import React, { ComponentProps, ReactNode } from 'react';
import { Pressable, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, font, radius, shadow, spacing } from '@/theme';

type IconName = ComponentProps<typeof Ionicons>['name'];

/** Icône dans un carré aux coins arrondis, sur fond pastel. */
export function IconTile({
  icon,
  color = colors.primary,
  background = colors.primarySoft,
  size = 44,
}: {
  icon: IconName;
  color?: string;
  background?: string;
  size?: number;
}) {
  return (
    <View
      style={[
        styles.tile,
        { width: size, height: size, borderRadius: size * 0.32, backgroundColor: background },
      ]}
    >
      <Ionicons name={icon} size={size * 0.5} color={color} />
    </View>
  );
}

interface ListItemProps {
  icon: IconName;
  iconColor?: string;
  iconBackground?: string;
  title: string;
  subtitle?: string;
  /** Ligne colorée sous le titre (verdict, statut…) */
  highlight?: { text: string; color: string };
  /** Contenu à droite : heure, pastille… (chevron par défaut si onPress) */
  right?: ReactNode;
  onPress?: () => void;
  selected?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}

/** Ligne de liste en carte blanche : icône, titre, détail et élément à droite. */
export function ListItem({
  icon,
  iconColor,
  iconBackground,
  title,
  subtitle,
  highlight,
  right,
  onPress,
  selected = false,
  style,
  accessibilityLabel,
}: ListItemProps) {
  const content = (
    <>
      <IconTile icon={icon} color={iconColor} background={iconBackground} />
      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        {highlight ? (
          <Text style={[styles.highlight, { color: highlight.color }]} numberOfLines={1}>
            {highlight.text}
          </Text>
        ) : null}
        {subtitle ? (
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right ?? (onPress ? <Ionicons name="chevron-forward" size={20} color={colors.muted} /> : null)}
    </>
  );

  if (!onPress) {
    return <View style={[styles.item, style]}>{content}</View>;
  }

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ selected }}
      android_ripple={{ color: 'rgba(47, 43, 110, 0.08)' }}
      style={({ pressed }) => [styles.item, selected && styles.selected, pressed && styles.pressed, style]}
    >
      {content}
    </Pressable>
  );
}

/** Pastille de statut arrondie. */
export function Pill({ text, color, background }: { text: string; color: string; background: string }) {
  return (
    <View style={[styles.pill, { backgroundColor: background }]}>
      <Text style={[styles.pillText, { color }]}>{text}</Text>
    </View>
  );
}

/** Titre de section, avec un lien facultatif à droite. */
export function SectionTitle({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {action && onAction ? (
        <Pressable onPress={onAction} hitSlop={10} accessibilityRole="button">
          <Text style={styles.sectionAction}>{action}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  tile: { alignItems: 'center', justifyContent: 'center' },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: 'transparent',
    overflow: 'hidden',
    ...shadow,
  },
  selected: { borderColor: colors.primary },
  pressed: { backgroundColor: '#FAFAFE' },
  body: { flex: 1, gap: 2 },
  title: { fontSize: font.body, fontWeight: '700', color: colors.ink },
  highlight: { fontSize: font.caption + 1, fontWeight: '700' },
  subtitle: { fontSize: font.caption, color: colors.muted },

  pill: { paddingHorizontal: spacing.md, paddingVertical: 5, borderRadius: radius.pill },
  pillText: { fontSize: font.caption - 1, fontWeight: '800' },

  section: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { fontSize: font.bodyLarge, fontWeight: '800', color: colors.ink },
  sectionAction: { fontSize: font.caption + 1, fontWeight: '700', color: colors.primary },
});
