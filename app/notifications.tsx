import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
  Alert,
  Platform,
  Modal,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { X, Bell, BellOff, Clock, TrendingUp, Zap, Users, MessageCircle } from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Notifications from 'expo-notifications';
import * as Haptics from 'expo-haptics';
import {
  getNotificationPreferences,
  saveNotificationPreferences,
  getRecentNotifications,
  requestNotificationPermissions,
  hasNotificationPermissions,
  scheduleRecurringNotifications,
  cancelNotificationsByType,
  isWithinQuietHours,
  type NotificationPreferences,
  type LocalNotification,
  type NotificationType,
} from '@/lib/localNotifications';
import AuroraBackground from '@/components/shared/AuroraBackground';
import BottomTabNav from '@/components/BottomTabNav';

export default function NotificationsScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [recentNotifications, setRecentNotifications] = useState<LocalNotification[]>([]);
  const [hasPermissions, setHasPermissions] = useState(false);
  const [permissionLoading, setPermissionLoading] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [tempStartTime, setTempStartTime] = useState(new Date());
  const [tempEndTime, setTempEndTime] = useState(new Date());
  const [quietHoursCheck, setQuietHoursCheck] = useState(0); // Minimal state for quiet hours re-render
  const notificationListener = useRef<Notifications.Subscription | null>(null);

  useEffect(() => {
    loadData();
    checkPermissions();

    // Set up notification listener
    notificationListener.current = Notifications.addNotificationReceivedListener(() => {
      // Refresh recent notifications when a new one is received
      loadRecentNotifications();
    });

    // Update quiet hours status periodically (every minute) to show/hide banner
    // Use a minimal state update to force re-render without recreating preferences object
    const quietHoursCheckInterval = setInterval(() => {
      // Force re-render by updating a minimal counter
      // This will cause isCurrentlyInQuietHours to recalculate
      setQuietHoursCheck((prev) => prev + 1);
    }, 60000); // Check every minute

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      clearInterval(quietHoursCheckInterval);
    };
  }, []);

  const checkPermissions = async () => {
    const has = await hasNotificationPermissions();
    setHasPermissions(has);
  };

  const loadData = async () => {
    try {
      const [prefs, notifications] = await Promise.all([
        getNotificationPreferences(),
        getRecentNotifications(20),
      ]);

      setPreferences(prefs);
      setRecentNotifications(notifications);

      // Initialize time picker values with current preferences
      if (prefs.quiet_hours_start) {
        setTempStartTime(parseTimeString(prefs.quiet_hours_start));
      }
      if (prefs.quiet_hours_end) {
        setTempEndTime(parseTimeString(prefs.quiet_hours_end));
      }
    } catch (error) {
      console.error('[Notifications] Error loading notification data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Helper functions for time conversion (needed before useEffect)
  const parseTimeString = (timeStr: string): Date => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
  };

  const formatTimeString = (date: Date): string => {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const loadRecentNotifications = async () => {
    try {
      const notifications = await getRecentNotifications(20);
      setRecentNotifications(notifications);
    } catch (error) {
      console.error('[Notifications] Error loading recent notifications:', error);
    }
  };

  const handleRequestPermissions = async () => {
    setPermissionLoading(true);
    try {
      const granted = await requestNotificationPermissions();
      setHasPermissions(granted);
      
      if (granted) {
        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
        Alert.alert('Permissions Granted', 'You can now receive notifications from NeuroBlock OS.');
        
        // Schedule recurring notifications
        await scheduleRecurringNotifications();
      } else {
        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        }
        Alert.alert(
          'Permissions Denied',
          'To receive notifications, please enable them in your device settings.'
        );
      }
    } catch (error) {
      console.error('[Notifications] Error requesting permissions:', error);
      Alert.alert('Error', 'Failed to request notification permissions.');
    } finally {
      setPermissionLoading(false);
    }
  };

  const handleToggle = async (key: keyof NotificationPreferences, value: boolean) => {
    if (!preferences) return;

    // Check permissions first
    if (value && !hasPermissions) {
      const granted = await requestNotificationPermissions();
      if (!granted) {
        Alert.alert(
          'Permissions Required',
          'Please enable notifications to use this feature.',
          [{ text: 'OK' }]
        );
        return;
      }
      setHasPermissions(true);
    }

    // Haptic feedback
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    const updated = { ...preferences, [key]: value };
    setPreferences(updated);

    try {
      // Save preferences
      await saveNotificationPreferences({ [key]: value });

      // Handle notification scheduling based on type
      const typeMap: Record<string, NotificationType> = {
        focus_reminders_enabled: 'focus',
        motivation_boosts_enabled: 'motivation',
        predictive_nudges_enabled: 'nudge',
        checkin_reminders_enabled: 'checkin',
        challenge_updates_enabled: 'challenge',
      };

      const notificationType = typeMap[key];

      if (value) {
        // Enable: Schedule recurring notifications
        if (notificationType === 'checkin') {
          // Check-ins are scheduled daily at 2 PM
          await scheduleRecurringNotifications();
        }
        // Other types are triggered on-demand (focus reminders at session start, etc.)
      } else {
        // Disable: Cancel notifications of this type
        if (notificationType) {
          await cancelNotificationsByType(notificationType);
        }
      }

      // Show toast-like feedback
      const toastMessages: Record<string, { enabled: string; disabled: string }> = {
        focus_reminders_enabled: {
          enabled: 'Focus Reminders enabled!',
          disabled: 'Focus Reminders disabled',
        },
        motivation_boosts_enabled: {
          enabled: 'Motivation Boosts enabled!',
          disabled: 'Motivation Boosts disabled',
        },
        predictive_nudges_enabled: {
          enabled: 'AI Predictive Nudges enabled!',
          disabled: 'AI Predictive Nudges disabled',
        },
        checkin_reminders_enabled: {
          enabled: 'Mindful Check-ins enabled!',
          disabled: 'Mindful Check-ins disabled',
        },
        challenge_updates_enabled: {
          enabled: 'Challenge Updates enabled!',
          disabled: 'Challenge Updates disabled',
        },
      };

      // Refresh recent notifications
      await loadRecentNotifications();
    } catch (error) {
      console.error('[Notifications] Error toggling notification:', error);
      Alert.alert('Error', 'Failed to update notification settings.');
      // Revert UI state on error
      setPreferences({ ...updated, [key]: !value });
    }
  };


  const handleStartTimePress = () => {
    if (!preferences) return;
    const startTime = preferences.quiet_hours_start 
      ? parseTimeString(preferences.quiet_hours_start)
      : new Date();
    startTime.setHours(22, 0, 0, 0); // Default to 10 PM
    setTempStartTime(startTime);
    setShowStartTimePicker(true);
    
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleEndTimePress = () => {
    if (!preferences) return;
    const endTime = preferences.quiet_hours_end
      ? parseTimeString(preferences.quiet_hours_end)
      : new Date();
    endTime.setHours(7, 0, 0, 0); // Default to 7 AM
    setTempEndTime(endTime);
    setShowEndTimePicker(true);
    
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleStartTimeChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowStartTimePicker(false);
    }
    
    if (selectedDate) {
      setTempStartTime(selectedDate);
      
      if (Platform.OS === 'ios') {
        // On iOS, update immediately as user scrolls
        return;
      }
      
      // On Android, save immediately
      const timeStr = formatTimeString(selectedDate);
      handleQuietHoursChange(timeStr, preferences?.quiet_hours_end || '07:00');
    } else {
      setShowStartTimePicker(false);
    }
  };

  const handleEndTimeChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowEndTimePicker(false);
    }
    
    if (selectedDate) {
      setTempEndTime(selectedDate);
      
      if (Platform.OS === 'ios') {
        // On iOS, update immediately as user scrolls
        return;
      }
      
      // On Android, save immediately
      const timeStr = formatTimeString(selectedDate);
      handleQuietHoursChange(preferences?.quiet_hours_start || '22:00', timeStr);
    } else {
      setShowEndTimePicker(false);
    }
  };

  const handleConfirmStartTime = () => {
    setShowStartTimePicker(false);
    const timeStr = formatTimeString(tempStartTime);
    handleQuietHoursChange(timeStr, preferences?.quiet_hours_end || '07:00');
  };

  const handleConfirmEndTime = () => {
    setShowEndTimePicker(false);
    const timeStr = formatTimeString(tempEndTime);
    handleQuietHoursChange(preferences?.quiet_hours_start || '22:00', timeStr);
  };

  const handleQuietHoursChange = async (start: string, end: string) => {
    if (!preferences) return;

    const updated = { ...preferences, quiet_hours_start: start, quiet_hours_end: end };
    setPreferences(updated);

    try {
      await saveNotificationPreferences({
        quiet_hours_start: start,
        quiet_hours_end: end,
      });

      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch (error) {
      console.error('[Notifications] Error updating quiet hours:', error);
      Alert.alert('Error', 'Failed to update quiet hours.');
      // Revert on error
      setPreferences(preferences);
    }
  };

  // Check if currently in quiet hours
  const isCurrentlyInQuietHours = preferences ? isWithinQuietHours(preferences) : false;

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
        <AuroraBackground />
        <ActivityIndicator size="large" color="#7C9DD9" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AuroraBackground />
      
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
          <X color="#9BA8BA" size={24} strokeWidth={2} />
        </TouchableOpacity>

        <View style={styles.header}>
          <Bell color={hasPermissions ? "#7C9DD9" : "#6B7A8F"} size={48} strokeWidth={1.5} />
          <Text style={styles.title}>Notifications</Text>
          <Text style={styles.subtitle}>Manage your mindful reminders</Text>
          
          {!hasPermissions && (
            <TouchableOpacity
              style={styles.permissionButton}
              onPress={handleRequestPermissions}
              disabled={permissionLoading}
            >
              {permissionLoading ? (
                <ActivityIndicator size="small" color="#7C9DD9" />
              ) : (
                <>
                  <Bell color="#7C9DD9" size={16} strokeWidth={2} />
                  <Text style={styles.permissionButtonText}>Enable Notifications</Text>
                </>
              )}
            </TouchableOpacity>
          )}
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
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Quiet Hours</Text>
            {isCurrentlyInQuietHours && (
              <View style={styles.activeIndicator}>
                <BellOff color="#FECF5E" size={16} strokeWidth={2} />
              </View>
            )}
          </View>

          {isCurrentlyInQuietHours && (
            <View style={styles.quietHoursBanner}>
              <BellOff color="#FECF5E" size={18} strokeWidth={2} />
              <Text style={styles.quietHoursBannerText}>
                Quiet Hours active — notifications are currently silenced
              </Text>
            </View>
          )}

          <View style={styles.quietCard}>
            <TouchableOpacity
              style={styles.quietTimeRow}
              onPress={handleStartTimePress}
              activeOpacity={0.7}
            >
              <View style={styles.quietTimeInfo}>
                <Clock color="#9BA8BA" size={18} strokeWidth={2} />
                <View style={styles.quietTimeText}>
                  <Text style={styles.quietTimeLabel}>Start Quiet Hours</Text>
                  <Text style={styles.quietTimeValue}>
                    {preferences?.quiet_hours_start || 'No time set'}
                  </Text>
                </View>
              </View>
              <Text style={styles.quietTimeEdit}>Edit</Text>
            </TouchableOpacity>

            <View style={styles.quietDivider} />

            <TouchableOpacity
              style={styles.quietTimeRow}
              onPress={handleEndTimePress}
              activeOpacity={0.7}
            >
              <View style={styles.quietTimeInfo}>
                <Clock color="#9BA8BA" size={18} strokeWidth={2} />
                <View style={styles.quietTimeText}>
                  <Text style={styles.quietTimeLabel}>End Quiet Hours</Text>
                  <Text style={styles.quietTimeValue}>
                    {preferences?.quiet_hours_end || 'No time set'}
                  </Text>
                </View>
              </View>
              <Text style={styles.quietTimeEdit}>Edit</Text>
            </TouchableOpacity>

            {(preferences?.quiet_hours_start && preferences?.quiet_hours_end) && (
              <>
                <View style={styles.quietDivider} />
                <View style={styles.quietSummary}>
                  <Text style={styles.quietSummaryLabel}>Quiet Hours:</Text>
                  <Text style={styles.quietSummaryTime}>
                    {preferences.quiet_hours_start} – {preferences.quiet_hours_end}
                  </Text>
                </View>
              </>
            )}

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
          {!hasPermissions && (
            <Text style={[styles.infoText, styles.warningText]}>
              Enable notifications above to receive reminders
            </Text>
          )}
        </View>
      </ScrollView>

      <BottomTabNav />

      {/* iOS Time Picker Modal for Start Time */}
      {Platform.OS === 'ios' && (
        <Modal
          visible={showStartTimePicker}
          transparent
          animationType="slide"
          onRequestClose={() => setShowStartTimePicker(false)}
        >
          <Pressable style={styles.modalOverlay} onPress={() => setShowStartTimePicker(false)}>
            <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Start Quiet Hours</Text>
                <TouchableOpacity onPress={() => setShowStartTimePicker(false)}>
                  <X color="#9BA8BA" size={24} strokeWidth={2} />
                </TouchableOpacity>
              </View>
              
              <DateTimePicker
                value={tempStartTime}
                mode="time"
                is24Hour={false}
                display="spinner"
                onChange={handleStartTimeChange}
                textColor="#E8EDF4"
                style={styles.timePicker}
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonCancel]}
                  onPress={() => setShowStartTimePicker(false)}
                >
                  <Text style={styles.modalButtonCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonConfirm]}
                  onPress={handleConfirmStartTime}
                >
                  <Text style={styles.modalButtonConfirmText}>Done</Text>
                </TouchableOpacity>
              </View>
            </Pressable>
          </Pressable>
        </Modal>
      )}

      {/* iOS Time Picker Modal for End Time */}
      {Platform.OS === 'ios' && (
        <Modal
          visible={showEndTimePicker}
          transparent
          animationType="slide"
          onRequestClose={() => setShowEndTimePicker(false)}
        >
          <Pressable style={styles.modalOverlay} onPress={() => setShowEndTimePicker(false)}>
            <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>End Quiet Hours</Text>
                <TouchableOpacity onPress={() => setShowEndTimePicker(false)}>
                  <X color="#9BA8BA" size={24} strokeWidth={2} />
                </TouchableOpacity>
              </View>
              
              <DateTimePicker
                value={tempEndTime}
                mode="time"
                is24Hour={false}
                display="spinner"
                onChange={handleEndTimeChange}
                textColor="#E8EDF4"
                style={styles.timePicker}
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonCancel]}
                  onPress={() => setShowEndTimePicker(false)}
                >
                  <Text style={styles.modalButtonCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonConfirm]}
                  onPress={handleConfirmEndTime}
                >
                  <Text style={styles.modalButtonConfirmText}>Done</Text>
                </TouchableOpacity>
              </View>
            </Pressable>
          </Pressable>
        </Modal>
      )}

      {/* Android Time Pickers */}
      {Platform.OS === 'android' && showStartTimePicker && (
        <DateTimePicker
          value={tempStartTime}
          mode="time"
          is24Hour={false}
          display="default"
          onChange={handleStartTimeChange}
        />
      )}

      {Platform.OS === 'android' && showEndTimePicker && (
        <DateTimePicker
          value={tempEndTime}
          mode="time"
          is24Hour={false}
          display="default"
          onChange={handleEndTimeChange}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0B0B',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0B0B0B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
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
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  activeIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(254, 207, 94, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quietHoursBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(254, 207, 94, 0.1)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(254, 207, 94, 0.3)',
  },
  quietHoursBannerText: {
    flex: 1,
    fontSize: 13,
    color: '#FECF5E',
    lineHeight: 18,
  },
  quietCard: {
    backgroundColor: '#161C26',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#2A3441',
  },
  quietTimeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  quietTimeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  quietTimeText: {
    flex: 1,
  },
  quietTimeLabel: {
    fontSize: 14,
    color: '#9BA8BA',
    marginBottom: 2,
  },
  quietTimeValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E8EDF4',
  },
  quietTimeEdit: {
    fontSize: 14,
    color: '#7C9DD9',
    fontWeight: '600',
  },
  quietDivider: {
    height: 1,
    backgroundColor: '#2A3441',
    marginVertical: 4,
  },
  quietSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingTop: 8,
  },
  quietSummaryLabel: {
    fontSize: 14,
    color: '#9BA8BA',
  },
  quietSummaryTime: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E8EDF4',
  },
  quietNote: {
    fontSize: 12,
    color: '#6B7A8F',
    lineHeight: 16,
    marginTop: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#161C26',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#2A3441',
    borderBottomWidth: 0,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#E8EDF4',
  },
  timePicker: {
    backgroundColor: '#0B0B0B',
    borderRadius: 12,
    marginVertical: 10,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonCancel: {
    backgroundColor: '#2A3441',
  },
  modalButtonConfirm: {
    backgroundColor: '#7C9DD9',
  },
  modalButtonCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#9BA8BA',
  },
  modalButtonConfirmText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
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
  warningText: {
    color: '#FECF5E',
    marginTop: 8,
  },
  permissionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: 'rgba(124, 157, 217, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(124, 157, 217, 0.3)',
  },
  permissionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7C9DD9',
  },
});
