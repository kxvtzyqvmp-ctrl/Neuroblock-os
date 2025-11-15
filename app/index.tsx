/**
 * Root Entry Point - App Router
 * 
 * Routes based on app state:
 * - Loading → Splash screen
 * - Not onboarded → Onboarding flow
 * - Onboarded, trial expired, no subscription → Paywall
 * - Onboarded, trial active or subscribed → Dashboard
 */

import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { Shield } from 'lucide-react-native';
import { useAppState } from '@/contexts/AppStateContext';

export default function RootScreen() {
  const router = useRouter();
  const { isLoading, hasCompletedOnboarding, isTrialActive, hasSubscription } = useAppState();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  useEffect(() => {
    if (!isLoading) {
      const timer = setTimeout(() => {
        // Route based on app state
        if (!hasCompletedOnboarding) {
          // First time user - show onboarding
          router.replace('/onboarding');
        } else if (hasSubscription || isTrialActive) {
          // User has subscription or trial is active - show home
          router.replace('/home');
        } else {
          // Trial expired, no subscription - show paywall
          router.replace('/paywall');
        }
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [isLoading, hasCompletedOnboarding, isTrialActive, hasSubscription]);

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <View style={styles.iconContainer}>
          <Shield color="#7C9DD9" size={80} strokeWidth={1.5} />
          <View style={styles.glow} />
        </View>
        <Text style={styles.title}>NeuroBlock OS</Text>
        <Text style={styles.tagline}>Take control. Stay in focus.</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0B0B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
    gap: 24,
  },
  iconContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  glow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#7C9DD9',
    opacity: 0.3,
    borderRadius: 100,
    transform: [{ scale: 1.5 }],
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#E8EDF4',
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 16,
    color: '#9BA8BA',
    letterSpacing: 0.2,
  },
});
