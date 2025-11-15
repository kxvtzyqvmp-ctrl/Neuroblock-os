/**
 * Blocking Overlay Component
 * 
 * Displays a fullscreen overlay when a blocked app is detected
 * during an active focus/detox session.
 * 
 * For iOS, shows a message about limitations instead.
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  Platform,
} from 'react-native';
import { Shield, X, Timer, AlertTriangle } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

interface BlockingOverlayProps {
  visible: boolean;
  blockedAppName: string;
  remainingTime?: string;
  onDismiss?: () => void;
}

export default function BlockingOverlay({
  visible,
  blockedAppName,
  remainingTime,
  onDismiss,
}: BlockingOverlayProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start();

      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.8,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="none"
      onRequestClose={onDismiss}
    >
      <LinearGradient
        colors={['#0B0B0B', '#1A1B2E']}
        style={styles.container}
      >
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
            <View style={styles.iconCircle}>
              <Shield color="#F87171" size={64} strokeWidth={2} />
            </View>
          </View>

          {Platform.OS === 'ios' ? (
            <>
              <Text style={styles.title}>iOS Limitations</Text>
              <View style={styles.iOSWarningContainer}>
                <AlertTriangle color="#FECF5E" size={32} strokeWidth={2} />
                <Text style={styles.iOSWarningText}>
                  App blocking is limited on iOS due to system permissions.
                </Text>
                <Text style={styles.iOSInfoText}>
                  Use the Focus Timer to stay distraction-free during your detox session.
                </Text>
              </View>
              {remainingTime && (
                <View style={styles.timerContainer}>
                  <Timer color="#8E89FB" size={20} strokeWidth={2} />
                  <Text style={styles.timerText}>{remainingTime} remaining</Text>
                </View>
              )}
            </>
          ) : (
            <>
              <Text style={styles.title}>App Blocked</Text>
              <Text style={styles.appName}>{blockedAppName}</Text>
              <Text style={styles.message}>
                You're in Detox Mode — this app is currently blocked.
              </Text>
              <Text style={styles.subMessage}>
                This app cannot be accessed during your focus session.
              </Text>

              {remainingTime && (
                <View style={styles.timerContainer}>
                  <Timer color="#8E89FB" size={20} strokeWidth={2} />
                  <Text style={styles.timerText}>{remainingTime} remaining</Text>
                </View>
              )}
            </>
          )}

          <View style={styles.buttonContainer}>
            {Platform.OS === 'ios' ? (
              <TouchableOpacity
                style={styles.button}
                onPress={onDismiss}
              >
                <LinearGradient
                  colors={['#8E89FB', '#4ED4C7']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.buttonGradient}
                >
                  <Text style={styles.buttonText}>Continue Focus</Text>
                </LinearGradient>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.button}
                onPress={onDismiss}
              >
                <LinearGradient
                  colors={['#8E89FB', '#4ED4C7']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.buttonGradient}
                >
                  <Text style={styles.buttonText}>Back to Focus</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>
      </LinearGradient>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    alignItems: 'center',
    maxWidth: 400,
    width: '100%',
  },
  iconContainer: {
    marginBottom: 32,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(248, 113, 113, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(248, 113, 113, 0.3)',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
  },
  appName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#F87171',
    marginBottom: 16,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#9BA8BA',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 12,
  },
  subMessage: {
    fontSize: 14,
    color: '#6B7A8F',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 32,
  },
  iOSWarningContainer: {
    alignItems: 'center',
    gap: 16,
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  iOSWarningText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FECF5E',
    textAlign: 'center',
    lineHeight: 22,
  },
  iOSInfoText: {
    fontSize: 14,
    color: '#9BA8BA',
    textAlign: 'center',
    lineHeight: 20,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(142, 137, 251, 0.1)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: 'rgba(142, 137, 251, 0.2)',
  },
  timerText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8E89FB',
  },
  buttonContainer: {
    width: '100%',
    marginTop: 16,
  },
  button: {
    height: 56,
    borderRadius: 16,
    overflow: 'hidden',
  },
  buttonGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

