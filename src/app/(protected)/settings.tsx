import React from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '@/stores/authStore';
import { API_CONFIG } from '@/utils/constants';
import { authApi } from '@/api/authApi';
import { eventStore } from '@/stores/eventStore';
import { Button } from '@/components/ui/Button';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { colors, font, radius, shadow, spacing } from '@/theme';

const ROLE_LABELS: Record<string, string> = {
  AGENT: 'Agent de contrôle',
  ADMIN: 'Administrateur',
  SUPER_ADMIN: 'Propriétaire de la plateforme',
};

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, device, logout } = useAuthStore();
  const role = ROLE_LABELS[user?.role ?? ''] ?? user?.role ?? '—';

  const handleLogout = () => {
    Alert.alert('Se déconnecter ?', 'Le terminal restera activé pour la prochaine connexion.', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Se déconnecter',
        style: 'destructive',
        onPress: async () => {
          // Révoque la session côté serveur ; hors-ligne, on ferme quand même la session locale
          await authApi.logout().catch(() => {});
          await logout();
          await eventStore.getState().reset();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <ScreenHeader title="Profil" overlap={OVERLAP}>
          {/* Identité, centrée dans le bandeau */}
          <View style={styles.identity}>
            <View style={styles.avatarRing}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{(user?.name || 'A').charAt(0).toUpperCase()}</Text>
              </View>
            </View>
            <Text style={styles.name} numberOfLines={1}>
              {user?.name || 'Agent'}
            </Text>
            <Text style={styles.role}>{role}</Text>
          </View>
        </ScreenHeader>

        <View style={styles.content}>
          {/* Terminal, à cheval sur le bandeau */}
          <View style={styles.statsCard}>
            <Stat label="Terminal" value={device?.name || '—'} />
            <View style={styles.statDivider} />
            <Stat
              label="État"
              value={device ? 'Activé' : 'Non activé'}
              color={device ? colors.success : colors.danger}
            />
          </View>

          <View style={styles.card}>
            <Field label="Email" value={user?.email || '—'} />
            <Field label="Rôle" value={role} />
            {device ? <Field label="Identifiant du terminal" value={device.id} /> : null}
            <Field label="Serveur" value={API_CONFIG.BASE_URL} />
            <Field label="Version de l’application" value="1.0.0" last />
          </View>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
        <Button label="Se déconnecter" icon="log-out" variant="danger" large onPress={handleLogout} />
      </View>
    </View>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, color ? { color } : null]} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

function Field({ label, value, last = false }: { label: string; value: string; last?: boolean }) {
  return (
    <View style={[styles.field, !last && styles.fieldBorder]}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text style={styles.fieldValue} selectable>
        {value}
      </Text>
    </View>
  );
}

const OVERLAP = 40;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { paddingBottom: spacing.xl },
  content: { paddingHorizontal: spacing.lg, gap: spacing.lg, marginTop: -OVERLAP },

  identity: { alignItems: 'center', gap: 2 },
  avatarRing: {
    padding: 4,
    borderRadius: 52,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    marginBottom: spacing.sm,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 38, fontWeight: '800', color: colors.primary },
  name: { fontSize: font.title, fontWeight: '800', color: colors.white },
  role: { fontSize: font.caption + 1, color: '#C9C7EA' },

  statsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg + 4,
    paddingVertical: spacing.lg,
    ...shadow,
    shadowOpacity: 0.1,
    elevation: 4,
  },
  stat: { flex: 1, alignItems: 'center', gap: 4, paddingHorizontal: spacing.md },
  statDivider: { width: 1, height: 36, backgroundColor: colors.border },
  statLabel: { fontSize: font.caption, color: colors.muted },
  statValue: { fontSize: font.body + 1, fontWeight: '800', color: colors.ink },

  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    ...shadow,
  },
  field: { paddingVertical: spacing.md, gap: 2 },
  fieldBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  fieldLabel: { fontSize: font.caption, color: colors.muted },
  fieldValue: { fontSize: font.body - 1, fontWeight: '700', color: colors.ink },

  footer: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, backgroundColor: colors.background },
});
