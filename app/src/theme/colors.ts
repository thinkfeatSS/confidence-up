export const darkColors = {
  bgPrimary: '#0A0B14',
  bgSecondary: '#0F1020',
  bgCard: 'rgba(255,255,255,0.05)',
  bgCardElevated: 'rgba(120,80,255,0.08)',
  bgInput: 'rgba(255,255,255,0.07)',

  accentPurple: '#7C3AED',
  accentPurpleLight: '#A855F7',
  accentPurpleDark: '#5B21B6',
  accentCyan: '#06B6D4',
  accentCyanLight: '#67E8F9',

  xpGold: '#F59E0B',
  xpGoldLight: '#FCD34D',
  streakOrange: '#F97316',
  success: '#10B981',
  successLight: '#34D399',
  danger: '#EF4444',
  dangerLight: '#FCA5A5',
  warning: '#F59E0B',

  textPrimary: '#F8FAFC',
  textSecondary: '#94A3B8',
  textMuted: '#475569',
  textDisabled: '#334155',

  border: 'rgba(255,255,255,0.08)',
  borderAccent: 'rgba(124,58,237,0.4)',
  borderCyan: 'rgba(6,182,212,0.3)',

  glowPurple: 'rgba(124,58,237,0.5)',
  glowCyan: 'rgba(6,182,212,0.35)',
  glowGold: 'rgba(245,158,11,0.45)',
  glowGreen: 'rgba(16,185,129,0.35)',
  glowOrange: 'rgba(249,115,22,0.4)',

  categorySpeaking: '#06B6D4',
  categorySocial: '#10B981',
  categoryAcademic: '#A855F7',
  categorySports: '#F97316',
  categoryCreative: '#EC4899',

  levelBronze: '#CD7F32',
  levelSilver: '#94A3B8',
  levelGold: '#F59E0B',
  levelPlatinum: '#06B6D4',
  levelDiamond: '#A855F7',

  white: '#FFFFFF',
  black: '#000000',
  overlay: 'rgba(0,0,0,0.7)',
  overlayLight: 'rgba(0,0,0,0.4)',

  transparent: 'transparent',
} as const;

export const lightColors = {
  bgPrimary: '#F8FAFC',
  bgSecondary: '#F1F5F9',
  bgCard: 'rgba(255,255,255,0.92)',
  bgCardElevated: 'rgba(124,58,237,0.06)',
  bgInput: 'rgba(15,23,42,0.04)',

  accentPurple: '#7C3AED',
  accentPurpleLight: '#6D28D9',
  accentPurpleDark: '#5B21B6',
  accentCyan: '#0891B2',
  accentCyanLight: '#0E7490',

  xpGold: '#D97706',
  xpGoldLight: '#F59E0B',
  streakOrange: '#EA580C',
  success: '#059669',
  successLight: '#10B981',
  danger: '#DC2626',
  dangerLight: '#EF4444',
  warning: '#D97706',

  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#64748B',
  textDisabled: '#94A3B8',

  border: 'rgba(15,23,42,0.1)',
  borderAccent: 'rgba(124,58,237,0.25)',
  borderCyan: 'rgba(8,145,178,0.25)',

  glowPurple: 'rgba(124,58,237,0.15)',
  glowCyan: 'rgba(8,145,178,0.12)',
  glowGold: 'rgba(217,119,6,0.15)',
  glowGreen: 'rgba(5,150,105,0.12)',
  glowOrange: 'rgba(234,88,12,0.12)',

  categorySpeaking: '#0891B2',
  categorySocial: '#059669',
  categoryAcademic: '#7C3AED',
  categorySports: '#EA580C',
  categoryCreative: '#DB2777',

  levelBronze: '#B45309',
  levelSilver: '#64748B',
  levelGold: '#D97706',
  levelPlatinum: '#0891B2',
  levelDiamond: '#7C3AED',

  white: '#FFFFFF',
  black: '#000000',
  overlay: 'rgba(15,23,42,0.5)',
  overlayLight: 'rgba(15,23,42,0.25)',

  transparent: 'transparent',
} as const;

/** @deprecated Use useTheme().colors in new code */
export const Colors = darkColors;

export type ThemeColors = typeof darkColors | typeof lightColors;
export type ColorKey = keyof typeof darkColors;
