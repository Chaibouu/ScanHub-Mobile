import { ApiError, apiClient } from './client';
import {
  QRVerifyRequest,
  QRVerificationResult,
  QRConsumeRequest,
  QRConsumeResult,
  ScanResultCode,
  QRStatus,
} from '@/types/qr';
import { API_CONFIG } from '@/utils/constants';
import { OfflineQRCode, PendingScan } from '@/types/sync';
import { syncStore } from '@/stores/syncStore';
import { offlineRepository } from '@/db/sqlite';
import { authStore } from '@/stores/authStore';
import { hashTokenOffline } from '@/lib/hash';

function deviceBlockedResult(message: string): QRVerificationResult {
  return {
    valid: false,
    code: 'DEVICE_BLOCKED',
    status: 'BLOCKED',
    reusable: false,
    message,
    verifiedAt: new Date().toISOString(),
  };
}

/**
 * Règle de validité appliquée au cache local. Miroir de `evaluateQR` côté serveur :
 * le serveur reste l'arbitre final lors de la synchronisation.
 */
function evaluateCached(
  qr: OfflineQRCode,
  eventId: string | undefined,
  now: Date
): { code: ScanResultCode; status: QRStatus; message: string } {
  if (qr.status === 'REVOKED' || qr.status === 'BLOCKED') {
    return { code: 'REVOKED', status: qr.status, message: 'Ce pass a été révoqué (vérifié hors-ligne).' };
  }
  if (qr.status === 'PENDING') {
    return { code: 'INVALID', status: qr.status, message: 'Ce pass n’est pas encore activé.' };
  }
  if (qr.status === 'USED' && !qr.reusable) {
    return { code: 'ALREADY_USED', status: 'USED', message: 'Billet déjà validé (vérifié hors-ligne).' };
  }
  if (qr.status === 'EXPIRED' || (qr.expiresAt && new Date(qr.expiresAt) < now)) {
    return { code: 'EXPIRED', status: 'EXPIRED', message: 'Période de validité expirée.' };
  }
  if (eventId && qr.eventId && qr.eventId !== eventId) {
    return {
      code: 'UNAUTHORIZED',
      status: qr.status,
      message: 'Ce pass n’est pas associé à l’événement sélectionné.',
    };
  }
  return {
    code: 'VALID',
    status: qr.status,
    message: qr.reusable
      ? 'Badge vérifié via la base locale hors-ligne.'
      : 'Billet valide (base locale hors-ligne).',
  };
}

function describeCached(qr: OfflineQRCode) {
  let meta: Record<string, string | undefined> = {};
  try {
    if (qr.metadataJson) meta = JSON.parse(qr.metadataJson);
  } catch {
    // Métadonnées illisibles : on se contente des colonnes dédiées
  }

  return {
    reusable: qr.reusable,
    qr: {
      id: qr.id,
      type: qr.type,
      source: 'Cache hors-ligne',
      reusable: qr.reusable,
      expiresAt: qr.expiresAt,
    },
    holder: {
      name: qr.holderName || meta.holderName || 'Participant',
      role: qr.holderRole || meta.holderRole || '',
      company: meta.company,
    },
  };
}

async function verifyOffline(req: QRVerifyRequest): Promise<{
  result: QRVerificationResult;
  cached: OfflineQRCode | null;
}> {
  const now = new Date();
  const cached = await offlineRepository.lookupQRCode(await hashTokenOffline(req.token));

  // Un QR absent de la liste n'est JAMAIS accepté sans le serveur. Ce n'est pas pour autant
  // un faux billet : on ne sait pas, et on le dit (l'agent réessaie ou télécharge la liste).
  if (!cached) {
    return {
      cached: null,
      result: {
        valid: false,
        code: 'UNVERIFIED',
        status: 'BLOCKED',
        reusable: false,
        message: syncStore.getState().isOnline
          ? 'Le serveur ne répond pas et ce billet n’est pas dans la liste téléchargée. Réessayez dans un instant.'
          : 'Pas de réseau et ce billet n’est pas dans la liste téléchargée. Réessayez une fois connecté.',
        offline: true,
        verifiedAt: now.toISOString(),
      },
    };
  }

  const evaluation = evaluateCached(cached, req.eventId, now);
  return {
    cached,
    result: {
      valid: evaluation.code === 'VALID',
      code: evaluation.code,
      status: evaluation.status,
      message: evaluation.message,
      ...describeCached(cached),
      offline: true,
      verifiedAt: now.toISOString(),
    },
  };
}

export const qrApi = {
  /**
   * Contrôle d'un billet scanné : vérification ET enregistrement du passage en un seul appel.
   *
   * 1. En ligne : le serveur décide (seul à savoir si un autre terminal vient de valider le billet).
   *    Délai court : au-delà, on n'attend pas plus et on passe à l'étape 2.
   * 2. Serveur injoignable ou trop lent : liste téléchargée sur le téléphone, passage mis en file
   *    et envoyé au retour du réseau. Si le serveur avait en fait reçu la demande, le même
   *    clientId évite tout double comptage.
   *
   * Toute autre erreur (session expirée, erreur serveur…) est remontée telle quelle :
   * elle ne doit jamais se transformer en « valide ».
   */
  async consume(req: QRConsumeRequest): Promise<QRConsumeResult> {
    if (syncStore.getState().isOnline) {
      try {
        const res = await apiClient<QRConsumeResult>('/qr/consume', {
          method: 'POST',
          body: JSON.stringify(req),
          timeoutMs: API_CONFIG.SCAN_TIMEOUT_MS,
        });
        // Garde la liste locale à jour : si le réseau tombe ensuite, ce billet reste refusé
        if (res.qr?.id && !res.reusable && (res.consumed || res.code === 'ALREADY_USED')) {
          offlineRepository.markUsed(res.qr.id).catch(() => {});
        }
        return res;
      } catch (err) {
        if (err instanceof ApiError && err.isDeviceBlocked) {
          return { ...deviceBlockedResult(err.message), consumed: false };
        }
        if (!(err instanceof ApiError) || !err.isNetworkError) throw err;
      }
    }

    return consumeOffline(req);
  },
};

async function consumeOffline(req: QRConsumeRequest): Promise<QRConsumeResult> {
  const { result, cached } = await verifyOffline(req);
  if (!result.valid || !cached) {
    return { ...result, consumed: false };
  }

  // Billet à usage unique : transition atomique locale ACTIVE -> USED
  if (!cached.reusable && !(await offlineRepository.consumeLocally(cached.id))) {
    return {
      ...result,
      valid: false,
      code: 'ALREADY_USED',
      status: 'USED',
      message: 'Billet déjà validé sur ce terminal (hors-ligne).',
      consumed: false,
    };
  }

  const now = new Date().toISOString();
  const { user, device } = authStore.getState();
  const pendingItem: PendingScan = {
    clientId: req.clientId,
    token: req.token,
    qrId: cached.id,
    eventId: req.eventId || cached.eventId,
    userId: user?.id || '',
    deviceId: device?.id,
    result: 'VALID',
    scannedAt: now,
    syncStatus: 'PENDING',
    offline: true,
  };

  // Si le scan ne peut pas être mis en file, l'erreur remonte : pas de validation fantôme
  await offlineRepository.recordPendingScan(pendingItem);
  syncStore.getState().addPendingScan(pendingItem);

  return {
    ...result,
    status: cached.reusable ? result.status : 'USED',
    message: 'Entrée enregistrée sur le téléphone — envoyée au serveur dès que possible.',
    consumed: true,
    consumedAt: now,
  };
}
