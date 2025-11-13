import { ReactNode } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface GlassCardProps {
  children: ReactNode;
  style?: ViewStyle;
  glowColor?: string;
}

export default function GlassCard({ children, style, glowColor = '#8E89FB' }: GlassCardProps) {
  return (
    <View style={[styles.container, style]}>
      <LinearGradient
        colors={['rgba(22, 28, 38, 0.6)', 'rgba(26, 27, 46, 0.4)']}
        style={styles.gradient}
      >
        <View style={[styles.glowTop, { backgroundColor: glowColor }]} />
        <View style={styles.content}>{children}</View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(163, 161, 255, 0.2)',
  },
  gradient: {
    padding: 24,
    position: 'relative',
  },
  glowTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    opacity: 0.4,
  },
  content: {
    position: 'relative',
  },
});
