import { StyleSheet, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

// 🎨 Premium Preschool Soft Pastel Palette
export const PALETTE = {
  primary: '#5BB8FF',       // Sky Blue (Joy, Clarity)
  secondary: '#9B8CFF',     // Lavender (Creativity, Gentleness)
  accent: '#7ED9A5',        // Mint Green (Safety, Growth, Present Status)
  warning: '#FFA66B',       // Peach Blossom (Alerts, Birthdays, Holidays)
  highlight: '#FFD966',     // Sunshine Yellow (Achievements, Special Focus)
  background: '#FAFBFC',    // Warm Snow Canvas (Pristine, High Contrast)
  card: '#FFFFFF',          // Pure Ivory (Clean Component Containers)
  text: '#233044',          // Dark Slate (Trustworthy, Deep Readability)
  textMuted: '#7A889B',     // Slate Blue (Soft, Non-Intrusive Secondary Labels)
  border: '#E8EDF2',        // Soft Feather Gray (Subtle Structural Outlines)
};

// 📐 Fluid Geometry & Corner Archetypes
export const RADIUS = {
  pill: 16,     // Interactive status tags & small chips
  button: 20,   // Premium call-to-action touch boundaries
  card: 24,     // Universal content container curvature
  large: 30,    // Floating navigation bar and screen heroes
};

// 🧼 Generous 8-Point Spacing Foundations
export const SPACING = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
};

// 🌤️ Tactile Depth & Elevation Profiles
export const SHADOWS = StyleSheet.create({
  soft: {
    shadowColor: '#9B8CFF', // Tinted shadow to feel magical and friendly
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  premium: {
    shadowColor: '#233044', // Deeper grounding anchor for floating bars
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 24,
    elevation: 6,
  },
});

// 📱 Utility Metrics for Screen Responsiveness
export const METRICS = {
  windowWidth: width,
  windowHeight: height,
  isSmallDevice: width < 375,
};