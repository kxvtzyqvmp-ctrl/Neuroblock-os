import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  Platform,
  ScrollView,
} from 'react-native';
import { Shield } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { supabase } from '@/lib/supabase';

interface PrivacySettings {
  analyticsEnabled: boolean;
  crashReportsEnabled: boolean;
  usageDataCollection: boolean;
  shareAnonymousData: boolean;
}

export default function DataPrivacy() {
  const [settings, setSettings] = useState<PrivacySettings>({
    analyticsEnabled: true,
    crashReportsEnabled: true,
    usageDataCollection: true,
    shareAnonymousData: false,
  });
  const [loading, setLoading] = useState(true);
  const [settingsId, setSettingsId] = useState<string | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('privacy_settings')
        .select('*')
        .order('created_at', { ascending: false })
        .maybeSingle();

      if (error) {
        console.error('Error loading privacy settings:', error);
        return;
      }

      if (data) {
        setSettingsId(data.id);
        setSettings({
          analyticsEnabled: data.analytics_enabled ?? true,
          crashReportsEnabled: data.crash_reports_enabled ?? true,
          usageDataCollection: data.usage_data_collection ?? true,
          shareAnonymousData: data.share_anonymous_data ?? false,
        });
      }
    } catch (err) {
      console.error('Unexpected error loading settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = async (
    field: keyof PrivacySettings,
    value: boolean
  ) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    const dbField =
      field === 'analyticsEnabled'
        ? 'analytics_enabled'
        : field === 'crashReportsEnabled'
        ? 'crash_reports_enabled'
        : field === 'usageDataCollection'
        ? 'usage_data_collection'
        : 'share_anonymous_data';

    if (!settingsId) {
      const { data, error } = await supabase
        .from('privacy_settings')
        .insert([{ [dbField]: value }])
        .select()
        .single();

      if (error) {
        console.error('Error creating settings:', error);
        return;
      }

      if (data) {
        setSettingsId(data.id);
        setSettings((prev) => ({ ...prev, [field]: value }));
      }
      return;
    }

    setSettings((prev) => ({ ...prev, [field]: value }));

    const { error } = await supabase
      .from('privacy_settings')
      .update({ [dbField]: value })
      .eq('id', settingsId);

    if (error) {
      console.error('Error updating setting:', error);
      setSettings((prev) => ({ ...prev, [field]: !value }));
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading privacy settings...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.headerCard}>
        <Shield color="#4ED4C7" size={32} strokeWidth={2} />
        <Text style={styles.headerTitle}>Your Privacy Matters</Text>
        <Text style={styles.headerDescription}>
          Control how your data is collected and used. We're committed to transparency
          and protecting your privacy.
        </Text>
      </View>

      <Text style={styles.sectionTitle}>Data Collection</Text>
      <View style={styles.optionsList}>
        <View style={styles.optionRow}>
          <View style={styles.optionLeft}>
            <Text style={styles.optionLabel}>Anonymous analytics</Text>
            <Text style={styles.optionSubtext}>
              Help improve the app with anonymous usage data
            </Text>
          </View>
          <Switch
            value={settings.analyticsEnabled}
            onValueChange={(value) => updateSetting('analyticsEnabled', value)}
            trackColor={{ false: '#3A4556', true: '#4ED4C7' }}
            thumbColor={settings.analyticsEnabled ? '#FFFFFF' : '#9BA8BA'}
            ios_backgroundColor="#3A4556"
          />
        </View>

        <View style={styles.optionRow}>
          <View style={styles.optionLeft}>
            <Text style={styles.optionLabel}>Crash reports</Text>
            <Text style={styles.optionSubtext}>
              Automatically send crash reports to help us fix bugs
            </Text>
          </View>
          <Switch
            value={settings.crashReportsEnabled}
            onValueChange={(value) => updateSetting('crashReportsEnabled', value)}
            trackColor={{ false: '#3A4556', true: '#4ED4C7' }}
            thumbColor={settings.crashReportsEnabled ? '#FFFFFF' : '#9BA8BA'}
            ios_backgroundColor="#3A4556"
          />
        </View>

        <View style={styles.optionRow}>
          <View style={styles.optionLeft}>
            <Text style={styles.optionLabel}>Usage data collection</Text>
            <Text style={styles.optionSubtext}>
              Collect data about how you use the app for insights
            </Text>
          </View>
          <Switch
            value={settings.usageDataCollection}
            onValueChange={(value) => updateSetting('usageDataCollection', value)}
            trackColor={{ false: '#3A4556', true: '#4ED4C7' }}
            thumbColor={settings.usageDataCollection ? '#FFFFFF' : '#9BA8BA'}
            ios_backgroundColor="#3A4556"
          />
        </View>
      </View>

      <Text style={styles.sectionTitle}>Research & Development</Text>
      <View style={styles.optionsList}>
        <View style={styles.optionRow}>
          <View style={styles.optionLeft}>
            <Text style={styles.optionLabel}>Share anonymous data</Text>
            <Text style={styles.optionSubtext}>
              Contribute to digital wellness research (fully anonymized)
            </Text>
          </View>
          <Switch
            value={settings.shareAnonymousData}
            onValueChange={(value) => updateSetting('shareAnonymousData', value)}
            trackColor={{ false: '#3A4556', true: '#4ED4C7' }}
            thumbColor={settings.shareAnonymousData ? '#FFFFFF' : '#9BA8BA'}
            ios_backgroundColor="#3A4556"
          />
        </View>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>What data do we collect?</Text>
        <Text style={styles.infoText}>
          • App usage times and durations{'\n'}
          • Selected apps and categories{'\n'}
          • Settings and preferences{'\n'}
          • Device type and OS version{'\n'}
          • Crash logs and error reports
        </Text>
        <Text style={styles.infoNote}>
          We never collect personal information, browsing history, or app content.
          All data is encrypted and stored securely.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingText: {
    fontSize: 14,
    color: '#9BA8BA',
    textAlign: 'center',
    paddingVertical: 20,
  },
  headerCard: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'rgba(78, 212, 199, 0.1)',
    borderRadius: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(78, 212, 199, 0.2)',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 12,
    marginBottom: 8,
    textAlign: 'center',
  },
  headerDescription: {
    fontSize: 14,
    color: '#9BA8BA',
    lineHeight: 20,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 8,
    marginBottom: 12,
  },
  optionsList: {
    gap: 2,
    marginBottom: 24,
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
  infoCard: {
    padding: 16,
    backgroundColor: 'rgba(107, 122, 143, 0.08)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(107, 122, 143, 0.2)',
    marginBottom: 40,
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#C5D1E0',
    lineHeight: 22,
    marginBottom: 12,
  },
  infoNote: {
    fontSize: 13,
    color: '#4ED4C7',
    lineHeight: 19,
    fontStyle: 'italic',
  },
});
