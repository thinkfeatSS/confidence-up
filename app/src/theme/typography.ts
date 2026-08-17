import { TextStyle } from 'react-native';
import { Colors } from './colors';

type TypographyStyle = Pick<TextStyle, 'fontSize' | 'fontWeight' | 'lineHeight' | 'letterSpacing' | 'color'>;

export const Typography: Record<string, TypographyStyle> = {
  display: {
    fontSize: 32,
    fontWeight: '700',
    lineHeight: 40,
    letterSpacing: -0.5,
    color: Colors.textPrimary,
  },
  h1: {
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 32,
    letterSpacing: -0.3,
    color: Colors.textPrimary,
  },
  h2: {
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 28,
    letterSpacing: -0.2,
    color: Colors.textPrimary,
  },
  h3: {
    fontSize: 17,
    fontWeight: '600',
    lineHeight: 24,
    color: Colors.textPrimary,
  },
  bodyLarge: {
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 24,
    color: Colors.textSecondary,
  },
  body: {
    fontSize: 15,
    fontWeight: '400',
    lineHeight: 22,
    color: Colors.textSecondary,
  },
  bodySmall: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
    color: Colors.textSecondary,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
    color: Colors.textSecondary,
  },
  labelBold: {
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
    letterSpacing: 0.5,
    color: Colors.textPrimary,
  },
  caption: {
    fontSize: 11,
    fontWeight: '500',
    lineHeight: 16,
    color: Colors.textMuted,
  },
  captionBold: {
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 16,
    letterSpacing: 0.8,
    color: Colors.textMuted,
  },
  xpNumber: {
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 34,
    color: Colors.xpGold,
  },
  scoreHero: {
    fontSize: 48,
    fontWeight: '700',
    lineHeight: 56,
    color: Colors.textPrimary,
  },
};
