import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { usePathname, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSyncStore } from '@/stores/syncStore';
import { colors, font, spacing } from '@/theme';

/**
 * Bandeau d'état réseau, en bas de l'écran.
 * Il n'apparaît que lorsqu'il y a quelque chose à savoir : hors connexion,
 * ou des scans en attente d'envoi. En ligne et à jour, il ne prend aucune place.
 */
export function NetworkStatusBar() {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { isOnline, pendingScans, isSyncing } = useSyncStore();
  const pending = pendingScans.length;

  // Écrans plein écran : le bandeau gênerait la caméra et le verdict
  const fullScreen = pathname.endsWith('/scanner') || pathname.endsWith('/result');
  if (fullScreen || (isOnline && pending === 0)) return null;

  const offline = !isOnline;
  const message = offline
    ? pending > 0
      ? `Hors connexion · ${pending} scan${pending > 1 ? 's' : ''} en attente`
      : 'Hors connexion · contrôle sur la liste téléchargée'
    : isSyncing
      ? `Envoi de ${pending} scan${pending > 1 ? 's' : ''}…`
      : `${pending} scan${pending > 1 ? 's' : ''} à envoyer`;

  return (
    <Pressable
      onPress={() => router.push('/(protected)/sync')}
      accessibilityRole="button"
      accessibilityLabel={`${message}. Ouvrir la synchronisation`}
      style={[
        styles.bar,
        { paddingBottom: insets.bottom + spacing.md },
        offline ? styles.offline : styles.pending,
      ]}
    >
      <Ionicons
        name={offline ? 'cloud-offline' : 'cloud-upload'}
        size={20}
        color={offline ? colors.white : colors.warning}
      />
      <Text style={[styles.text, { color: offline ? colors.white : colors.warning }]} numberOfLines={1}>
        {message}
      </Text>
      <Ionicons name="chevron-forward" size={18} color={offline ? colors.white : colors.warning} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  offline: { backgroundColor: colors.brand },
  pending: { backgroundColor: colors.warningSoft },
  text: { flex: 1, fontSize: font.caption + 1, fontWeight: '700' },
});
