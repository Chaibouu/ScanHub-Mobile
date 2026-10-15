import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { qrApi } from '@/api/qrApi';
import { QRConsumeResult, ScanResultCode } from '@/types/qr';
import { ApiError } from '@/api/client';
import { formatTime, truncateToken, generateUUID } from '@/utils/formatters';
import { hapticFeedback } from '@/lib/haptics';
import { Button } from '@/components/ui/Button';
import { colors, font, radius, RESULT_TONES, spacing } from '@/theme';

export default function ResultScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ token?: string; eventId?: string }>();
  const token = params.token || '';
  const eventId = params.eventId || '';

  // Clé d'idempotence stable pour toute la durée de l'écran : un nouvel essai ne compte qu'une fois
  const [clientId] = useState(() => generateUUID());
  const [attempt, setAttempt] = useState(0);
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<QRConsumeResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Le passage est enregistré dès le scan : pas de second appui pour l'agent
  useEffect(() => {
    let isMounted = true;

    qrApi
      .consume({ token, eventId: eventId || undefined, clientId })
      .then((res) => {
        if (!isMounted) return;
        setResult(res);
        if (res.consumed) hapticFeedback.success();
        else if (res.code === 'ALREADY_USED' || res.code === 'UNVERIFIED') hapticFeedback.warning();
        else hapticFeedback.error();
      })
      .catch((err: unknown) => {
        if (!isMounted) return;
        // L'entrée n'est PAS enregistrée : on le dit clairement à l'agent
        setResult(null);
        setError(
          err instanceof ApiError
            ? `Contrôle impossible : ${err.message}`
            : 'Contrôle impossible. Réessayez.'
        );
        hapticFeedback.error();
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [token, eventId, clientId, attempt]);

  const retry = () => {
    setLoading(true);
    setError(null);
    setAttempt((n) => n + 1);
  };

  // Retour à la caméra déjà ouverte (ne pas en empiler une seconde)
  const scanNext = () => router.back();

  if (loading) {
    return (
      <View style={[styles.loading, { paddingTop: insets.top }]}>
        <StatusBar style="light" />
        <ActivityIndicator size="large" color={colors.white} />
        <Text style={styles.loadingText}>Contrôle en cours…</Text>
        <Text style={styles.loadingToken}>{truncateToken(token)}</Text>
      </View>
    );
  }

  const code: ScanResultCode = error ? 'UNVERIFIED' : result?.code || 'INVALID';
  const tone = RESULT_TONES[code] ?? RESULT_TONES.INVALID;
  const consumed = Boolean(result?.consumed);
  // Résultat incertain : l'agent peut relancer le même contrôle (même clientId)
  const canRetry = Boolean(error) || code === 'UNVERIFIED';
  const holder = result?.holder;
  const message = error ?? result?.message;

  return (
    <View style={[styles.container, { backgroundColor: tone.solid }]}>
      <StatusBar style="light" />

      {/* Verdict : lisible d'un coup d'œil, à bout de bras */}
      <View style={[styles.verdict, { paddingTop: insets.top + spacing.xxl }]} accessibilityRole="alert">
        <Ionicons name={consumed ? 'checkmark-done-circle' : tone.icon} size={96} color={colors.white} />
        <Text style={styles.verdictTitle}>
          {consumed ? (result?.reusable ? 'Passage enregistré' : 'Entrée validée') : tone.title}
        </Text>
        {message ? <Text style={styles.verdictMessage}>{message}</Text> : null}
        {result?.offline ? (
          <View style={styles.offlineTag}>
            <Ionicons name="cloud-offline" size={16} color={colors.white} />
            <Text style={styles.offlineTagText}>Vérifié hors connexion</Text>
          </View>
        ) : null}
      </View>

      <View style={[styles.sheet, { paddingBottom: insets.bottom + spacing.lg }]}>
        <ScrollView contentContainerStyle={styles.sheetContent} showsVerticalScrollIndicator={false}>
          {holder ? (
            <View style={styles.holder}>
              <Text style={styles.holderName}>{holder.name}</Text>
              {holder.role ? <Text style={styles.holderRole}>{holder.role}</Text> : null}
              {holder.company ? <Text style={styles.holderCompany}>{holder.company}</Text> : null}
            </View>
          ) : null}

          <View style={styles.details}>
            <Detail label="Type" value={result?.qr?.type || '—'} />
            <Detail label="Usage" value={result?.reusable ? 'Réutilisable' : 'Usage unique'} />
            {result?.event?.name ? <Detail label="Événement" value={result.event.name} /> : null}
            <Detail label="Contrôlé à" value={formatTime(result?.verifiedAt)} />
            <Detail label="Code" value={truncateToken(token)} />
          </View>

        </ScrollView>

        <View style={styles.actions}>
          {canRetry ? <Button label="Réessayer" icon="refresh" large onPress={retry} /> : null}
          <Button
            label="Scanner le suivant"
            icon="qr-code"
            large={!canRetry}
            variant={canRetry ? 'secondary' : 'primary'}
            onPress={scanNext}
          />
          <Button label="Retour à l'accueil" variant="ghost" onPress={() => router.dismissAll()} />
        </View>
      </View>
    </View>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  loading: {
    flex: 1,
    backgroundColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  loadingText: { color: colors.white, fontSize: font.bodyLarge, fontWeight: '700' },
  loadingToken: { color: '#C9C7EA', fontSize: font.caption },

  verdict: {
    alignItems: 'center',
    paddingHorizontal: spacing.xxl,
    paddingBottom: spacing.xxl,
    gap: spacing.sm,
  },
  verdictTitle: {
    color: colors.white,
    fontSize: font.display + 2,
    fontWeight: '800',
    textAlign: 'center',
  },
  verdictMessage: {
    color: colors.white,
    fontSize: font.body,
    lineHeight: 23,
    textAlign: 'center',
    opacity: 0.95,
  },
  offlineTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
    marginTop: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(0, 0, 0, 0.22)',
  },
  offlineTagText: { color: colors.white, fontSize: font.caption, fontWeight: '700' },

  sheet: {
    flex: 1,
    backgroundColor: colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
  },
  sheetContent: { gap: spacing.xl, paddingBottom: spacing.lg },

  holder: { alignItems: 'center', gap: spacing.xs },
  holderName: { fontSize: font.title + 2, fontWeight: '800', color: colors.ink, textAlign: 'center' },
  holderRole: { fontSize: font.bodyLarge, fontWeight: '600', color: colors.primary, textAlign: 'center' },
  holderCompany: { fontSize: font.body, color: colors.muted, textAlign: 'center' },

  details: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  detailLabel: { fontSize: font.body - 1, color: colors.muted },
  detailValue: { flex: 1, textAlign: 'right', fontSize: font.body - 1, fontWeight: '600', color: colors.ink },


  actions: { gap: spacing.sm, paddingTop: spacing.md },
});
