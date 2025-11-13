import { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function AuroraBackground() {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1500,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <>
      <LinearGradient
        colors={['#0B0B0B', '#1A1B2E', '#16213E', '#0B0B0B']}
        style={styles.gradientBackground}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      <Animated.View style={[styles.auroraLayer, { opacity: fadeAnim }]}>
        <LinearGradient
          colors={[
            'rgba(142, 137, 251, 0.15)',
            'rgba(78, 212, 199, 0.08)',
            'rgba(163, 161, 255, 0.12)',
          ]}
          style={styles.aurora}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  gradientBackground: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  auroraLayer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  aurora: {
    flex: 1,
    opacity: 0.6,
  },
});
