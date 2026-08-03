import React from 'react';
import { StyleSheet, View, ViewStyle, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { GLASS_THEME } from '../theme/designSystem';

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  intensity?: number;
}

export const GlassCard = ({ children, style, intensity = 50 }: GlassCardProps) => {
  return (
    <View style={[styles.container, GLASS_THEME.glassShadow, style]}>
      {/* 🛠️ pointerEvents="none" allows scrolling gestures to pass through cleanly */}
      <BlurView 
        intensity={Platform.OS === 'android' ? 30 : intensity} 
        tint="light" 
        style={StyleSheet.absoluteFillObject} 
        pointerEvents="none"
      />
      <View style={styles.contentInner}>
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: GLASS_THEME.glassBorder,
    backgroundColor: GLASS_THEME.glassCard,
    position: 'relative',
  },
  contentInner: {
    padding: 20,
    zIndex: 1, // Ensures content sits above blur backdrop
  },
});