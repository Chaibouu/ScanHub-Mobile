import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useFocusEffect, useIsFocused, useRouter } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScannerOverlay } from '@/components/scanner/ScannerOverlay';
import { Button } from '@/components/ui/Button';
import { useEventStore } from '@/stores/eventStore';
import { hapticFeedback } from '@/lib/haptics';
import { colors, font, radius, spacing, TOUCH_MIN } from '@/theme';

export default function ScannerScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();
  const { activeEvent } = useEventStore();

  const [permission, requestPermission] = useCameraPermissions();
  const [torch, setTorch] = useState(false);
  const [manualToken, setManualToken] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);

  // Verrou : un QR resté devant l'objectif ne doit ouvrir qu'un seul écran de résultat
  const lockedRef = useRef(false);
  const askedRef = useRef(false);

  // Demande l'autorisation dès l'arrivée sur l'écran, sans attendre un appui
  useEffect(() => {
    if (permission && !permission.granted && permission.canAskAgain && !askedRef.current) {
      askedRef.current = true;
      requestPermission();
    }
  }, [permission, requestPermission]);

  // Au retour de l'écran de résultat, on laisse le temps d'écarter le billet déjà lu
  useFocusEffect(
    useCallback(() => {
      const timer = setTimeout(() => {
        lockedRef.current = false;
      }, 700);
      return () => clearTimeout(timer);
    }, [])
  );

  const openResult = useCallback(
    (rawToken: string) => {
      const token = rawToken.trim();
      if (!token || lockedRef.current) return;
      lockedRef.current = true;
      hapticFeedback.scanImpact();

      router.push({
        pathname: '/(protected)/result',
        params: { token, eventId: activeEvent?.id || '' },
      });
    },
    [router, activeEvent?.id]
  );

  const submitManual = () => {
    const token = manualToken;
    setManualToken('');
    setShowManualInput(false);
    openResult(token);
  };

  const cameraReady = Boolean(permission?.granted);

  return (
    <View style={styles.container}>
      {cameraReady ? (
        <>
          <CameraView
            style={StyleSheet.absoluteFill}
            facing="back"
            // Caméra en pause quand un autre écran est au premier plan
            active={isFocused}
            enableTorch={torch}
            barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
            onBarcodeScanned={isFocused ? ({ data }) => openResult(data) : undefined}
          />
          <ScannerOverlay hint="Placez le QR code dans le cadre" />
        </>
      ) : (
        <View style={styles.permissionPanel}>
          {!permission ? (
            <ActivityIndicator size="large" color={colors.white} />
          ) : (
            <>
              <Ionicons name="camera" size={56} color={colors.white} />
              <Text style={styles.permissionTitle}>Autorisez la caméra</Text>
              <Text style={styles.permissionText}>
                ScanHub utilise la caméra uniquement pour lire les QR codes des billets et des badges.
              </Text>
              {permission.canAskAgain ? (
                <Button label="Autoriser la caméra" icon="camera" large onPress={requestPermission} />
              ) : (
                <>
                  <Text style={styles.permissionText}>
                    L’accès a été refusé. Activez la caméra pour ScanHub dans les réglages du téléphone.
                  </Text>
                  <Button
                    label="Ouvrir les réglages"
                    icon="settings"
                    large
                    onPress={() => Linking.openSettings()}
                  />
                </>
              )}
            </>
          )}
        </View>
      )}

      {/* Barre du haut */}
      <View style={[styles.topBar, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable
          style={styles.roundButton}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Fermer le scanner"
        >
          <Ionicons name="close" size={26} color={colors.white} />
        </Pressable>

        <View style={styles.eventPill}>
          <Text style={styles.eventPillText} numberOfLines={1}>
            {activeEvent?.name || 'Aucun événement choisi'}
          </Text>
        </View>

        <Pressable
          style={[styles.roundButton, torch && styles.roundButtonActive]}
          onPress={() => setTorch((on) => !on)}
          disabled={!cameraReady}
          accessibilityRole="button"
          accessibilityLabel={torch ? 'Éteindre la lampe' : 'Allumer la lampe'}
          accessibilityState={{ selected: torch }}
        >
          <Ionicons name={torch ? 'flash' : 'flash-outline'} size={24} color={torch ? colors.ink : colors.white} />
        </Pressable>
      </View>

      {/* Bas d'écran : saisie manuelle si le QR est illisible */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={[styles.bottom, { paddingBottom: insets.bottom + spacing.lg }]}
      >
        {showManualInput ? (
          <View style={styles.manualCard}>
            <Text style={styles.manualLabel}>Code inscrit sous le QR</Text>
            <TextInput
              style={styles.manualInput}
              placeholder="Ex : TKT_8F72K91X…"
              placeholderTextColor="#94A3B8"
              value={manualToken}
              onChangeText={setManualToken}
              autoCapitalize="characters"
              autoCorrect={false}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={submitManual}
              accessibilityLabel="Code du billet"
            />
            <View style={styles.manualActions}>
              <Button
                label="Annuler"
                variant="secondary"
                style={styles.flex}
                onPress={() => {
                  setManualToken('');
                  setShowManualInput(false);
                }}
              />
              <Button
                label="Vérifier"
                style={styles.flex}
                disabled={!manualToken.trim()}
                onPress={submitManual}
              />
            </View>
          </View>
        ) : (
          <>
            <Pressable
              style={styles.manualPill}
              onPress={() => setShowManualInput(true)}
              accessibilityRole="button"
              accessibilityLabel="Saisir le code à la main"
            >
              <Ionicons name="keypad" size={20} color={colors.white} />
              <Text style={styles.manualPillText}>Saisir le code à la main</Text>
            </Pressable>

            {/* Raccourcis vers les QR du seed — builds de développement uniquement */}
            {__DEV__ && (
              <View style={styles.devRow}>
                {[
                  ['Valide', 'TICKET_VALIDE_2026'],
                  ['Utilisé', 'TICKET_USED_992'],
                  ['Badge', 'BADGE_VIP_AMB'],
                ].map(([label, token]) => (
                  <Pressable key={token} style={styles.devTag} onPress={() => openResult(token)}>
                    <Text style={styles.devTagText}>Test : {label}</Text>
                  </Pressable>
                ))}
              </View>
            )}
          </>
        )}
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.brand },
  flex: { flex: 1 },

  permissionPanel: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
    paddingHorizontal: spacing.xxxl,
  },
  permissionTitle: { color: colors.white, fontSize: font.title, fontWeight: '800', textAlign: 'center' },
  permissionText: { color: '#CBD5E1', fontSize: font.body, lineHeight: 24, textAlign: 'center' },

  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  roundButton: {
    width: TOUCH_MIN,
    height: TOUCH_MIN,
    borderRadius: TOUCH_MIN / 2,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  roundButtonActive: { backgroundColor: '#FDE047' },
  eventPill: {
    flex: 1,
    minHeight: 40,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
  },
  eventPillText: { color: colors.white, fontSize: font.caption + 1, fontWeight: '700', textAlign: 'center' },

  bottom: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    gap: spacing.md,
  },
  manualPill: {
    minHeight: TOUCH_MIN,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
  },
  manualPillText: { color: colors.white, fontSize: font.body, fontWeight: '700' },
  manualCard: {
    alignSelf: 'stretch',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
  },
  manualLabel: { fontSize: font.caption + 1, fontWeight: '600', color: colors.text },
  manualInput: {
    minHeight: TOUCH_MIN,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    fontSize: font.bodyLarge,
    color: colors.ink,
  },
  manualActions: { flexDirection: 'row', gap: spacing.md },

  devRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: spacing.sm },
  devTag: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
  },
  devTagText: { color: colors.white, fontSize: font.caption, fontWeight: '600' },
});
