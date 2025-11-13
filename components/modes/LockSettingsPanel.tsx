import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { supabase } from '@/lib/supabase';

interface LockSettings {
  requirePin: boolean;
  lockDuringActiveHours: boolean;
  emergencyUnlockEnabled: boolean;
}

interface LockSettingsPanelProps {
  onRequestPin: () => void;
}

export default function LockSettingsPanel({ onRequestPin }: LockSettingsPanelProps) {
  const [settings, setSettings] = useState<LockSettings>({
    requirePin: false,
    lockDuringActiveHours: false,
    emergencyUnlockEnabled: true,
  });
  const [loading, setLoading] = useState(true);
  const [settingsId, setSettingsId] = useState<string | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('detox_settings')
        .select('id, require_pin, lock_during_active_hours, emergency_unlock_enabled')
        .order('created_at', { ascending: false })
        .maybeSingle();

      if (error) {
        console.error('Error loading lock settings:', error);
        return;
      }

      if (data) {
        setSettingsId(data.id);
        setSettings({
          requirePin: data.require_pin || false,
          lockDuringActiveHours: data.lock_during_active_hours || false,
          emergencyUnlockEnabled: data.emergency_unlock_enabled ?? true,
        });
      }
    } catch (err) {
      console.error('Unexpected error loading settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = async (
    field: keyof LockSettings,
    value: boolean
  ) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    const dbField = field === 'requirePin'
      ? 'require_pin'
      : field === 'lockDuringActiveHours'
      ? 'lock_during_active_hours'
      : 'emergency_unlock_enabled';

    if (!settingsId) {
      const { data, error } = await supabase
        .from('detox_settings')
        .insert([
          {
            [dbField]: value,
          },
        ])
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
      .from('detox_settings')
      .update({ [dbField]: value })
      .eq('id', settingsId);

    if (error) {
      console.error('Error updating setting:', error);
      setSettings((prev) => ({ ...prev, [field]: !value }));
    }
  };

  const handlePinToggle = async (value: boolean) => {
    if (value && !settings.requirePin) {
      onRequestPin();
    } else {
      await updateSetting('requirePin', value);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading settings...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.description}>
        Prevent changes to your detox settings during active sessions
      </Text>

      <View style={styles.optionsList}>
        <View style={styles.optionRow}>
          <View style={styles.optionLeft}>
            <Text style={styles.optionLabel}>Require PIN</Text>
            <Text style={styles.optionSubtext}>
              Set a PIN to protect your settings
            </Text>
          </View>
          <Switch
            value={settings.requirePin}
            onValueChange={handlePinToggle}
            trackColor={{ false: '#3A4556', true: '#7C9DD9' }}
            thumbColor={settings.requirePin ? '#FFFFFF' : '#9BA8BA'}
            ios_backgroundColor="#3A4556"
          />
        </View>

        <View style={styles.optionRow}>
          <View style={styles.optionLeft}>
            <Text style={styles.optionLabel}>Lock during active hours</Text>
            <Text style={styles.optionSubtext}>
              Prevent changes during your detox schedule
            </Text>
          </View>
          <Switch
            value={settings.lockDuringActiveHours}
            onValueChange={(value) => updateSetting('lockDuringActiveHours', value)}
            trackColor={{ false: '#3A4556', true: '#7C9DD9' }}
            thumbColor={settings.lockDuringActiveHours ? '#FFFFFF' : '#9BA8BA'}
            ios_backgroundColor="#3A4556"
          />
        </View>

        <View style={styles.optionRow}>
          <View style={styles.optionLeft}>
            <Text style={styles.optionLabel}>Emergency unlock</Text>
            <Text style={styles.optionSubtext}>
              Allow emergency access when needed
            </Text>
          </View>
          <Switch
            value={settings.emergencyUnlockEnabled}
            onValueChange={(value) => updateSetting('emergencyUnlockEnabled', value)}
            trackColor={{ false: '#3A4556', true: '#4ED4C7' }}
            thumbColor={settings.emergencyUnlockEnabled ? '#FFFFFF' : '#9BA8BA'}
            ios_backgroundColor="#3A4556"
          />
        </View>
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
  description: {
    fontSize: 14,
    color: '#9BA8BA',
    lineHeight: 20,
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
    marginBottom: 12,
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
});
