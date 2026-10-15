import React, { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSyncStore } from '@/stores/syncStore';
import { useEventStore } from '@/stores/eventStore';
import { useSync } from '@/hooks/useSync';
import { offlineRepository } from '@/db/sqlite';
import { formatTime } from '@/utils/formatters';
import { Button } from '@/components/ui/Button';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { IconTile, Pill } from '@/components/ui/ListItem';
import { colors, font, radius, shadow, spacing } from '@/theme';

export default function SyncScreen() {
  const { isOnline, setOnline, pendingScans, lastSyncedAt } = useSyncStore();
  const { activeEvent } = useEventStore();
  const { triggerPushSync, triggerPullSync, isSyncing } = useSync();

  const [downloading, setDownloading] = useState(false);
  const [cachedCount, setCachedCount] = useState<number | null>(null);
  const eventId = activeEvent?.id;

  const refreshCachedCount = useCallback(() => {
    if (!eventId) return;
    offlineRepository
      .countCachedQRCodes(eventId)
      .then(setCachedCount)
      .catch(() => setCachedCount(null));
  }, [eventId]);

  useFocusEffect(refreshCachedCount);

  const handlePushSync = async () => {
    if (pendingScans.length === 0) {
      Alert.alert('Rien à envoyer', 'Tous les contrôles sont déjà sur le serveur.');
      return;
    }

    try {
      const summary = await triggerPushSync();
      const lines = [`${summary.accepted} scan(s) envoyé(s).`];
      if (summary.conflicts > 0) {
        lines.push(`${summary.conflicts} refusé(s) par le serveur (billet déjà utilisé, révoqué…).`);
      }
      if (summary.failed > 0) {
        lines.push(`${summary.failed} en échec, à renvoyer.`);
      }
      Alert.alert(
        summary.conflicts + summary.failed > 0 ? 'Envoi partiel' : 'Envoi terminé',
        lines.join('\n')
      );
    } catch {
      Alert.alert(
        'Serveur injoignable',
        'Les contrôles restent sur le téléphone. Ils partiront dès que la connexion revient.'
      );
    }
  };

  const handlePullQRs = async () => {
    if (!activeEvent) {
      Alert.alert('Aucun événement', 'Choisissez d’abord un événement.');
      return;
    }
    setDownloading(true);
    try {
      const count = await triggerPullSync(activeEvent.id);
      refreshCachedCount();
      Alert.alert(
        'Liste téléchargée',
        `${count || 0} billet(s) enregistré(s) sur ce téléphone. Vous pouvez contrôler sans connexion.`
      );
    } catch {
      Alert.alert('Téléchargement impossible', 'Vérifiez votre connexion puis réessayez.');
    } finally {
      setDownloading(false);
    }
  };

  const pending = pendingScans.length;

  return (
    <View style={styles.container}>
      {/* Le bandeau défile avec le contenu : la carte de résumé peut le chevaucher sans être coupée */}
      <ScrollView contentContainerStyle={styles.scroll}>
        <ScreenHeader title="Synchronisation" subtitle={activeEvent?.name} overlap={OVERLAP} />
        <View style={styles.content}>
          {/* Résumé à cheval sur le bandeau */}
          <View style={styles.summary}>
            <View style={styles.summaryTop}>
              <IconTile
                icon={isOnline ? 'wifi' : 'cloud-offline'}
                color={isOnline ? colors.success : colors.warning}
                background={isOnline ? colors.successSoft : colors.warningSoft}
              />
              <View style={styles.flex}>
                <Text style={styles.summaryTitle}>{isOnline ? 'Connecté' : 'Hors connexion'}</Text>
                <Text style={styles.muted}>
                  Dernier échange : {lastSyncedAt ? formatTime(lastSyncedAt) : 'aucun'}
                </Text>
              </View>
              {isSyncing ? (
                <Pill text="En cours…" color={colors.primary} background={colors.primarySoft} />
              ) : null}
            </View>
            <View style={styles.statsRow}>
              <Stat value={pending} label="À envoyer" color={pending > 0 ? colors.accentStrong : undefined} />
              <View style={styles.statDivider} />
              <Stat value={cachedCount ?? '—'} label="Billets sur le téléphone" />
            </View>
          </View>

          {/* Simulateur de coupure réseau — builds de développement uniquement */}
          {__DEV__ && (
            <Button
              label={isOnline ? 'Test : simuler une coupure' : 'Test : rétablir la connexion'}
              variant="ghost"
              onPress={() => setOnline(!isOnline)}
            />
          )}

          <Section
            icon="cloud-upload"
            title="Contrôles à envoyer"
            text={
              pending === 0
                ? 'Tous les contrôles sont sur le serveur.'
                : 'Contrôles faits sans connexion, gardés sur ce téléphone. Ils partent automatiquement dès que le réseau revient.'
            }
          >
            <Button
              label="Envoyer maintenant"
              icon="cloud-upload"
              loading={isSyncing && !downloading}
              disabled={pending === 0}
              onPress={handlePushSync}
            />
          </Section>

          <Section
            icon="cloud-download"
            title="Mode sans connexion"
            text={`La liste des billets de ${activeEvent?.name || 'l’événement choisi'} est téléchargée automatiquement. Retéléchargez-la avant l’ouverture des portes pour avoir les derniers billets.`}
          >
            <Button
              label="Télécharger la liste des billets"
              icon="cloud-download"
              variant="secondary"
              loading={downloading}
              onPress={handlePullQRs}
            />
          </Section>
        </View>
      </ScrollView>
    </View>
  );
}

function Stat({ value, label, color }: { value: number | string; label: string; color?: string }) {
  return (
    <View style={styles.stat}>
      <Text style={[styles.statValue, color ? { color } : null]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function Section({
  icon,
  title,
  text,
  children,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  title: string;
  text: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.sectionTop}>
        <IconTile icon={icon} size={40} />
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      <Text style={styles.text}>{text}</Text>
      {children}
    </View>
  );
}

const OVERLAP = 44;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  scroll: { paddingBottom: spacing.xxl },
  content: { paddingHorizontal: spacing.lg, gap: spacing.lg, marginTop: -OVERLAP },
  muted: { fontSize: font.caption + 1, color: colors.muted },

  summary: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg + 4,
    padding: spacing.lg,
    gap: spacing.lg,
    ...shadow,
    shadowOpacity: 0.1,
    elevation: 4,
  },
  summaryTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  summaryTitle: { fontSize: font.bodyLarge, fontWeight: '800', color: colors.ink },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.background,
  },
  stat: { flex: 1, alignItems: 'center', gap: 2, paddingHorizontal: spacing.sm },
  statDivider: { width: 1, height: 32, backgroundColor: colors.border },
  statValue: { fontSize: font.title + 2, fontWeight: '800', color: colors.ink },
  statLabel: { fontSize: font.caption - 1, color: colors.muted, textAlign: 'center' },

  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
    ...shadow,
  },
  sectionTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  sectionTitle: { flex: 1, fontSize: font.body, fontWeight: '800', color: colors.ink },
  text: { fontSize: font.body - 2, lineHeight: 21, color: colors.text },
});
