import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { X, Clock, Pause } from 'lucide-react-native';
import { Notification, dismissNotification, markNotificationRead } from '@/lib/notifications';

interface NotificationBannerProps {
  notification: Notification;
  onDismiss: () => void;
}

export default function NotificationBanner({ notification, onDismiss }: NotificationBannerProps) {
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(-100));

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    markNotificationRead(notification.id);

    const timer = setTimeout(() => {
      handleDismiss();
    }, 8000);

    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = (action?: string) => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      dismissNotification(notification.id, action);
      onDismiss();
    });
  };

  const getBorderColor = () => {
    switch (notification.notification_type) {
      case 'focus':
        return '#7C9DD9';
      case 'motivation':
        return '#5AE38C';
      case 'nudge':
        return '#8E89FB';
      case 'checkin':
        return '#FECF5E';
      case 'challenge':
        return '#4ED4C7';
      default:
        return '#7C9DD9';
    }
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
          borderLeftColor: getBorderColor(),
        },
      ]}
    >
      <View style={styles.content}>
        <Text style={styles.icon}>{notification.icon}</Text>
        <View style={styles.textContainer}>
          <Text style={styles.title}>{notification.title}</Text>
          <Text style={styles.message}>{notification.message}</Text>
        </View>
        <TouchableOpacity style={styles.closeButton} onPress={() => handleDismiss()}>
          <X color="#9BA8BA" size={20} strokeWidth={2} />
        </TouchableOpacity>
      </View>

      {notification.notification_type === 'nudge' && (
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleDismiss('pause_apps')}
          >
            <Pause color="#7C9DD9" size={16} strokeWidth={2} />
            <Text style={styles.actionText}>Pause 30 min</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleDismiss('remind_later')}
          >
            <Clock color="#7C9DD9" size={16} strokeWidth={2} />
            <Text style={styles.actionText}>Remind in 1h</Text>
          </TouchableOpacity>
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: 16,
    right: 16,
    backgroundColor: '#161C26',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2A3441',
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1000,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    gap: 12,
  },
  icon: {
    fontSize: 24,
  },
  textContainer: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: '#E8EDF4',
  },
  message: {
    fontSize: 14,
    color: '#9BA8BA',
    lineHeight: 20,
  },
  closeButton: {
    padding: 4,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#0A0E14',
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2A3441',
  },
  actionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#7C9DD9',
  },
});
