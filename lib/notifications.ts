import { supabase } from './supabase';

export interface NotificationPreferences {
  id: string;
  user_id: string | null;
  focus_reminders_enabled: boolean;
  motivation_boosts_enabled: boolean;
  predictive_nudges_enabled: boolean;
  challenge_updates_enabled: boolean;
  checkin_reminders_enabled: boolean;
  quiet_hours_start: string;
  quiet_hours_end: string;
  max_daily_notifications: number;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  user_id: string | null;
  notification_type: 'focus' | 'motivation' | 'nudge' | 'checkin' | 'challenge';
  title: string;
  message: string;
  icon: string;
  priority: 'high' | 'normal' | 'low';
  context_data: any;
  scheduled_for: string;
  sent_at: string | null;
  read_at: string | null;
  dismissed_at: string | null;
  action_taken: string | null;
  created_at: string;
}

export interface PredictivePattern {
  pattern_type: string;
  time_of_day: string;
  confidence_score: number;
  trigger_app?: string;
}

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

export const getNotificationPreferences = async (): Promise<NotificationPreferences | null> => {
  try {
    const { data } = await supabase
      .from('notification_preferences')
      .select('*')
      .maybeSingle();

    return data;
  } catch (error) {
    console.error('Error getting preferences:', error);
    return null;
  }
};

export const updateNotificationPreferences = async (
  updates: Partial<NotificationPreferences>
): Promise<boolean> => {
  try {
    const { data: existing } = await supabase
      .from('notification_preferences')
      .select('id')
      .maybeSingle();

    if (existing) {
      await supabase
        .from('notification_preferences')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', existing.id);
    } else {
      await supabase
        .from('notification_preferences')
        .insert([{ ...updates }]);
    }

    return true;
  } catch (error) {
    console.error('Error updating preferences:', error);
    return false;
  }
};

export const isWithinQuietHours = (prefs: NotificationPreferences): boolean => {
  const now = new Date();
  const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

  const start = prefs.quiet_hours_start;
  const end = prefs.quiet_hours_end;

  if (start > end) {
    return currentTime >= start || currentTime < end;
  }

  return currentTime >= start && currentTime < end;
};

export const canSendNotification = async (type: string): Promise<boolean> => {
  try {
    const prefs = await getNotificationPreferences();

    if (!prefs) return false;

    if (isWithinQuietHours(prefs)) return false;

    const typeEnabled = {
      focus: prefs.focus_reminders_enabled,
      motivation: prefs.motivation_boosts_enabled,
      nudge: prefs.predictive_nudges_enabled,
      challenge: prefs.challenge_updates_enabled,
      checkin: prefs.checkin_reminders_enabled,
    };

    if (!typeEnabled[type as keyof typeof typeEnabled]) return false;

    const today = new Date().toISOString().split('T')[0];

    const { data: history } = await supabase
      .from('notification_history')
      .select('notifications_sent')
      .eq('date', today)
      .maybeSingle();

    const sentToday = history?.notifications_sent || 0;

    if (sentToday >= prefs.max_daily_notifications) return false;

    return true;
  } catch (error) {
    console.error('Error checking notification permission:', error);
    return false;
  }
};

export const createNotification = async (
  type: 'focus' | 'motivation' | 'nudge' | 'checkin' | 'challenge',
  context?: any
): Promise<Notification | null> => {
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

    const { data: notification } = await supabase
      .from('notifications')
      .insert([
        {
          notification_type: type,
          title: template.title,
          message,
          icon: template.icon,
          priority: type === 'nudge' ? 'high' : 'normal',
          context_data: context || {},
          sent_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    const today = new Date().toISOString().split('T')[0];

    await supabase
      .from('notification_history')
      .upsert([
        {
          date: today,
          notifications_sent: 1,
        },
      ], {
        onConflict: 'user_id,date',
        ignoreDuplicates: false
      });

    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    return null;
  }
};

export const detectPredictivePatterns = async (): Promise<PredictivePattern[]> => {
  try {
    const patterns: PredictivePattern[] = [];

    const now = new Date();
    const currentHour = now.getHours();

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(now.getDate() - 7);

    const { data: recentSessions } = await supabase
      .from('focus_sessions')
      .select('start_time, end_time')
      .gte('start_time', sevenDaysAgo.toISOString())
      .order('start_time', { ascending: true });

    if (recentSessions && recentSessions.length > 0) {
      const hourCounts: { [key: number]: number } = {};

      recentSessions.forEach((session) => {
        const hour = new Date(session.start_time).getHours();
        hourCounts[hour] = (hourCounts[hour] || 0) + 1;
      });

      const mostCommonHour = Object.entries(hourCounts)
        .sort(([, a], [, b]) => b - a)[0];

      if (mostCommonHour && currentHour === parseInt(mostCommonHour[0])) {
        patterns.push({
          pattern_type: 'high_risk_time',
          time_of_day: `${currentHour}:00`,
          confidence_score: 0.75,
        });
      }
    }

    const { data: settings } = await supabase
      .from('detox_settings')
      .select('selected_apps')
      .eq('is_active', true)
      .maybeSingle();

    if (settings && settings.selected_apps.length > 0) {
      const triggerApp = settings.selected_apps[0];

      patterns.push({
        pattern_type: 'app_trigger',
        time_of_day: `${currentHour}:00`,
        confidence_score: 0.65,
        trigger_app: triggerApp,
      });
    }

    const { data: moods } = await supabase
      .from('mood_logs')
      .select('mood')
      .gte('date', sevenDaysAgo.toISOString().split('T')[0])
      .order('date', { ascending: false })
      .limit(3);

    if (moods && moods.length >= 2) {
      const recentMoods = moods.slice(0, 2);
      const hasNegativeTrend = recentMoods.every(
        (m) => m.mood === 'stressed' || m.mood === 'frustrated'
      );

      if (hasNegativeTrend) {
        patterns.push({
          pattern_type: 'mood_dip',
          time_of_day: `${currentHour}:00`,
          confidence_score: 0.8,
        });
      }
    }

    for (const pattern of patterns) {
      await supabase
        .from('predictive_patterns')
        .upsert([
          {
            pattern_type: pattern.pattern_type,
            time_of_day: pattern.time_of_day,
            confidence_score: pattern.confidence_score,
            trigger_app: pattern.trigger_app,
            last_occurred: new Date().toISOString(),
          },
        ], { onConflict: 'user_id,pattern_type,time_of_day' });
    }

    return patterns;
  } catch (error) {
    console.error('Error detecting patterns:', error);
    return [];
  }
};

export const nudgeEngine = async (): Promise<Notification | null> => {
  try {
    const patterns = await detectPredictivePatterns();

    if (patterns.length === 0) return null;

    const highConfidencePattern = patterns.find((p) => p.confidence_score > 0.7);

    if (!highConfidencePattern) return null;

    if (highConfidencePattern.pattern_type === 'high_risk_time') {
      return await createNotification('nudge', {
        time: highConfidencePattern.time_of_day,
      });
    }

    if (highConfidencePattern.pattern_type === 'mood_dip') {
      return await createNotification('checkin');
    }

    const { data: analytics } = await supabase
      .from('user_analytics')
      .select('total_time_saved_hours')
      .order('week_start_date', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (analytics && analytics.total_time_saved_hours > 5) {
      return await createNotification('motivation', {
        hours: analytics.total_time_saved_hours.toFixed(1),
      });
    }

    return null;
  } catch (error) {
    console.error('Error in nudge engine:', error);
    return null;
  }
};

export const markNotificationRead = async (notificationId: string): Promise<void> => {
  try {
    await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('id', notificationId);

    const today = new Date().toISOString().split('T')[0];

    const { data: history } = await supabase
      .from('notification_history')
      .select('notifications_read')
      .eq('date', today)
      .maybeSingle();

    const currentRead = history?.notifications_read || 0;

    await supabase
      .from('notification_history')
      .upsert([
        {
          date: today,
          notifications_read: currentRead + 1,
        },
      ], { onConflict: 'user_id,date' });
  } catch (error) {
    console.error('Error marking notification read:', error);
  }
};

export const dismissNotification = async (
  notificationId: string,
  action?: string
): Promise<void> => {
  try {
    await supabase
      .from('notifications')
      .update({
        dismissed_at: new Date().toISOString(),
        action_taken: action || null,
      })
      .eq('id', notificationId);

    if (action) {
      const today = new Date().toISOString().split('T')[0];

      const { data: history } = await supabase
        .from('notification_history')
        .select('notifications_acted')
        .eq('date', today)
        .maybeSingle();

      const currentActed = history?.notifications_acted || 0;

      await supabase
        .from('notification_history')
        .upsert([
          {
            date: today,
            notifications_acted: currentActed + 1,
          },
        ], { onConflict: 'user_id,date' });
    }
  } catch (error) {
    console.error('Error dismissing notification:', error);
  }
};

export const getRecentNotifications = async (limit: number = 10): Promise<Notification[]> => {
  try {
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    return data || [];
  } catch (error) {
    console.error('Error getting recent notifications:', error);
    return [];
  }
};

export const getLastNotificationTime = async (): Promise<string | null> => {
  try {
    const { data } = await supabase
      .from('notifications')
      .select('sent_at')
      .not('sent_at', 'is', null)
      .order('sent_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    return data?.sent_at || null;
  } catch (error) {
    console.error('Error getting last notification time:', error);
    return null;
  }
};
