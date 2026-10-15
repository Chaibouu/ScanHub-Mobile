import React, { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { authApi } from '@/api/authApi';
import { ApiError } from '@/api/client';
import { authStore } from '@/stores/authStore';
import { Button } from '@/components/ui/Button';
import { AuthScaffold } from '@/components/auth/AuthScaffold';
import { AuthField } from '@/components/auth/AuthField';
import { colors, font, radius, spacing } from '@/theme';

export default function DeviceActivationScreen() {
  const router = useRouter();
  const [activationCode, setActivationCode] = useState('');
  const [deviceName, setDeviceName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleActivate = async () => {
    if (!activationCode.trim()) {
      Alert.alert('Code manquant', 'Saisissez le code d’activation.');
      return;
    }
    setLoading(true);

    try {
      const { device } = await authApi.activateDevice(activationCode, deviceName);
      const { deviceKey, ...deviceInfo } = device;
      // La clé du terminal n'est transmise qu'une fois : elle part dans le stockage sécurisé
      await authStore.getState().setDevice(deviceInfo, deviceKey);

      Alert.alert('Téléphone activé', `Terminal « ${device.name} » prêt à scanner.`, [
        { text: 'Continuer', onPress: () => router.back() },
      ]);
    } catch (err) {
      Alert.alert(
        'Activation impossible',
        err instanceof ApiError ? err.message : 'Une erreur inattendue est survenue.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthScaffold title="Activer ce téléphone" onBack={() => router.back()}>
      <View style={styles.info}>
        <Ionicons name="information-circle" size={22} color={colors.brand} />
        <Text style={styles.infoText}>
          Demandez un code à votre administrateur. Il le crée dans le tableau de bord, rubrique
          « Terminaux mobiles ». Le code ne sert qu’une fois.
        </Text>
      </View>

      <AuthField
        label="Code d’activation"
        icon="key-outline"
        value={activationCode}
        onChangeText={(text) => setActivationCode(text.toUpperCase())}
        placeholder="Code à 8 caractères"
        autoCapitalize="characters"
        autoCorrect={false}
        maxLength={12}
        style={activationCode ? styles.codeInput : undefined}
      />
      <AuthField
        label="Nom du poste (facultatif)"
        icon="location-outline"
        value={deviceName}
        onChangeText={setDeviceName}
        placeholder="Nom du poste (ex : Entrée Nord)"
        maxLength={80}
        returnKeyType="go"
        onSubmitEditing={handleActivate}
      />

      <Button
        label="Activer le téléphone"
        icon="checkmark"
        variant="brand"
        large
        loading={loading}
        onPress={handleActivate}
        style={styles.pill}
      />
    </AuthScaffold>
  );
}

const styles = StyleSheet.create({
  pill: { borderRadius: radius.pill },
  info: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.brandSoft,
  },
  infoText: { flex: 1, fontSize: font.body - 2, lineHeight: 21, color: colors.text },
  codeInput: { fontSize: font.title, fontWeight: '800', letterSpacing: 4 },
});
