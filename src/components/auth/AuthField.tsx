import React, { ComponentProps, Ref, useState } from 'react';
import { Pressable, StyleSheet, TextInput, TextInputProps, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, font, radius, spacing, TOUCH_MIN } from '@/theme';

interface AuthFieldProps extends TextInputProps {
  /** Lu par les lecteurs d'écran : le champ n'a pas de libellé visible, l'icône en tient lieu */
  label: string;
  icon: ComponentProps<typeof Ionicons>['name'];
  /** Ajoute l'œil pour afficher / masquer un mot de passe */
  password?: boolean;
  ref?: Ref<TextInput>;
}

/** Champ arrondi avec icône, pour les écrans de connexion et d'activation. */
export function AuthField({ label, icon, password = false, style, ref, ...inputProps }: AuthFieldProps) {
  const [hidden, setHidden] = useState(password);
  const [focused, setFocused] = useState(false);

  return (
    <View style={[styles.wrapper, focused && styles.wrapperFocused]}>
      <Ionicons name={icon} size={20} color={focused ? colors.brand : colors.muted} />
      <TextInput
        ref={ref}
        accessibilityLabel={label}
        placeholderTextColor="#9AA0B4"
        secureTextEntry={hidden}
        style={[styles.input, style]}
        {...inputProps}
        onFocus={(e) => {
          setFocused(true);
          inputProps.onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          inputProps.onBlur?.(e);
        }}
      />
      {password ? (
        <Pressable
          onPress={() => setHidden((h) => !h)}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel={hidden ? 'Afficher le mot de passe' : 'Masquer le mot de passe'}
        >
          <Ionicons name={hidden ? 'eye-outline' : 'eye-off-outline'} size={22} color={colors.muted} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    minHeight: TOUCH_MIN + 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.pill,
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: 'transparent',
    shadowColor: colors.brand,
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  wrapperFocused: { borderColor: colors.brand },
  input: { flex: 1, minHeight: TOUCH_MIN, fontSize: font.body, color: colors.ink },
});
