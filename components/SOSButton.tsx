/**
 * S.O.S. Button Component
 * 
 * The central, intelligent control element of NeuroBlock OS.
 * A pulsating, animated button that starts focus sessions on touch & hold.
 * 
 * Features:
 * - Pulsating animation at idle
 * - Touch & hold to select duration (30m → 1h → 2h → Until I stop)
 * - Smooth color fill animation
 * - Haptic feedback
 * - Minimalist, machine-inspired design
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Animated,
  Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusButton, type FocusDuration } from '@/hooks/useFocusButton';
import { useTheme } from '@/contexts/ThemeContext';

interface SOSButtonProps {
  onSessionStart?: (result: { success: boolean; firstTime?: boolean; message?: string }) => void;
}

export default function SOSButton({ onSessionStart }: SOSButtonProps) {
  const { isHolding, duration, isStarting, onPressIn, onPressOut, canStart } = useFocusButton();
  const { colors } = useTheme();

  // Animation values
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fillAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0.3)).current;

  // Pulse animation at idle
  useEffect(() => {
    if (!isHolding && canStart) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.08,
            duration: 2000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 2000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );

      const glow = Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 0.6,
            duration: 2000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0.3,
            duration: 2000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );

      pulse.start();
      glow.start();

      return () => {
        pulse.stop();
        glow.stop();
      };
    }
  }, [isHolding, canStart]);

  // Fill animation on hold
  useEffect(() => {
    if (isHolding) {
      // Scale up slightly
      Animated.spring(scaleAnim, {
        toValue: 1.05,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }).start();

      // Fill animation based on duration index
      const fillValue = (duration === 30 ? 0.25 : duration === 60 ? 0.5 : duration === 120 ? 0.75 : 1);
      
      Animated.timing(fillAnim, {
        toValue: fillValue,
        duration: 200,
        easing: Easing.out(Easing.ease),
        useNativeDriver: false,
      }).start();

      // Intensify glow
      Animated.timing(glowAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    } else {
      // Reset animations
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(fillAnim, {
          toValue: 0,
          duration: 300,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
        Animated.timing(glowAnim, {
          toValue: 0.3,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isHolding, duration]);

  const formatDuration = (dur: FocusDuration): string => {
    if (dur === 0) return 'Until I stop';
    if (dur === 30) return '30m';
    if (dur === 60) return '1h';
    if (dur === 120) return '2h';
    return `${dur}m`;
  };

  const getDurationText = (dur: FocusDuration): string => {
    if (dur === 0) return 'Until I stop';
    if (dur === 30) return '30 minutes';
    if (dur === 60) return '1 hour';
    if (dur === 120) return '2 hours';
    return '';
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.buttonWrapper}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        disabled={!canStart || isStarting}
        activeOpacity={1}
      >
        <Animated.View
          style={[
            styles.buttonContainer,
            {
              transform: [
                { scale: Animated.multiply(pulseAnim, scaleAnim) },
              ],
            },
          ]}
        >
          {/* Outer glow ring */}
          <Animated.View
            style={[
              styles.glowRing,
              {
                opacity: glowAnim,
                borderColor: colors.accent,
              },
            ]}
          />

          {/* Main button circle */}
          <View style={[styles.buttonCircle, { borderColor: colors.accent }]}>
            {/* Fill gradient */}
            <Animated.View
              style={[
                StyleSheet.absoluteFill,
                {
                  opacity: fillAnim,
                },
              ]}
            >
              <LinearGradient
                colors={[colors.accent, colors.accentLight || colors.accent]}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              />
            </Animated.View>

            {/* Button content */}
            <View style={styles.buttonContent}>
              {isHolding ? (
                <>
                  <Text style={[styles.durationText, { color: colors.text }]}>
                    {formatDuration(duration)}
                  </Text>
                  <Text style={[styles.hintText, { color: colors.textSecondary }]}>
                    Release to start
                  </Text>
                </>
              ) : isStarting ? (
                <Text style={[styles.loadingText, { color: colors.text }]}>
                  Starting...
                </Text>
              ) : !canStart ? (
                <>
                  <Text style={[styles.sosText, { color: colors.textSecondary }]}>
                    Focus Active
                  </Text>
                  <Text style={[styles.hintText, { color: colors.textSecondary }]}>
                    Session in progress
                  </Text>
                </>
              ) : (
                <>
                  <Text style={[styles.sosText, { color: colors.accent }]}>
                    S.O.S.
                  </Text>
                  <Text style={[styles.hintText, { color: colors.textSecondary }]}>
                    Hold to focus
                  </Text>
                </>
              )}
            </View>
          </View>
        </Animated.View>
      </TouchableOpacity>

      {/* Duration indicator when holding */}
      {isHolding && (
        <View style={styles.durationIndicator}>
          <Text style={[styles.durationLabel, { color: colors.textSecondary }]}>
            {getDurationText(duration)}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingVertical: 40,
  },
  buttonWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  glowRing: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    borderWidth: 2,
  },
  buttonCircle: {
    width: 240,
    height: 240,
    borderRadius: 120,
    borderWidth: 3,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: '#8E89FB',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 15,
  },
  buttonContent: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    zIndex: 1,
  },
  sosText: {
    fontSize: 48,
    fontWeight: '700',
    letterSpacing: 4,
    fontFamily: Platform.select({
      ios: 'System',
      android: 'sans-serif-medium',
    }),
  },
  durationText: {
    fontSize: 56,
    fontWeight: '700',
    letterSpacing: 2,
    fontFamily: Platform.select({
      ios: 'System',
      android: 'sans-serif-medium',
    }),
  },
  loadingText: {
    fontSize: 24,
    fontWeight: '600',
    letterSpacing: 1,
  },
  hintText: {
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  durationIndicator: {
    marginTop: 24,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(142, 137, 251, 0.1)',
  },
  durationLabel: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});

