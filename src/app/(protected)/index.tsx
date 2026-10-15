import React, { ComponentProps, useCallback, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '@/stores/authStore';
import { eventStore, useEventStore } from '@/stores/eventStore';
import { useSyncStore } from '@/stores/syncStore';
import { eventApi, ScanHistoryItem } from '@/api/eventApi';
import { HeaderDecor } from '@/components/ui/ScreenHeader';
import { ListItem, SectionTitle } from '@/components/ui/ListItem';
import { formatDate, formatTime } from '@/utils/formatters';
import { colors, font, radius, RESULT_TONES, shadow, spacing } from '@/theme';

type IconName = ComponentProps<typeof Ionicons>['name'];

const logo = require('../../../assets/icon.png');

const ROLE_LABELS: Record<string, string> = {
  AGENT: 'Agent de contrôle',
  ADMIN: 'Administrateur',
  SUPER_ADMIN: 'Propriétaire',
};

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, device } = useAuthStore();
  const { activeEvent } = useEventStore();
  const { pendingScans, isOnline } = useSyncStore();
  const [recent, setRecent] = useState<ScanHistoryItem[]>([]);
  const eventId = activeEvent?.id;

  // À chaque retour sur l'accueil : compteurs et derniers contrôles à jour (en silence)
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      eventStore.getState().loadEvents();
      eventApi
        .recentScans(eventId, 3)
        .then((scans) => {
          if (!cancelled) setRecent(scans);
        })
        .catch(() => {
          // Hors connexion : la section reste telle quelle
        });
      return () => {
        cancelled = true;
      };
    }, [eventId])
  );

  const stats = activeEvent?.stats;
  const pending = pendingScans.length;
  const initial = (user?.name || 'A').charAt(0).toUpperCase();

  const shortcuts: { icon: IconName; title: string; detail: string; href: string; badge?: boolean }[] = [
    { icon: 'time', title: 'Historique', detail: 'Mes contrôles', href: '/(protected)/history' },
    {
      icon: 'sync',
      title: 'Synchro',
      detail: pending > 0 ? `${pending} en attente` : 'À jour',
      href: '/(protected)/sync',
      badge: pending > 0,
    },
    { icon: 'calendar', title: 'Événement', detail: 'Changer', href: '/(protected)/event' },
  ];

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Bandeau : logo, agent, accès au profil */}
        <View style={[styles.header, { paddingTop: insets.top + spacing.xxxl }]}>
          <HeaderDecor />
          <View style={styles.headerRow}>
            <Image source={logo} style={styles.logo} accessibilityIgnoresInvertColors />
            <View style={styles.flex}>
              <Text style={styles.name} numberOfLines={1}>
                {user?.name || 'Agent'}
              </Text>
              <Text style={styles.role} numberOfLines={1}>
                {ROLE_LABELS[user?.role ?? ''] ?? 'Agent'} · {device?.name || 'Terminal non activé'}
              </Text>
            </View>
            <Pressable
              onPress={() => router.push('/(protected)/settings')}
              accessibilityRole="button"
              accessibilityLabel="Mon profil et paramètres"
              style={styles.avatar}
            >
              <Text style={styles.avatarText}>{initial}</Text>
              <View style={[styles.onlineDot, { backgroundColor: isOnline ? '#22C55E' : colors.accent }]} />
            </Pressable>
          </View>
        </View>

        <View style={styles.body}>
          {/* Événement en cours, à cheval sur le bandeau */}
          {activeEvent ? (
            <Pressable
              onPress={() => router.push('/(protected)/event')}
              accessibilityRole="button"
              accessibilityLabel={`Événement en cours : ${activeEvent.name}. Changer d’événement`}
              style={styles.eventCard}
            >
              <View style={styles.eventTop}>
                <View style={styles.flex}>
                  <Text style={styles.eventLabel}>ÉVÉNEMENT EN COURS</Text>
                  <Text style={styles.eventName} numberOfLines={2}>
                    {activeEvent.name}
                  </Text>
                  <Text style={styles.eventPlace} numberOfLines={1}>
                    {activeEvent.location || activeEvent.organization?.name || formatDate(activeEvent.startsAt)}
                  </Text>
                </View>
                <View style={styles.changePill}>
                  <Ionicons name="swap-horizontal" size={14} color={colors.primary} />
                  <Text style={styles.changePillText}>Changer</Text>
                </View>
              </View>
              <View style={styles.statsRow}>
                <Stat value={stats?.totalScanned ?? 0} label="Contrôles" />
                <View style={styles.statDivider} />
                <Stat value={stats?.validScans ?? 0} label="Entrées" color={colors.success} />
                <View style={styles.statDivider} />
                <Stat value={stats?.rejectedScans ?? 0} label="Refus" color={colors.danger} />
              </View>
            </Pressable>
          ) : (
            <Pressable
              onPress={() => router.push('/(protected)/event')}
              accessibilityRole="button"
              style={[styles.eventCard, styles.eventCardEmpty]}
            >
              <View style={styles.addIcon}>
                <Ionicons name="calendar" size={22} color={colors.primary} />
              </View>
              <Text style={styles.addText}>+ Choisir un événement</Text>
              <Text style={styles.eventPlace}>Indispensable avant de scanner</Text>
            </Pressable>
          )}

          {/* Raccourcis : le premier en couleur pleine, comme les modèles */}
          <View style={styles.grid}>
            {shortcuts.map((item, index) => {
              const filled = index === 0;
              return (
                <Pressable
                  key={item.title}
                  onPress={() => router.push(item.href as never)}
                  accessibilityRole="button"
                  accessibilityLabel={`${item.title}. ${item.detail}`}
                  android_ripple={{ color: 'rgba(47, 43, 110, 0.1)' }}
                  style={[styles.tile, filled && styles.tileFilled]}
                >
                  <View style={[styles.tileIcon, filled && styles.tileIconFilled]}>
                    <Ionicons name={item.icon} size={20} color={filled ? colors.white : colors.primary} />
                    {item.badge ? <View style={styles.tileBadge} /> : null}
                  </View>
                  <Text style={[styles.tileTitle, filled && styles.white]} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <Text style={[styles.tileDetail, filled && styles.tileDetailFilled]} numberOfLines={1}>
                    {item.detail}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Derniers contrôles de l'agent */}
          <SectionTitle
            title="Derniers contrôles"
            action="Tout voir"
            onAction={() => router.push('/(protected)/history')}
          />
          {recent.length === 0 ? (
            <View style={styles.empty}>
              <Ionicons name="qr-code-outline" size={28} color={colors.muted} />
              <Text style={styles.emptyText}>Vos contrôles apparaîtront ici.</Text>
            </View>
          ) : (
            recent.map((scan) => {
              const tone = RESULT_TONES[scan.result] ?? RESULT_TONES.INVALID;
              return (
                <ListItem
                  key={scan.id}
                  icon={tone.icon}
                  iconColor={tone.solid}
                  iconBackground={tone.soft}
                  title={scan.holderName}
                  highlight={{ text: tone.title, color: tone.solid }}
                  right={<Text style={styles.time}>{formatTime(scan.scannedAt)}</Text>}
                />
              );
            })
          )}
        </View>
      </ScrollView>

      {/* Action principale, toujours sous le pouce */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
        <Pressable
          onPress={() => router.push('/(protected)/scanner')}
          accessibilityRole="button"
          accessibilityLabel="Scanner un QR code"
          android_ripple={{ color: 'rgba(255, 255, 255, 0.25)' }}
          style={({ pressed }) => [styles.scanButton, pressed && styles.scanButtonPressed]}
        >
          <View style={styles.scanIcon}>
            <Ionicons name="scan" size={26} color={colors.primary} />
          </View>
          <Text style={styles.scanButtonText}>Scanner un billet</Text>
          <Ionicons name="arrow-forward" size={22} color={colors.white} />
        </Pressable>
      </View>
    </View>
  );
}

function Stat({ value, label, color }: { value: number; label: string; color?: string }) {
  return (
    <View style={styles.stat}>
      <Text style={[styles.statValue, color ? { color } : null]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const OVERLAP = 80;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  white: { color: colors.white },
  scroll: { paddingBottom: spacing.xl },

  header: {
    backgroundColor: colors.brand,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxxl + spacing.xs + OVERLAP,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    overflow: 'hidden',
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  logo: { width: 44, height: 44, borderRadius: 14, borderWidth: 2, borderColor: 'rgba(255,255,255,0.9)' },
  name: { fontSize: font.bodyLarge + 1, fontWeight: '800', color: colors.white },
  role: { fontSize: font.caption, color: '#C9C7EA', marginTop: 1 },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: font.title, fontWeight: '800', color: colors.primary },
  onlineDot: {
    position: 'absolute',
    bottom: 1,
    right: 1,
    width: 13,
    height: 13,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: colors.white,
  },

  body: { paddingHorizontal: spacing.lg, marginTop: -OVERLAP, gap: spacing.lg },

  eventCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg + 4,
    padding: spacing.lg,
    gap: spacing.lg,
    ...shadow,
    shadowOpacity: 0.1,
    elevation: 4,
  },
  eventCardEmpty: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xxl,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#C9C7EA',
  },
  addIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addText: { fontSize: font.body, fontWeight: '800', color: colors.primary },
  eventTop: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  eventLabel: { fontSize: font.caption - 2, fontWeight: '800', letterSpacing: 0.8, color: colors.accentStrong },
  eventName: { fontSize: font.bodyLarge + 1, fontWeight: '800', color: colors.ink, marginTop: 2 },
  eventPlace: { fontSize: font.caption + 1, color: colors.muted, marginTop: 2 },
  changePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
  },
  changePillText: { fontSize: font.caption, fontWeight: '700', color: colors.primary },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.background,
  },
  stat: { flex: 1, alignItems: 'center', gap: 2 },
  statDivider: { width: 1, height: 28, backgroundColor: colors.border },
  statValue: { fontSize: font.title, fontWeight: '800', color: colors.ink },
  statLabel: { fontSize: font.caption - 1, color: colors.muted },

  grid: { flexDirection: 'row', gap: spacing.md },
  tile: {
    flex: 1,
    minHeight: 112,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: 2,
    overflow: 'hidden',
    ...shadow,
  },
  tileFilled: { backgroundColor: colors.primary },
  tileIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  tileIconFilled: { backgroundColor: 'rgba(255, 255, 255, 0.16)' },
  tileBadge: {
    position: 'absolute',
    top: -3,
    right: -3,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.accent,
    borderWidth: 2,
    borderColor: colors.white,
  },
  tileTitle: { fontSize: font.body - 1, fontWeight: '800', color: colors.ink },
  tileDetail: { fontSize: font.caption - 1, color: colors.muted },
  tileDetailFilled: { color: '#C9C7EA' },

  empty: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xl,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
  },
  emptyText: { fontSize: font.caption + 1, color: colors.muted },
  time: { fontSize: font.caption, fontWeight: '600', color: colors.text },

  footer: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, backgroundColor: colors.background },
  scanButton: {
    minHeight: 68,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingLeft: spacing.sm,
    paddingRight: spacing.xl,
    overflow: 'hidden',
    ...shadow,
    shadowColor: colors.primary,
    shadowOpacity: 0.35,
    elevation: 6,
  },
  scanButtonPressed: { backgroundColor: colors.primaryPressed },
  scanIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanButtonText: { flex: 1, color: colors.white, fontSize: font.bodyLarge + 1, fontWeight: '800' },
});
