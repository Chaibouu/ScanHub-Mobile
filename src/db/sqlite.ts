import { Platform } from 'react-native';
import * as SQLite from 'expo-sqlite';
import { SQLITE_MIGRATIONS, SQLITE_TABLES } from './schema';
import { OfflineQRCode, PendingScan, SyncStatus } from '@/types/sync';

// 11 colonnes par billet : 100 billets = 1 100 paramètres, sous la limite de SQLite
const INSERT_CHUNK = 100;

let dbPromise: Promise<SQLite.SQLiteDatabase | null> | null = null;

async function openDatabase(): Promise<SQLite.SQLiteDatabase | null> {
  // Le mode hors-ligne repose sur SQLite natif (iOS / Android)
  if (Platform.OS === 'web') return null;

  const db = await SQLite.openDatabaseAsync('scanhub_offline.db');
  await db.execAsync(SQLITE_TABLES.OFFLINE_QR);
  await db.execAsync(SQLITE_TABLES.PENDING_SCANS);

  for (const migration of SQLITE_MIGRATIONS) {
    try {
      await db.execAsync(migration);
    } catch {
      // Colonne déjà présente
    }
  }
  return db;
}

export function getLocalDatabase(): Promise<SQLite.SQLiteDatabase | null> {
  if (!dbPromise) {
    dbPromise = openDatabase().catch(() => {
      dbPromise = null;
      return null;
    });
  }
  return dbPromise;
}

interface OfflineQRRow extends Omit<OfflineQRCode, 'reusable' | 'metadataJson'> {
  reusable: number;
  metadata: string | null;
}

function fromRow(row: OfflineQRRow): OfflineQRCode {
  const { metadata, reusable, ...rest } = row;
  return {
    ...rest,
    reusable: reusable === 1,
    metadataJson: metadata ?? undefined,
  };
}

export const offlineRepository = {
  /**
   * Remplace la liste téléchargée d'un événement par celle du serveur (une seule transaction).
   *
   * Les billets retirés côté serveur disparaissent du téléphone, et l'insertion se fait par
   * paquets : quelques dizaines d'appels pour des milliers de billets, au lieu d'un par billet.
   */
  async replaceEventQRCodes(eventId: string, qrs: OfflineQRCode[]): Promise<void> {
    const db = await getLocalDatabase();
    if (!db) return;

    await db.withExclusiveTransactionAsync(async (txn) => {
      await txn.runAsync(`DELETE FROM offline_qr WHERE eventId = ?`, [eventId]);

      for (let i = 0; i < qrs.length; i += INSERT_CHUNK) {
        const chunk = qrs.slice(i, i + INSERT_CHUNK);
        const placeholders = chunk.map(() => '(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').join(', ');
        const params = chunk.flatMap((qr) => [
          qr.id,
          qr.tokenHash,
          qr.type,
          qr.status,
          qr.reusable ? 1 : 0,
          qr.eventId,
          qr.holderName || null,
          qr.holderRole || null,
          qr.expiresAt || null,
          qr.metadataJson || null,
          qr.updatedAt,
        ]);
        await txn.runAsync(
          `INSERT OR REPLACE INTO offline_qr (id, tokenHash, type, status, reusable, eventId, holderName, holderRole, expiresAt, metadata, updatedAt)
           VALUES ${placeholders}`,
          params
        );
      }

      // Un billet validé hors connexion mais pas encore envoyé reste « utilisé » sur ce téléphone
      await txn.runAsync(
        `UPDATE offline_qr SET status = 'USED'
          WHERE reusable = 0 AND id IN (SELECT qrId FROM pending_scans WHERE syncStatus = 'PENDING' AND qrId IS NOT NULL)`,
        []
      );
    });
  },

  /** Reporte sur la liste locale un billet consommé en ligne (utile si le réseau tombe ensuite). */
  async markUsed(id: string): Promise<void> {
    const db = await getLocalDatabase();
    if (!db) return;
    await db.runAsync(
      `UPDATE offline_qr SET status = 'USED', updatedAt = ? WHERE id = ? AND reusable = 0`,
      [new Date().toISOString(), id]
    );
  },

  /** Supprime les scans déjà envoyés au serveur depuis plus de `days` jours (gain de place). */
  async purgeSyncedScans(days = 3): Promise<void> {
    const db = await getLocalDatabase();
    if (!db) return;
    const limit = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
    await db.runAsync(
      `DELETE FROM pending_scans WHERE syncStatus IN ('SYNCED', 'CONFLICT') AND scannedAt < ?`,
      [limit]
    );
  },

  /**
   * Lookup a QR code in local SQLite cache by its offline hash — SHA-256(token)
   */
  async lookupQRCode(tokenHash: string): Promise<OfflineQRCode | null> {
    const db = await getLocalDatabase();
    if (!db) return null;
    const row = await db.getFirstAsync<OfflineQRRow>(
      `SELECT * FROM offline_qr WHERE tokenHash = ?`,
      [tokenHash]
    );
    return row ? fromRow(row) : null;
  },

  /**
   * Consomme localement un billet à usage unique : ACTIVE -> USED.
   * Retourne false s'il avait déjà été consommé sur ce terminal.
   */
  async consumeLocally(id: string): Promise<boolean> {
    const db = await getLocalDatabase();
    if (!db) return false;
    const result = await db.runAsync(
      `UPDATE offline_qr SET status = 'USED', updatedAt = ? WHERE id = ? AND status = 'ACTIVE'`,
      [new Date().toISOString(), id]
    );
    return result.changes > 0;
  },

  async countCachedQRCodes(eventId?: string): Promise<number> {
    const db = await getLocalDatabase();
    if (!db) return 0;
    const row = eventId
      ? await db.getFirstAsync<{ total: number }>(
          `SELECT COUNT(*) AS total FROM offline_qr WHERE eventId = ?`,
          [eventId]
        )
      : await db.getFirstAsync<{ total: number }>(`SELECT COUNT(*) AS total FROM offline_qr`, []);
    return row?.total ?? 0;
  },

  /**
   * Record a scan into pending offline queue
   */
  async recordPendingScan(scan: PendingScan): Promise<void> {
    const db = await getLocalDatabase();
    if (!db) throw new Error('Stockage hors-ligne indisponible sur cet appareil.');
    await db.runAsync(
      `INSERT OR REPLACE INTO pending_scans (clientId, token, qrId, eventId, userId, deviceId, result, scannedAt, syncStatus)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        scan.clientId,
        scan.token,
        scan.qrId || null,
        scan.eventId,
        scan.userId,
        scan.deviceId || null,
        scan.result,
        scan.scannedAt,
        scan.syncStatus,
      ]
    );
  },

  /**
   * Get all pending scans waiting to be pushed to the server
   */
  async getPendingScans(): Promise<PendingScan[]> {
    const db = await getLocalDatabase();
    if (!db) return [];
    const rows = await db.getAllAsync<Omit<PendingScan, 'offline'>>(
      `SELECT * FROM pending_scans WHERE syncStatus = 'PENDING' ORDER BY scannedAt ASC`,
      []
    );
    return rows.map((row) => ({ ...row, offline: true }));
  },

  /**
   * Marque des scans comme traités par le serveur (SYNCED ou CONFLICT)
   */
  async markScans(clientIds: string[], status: SyncStatus): Promise<void> {
    const db = await getLocalDatabase();
    if (!db || clientIds.length === 0) return;
    const placeholders = clientIds.map(() => '?').join(',');
    await db.runAsync(
      `UPDATE pending_scans SET syncStatus = ? WHERE clientId IN (${placeholders})`,
      [status, ...clientIds]
    );
  },
};
