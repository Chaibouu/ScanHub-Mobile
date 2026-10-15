import React, { useEffect } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useEventStore } from '@/stores/eventStore';
import { formatDate } from '@/utils/formatters';
import { Button } from '@/components/ui/Button';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { ListItem, Pill } from '@/components/ui/ListItem';
import { colors, font, radius, spacing } from '@/theme';

const STATUS_LABELS: Record<string, { label: string; fg: string; bg: string }> = {
  ACTIVE: { label: 'Ouvert', fg: colors.success, bg: colors.successSoft },
  PAUSED: { label: 'Suspendu', fg: colors.warning, bg: colors.warningSoft },
  CLOSED: { label: 'Clôturé', fg: colors.muted, bg: '#EEF0F4' },
  DRAFT: { label: 'Brouillon', fg: colors.muted, bg: '#EEF0F4' },
};

export default function EventScreen() {
  const router = useRouter();
  const { events, activeEvent, setActiveEvent, loadEvents, isLoading, error } = useEventStore();

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const handleSelect = (event: (typeof events)[0]) => {
    setActiveEvent(event);
    router.back();
  };

  return (
    <View style={styles.container}>
      <ScreenHeader title="Événements" subtitle="Choisissez où vous contrôlez" />

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.notice}>
          <Ionicons name="information-circle" size={20} color={colors.primary} />
          <Text style={styles.noticeText}>
            Les contrôles sont rattachés à l’événement choisi. Un billet d’un autre événement sera refusé.
          </Text>
        </View>

        {isLoading && events.length === 0 ? <ActivityIndicator color={colors.primary} size="large" /> : null}

        {error ? (
          <View style={[styles.notice, styles.noticeError]} accessibilityRole="alert">
            <Ionicons name="warning" size={20} color={colors.danger} />
            <Text style={[styles.noticeText, { color: colors.danger }]}>{error}</Text>
          </View>
        ) : null}
        {error ? <Button label="Réessayer" variant="secondary" icon="refresh" onPress={loadEvents} /> : null}

        {!isLoading && !error && events.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="calendar-outline" size={40} color={colors.muted} />
            <Text style={styles.emptyText}>
              Aucun événement pour le moment. Un administrateur doit en créer un dans le tableau de bord.
            </Text>
          </View>
        ) : null}

        {events.map((evt) => {
          const selected = activeEvent?.id === evt.id;
          const status = STATUS_LABELS[evt.status] ?? STATUS_LABELS.DRAFT;
          const place = evt.location || evt.organization?.name;
          const details = [place, formatDate(evt.startsAt)].filter(Boolean).join(' · ');
          const counts = evt.stats
            ? `${evt.stats.totalTickets} billet${evt.stats.totalTickets > 1 ? 's' : ''} · ${evt.stats.totalScanned} contrôle${evt.stats.totalScanned > 1 ? 's' : ''}`
            : undefined;

          return (
            <ListItem
              key={evt.id}
              icon={selected ? 'checkmark' : 'calendar'}
              iconColor={selected ? colors.white : colors.primary}
              iconBackground={selected ? colors.primary : colors.primarySoft}
              title={evt.name}
              highlight={counts ? { text: counts, color: colors.text } : undefined}
              subtitle={details}
              selected={selected}
              onPress={() => handleSelect(evt)}
              accessibilityLabel={`${evt.name}, ${status.label}${selected ? ', sélectionné' : ''}`}
              right={<Pill text={status.label} color={status.fg} background={status.bg} />}
            />
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.md },
  notice: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
  },
  noticeError: { backgroundColor: colors.dangerSoft },
  noticeText: { flex: 1, color: colors.text, fontSize: font.caption + 1, lineHeight: 20 },
  empty: { alignItems: 'center', gap: spacing.md, paddingVertical: spacing.xxxl },
  emptyText: { fontSize: font.body, lineHeight: 24, color: colors.muted, textAlign: 'center' },
});
