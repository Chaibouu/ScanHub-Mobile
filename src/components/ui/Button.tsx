import React, { ComponentProps } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, ViewStyle, StyleProp } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, font, radius, spacing, TOUCH_MIN } from '@/theme';

type Variant = 'primary' | 'brand' | 'accent' | 'secondary' | 'danger' | 'ghost' | 'onColor';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  icon?: ComponentProps<typeof Ionicons>['name'];
  loading?: boolean;
  disabled?: boolean;
  /** Bouton d'action principal d'un écran : plus haut, texte plus gros */
  large?: boolean;
  style?: StyleProp<ViewStyle>;
}

const VARIANTS: Record<Variant, { bg: string; pressed: string; fg: string; border?: string }> = {
  primary: { bg: colors.primary, pressed: colors.primaryPressed, fg: colors.white },
  // Couleur du logo (écrans de connexion et d'activation)
  brand: { bg: colors.brand, pressed: colors.brandPressed, fg: colors.white },
  // Action principale de l'application : scanner
  accent: { bg: colors.accentStrong, pressed: colors.accentPressed, fg: colors.white },
  secondary: { bg: colors.surface, pressed: colors.background, fg: colors.ink, border: colors.border },
  danger: { bg: colors.dangerSoft, pressed: '#FECACA', fg: colors.danger },
  ghost: { bg: 'transparent', pressed: colors.background, fg: colors.primary },
  // Sur un fond de couleur pleine (écran de résultat)
  onColor: { bg: colors.white, pressed: '#E2E8F0', fg: colors.ink },
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  icon,
  loading = false,
  disabled = false,
  large = false,
  style,
}: ButtonProps) {
  const tone = VARIANTS[variant];
  const inactive = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: inactive, busy: loading }}
      android_ripple={{ color: 'rgba(15, 23, 42, 0.12)' }}
      style={({ pressed }) => [
        styles.base,
        large && styles.large,
        { backgroundColor: pressed ? tone.pressed : tone.bg },
        tone.border ? { borderWidth: 1, borderColor: tone.border } : null,
        inactive && styles.inactive,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={tone.fg} />
      ) : (
        <>
          {icon && <Ionicons name={icon} size={large ? 24 : 20} color={tone.fg} />}
          <Text style={[styles.label, large && styles.labelLarge, { color: tone.fg }]}>{label}</Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: TOUCH_MIN,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    overflow: 'hidden',
  },
  large: { minHeight: 60 },
  inactive: { opacity: 0.55 },
  label: { fontSize: font.body, fontWeight: '700' },
  labelLarge: { fontSize: font.bodyLarge },
});
