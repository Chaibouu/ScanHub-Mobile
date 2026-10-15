import React, { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, font, spacing, TOUCH_MIN } from '@/theme';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  /** false sur l'accueil : pas de bouton retour */
  back?: boolean;
  /** Élément à droite du titre (bouton, avatar…) */
  right?: ReactNode;
  /** Contenu sous le titre, dans le bandeau (recherche, filtres…) */
  children?: ReactNode;
  /** Marge basse supplémentaire, pour une carte qui chevauche le bandeau */
  overlap?: number;
}

/**
 * Bandeau bleu nuit aux coins bas arrondis, commun à tous les écrans de l'application.
 * Remplace l'en-tête natif : même allure partout, logo et écran de connexion compris.
 */
export function ScreenHeader({ title, subtitle, back = true, right, children, overlap = 0 }: ScreenHeaderProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.header, { paddingTop: insets.top + spacing.xxxl, paddingBottom: spacing.xxxl + spacing.xs + overlap }]}>
      <HeaderDecor />

      <View style={styles.row}>
        {back ? (
          <HeaderButton icon="arrow-back" label="Retour" onPress={() => router.back()} />
        ) : null}
        <View style={styles.titles}>
          <Text style={styles.title} numberOfLines={1} accessibilityRole="header">
            {title}
          </Text>
          {subtitle ? (
            <Text style={styles.subtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        {right}
      </View>

      {children ? <View style={styles.children}>{children}</View> : null}
    </View>
  );
}

/** Bouton rond translucide posé sur le bandeau. */
export function HeaderButton({
  icon,
  label,
  onPress,
  badge,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  onPress: () => void;
  badge?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={6}
      style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
    >
      <Ionicons name={icon} size={22} color={colors.white} />
      {badge ? <View style={styles.badge} /> : null}
    </Pressable>
  );
}

/** Formes douces en arrière-plan, reprises de l'écran de connexion. */
export function HeaderDecor() {
  return (
    <>
      <View style={styles.blob} pointerEvents="none" />
      <View style={styles.blobSmall} pointerEvents="none" />
    </>
  );
}

const BUTTON = TOUCH_MIN - 8;

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.brand,
    paddingHorizontal: spacing.lg,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    overflow: 'hidden',
  },
  blob: {
    position: 'absolute',
    top: -90,
    right: -60,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  blobSmall: {
    position: 'absolute',
    bottom: 18,
    left: -24,
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255, 123, 71, 0.16)',
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: BUTTON },
  titles: { flex: 1 },
  title: { fontSize: font.title, fontWeight: '800', color: colors.white },
  subtitle: { fontSize: font.caption + 1, color: '#C9C7EA', marginTop: 1 },
  children: { marginTop: spacing.lg, gap: spacing.md },

  button: {
    width: BUTTON,
    height: BUTTON,
    borderRadius: BUTTON / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
  },
  buttonPressed: { backgroundColor: 'rgba(255, 255, 255, 0.26)' },
  badge: {
    position: 'absolute',
    top: 9,
    right: 10,
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: colors.accent,
    borderWidth: 1.5,
    borderColor: colors.brand,
  },
});
