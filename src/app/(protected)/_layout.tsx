import React, { useEffect } from 'react';
import { Redirect, Stack } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { NetworkStatusBar } from '@/components/sync/NetworkStatusBar';
import { useSync } from '@/hooks/useSync';
import { useAuthStore } from '@/stores/authStore';
import { eventStore, useEventStore } from '@/stores/eventStore';
import { colors } from '@/theme';

export default function ProtectedLayout() {
  // Automatically monitors network connectivity and triggers background sync on reconnection
  const { triggerPullSync } = useSync();

  const { isAuthenticated } = useAuthStore();
  const activeEventId = useEventStore().activeEvent?.id;

  useEffect(() => {
    if (isAuthenticated) {
      eventStore.getState().loadEvents();
    }
  }, [isAuthenticated]);

  // Télécharge en silence les billets de l'événement choisi : ils servent de secours
  // si le serveur ne répond pas pendant un scan
  useEffect(() => {
    if (isAuthenticated && activeEventId) {
      triggerPullSync(activeEventId).catch(() => {});
    }
  }, [isAuthenticated, activeEventId, triggerPullSync]);

  // Garde d'accès : sans session, aucune route protégée n'est rendue
  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <View style={styles.container}>
      {/* Chaque écran dessine son propre bandeau (ScreenHeader) */}
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
        <Stack.Screen name="index" />
        {/* Caméra et résultat en plein écran */}
        <Stack.Screen name="scanner" />
        <Stack.Screen name="result" options={{ animation: 'fade' }} />
        <Stack.Screen name="history" />
        <Stack.Screen name="event" />
        <Stack.Screen name="sync" />
        <Stack.Screen name="settings" />
      </Stack>
      <NetworkStatusBar />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
});
