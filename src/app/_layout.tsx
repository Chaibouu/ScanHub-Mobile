import React, { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { authStore, useAuthStore } from '@/stores/authStore';
import { eventStore } from '@/stores/eventStore';
import { colors } from '@/theme';

export default function RootLayout() {
  const { isLoading } = useAuthStore();

  // Relit la session et l'événement actif persistés avant d'afficher la moindre route
  useEffect(() => {
    authStore.getState().hydrate();
    eventStore.getState().hydrate();
  }, []);

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.brand }}>
        <ActivityIndicator size="large" color={colors.white} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      {/* Tous les écrans ont un en-tête foncé (bleu nuit, caméra, verdict en couleur) */}
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(protected)" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      </Stack>
    </SafeAreaProvider>
  );
}
