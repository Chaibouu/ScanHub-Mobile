import React, { ReactNode } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, font, spacing, TOUCH_MIN } from '@/theme';

const logo = require('../../../assets/icon.png');

interface AuthScaffoldProps {
  /** Titre affiché en haut de la feuille blanche */
  title: string;
  /** Bouton retour en haut à gauche (écran d'activation) */
  onBack?: () => void;
  children: ReactNode;
}

/**
 * Mise en page des écrans hors connexion : bandeau aux couleurs du logo, logo centré,
 * puis une feuille claire aux coins arrondis qui porte le formulaire.
 */
export function AuthScaffold({ title, onBack, children }: AuthScaffoldProps) {
  const insets = useSafeAreaInsets();

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <StatusBar style="light" />
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        bounces={false}
      >
        <View style={[styles.header, { paddingTop: insets.top + spacing.xxxl }]}>
          {/* Décor : formes douces et coins de viseur, comme sur le logo */}
          <View style={styles.blobLarge} />
          <View style={styles.blobAccent} />
          <View style={[styles.corner, styles.cornerTopRight]} />
          <View style={[styles.corner, styles.cornerBottomRight]} />

          {onBack ? (
            <Pressable
              onPress={onBack}
              style={[styles.back, { top: insets.top + spacing.sm }]}
              accessibilityRole="button"
              accessibilityLabel="Retour"
              hitSlop={8}
            >
              <Ionicons name="arrow-back" size={24} color={colors.white} />
            </Pressable>
          ) : null}

          <View style={styles.logoRing}>
            <Image source={logo} style={styles.logo} accessibilityIgnoresInvertColors />
          </View>
          <Text style={styles.brandName} accessibilityRole="header">
            ScanHub
          </Text>
          <Text style={styles.tagline}>Contrôle d’accès par QR code</Text>
        </View>

        <View style={[styles.sheet, { paddingBottom: insets.bottom + spacing.xxl }]}>
          <Text style={styles.title}>{title}</Text>
          {children}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const CORNER = 64;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.brand },
  scroll: { flexGrow: 1 },

  header: {
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxxl + spacing.xl,
    overflow: 'hidden',
  },
  blobLarge: {
    position: 'absolute',
    top: -70,
    left: -60,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
  },
  blobAccent: {
    position: 'absolute',
    top: 70,
    left: 60,
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(255, 123, 71, 0.28)',
  },
  corner: {
    position: 'absolute',
    width: CORNER,
    height: CORNER,
    borderColor: 'rgba(255, 255, 255, 0.16)',
  },
  cornerTopRight: {
    top: 48,
    right: 28,
    borderTopWidth: 7,
    borderRightWidth: 7,
    borderTopRightRadius: 18,
  },
  cornerBottomRight: {
    bottom: 34,
    right: 28,
    borderBottomWidth: 7,
    borderRightWidth: 7,
    borderBottomRightRadius: 18,
  },
  back: {
    position: 'absolute',
    left: spacing.md,
    width: TOUCH_MIN,
    height: TOUCH_MIN,
    borderRadius: TOUCH_MIN / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },

  logoRing: {
    padding: 4,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    marginBottom: spacing.lg,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  logo: { width: 96, height: 96, borderRadius: 28 },
  brandName: { fontSize: 34, fontWeight: '800', color: colors.white, letterSpacing: 0.5 },
  tagline: { marginTop: spacing.xs, fontSize: font.body, color: '#C9C7EA' },

  sheet: {
    flex: 1,
    marginTop: -spacing.xxxl,
    paddingTop: spacing.xxxl,
    paddingHorizontal: spacing.xxl,
    gap: spacing.lg,
    backgroundColor: colors.sheet,
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
  },
  title: { fontSize: 28, fontWeight: '800', color: colors.brand, marginBottom: spacing.xs },
});
