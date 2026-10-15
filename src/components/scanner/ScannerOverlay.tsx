import React from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { colors, font, radius, spacing } from '@/theme';

const CORNER = 34;
const STROKE = 5;

/**
 * Cadre de visée posé au-dessus de la caméra.
 * `pointerEvents="none"` : il ne doit jamais intercepter les appuis destinés
 * aux boutons situés dessous (autorisation caméra, saisie manuelle…).
 */
export function ScannerOverlay({ hint }: { hint: string }) {
  const { width } = useWindowDimensions();
  const size = Math.min(width * 0.72, 320);

  return (
    <View style={styles.overlay} pointerEvents="none">
      <View style={styles.mask} />
      <View style={styles.centerRow}>
        <View style={styles.mask} />
        <View style={{ width: size, height: size }}>
          <View style={[styles.corner, styles.topLeft]} />
          <View style={[styles.corner, styles.topRight]} />
          <View style={[styles.corner, styles.bottomLeft]} />
          <View style={[styles.corner, styles.bottomRight]} />
        </View>
        <View style={styles.mask} />
      </View>
      <View style={[styles.mask, styles.bottomMask]}>
        <Text style={styles.hint}>{hint}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFill },
  mask: { flex: 1, backgroundColor: colors.overlay },
  centerRow: { flexDirection: 'row' },
  bottomMask: { alignItems: 'center', paddingTop: spacing.xl },
  hint: {
    color: colors.white,
    fontSize: font.body,
    fontWeight: '600',
    textAlign: 'center',
    paddingHorizontal: spacing.xxl,
  },
  corner: { position: 'absolute', width: CORNER, height: CORNER, borderColor: colors.white },
  topLeft: { top: 0, left: 0, borderTopWidth: STROKE, borderLeftWidth: STROKE, borderTopLeftRadius: radius.md },
  topRight: { top: 0, right: 0, borderTopWidth: STROKE, borderRightWidth: STROKE, borderTopRightRadius: radius.md },
  bottomLeft: { bottom: 0, left: 0, borderBottomWidth: STROKE, borderLeftWidth: STROKE, borderBottomLeftRadius: radius.md },
  bottomRight: { bottom: 0, right: 0, borderBottomWidth: STROKE, borderRightWidth: STROKE, borderBottomRightRadius: radius.md },
});
