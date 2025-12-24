/**
 * Local Notification System
 * 
 * Handles notification preferences and scheduling using AsyncStorage
 * and expo-notifications for local push notifications.
 */

import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Storage keys
const STORAGE_KEYS = {
  NOTIFICATION_PREFS: '@neuroblock:notification_prefs',
  NOTIFICATION_HISTORY: '@neuroblock:notification_history',
  SCHEDULED_NOTIFICATIONS: '@neuroblock:scheduled_notifications',
} as const;

// Notification types
export type NotificationType = 'focus' | 'motivation' | 'nudge' | 'checkin' | 'challenge';

// Notification preferences interface
export interface NotificationPreferences {
  focus_reminders_enabled: boolean;
  motivation_boosts_enabled: boolean;
  predictive_nudges_enabled: boolean;
  checkin_reminders_enabled: boolean;
  challenge_updates_enabled: boolean;
  quiet_hours_start: string; // Format: "HH:mm" (e.g., "22:00")
  quiet_hours_end: string; // Format: "HH:mm" (e.g., "07:00")
  max_daily_notifications: number;
}

// Local notification interface
export interface LocalNotification {
  id: string;
  notification_type: NotificationType;
  title: string;
  message: string;
  icon: string;
  priority: 'high' | 'normal' | 'low';
  sent_at: string;
  scheduled_for: string;
}

// Default preferences
const DEFAULT_PREFS: NotificationPreferences = {
  focus_reminders_enabled: true,
  motivation_boosts_enabled: true,
  predictive_nudges_enabled: true,
  checkin_reminders_enabled: true,
  challenge_updates_enabled: true,
  quiet_hours_start: '22:00',
  quiet_hours_end: '07:00',
  max_daily_notifications: 3,
};

// Notification message templates
const NOTIFICATION_MESSAGES = {
  focus: [
    { title: 'Time to focus', message: "Detox Mode is on. Let's stay clear for the next hour.", icon: '⏰' },
    { title: 'Focus time', message: "Your phone will wait. Your focus cannot.", icon: '🧠' },
    { title: 'Begin your session', message: 'Clear your mind. Block distractions. Start creating.', icon: '⏰' },
  ],
  motivation: [
    { title: 'Progress check', message: "You have saved {hours} hours this week — that is real progress.", icon: '💪' },
    { title: 'Streak milestone', message: "You are {days} days into your streak. Keep building momentum.", icon: '🔥' },
    { title: 'Well done', message: 'Your consistency is showing real commitment to change.', icon: '✨' },
    { title: 'Keep it up', message: 'Small daily wins create lasting transformation.', icon: '🌟' },
  ],
  checkin: [
    { title: 'How are you?', message: 'How are you feeling today?', icon: '🧘' },
    { title: 'Mindful pause', message: "You have been scrolling longer than usual — want to pause?", icon: '🧘' },
    { title: 'Break time', message: "It's been 3 hours since your last mindful break.", icon: '💭' },
  ],
  nudge: [
    { title: 'Heads up', message: 'Noticed you often open social apps around this time — want to block for an hour?', icon: '💡' },
    { title: 'Stay mindful', message: 'Take 3 deep breaths before opening that app.', icon: '🧘' },
    { title: 'Pattern detected', message: "You are reaching for your phone more than usual. Everything okay?", icon: '💡' },
  ],
  challenge: [
    { title: 'Circle update', message: 'Your Detox Circle saved {hours} hours today 🙌', icon: '🫱🏽‍🫲🏾' },
    { title: 'Challenge progress', message: 'Day {day} of your {total}-Day Challenge — halfway there!', icon: '🎯' },
    { title: 'Team win', message: 'Your teammate just completed a Focus Block 💪', icon: '👥' },
  ],
};

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Request notification permissions
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    
    if (existingStatus === 'granted') {
      return true;
    }

    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.error('[Notifications] Error requesting permissions:', error);
    return false;
  }
}

/**
 * Check if notification permissions are granted
 */
export async function hasNotificationPermissions(): Promise<boolean> {
  try {
    const { status } = await Notifications.getPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.error('[Notifications] Error checking permissions:', error);
    return false;
  }
}

/**
 * Get notification preferences from AsyncStorage
 */
export async function getNotificationPreferences(): Promise<NotificationPreferences> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.NOTIFICATION_PREFS);
    if (data) {
      return JSON.parse(data);
    }
    return DEFAULT_PREFS;
  } catch (error) {
    console.error('[Notifications] Error getting preferences:', error);
    return DEFAULT_PREFS;
  }
}

/**
 * Save notification preferences to AsyncStorage
 */
export async function saveNotificationPreferences(
  prefs: Partial<NotificationPreferences>
): Promise<void> {
  try {
    const current = await getNotificationPreferences();
    const updated = { ...current, ...prefs };
    await AsyncStorage.setItem(STORAGE_KEYS.NOTIFICATION_PREFS, JSON.stringify(updated));
  } catch (error) {
    console.error('[Notifications] Error saving preferences:', error);
    throw error;
  }
}

/**
 * Check if current time is within quiet hours
 */
export function isWithinQuietHours(prefs: NotificationPreferences): boolean {
  const now = new Date();
  const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

  const start = prefs.quiet_hours_start;
  const end = prefs.quiet_hours_end;

  // Handle overnight quiet hours (e.g., 22:00 - 07:00)
  if (start > end) {
    return currentTime >= start || currentTime < end;
  }

  return currentTime >= start && currentTime < end;
}

/**
 * Get notification count sent today
 */
async function getNotificationsSentToday(): Promise<number> {
  try {
    const today = new Date().toISOString().split('T')[0];
    const historyData = await AsyncStorage.getItem(STORAGE_KEYS.NOTIFICATION_HISTORY);
    
    if (historyData) {
      const history = JSON.parse(historyData);
      return history[today]?.sent || 0;
    }
    
    return 0;
  } catch (error) {
    console.error('[Notifications] Error getting notification count:', error);
    return 0;
  }
}

/**
 * Increment notification count for today
 */
async function incrementNotificationsSentToday(): Promise<void> {
  try {
    const today = new Date().toISOString().split('T')[0];
    const historyData = await AsyncStorage.getItem(STORAGE_KEYS.NOTIFICATION_HISTORY);
    const history = historyData ? JSON.parse(historyData) : {};
    
    history[today] = {
      sent: (history[today]?.sent || 0) + 1,
      date: today,
    };
    
    await AsyncStorage.setItem(STORAGE_KEYS.NOTIFICATION_HISTORY, JSON.stringify(history));
  } catch (error) {
    console.error('[Notifications] Error incrementing notification count:', error);
  }
}

/**
 * Check if a notification can be sent
 */
export async function canSendNotification(type: NotificationType): Promise<boolean> {
  try {
    const prefs = await getNotificationPreferences();
    const hasPermissions = await hasNotificationPermissions();
    
    if (!hasPermissions) return false;
    
    // Check quiet hours
    if (isWithinQuietHours(prefs)) return false;
    
    // Check if this notification type is enabled
    const typeEnabled = {
      focus: prefs.focus_reminders_enabled,
      motivation: prefs.motivation_boosts_enabled,
      nudge: prefs.predictive_nudges_enabled,
      checkin: prefs.checkin_reminders_enabled,
      challenge: prefs.challenge_updates_enabled,
    };
    
    if (!typeEnabled[type]) return false;
    
    // Check daily limit
    const sentToday = await getNotificationsSentToday();
    if (sentToday >= prefs.max_daily_notifications) return false;
    
    return true;
  } catch (error) {
    console.error('[Notifications] Error checking can send:', error);
    return false;
  }
}

/**
 * Schedule a local notification
 */
export async function scheduleNotification(
  type: NotificationType,
  trigger: Notifications.NotificationTriggerInput,
  context?: any
): Promise<string | null> {
  try {
    const canSend = await canSendNotification(type);
    if (!canSend) return null;
    
    const templates = NOTIFICATION_MESSAGES[type];
    const template = templates[Math.floor(Math.random() * templates.length)];
    
    let message = template.message;
    if (context) {
      if (context.hours) message = message.replace('{hours}', context.hours);
      if (context.days) message = message.replace('{days}', context.days);
      if (context.day) message = message.replace('{day}', context.day);
      if (context.total) message = message.replace('{total}', context.total);
    }
    
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: template.title,
        body: message,
        data: {
          type,
          icon: template.icon,
        },
        sound: true,
        priority: type === 'nudge' ? Notifications.AndroidNotificationPriority.HIGH : Notifications.AndroidNotificationPriority.DEFAULT,
      },
      trigger,
    });
    
    // Save to history
    await incrementNotificationsSentToday();
    
    // Save scheduled notification info
    const scheduledData = await AsyncStorage.getItem(STORAGE_KEYS.SCHEDULED_NOTIFICATIONS);
    const scheduled = scheduledData ? JSON.parse(scheduledData) : {};
    scheduled[notificationId] = {
      type,
      title: template.title,
      message,
      icon: template.icon,
      scheduled_for: trigger instanceof Date ? trigger.toISOString() : new Date().toISOString(),
      sent_at: null,
    };
    await AsyncStorage.setItem(STORAGE_KEYS.SCHEDULED_NOTIFICATIONS, JSON.stringify(scheduled));
    
    return notificationId;
  } catch (error) {
    console.error('[Notifications] Error scheduling notification:', error);
    return null;
  }
}

/**
 * Cancel all scheduled notifications
 */
export async function cancelAllNotifications(): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    await AsyncStorage.removeItem(STORAGE_KEYS.SCHEDULED_NOTIFICATIONS);
  } catch (error) {
    console.error('[Notifications] Error canceling notifications:', error);
  }
}

/**
 * Cancel notifications of a specific type
 */
export async function cancelNotificationsByType(type: NotificationType): Promise<void> {
  try {
    const scheduledData = await AsyncStorage.getItem(STORAGE_KEYS.SCHEDULED_NOTIFICATIONS);
    if (!scheduledData) return;
    
    const scheduled = JSON.parse(scheduledData);
    const toCancel: string[] = [];
    
    for (const [id, notif] of Object.entries(scheduled)) {
      if ((notif as any).type === type) {
        toCancel.push(id);
      }
    }
    
    // Cancel notifications
    for (const id of toCancel) {
      await Notifications.cancelScheduledNotificationAsync(id);
      delete scheduled[id];
    }
    
    await AsyncStorage.setItem(STORAGE_KEYS.SCHEDULED_NOTIFICATIONS, JSON.stringify(scheduled));
  } catch (error) {
    console.error('[Notifications] Error canceling notifications by type:', error);
  }
}

/**
 * Schedule recurring notifications based on preferences
 */
export async function scheduleRecurringNotifications(): Promise<void> {
  try {
    const prefs = await getNotificationPreferences();
    const hasPermissions = await hasNotificationPermissions();
    
    if (!hasPermissions) return;
    
    // Cancel existing recurring notifications
    const scheduledData = await AsyncStorage.getItem(STORAGE_KEYS.SCHEDULED_NOTIFICATIONS);
    if (scheduledData) {
      const scheduled = JSON.parse(scheduledData);
      for (const id of Object.keys(scheduled)) {
        await Notifications.cancelScheduledNotificationAsync(id);
      }
    }
    
    // Schedule Motivation Boosts (every 3 hours during active hours)
    if (prefs.motivation_boosts_enabled) {
      // This would require more complex scheduling logic
      // For now, we'll schedule them dynamically when needed
    }
    
    // Schedule Mindful Check-ins (daily at 2 PM)
    if (prefs.checkin_reminders_enabled) {
      await scheduleNotification('checkin', {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: 14, // 2 PM
        minute: 0,
      });
    }
    
    // AI Predictive Nudges are scheduled on-demand based on patterns
    // Challenge Updates are triggered by challenge events
    // Focus Reminders are triggered when focus sessions start
    
  } catch (error) {
    console.error('[Notifications] Error scheduling recurring notifications:', error);
  }
}

/**
 * Trigger a focus reminder notification (immediate)
 */
export async function triggerFocusReminder(): Promise<void> {
  try {
    const prefs = await getNotificationPreferences();
    if (!prefs.focus_reminders_enabled) return;
    
    const canSend = await canSendNotification('focus');
    if (!canSend) return;
    
    await scheduleNotification('focus', { 
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 2 
    });
  } catch (error) {
    console.error('[Notifications] Error triggering focus reminder:', error);
  }
}

/**
 * Trigger a motivation boost notification
 */
export async function triggerMotivationBoost(context?: { hours?: string; days?: string }): Promise<void> {
  try {
    const prefs = await getNotificationPreferences();
    if (!prefs.motivation_boosts_enabled) return;
    
    // Schedule for 2 hours from now
    const inTwoHours = new Date();
    inTwoHours.setHours(inTwoHours.getHours() + 2);
    
    await scheduleNotification('motivation', { 
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: inTwoHours 
    }, context);
  } catch (error) {
    console.error('[Notifications] Error triggering motivation boost:', error);
  }
}

/**
 * Get recent notifications from local storage
 */
export async function getRecentNotifications(limit: number = 10): Promise<LocalNotification[]> {
  try {
    const scheduledData = await AsyncStorage.getItem(STORAGE_KEYS.SCHEDULED_NOTIFICATIONS);
    if (!scheduledData) return [];
    
    const scheduled = JSON.parse(scheduledData);
    const notifications = Object.values(scheduled) as any[];
    
    // Sort by scheduled_for (most recent first)
    notifications.sort((a, b) => {
      const dateA = new Date(a.scheduled_for).getTime();
      const dateB = new Date(b.scheduled_for).getTime();
      return dateB - dateA;
    });
    
    return notifications.slice(0, limit).map((notif, index) => ({
      id: `local-${index}`,
      notification_type: notif.type,
      title: notif.title,
      message: notif.message,
      icon: notif.icon,
      priority: notif.type === 'nudge' ? 'high' : 'normal',
      sent_at: notif.sent_at || new Date().toISOString(),
      scheduled_for: notif.scheduled_for,
    }));
  } catch (error) {
    console.error('[Notifications] Error getting recent notifications:', error);
    return [];
  }
}

