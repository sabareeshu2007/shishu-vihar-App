import { StyleSheet, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

// 🎨 Premium Preschool Soft Pastel Palette
// theme/designSystem.ts
export const PALETTE = {
  background: '#F8FAFC', // 👈 Make sure background exists here
  primary: '#6366F1',
  secondary: '#EC4899',
  accent: '#10B981',
  card: '#FFFFFF',
  text: '#0F172A',
  textMuted: '#64748B',
  border: '#E2E8F0',
  warning: '#F59E0B',
};

export const RADIUS = {
  card: 20,
  pill: 999,
};

export const SPACING = {
  xs: 8,
  sm: 16,
  md: 24,
};

export const SHADOWS = {
  soft: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  premium: {
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
};
export const GLASS_THEME = {
  glassCard: 'rgba(255, 255, 255, 0.65)',
  glassCardSubtle: 'rgba(255, 255, 255, 0.45)',
  glassCardDark: 'rgba(20, 25, 45, 0.55)',

  glassBorder: 'rgba(255, 255, 255, 0.8)',
  glassBorderSubtle: 'rgba(255, 255, 255, 0.3)',

  // 1. Add "as const" so TypeScript treats them as fixed tuples
  orbPrimary: ['#FF9A9E', '#FECFEF'] as const,
  orbSecondary: ['#a1c4fd', '#c2e9fb'] as const,
  orbAccent: ['#fbc2eb', '#a6c1ee'] as const,

  glassShadow: {
    shadowColor: 'rgba(31, 38, 135, 0.15)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 8,
  }
};