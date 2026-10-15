import React, { useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatTime } from '@/utils/formatters';
import { eventApi, ScanHistoryItem } from '@/api/eventApi';
import { ApiError } from '@/api/client';
import { useEventStore } from '@/stores/eventStore';
import { HeaderButton, ScreenHeader } from '@/components/ui/ScreenHeader';
import { ListItem } from '@/components/ui/ListItem';
import { colors, font, radius, RESULT_TONES, spacing, TOUCH_MIN } from '@/theme';

type Filter = 'ALL' | 'VALID' | 'REJECTED';

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'ALL', label: 'Tous' },
  { key: 'VALID', label: 'Entrées' },
  { key: 'REJECTED', label: 'Refus' },
];

export default function HistoryScreen() {
  const { activeEvent } = useEventStore();
  const [filter, setFilter] = useState<Filter>('ALL');
  const [search, setSearch] = useState('');
  const [items, setItems] = useState<ScanHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const eventId = activeEvent?.id;

  useEffect(() => {
    let cancelled = false;

    eventApi
      .recentScans(eventId)
      .then((scans) => {
        if (cancelled) return;
        setItems(scans);
        setError(null);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(
          err instanceof ApiError && err.isNetworkError
            ? 'Historique indisponible hors connexion.'
            : (err as Error)?.message || 'Impossible de charger l’historique.'
        );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [eventId, reloadKey]);

  const refresh = () => {
    setLoading(true);
    setReloadKey((key) => key + 1);
  };

  const query = search.trim().toLowerCase();
  const filtered = items.filter((item) => {
    if (filter === 'VALID' && item.result !== 'VALID') return false;
    if (filter === 'REJECTED' && item.result === 'VALID') return false;
    if (!query) return true;
    return item.holderName.toLowerCase().includes(query) || item.qrType.toLowerCase().includes(query);
  });

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Historique"
        subtitle={activeEvent?.name || 'Tous les événements'}
        right={<HeaderButton icon="refresh" label="Actualiser" onPress={refresh} />}
      >
        <View style={styles.search}>
          <Ionicons name="search" size={20} color={colors.muted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher un nom"
            placeholderTextColor="#9AA0B4"
            value={search}
            onChangeText={setSearch}
            autoCorrect={false}
            accessibilityLabel="Rechercher dans l’historique"
          />
          {search ? (
            <Pressable onPress={() => setSearch('')} hitSlop={10} accessibilityLabel="Effacer la recherche">
              <Ionicons name="close-circle" size={20} color={colors.muted} />
            </Pressable>
          ) : null}
        </View>

        <View style={styles.tabs} accessibilityRole="tablist">
          {FILTERS.map(({ key, label }) => {
            const selected = filter === key;
            return (
              <Pressable
                key={key}
                onPress={() => setFilter(key)}
                accessibilityRole="tab"
                accessibilityState={{ selected }}
                style={[styles.tab, selected && styles.tabSelected]}
              >
                <Text style={[styles.tabText, selected && styles.tabTextSelected]}>{label}</Text>
              </Pressable>
            );
          })}
        </View>
      </ScreenHeader>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshing={loading}
        onRefresh={refresh}
        renderItem={({ item }) => {
          const tone = RESULT_TONES[item.result] ?? RESULT_TONES.INVALID;
          return (
            <ListItem
              icon={tone.icon}
              iconColor={tone.solid}
              iconBackground={tone.soft}
              title={item.holderName}
              highlight={{ text: tone.title, color: tone.solid }}
              subtitle={`${item.qrType} · ${item.event}`}
              right={
                <View style={styles.rowRight}>
                  <Text style={styles.rowTime}>{formatTime(item.scannedAt)}</Text>
                  {item.offline ? <Ionicons name="cloud-offline" size={16} color={colors.muted} /> : null}
                </View>
              }
            />
          );
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name={error ? 'cloud-offline' : 'file-tray-outline'} size={40} color={colors.muted} />
            <Text style={styles.emptyText}>
              {loading ? 'Chargement…' : error || 'Aucun contrôle pour le moment.'}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: TOUCH_MIN,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    backgroundColor: colors.white,
  },
  searchInput: { flex: 1, fontSize: font.body, color: colors.ink },
  tabs: { flexDirection: 'row', gap: spacing.sm },
  tab: {
    flex: 1,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
  },
  tabSelected: { backgroundColor: colors.white },
  tabText: { fontSize: font.caption + 1, fontWeight: '700', color: colors.white },
  tabTextSelected: { color: colors.primary },

  list: { padding: spacing.lg, gap: spacing.md, flexGrow: 1 },
  rowRight: { alignItems: 'flex-end', gap: spacing.xs },
  rowTime: { fontSize: font.caption, fontWeight: '600', color: colors.text },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md, paddingTop: spacing.xxxl * 2 },
  emptyText: { fontSize: font.body, color: colors.muted, textAlign: 'center', paddingHorizontal: spacing.xxl },
});
