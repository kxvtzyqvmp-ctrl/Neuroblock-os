import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { supabase } from '@/lib/supabase';

interface NotificationPreferences {
  dailyRecapEnabled: boolean;
  milestoneAlertsEnabled: boolean;
  reminderNudgesEnabled: boolean;
  appUsageAlertsEnabled: boolean;
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
}

export default function NotificationSettings() {
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    dailyRecapEnabled: true,
    milestoneAlertsEnabled: true,
    reminderNudgesEnabled: true,
    appUsageAlertsEnabled: true,
    quietHoursEnabled: false,
    quietHoursStart: '22:00',
    quietHoursEnd: '08:00',
  });
  const [loading, setLoading] = useState(true);
  const [settingsId, setSettingsId] = useState<string | null>(null);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .order('created_at', { ascending: false })
        .maybeSingle();

      if (error) {
        console.error('Error loading notification preferences:', error);
        return;
      }

      if (data) {
        setSettingsId(data.id);
        setPreferences({
          dailyRecapEnabled: data.daily_recap_enabled ?? true,
          milestoneAlertsEnabled: data.milestone_alerts_enabled ?? true,
          reminderNudgesEnabled: data.reminder_nudges_enabled ?? true,
          appUsageAlertsEnabled: data.app_usage_alerts_enabled ?? true,
          quietHoursEnabled: data.quiet_hours_enabled ?? false,
          quietHoursStart: data.quiet_hours_start?.substring(0, 5) || '22:00',
          quietHoursEnd: data.quiet_hours_end?.substring(0, 5) || '08:00',
        });
      }
    } catch (err) {
      console.error('Unexpected error loading preferences:', err);
    } finally {
      setLoading(false);
    }
  };

  const updatePreference = async (
    field: keyof NotificationPreferences,
    value: boolean | string
  ) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    const dbField =
      field === 'dailyRecapEnabled'
        ? 'daily_recap_enabled'
        : field === 'milestoneAlertsEnabled'
        ? 'milestone_alerts_enabled'
        : field === 'reminderNudgesEnabled'
        ? 'reminder_nudges_enabled'
        : field === 'appUsageAlertsEnabled'
        ? 'app_usage_alerts_enabled'
        : field === 'quietHoursEnabled'
        ? 'quiet_hours_enabled'
        : field === 'quietHoursStart'
        ? 'quiet_hours_start'
        : 'quiet_hours_end';

    if (!settingsId) {
      const { data, error } = await supabase
        .from('notification_preferences')
        .insert([{ [dbField]: value }])
        .select()
        .single();

      if (error) {
        console.error('Error creating preferences:', error);
        return;
      }

      if (data) {
        setSettingsId(data.id);
        setPreferences((prev) => ({ ...prev, [field]: value }));
      }
      return;
    }

    setPreferences((prev) => ({ ...prev, [field]: value }));

    const { error } = await supabase
      .from('notification_preferences')
      .update({ [dbField]: value })
      .eq('id', settingsId);

    if (error) {
      console.error('Error updating preference:', error);
      setPreferences((prev) => ({
        ...prev,
        [field]: typeof value === 'boolean' ? !value : prev[field],
      }));
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading notification settings...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Notifications</Text>
      <View style={styles.optionsList}>
        <View style={styles.optionRow}>
          <View style={styles.optionLeft}>
            <Text style={styles.optionLabel}>Daily recap</Text>
            <Text style={styles.optionSubtext}>
              Summary of your daily progress
            </Text>
          </View>
          <Switch
            value={preferences.dailyRecapEnabled}
            onValueChange={(value) => updatePreference('dailyRecapEnabled', value)}
            trackColor={{ false: '#3A4556', true: '#7C9DD9' }}
            thumbColor={preferences.dailyRecapEnabled ? '#FFFFFF' : '#9BA8BA'}
            ios_backgroundColor="#3A4556"
          />
        </View>

        <View style={styles.optionRow}>
          <View style={styles.optionLeft}>
            <Text style={styles.optionLabel}>Milestone alerts</Text>
            <Text style={styles.optionSubtext}>
              Celebrate your achievements
            </Text>
          </View>
          <Switch
            value={preferences.milestoneAlertsEnabled}
            onValueChange={(value) =>
              updatePreference('milestoneAlertsEnabled', value)
            }
            trackColor={{ false: '#3A4556', true: '#7C9DD9' }}
            thumbColor={preferences.milestoneAlertsEnabled ? '#FFFFFF' : '#9BA8BA'}
            ios_backgroundColor="#3A4556"
          />
        </View>

        <View style={styles.optionRow}>
          <View style={styles.optionLeft}>
            <Text style={styles.optionLabel}>Reminder nudges</Text>
            <Text style={styles.optionSubtext}>
              Gentle reminders to stay focused
            </Text>
          </View>
          <Switch
            value={preferences.reminderNudgesEnabled}
            onValueChange={(value) =>
              updatePreference('reminderNudgesEnabled', value)
            }
            trackColor={{ false: '#3A4556', true: '#7C9DD9' }}
            thumbColor={preferences.reminderNudgesEnabled ? '#FFFFFF' : '#9BA8BA'}
            ios_backgroundColor="#3A4556"
          />
        </View>

        <View style={styles.optionRow}>
          <View style={styles.optionLeft}>
            <Text style={styles.optionLabel}>App usage alerts</Text>
            <Text style={styles.optionSubtext}>
              Alert when approaching limits
            </Text>
          </View>
          <Switch
            value={preferences.appUsageAlertsEnabled}
            onValueChange={(value) =>
              updatePreference('appUsageAlertsEnabled', value)
            }
            trackColor={{ false: '#3A4556', true: '#7C9DD9' }}
            thumbColor={preferences.appUsageAlertsEnabled ? '#FFFFFF' : '#9BA8BA'}
            ios_backgroundColor="#3A4556"
          />
        </View>
      </View>

      <Text style={styles.sectionTitle}>Quiet Hours</Text>
      <View style={styles.optionsList}>
        <View style={styles.optionRow}>
          <View style={styles.optionLeft}>
            <Text style={styles.optionLabel}>Enable quiet hours</Text>
            <Text style={styles.optionSubtext}>
              Silence notifications during these hours
            </Text>
          </View>
          <Switch
            value={preferences.quietHoursEnabled}
            onValueChange={(value) => updatePreference('quietHoursEnabled', value)}
            trackColor={{ false: '#3A4556', true: '#7C9DD9' }}
            thumbColor={preferences.quietHoursEnabled ? '#FFFFFF' : '#9BA8BA'}
            ios_backgroundColor="#3A4556"
          />
        </View>

        {preferences.quietHoursEnabled && (
          <View style={styles.timeRow}>
            <View style={styles.timeItem}>
              <Text style={styles.timeLabel}>Start</Text>
              <Text style={styles.timeValue}>{preferences.quietHoursStart}</Text>
            </View>
            <View style={styles.timeSeparator} />
            <View style={styles.timeItem}>
              <Text style={styles.timeLabel}>End</Text>
              <Text style={styles.timeValue}>{preferences.quietHoursEnd}</Text>
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  loadingText: {
    fontSize: 14,
    color: '#9BA8BA',
    textAlign: 'center',
    paddingVertical: 20,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 8,
    marginBottom: 4,
  },
  optionsList: {
    gap: 2,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(107, 122, 143, 0.05)',
    borderRadius: 12,
    marginBottom: 8,
  },
  optionLeft: {
    flex: 1,
    marginRight: 16,
  },
  optionLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  optionSubtext: {
    fontSize: 13,
    color: '#9BA8BA',
    lineHeight: 18,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(107, 122, 143, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  timeItem: {
    flex: 1,
    alignItems: 'center',
  },
  timeSeparator: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(107, 122, 143, 0.3)',
    marginHorizontal: 16,
  },
  timeLabel: {
    fontSize: 13,
    color: '#9BA8BA',
    marginBottom: 8,
  },
  timeValue: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
