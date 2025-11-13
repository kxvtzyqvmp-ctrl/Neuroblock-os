import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { X, Bell, BellOff, Clock, TrendingUp, Zap, Users, MessageCircle } from 'lucide-react-native';
import {
  getNotificationPreferences,
  updateNotificationPreferences,
  getRecentNotifications,
  NotificationPreferences,
  Notification,
} from '@/lib/notifications';

export default function NotificationsScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [recentNotifications, setRecentNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [prefs, notifications] = await Promise.all([
        getNotificationPreferences(),
        getRecentNotifications(20),
      ]);

      setPreferences(prefs);
      setRecentNotifications(notifications);
    } catch (error) {
      console.error('Error loading notification data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (key: keyof NotificationPreferences, value: boolean) => {
    if (!preferences) return;

    const updated = { ...preferences, [key]: value };
    setPreferences(updated);

    await updateNotificationPreferences({ [key]: value });
  };

  const handleQuietHoursChange = async (start: string, end: string) => {
    if (!preferences) return;

    const updated = { ...preferences, quiet_hours_start: start, quiet_hours_end: end };
    setPreferences(updated);

    await updateNotificationPreferences({
      quiet_hours_start: start,
      quiet_hours_end: end,
    });
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'focus':
        return Clock;
      case 'motivation':
        return TrendingUp;
      case 'nudge':
        return Zap;
      case 'checkin':
        return MessageCircle;
      case 'challenge':
        return Users;
      default:
        return Bell;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
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

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;

    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#7C9DD9" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
          <X color="#9BA8BA" size={24} strokeWidth={2} />
        </TouchableOpacity>

        <View style={styles.header}>
          <Bell color="#7C9DD9" size={48} strokeWidth={1.5} />
          <Text style={styles.title}>Notifications</Text>
          <Text style={styles.subtitle}>Manage your mindful reminders</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notification Types</Text>

          <View style={styles.preferenceCard}>
            <View style={styles.preferenceRow}>
              <View style={styles.preferenceInfo}>
                <Clock color="#7C9DD9" size={20} strokeWidth={2} />
                <View style={styles.preferenceText}>
                  <Text style={styles.preferenceName}>Focus Reminders</Text>
                  <Text style={styles.preferenceDescription}>
                    Start of detox window alerts
                  </Text>
                </View>
              </View>
              <Switch
                value={preferences?.focus_reminders_enabled ?? true}
                onValueChange={(value) => handleToggle('focus_reminders_enabled', value)}
                trackColor={{ false: '#2A3441', true: '#7C9DD9' }}
                thumbColor="#E8EDF4"
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.preferenceRow}>
              <View style={styles.preferenceInfo}>
                <TrendingUp color="#5AE38C" size={20} strokeWidth={2} />
                <View style={styles.preferenceText}>
                  <Text style={styles.preferenceName}>Motivation Boosts</Text>
                  <Text style={styles.preferenceDescription}>
                    Progress and streak updates
                  </Text>
                </View>
              </View>
              <Switch
                value={preferences?.motivation_boosts_enabled ?? true}
                onValueChange={(value) => handleToggle('motivation_boosts_enabled', value)}
                trackColor={{ false: '#2A3441', true: '#5AE38C' }}
                thumbColor="#E8EDF4"
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.preferenceRow}>
              <View style={styles.preferenceInfo}>
                <Zap color="#8E89FB" size={20} strokeWidth={2} />
                <View style={styles.preferenceText}>
                  <Text style={styles.preferenceName}>AI Predictive Nudges</Text>
                  <Text style={styles.preferenceDescription}>
                    Pattern-based suggestions
                  </Text>
                </View>
              </View>
              <Switch
                value={preferences?.predictive_nudges_enabled ?? true}
                onValueChange={(value) => handleToggle('predictive_nudges_enabled', value)}
                trackColor={{ false: '#2A3441', true: '#8E89FB' }}
                thumbColor="#E8EDF4"
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.preferenceRow}>
              <View style={styles.preferenceInfo}>
                <MessageCircle color="#FECF5E" size={20} strokeWidth={2} />
                <View style={styles.preferenceText}>
                  <Text style={styles.preferenceName}>Mindful Check-ins</Text>
                  <Text style={styles.preferenceDescription}>
                    Mood and wellness prompts
                  </Text>
                </View>
              </View>
              <Switch
                value={preferences?.checkin_reminders_enabled ?? true}
                onValueChange={(value) => handleToggle('checkin_reminders_enabled', value)}
                trackColor={{ false: '#2A3441', true: '#FECF5E' }}
                thumbColor="#E8EDF4"
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.preferenceRow}>
              <View style={styles.preferenceInfo}>
                <Users color="#4ED4C7" size={20} strokeWidth={2} />
                <View style={styles.preferenceText}>
                  <Text style={styles.preferenceName}>Challenge Updates</Text>
                  <Text style={styles.preferenceDescription}>
                    Circle and challenge progress
                  </Text>
                </View>
              </View>
              <Switch
                value={preferences?.challenge_updates_enabled ?? true}
                onValueChange={(value) => handleToggle('challenge_updates_enabled', value)}
                trackColor={{ false: '#2A3441', true: '#4ED4C7' }}
                thumbColor="#E8EDF4"
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quiet Hours</Text>

          <View style={styles.quietCard}>
            <View style={styles.quietRow}>
              <Text style={styles.quietLabel}>No notifications during:</Text>
              <Text style={styles.quietTime}>
                {preferences?.quiet_hours_start} - {preferences?.quiet_hours_end}
              </Text>
            </View>
            <Text style={styles.quietNote}>
              All notifications will be silenced during this time
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Notifications</Text>

          {recentNotifications.length > 0 ? (
            <View style={styles.notificationsList}>
              {recentNotifications.map((notification) => {
                const Icon = getNotificationIcon(notification.notification_type);
                const color = getNotificationColor(notification.notification_type);

                return (
                  <View key={notification.id} style={styles.notificationItem}>
                    <View style={[styles.notificationIcon, { backgroundColor: `${color}15` }]}>
                      <Icon color={color} size={18} strokeWidth={2} />
                    </View>
                    <View style={styles.notificationContent}>
                      <Text style={styles.notificationTitle}>{notification.title}</Text>
                      <Text style={styles.notificationMessage}>{notification.message}</Text>
                      {notification.sent_at && (
                        <Text style={styles.notificationTime}>
                          {formatTime(notification.sent_at)}
                        </Text>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <BellOff color="#6B7A8F" size={40} strokeWidth={1.5} />
              <Text style={styles.emptyText}>No notifications yet</Text>
            </View>
          )}
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.infoText}>
            Maximum {preferences?.max_daily_notifications || 3} notifications per day
          </Text>
          <Text style={styles.infoText}>
            Notifications are designed to support, not distract
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0E14',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0A0E14',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  closeButton: {
    position: 'absolute',
    top: 60,
    right: 24,
    zIndex: 10,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 80,
    paddingBottom: 32,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#E8EDF4',
    textAlign: 'center',
    marginTop: 24,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#9BA8BA',
    textAlign: 'center',
  },
  section: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#E8EDF4',
    marginBottom: 16,
  },
  preferenceCard: {
    backgroundColor: '#161C26',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#2A3441',
  },
  preferenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  preferenceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  preferenceText: {
    flex: 1,
  },
  preferenceName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#E8EDF4',
    marginBottom: 2,
  },
  preferenceDescription: {
    fontSize: 12,
    color: '#9BA8BA',
  },
  divider: {
    height: 1,
    backgroundColor: '#2A3441',
    marginVertical: 4,
  },
  quietCard: {
    backgroundColor: '#161C26',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2A3441',
  },
  quietRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  quietLabel: {
    fontSize: 14,
    color: '#9BA8BA',
  },
  quietTime: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E8EDF4',
  },
  quietNote: {
    fontSize: 12,
    color: '#6B7A8F',
    lineHeight: 16,
  },
  notificationsList: {
    gap: 12,
  },
  notificationItem: {
    flexDirection: 'row',
    backgroundColor: '#161C26',
    borderRadius: 12,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: '#2A3441',
  },
  notificationIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationContent: {
    flex: 1,
    gap: 4,
  },
  notificationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#E8EDF4',
  },
  notificationMessage: {
    fontSize: 13,
    color: '#9BA8BA',
    lineHeight: 18,
  },
  notificationTime: {
    fontSize: 11,
    color: '#6B7A8F',
    marginTop: 4,
  },
  emptyState: {
    backgroundColor: '#161C26',
    borderRadius: 16,
    padding: 48,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2A3441',
  },
  emptyText: {
    fontSize: 14,
    color: '#9BA8BA',
    marginTop: 16,
  },
  infoSection: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    gap: 8,
  },
  infoText: {
    fontSize: 12,
    color: '#6B7A8F',
    textAlign: 'center',
    lineHeight: 18,
  },
});
