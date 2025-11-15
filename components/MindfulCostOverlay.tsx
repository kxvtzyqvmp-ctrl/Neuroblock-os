/**
 * Mindful Cost Overlay Component
 * 
 * Pro feature: Displays a 2-second fullscreen overlay when user tries to open a blocked app.
 * Shows attempt count, app icon, and remaining time in a neutral, data-driven way.
 * 
 * Philosophy: Instead of punishing users, reflect their pattern back to them.
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Animated,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Shield, AlertTriangle, Clock } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/contexts/ThemeContext';

interface MindfulCostOverlayProps {
  visible: boolean;
  appName: string;
  attemptCount: number;
  remainingTime: string;
  onDismiss?: () => void;
}

export default function MindfulCostOverlay({
  visible,
  appName,
  attemptCount,
  remainingTime,
  onDismiss,
}: MindfulCostOverlayProps) {
  const { colors } = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    if (visible) {
      // Haptic warning feedback
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }

      // Fade in animation
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto-dismiss after 2 seconds
      const timer = setTimeout(() => {
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(slideAnim, {
            toValue: 50,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start(() => {
          if (onDismiss) {
            onDismiss();
          }
        });
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [visible, onDismiss]);

  if (!visible) return null;

  const getAttemptText = (count: number): string => {
    const ordinals = ['', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th'];
    if (count <= 10) {
      return ordinals[count] || `${count}th`;
    }
    return `${count}th`;
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      statusBarTranslucent={true}
      onRequestClose={onDismiss}
    >
      <Animated.View
        style={[
          styles.overlay,
          {
            opacity: fadeAnim,
            backgroundColor: `rgba(${colors.background === '#0B0B0B' ? '11, 11, 11' : '255, 255, 255'}, 0.95)`,
          },
        ]}
      >
        <Animated.View
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* App icon placeholder */}
          <View style={[styles.iconContainer, { backgroundColor: `${colors.accent}20` }]}>
            <Shield color={colors.accent} size={48} strokeWidth={2} />
          </View>

          {/* App name */}
          <Text style={[styles.appName, { color: colors.text }]} numberOfLines={1}>
            {appName}
          </Text>

          {/* Attempt count message */}
          <View style={styles.messageContainer}>
            <Text style={[styles.messageText, { color: colors.textSecondary }]}>
              This is your {getAttemptText(attemptCount)} attempt
            </Text>
            <Text style={[styles.messageText, { color: colors.textSecondary }]}>
              to open this app.
            </Text>
          </View>

          {/* Remaining time */}
          {remainingTime && (
            <View style={[styles.timeContainer, { backgroundColor: `${colors.accent}15` }]}>
              <Clock color={colors.accent} size={18} strokeWidth={2} />
              <Text style={[styles.timeText, { color: colors.accent }]}>
                {remainingTime} remaining in this Focus Block
              </Text>
            </View>
          )}

          {/* Neutral observation */}
          <View style={styles.observationContainer}>
            <Text style={[styles.observationText, { color: colors.textSecondary }]}>
              Notice the pattern.
            </Text>
          </View>
        </Animated.View>

        {/* Tap to dismiss hint */}
        <TouchableOpacity
          style={styles.dismissHint}
          onPress={onDismiss}
          activeOpacity={0.7}
        >
          <Text style={[styles.dismissText, { color: colors.textSecondary }]}>
            Tap to dismiss
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    maxWidth: 400,
    gap: 24,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  appName: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  messageContainer: {
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
  },
  messageText: {
    fontSize: 18,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 26,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 16,
    marginTop: 8,
  },
  timeText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  observationContainer: {
    marginTop: 16,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: 'rgba(142, 137, 251, 0.2)',
  },
  observationText: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  dismissHint: {
    position: 'absolute',
    bottom: 60,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  dismissText: {
    fontSize: 14,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 1,
    opacity: 0.6,
  },
});

