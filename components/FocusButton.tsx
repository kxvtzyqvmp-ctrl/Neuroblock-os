/**
 * Focus Button Component
 * 
 * Premium-grade interactive focus button with:
 * - Perfect centering
 * - Tap to start/stop (not hold)
 * - Premium Reanimated animations
 * - Haptic feedback
 * - Countdown display
 * - Smooth transitions
 */

import React, { useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Alert,
} from 'react-native';
import Animated from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Shield } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/contexts/ThemeContext';
import { useFocusSession } from '@/hooks/useFocusSession';
import { useFocusAnimations } from '@/hooks/useFocusAnimations';
import { useFocusDuration } from '@/hooks/useFocusDuration';

interface FocusButtonProps {
  onManageApps?: () => void;
}

export default function FocusButton({ onManageApps }: FocusButtonProps) {
  const { colors } = useTheme();
  const { isActive, remainingTime, totalDuration, startSession, stopSession, isLoading } = useFocusSession();
  // Get selected duration from UI - this is the single source of truth for what user selected
  const { duration: selectedDurationMinutes } = useFocusDuration();
  
  // Convert to seconds for timer
  const selectedDurationSeconds = selectedDurationMinutes * 60;
  
  // Log current duration for debugging
  useEffect(() => {
    console.log('[FocusButton] Current selected duration:', selectedDurationMinutes, 'minutes (', selectedDurationSeconds, 'seconds)');
  }, [selectedDurationMinutes, selectedDurationSeconds]);
  
  const {
    pulseStyle,
    fillStyle,
    scaleStyle,
    glowStyle,
    startPulse,
    stopPulse,
    startFill,
    resetFill,
    triggerPress,
    triggerRelease,
    triggerEnd,
  } = useFocusAnimations();

  // Update fill animation based on remaining time
  useEffect(() => {
    if (isActive && remainingTime > 0 && totalDuration > 0) {
      // Calculate progress (0 = full time, 1 = time up)
      // Progress: 0 when full time remains, 1 when time is up
      const progress = Math.max(0, Math.min(1, 1 - (remainingTime / totalDuration)));
      startFill(progress);
    } else if (!isActive) {
      resetFill();
    }
  }, [isActive, remainingTime, totalDuration, startFill, resetFill]);

  // Start pulse animation when idle
  useEffect(() => {
    if (!isActive && !isLoading) {
      startPulse();
    } else {
      stopPulse();
    }
  }, [isActive, isLoading, startPulse, stopPulse]);

  const formatTime = useCallback((totalSeconds: number): string => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }, []);

  const formattedTime = useMemo(() => {
    if (!isActive || remainingTime <= 0) return '';
    return formatTime(remainingTime);
  }, [isActive, remainingTime, formatTime]);

  const handlePress = useCallback(async () => {
    if (isLoading) return;

    if (isActive) {
      // Show confirmation modal
      Alert.alert(
        'End Focus Session?',
        'Are you sure you want to end your current focus session?',
        [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => {
              if (Platform.OS !== 'web') {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
            },
          },
          {
            text: 'End Session',
            style: 'destructive',
            onPress: async () => {
              if (Platform.OS !== 'web') {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
              }
              triggerEnd();
              await stopSession();
            },
          },
        ]
      );
    } else {
      // Start session
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      triggerPress();
      
      // Small delay for natural rhythm
      setTimeout(async () => {
        // CRITICAL: Pass durationSeconds as argument to startSession()
        // Timer does NOT store duration internally - we pass the CURRENT selected duration
        // This makes sticky-state bugs impossible - timer always uses the value we pass here
        console.log('[FocusButton] Starting session with selected duration:', selectedDurationMinutes, 'minutes (', selectedDurationSeconds, 'seconds)');
        const success = await startSession(selectedDurationSeconds); // Pass current selected duration as argument
        if (success) {
          if (Platform.OS !== 'web') {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }
          triggerRelease();
        } else {
          // Reset animations on failure
          triggerEnd();
        }
      }, 150);
    }
  }, [isLoading, isActive, startSession, stopSession, triggerPress, triggerRelease, triggerEnd, selectedDurationSeconds, selectedDurationMinutes]);

  return (
    <View style={styles.container}>
      {/* Main Focus Button */}
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.9}
        disabled={isLoading}
        style={styles.buttonWrapper}
      >
        <Animated.View style={scaleStyle as any}>
          <View style={styles.buttonContainer}>
            {/* Outer glow ring */}
            <Animated.View
              style={[styles.glowRing, glowStyle] as any}
            >
              <View style={[StyleSheet.absoluteFill, { borderColor: colors.accent, borderWidth: 2, borderRadius: 140 }]} />
            </Animated.View>

            {/* Main button circle */}
            <View style={[styles.buttonCircle, { borderColor: colors.accent }]}>
              {/* Fill gradient (countdown progress) */}
              <Animated.View
                style={fillStyle as any}
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
              {isLoading ? (
                <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                  Loading...
                </Text>
              ) : isActive ? (
                <>
                  <Shield color={colors.accent} size={32} strokeWidth={2} />
                  <Text style={[styles.activeText, { color: colors.text }]}>
                    Focus Active
                  </Text>
                  <Text style={[styles.tapHint, { color: colors.textSecondary }]}>
                    Tap to End
                  </Text>
                </>
              ) : (
                <>
                  <Shield color={colors.accent} size={32} strokeWidth={2} />
                  <Text style={[styles.idleText, { color: colors.accent }]}>
                    Tap to Focus
                  </Text>
                </>
              )}
            </View>
          </View>
          </View>
        </Animated.View>
      </TouchableOpacity>

      {/* Countdown Display */}
      {isActive && remainingTime > 0 && formattedTime && (
        <View style={styles.countdownContainer}>
          <Text style={[styles.countdownText, { color: colors.text }]}>
            {formattedTime}
          </Text>
          <Text style={[styles.countdownLabel, { color: colors.textSecondary }]}>
            remaining
          </Text>
        </View>
      )}

      {/* Manage Blocked Apps Button */}
      {!isActive && (
        <TouchableOpacity
          style={styles.manageButton}
          onPress={onManageApps}
          activeOpacity={0.7}
        >
          <Text style={[styles.manageButtonText, { color: colors.textSecondary }]}>
            Manage Blocked Apps
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
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
    gap: 12,
    zIndex: 1,
  },
  idleText: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  activeText: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  tapHint: {
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginTop: 4,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '600',
  },
  countdownContainer: {
    alignItems: 'center',
    marginTop: 32,
    gap: 8,
  },
  countdownText: {
    fontSize: 48,
    fontWeight: '700',
    letterSpacing: 2,
    fontVariant: ['tabular-nums'],
  },
  countdownLabel: {
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  manageButton: {
    marginTop: 40,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  manageButtonText: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});

