import React, { useRef, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { authStore, useAuthStore } from '@/stores/authStore';
import { authApi } from '@/api/authApi';
import { ApiError } from '@/api/client';
import { AuthScaffold } from '@/components/auth/AuthScaffold';
import { AuthField } from '@/components/auth/AuthField';
import { Button } from '@/components/ui/Button';
import { colors, font, radius, spacing } from '@/theme';

export default function LoginScreen() {
  const router = useRouter();
  const { device } = useAuthStore();
  const passwordRef = useRef<TextInput>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Renseignez votre email et votre mot de passe.');
      return;
    }
    setError(null);
    setLoading(true);

    try {
      const res = await authApi.login(email, password);

      if (res.requires2FA) {
        setError(
          'Ce compte exige la double authentification, pas encore prise en charge sur mobile. Utilisez un compte agent sans 2FA.'
        );
        return;
      }

      await authStore.getState().setAuth(res.user, res.tokens.accessToken, res.tokens.refreshToken);
      router.replace('/(protected)');
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : 'Échec de la connexion. Vérifiez vos identifiants.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Les comptes sont créés par l'administrateur de l'espace : c'est lui qui réinitialise
  const forgotPassword = () =>
    Alert.alert(
      'Mot de passe oublié',
      'Demandez à l’administrateur de votre espace de vous donner un nouveau mot de passe depuis le tableau de bord (rubrique « Mon équipe »).'
    );

  return (
    <AuthScaffold title="Connexion">
      {error ? (
        <View style={styles.errorBox} accessibilityRole="alert">
          <Ionicons name="warning" size={20} color={colors.danger} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      <AuthField
        label="Email"
        icon="mail-outline"
        value={email}
        onChangeText={setEmail}
        placeholder="Email"
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="email"
        textContentType="username"
        returnKeyType="next"
        submitBehavior="submit"
        onSubmitEditing={() => passwordRef.current?.focus()}
      />
      <AuthField
        ref={passwordRef}
        label="Mot de passe"
        icon="lock-closed-outline"
        password
        value={password}
        onChangeText={setPassword}
        placeholder="Mot de passe"
        autoComplete="password"
        textContentType="password"
        returnKeyType="go"
        onSubmitEditing={handleLogin}
      />

      <Pressable onPress={forgotPassword} hitSlop={8} style={styles.forgot} accessibilityRole="button">
        <Text style={styles.link}>Mot de passe oublié ?</Text>
      </Pressable>

      <Button
        label="Se connecter"
        variant="brand"
        large
        loading={loading}
        onPress={handleLogin}
        style={styles.pill}
      />

      <View style={styles.divider}>
        <View style={styles.line} />
        <Text style={styles.dividerText}>Ce téléphone</Text>
        <View style={styles.line} />
      </View>

      {/* État du terminal : indispensable pour qu'un agent puisse scanner */}
      <Pressable
        onPress={() => router.push('/(auth)/device')}
        accessibilityRole="button"
        android_ripple={{ color: 'rgba(47, 43, 110, 0.08)' }}
        style={[styles.deviceRow, !device && styles.deviceRowWarning]}
      >
        <View style={[styles.deviceIcon, { backgroundColor: device ? colors.successSoft : colors.white }]}>
          <Ionicons
            name={device ? 'checkmark-circle' : 'phone-portrait-outline'}
            size={22}
            color={device ? colors.success : colors.warning}
          />
        </View>
        <View style={styles.flex}>
          <Text style={styles.deviceTitle}>
            {device ? `Terminal activé : ${device.name}` : 'Téléphone pas encore activé'}
          </Text>
          <Text style={styles.deviceDetail}>
            {device ? 'Appuyez pour saisir un nouveau code' : 'Appuyez pour saisir le code d’activation'}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.muted} />
      </Pressable>

      <Text style={styles.footer}>
        Pas encore de compte ? <Text style={styles.footerStrong}>Demandez-le à votre administrateur.</Text>
      </Text>
    </AuthScaffold>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  pill: { borderRadius: radius.pill },

  errorBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.dangerSoft,
  },
  errorText: { flex: 1, color: colors.danger, fontSize: font.body - 1, fontWeight: '600', lineHeight: 21 },

  forgot: { alignSelf: 'flex-end', marginTop: -spacing.xs },
  link: { color: colors.brand, fontSize: font.caption + 1, fontWeight: '700' },

  divider: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.sm },
  line: { flex: 1, height: 1, backgroundColor: '#DCDDEA' },
  dividerText: { fontSize: font.caption, color: colors.muted },

  deviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.white,
    overflow: 'hidden',
  },
  deviceRowWarning: { backgroundColor: colors.warningSoft },
  deviceIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deviceTitle: { fontSize: font.body - 1, fontWeight: '700', color: colors.ink },
  deviceDetail: { fontSize: font.caption, color: colors.text },

  footer: { textAlign: 'center', fontSize: font.caption, color: colors.muted, marginTop: spacing.sm },
  footerStrong: { color: colors.brand, fontWeight: '700' },
});
