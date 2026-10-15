import type { ComponentProps } from 'react';
import type { Ionicons } from '@expo/vector-icons';
import type { ScanResultCode } from '@/types/qr';

/**
 * Thème de l'application : un outil de terrain, utilisé debout, d'une main, souvent en
 * plein soleil. D'où un fort contraste, de gros textes et des zones tactiles généreuses.
 */

export const colors = {
  // Bleu nuit du logo ScanHub
  primary: '#2F2B6E',
  primaryPressed: '#24205A',
  primarySoft: '#ECEBF6',

  // Couleurs du logo ScanHub (écrans de connexion et d'activation)
  brand: '#2F2B6E',
  brandPressed: '#24205A',
  brandSoft: '#ECEBF6',
  accent: '#FF7B47',
  // Orange plus soutenu pour porter un texte blanc lisible (bouton Scanner)
  accentStrong: '#E4572E',
  accentPressed: '#C94822',
  accentSoft: '#FFEDE5',
  sheet: '#F6F6FB',

  ink: '#0F172A', // titres
  text: '#334155', // texte courant
  muted: '#64748B', // texte secondaire (contraste 4.5:1 sur fond clair)
  border: '#E2E8F0',
  background: '#F4F5FA',
  surface: '#FFFFFF',

  success: '#15803D',
  successSoft: '#DCFCE7',
  danger: '#B91C1C',
  dangerSoft: '#FEE2E2',
  warning: '#B45309',
  warningSoft: '#FEF3C7',

  white: '#FFFFFF',
  black: '#000000',
  overlay: 'rgba(2, 6, 23, 0.62)',
} as const;

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32 } as const;

export const radius = { sm: 10, md: 14, lg: 20, pill: 999 } as const;

export const font = {
  caption: 13,
  body: 16,
  bodyLarge: 18,
  title: 22,
  display: 30,
} as const;

/** Hauteur minimale d'une zone tactile (recommandation : 44 pt, portée à 52 pour les gants / la marche). */
export const TOUCH_MIN = 52;

export const shadow = {
  shadowColor: '#0F172A',
  shadowOpacity: 0.06,
  shadowRadius: 10,
  shadowOffset: { width: 0, height: 3 },
  elevation: 2,
} as const;

type IconName = ComponentProps<typeof Ionicons>['name'];

interface ResultTone {
  /** Couleur pleine de l'écran de résultat : se lit à bout de bras, sans lire le texte */
  solid: string;
  soft: string;
  icon: IconName;
  title: string;
}

/**
 * Trois familles visuelles seulement, pour une lecture immédiate :
 * vert = laisser entrer, orange = déjà passé / à vérifier, rouge = refuser.
 */
export const RESULT_TONES: Record<ScanResultCode, ResultTone> = {
  VALID: { solid: colors.success, soft: colors.successSoft, icon: 'checkmark-circle', title: 'Accès autorisé' },
  ALREADY_USED: { solid: colors.warning, soft: colors.warningSoft, icon: 'alert-circle', title: 'Déjà utilisé' },
  EXPIRED: { solid: colors.warning, soft: colors.warningSoft, icon: 'time', title: 'Expiré' },
  EVENT_CLOSED: { solid: colors.warning, soft: colors.warningSoft, icon: 'lock-closed', title: 'Événement fermé' },
  REVOKED: { solid: colors.danger, soft: colors.dangerSoft, icon: 'ban', title: 'Révoqué' },
  INVALID: { solid: colors.danger, soft: colors.dangerSoft, icon: 'close-circle', title: 'Code inconnu' },
  UNAUTHORIZED: { solid: colors.danger, soft: colors.dangerSoft, icon: 'shield', title: 'Autre événement' },
  DEVICE_BLOCKED: { solid: colors.danger, soft: colors.dangerSoft, icon: 'phone-portrait', title: 'Terminal bloqué' },
  // Ni oui ni non : on n'a pas pu vérifier, l'agent doit réessayer
  UNVERIFIED: { solid: '#475569', soft: '#E2E8F0', icon: 'cloud-offline', title: 'Vérification impossible' },
};
