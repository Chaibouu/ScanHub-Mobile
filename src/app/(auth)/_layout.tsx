import React from 'react';
import { Redirect, Stack } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';
import { colors } from '@/theme';

export default function AuthLayout() {
  const { isAuthenticated } = useAuthStore();

  // Une session active n'a rien à faire sur les écrans de connexion
  if (isAuthenticated) {
    return <Redirect href="/(protected)" />;
  }

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.ink,
        headerTitleStyle: { fontWeight: '700' },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="device" options={{ headerShown: false }} />
    </Stack>
  );
}
