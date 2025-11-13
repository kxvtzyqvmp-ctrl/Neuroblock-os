import { supabase } from './supabase';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

export interface EnvironmentSettings {
  id: string;
  user_id: string | null;
  smart_light_enabled: boolean;
  soundscapes_enabled: boolean;
  wearable_integration_enabled: boolean;
  auto_suggest_mode: boolean;
  light_brand: string;
  speaker_brand: string;
  focus_light_color: string;
  rest_light_color: string;
  soundscape_type: string;
  haptic_feedback_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface WearableConnection {
  id: string;
  device_type: string;
  device_id: string;
  is_active: boolean;
  last_sync_at: string;
  sync_status: 'connected' | 'syncing' | 'disconnected';
  permissions_granted: any;
}

export interface HealthData {
  date: string;
  heart_rate_avg: number;
  stress_level: number;
  sleep_hours: number;
  sleep_quality: string;
  activity_minutes: number;
  screen_time_correlation: number;
}

export const LIGHT_BRANDS = [
  { value: 'none', label: 'None' },
  { value: 'hue', label: 'Philips Hue' },
  { value: 'nanoleaf', label: 'Nanoleaf' },
  { value: 'lifx', label: 'LIFX' },
];

export const SPEAKER_BRANDS = [
  { value: 'none', label: 'None' },
  { value: 'alexa', label: 'Amazon Alexa' },
  { value: 'google_home', label: 'Google Home' },
];

export const SOUNDSCAPE_TYPES = [
  { value: 'ambient', label: 'Ambient', icon: '🌊' },
  { value: 'focus', label: 'Focus Music', icon: '🎵' },
  { value: 'nature', label: 'Nature Sounds', icon: '🌲' },
  { value: 'none', label: 'None', icon: '🔇' },
];

export const getEnvironmentSettings = async (): Promise<EnvironmentSettings | null> => {
  try {
    const { data } = await supabase
      .from('environment_settings')
      .select('*')
      .maybeSingle();

    return data;
  } catch (error) {
    console.error('Error getting environment settings:', error);
    return null;
  }
};

export const updateEnvironmentSettings = async (
  updates: Partial<EnvironmentSettings>
): Promise<boolean> => {
  try {
    const { data: existing } = await supabase
      .from('environment_settings')
      .select('id')
      .maybeSingle();

    if (existing) {
      await supabase
        .from('environment_settings')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', existing.id);
    } else {
      await supabase
        .from('environment_settings')
        .insert([{ ...updates }]);
    }

    return true;
  } catch (error) {
    console.error('Error updating environment settings:', error);
    return false;
  }
};

export const triggerHapticFeedback = async (type: 'light' | 'medium' | 'heavy' = 'light') => {
  if (Platform.OS === 'web') return;

  try {
    const settings = await getEnvironmentSettings();
    if (!settings?.haptic_feedback_enabled) return;

    switch (type) {
      case 'light':
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        break;
      case 'medium':
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        break;
      case 'heavy':
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        break;
    }
  } catch (error) {
    console.error('Error triggering haptic:', error);
  }
};

export const activateFocusEnvironment = async (): Promise<void> => {
  try {
    const settings = await getEnvironmentSettings();
    if (!settings) return;

    await triggerHapticFeedback('medium');

    if (settings.smart_light_enabled) {
      await activateSmartLight(settings.focus_light_color);
    }

    if (settings.soundscapes_enabled && settings.soundscape_type !== 'none') {
      await playSoundscape(settings.soundscape_type);
    }

    if (settings.wearable_integration_enabled) {
      await sendWearableCommand('start_focus');
    }

    await supabase.from('environmental_sessions').insert([
      {
        session_type: 'focus',
        light_activated: settings.smart_light_enabled,
        sound_activated: settings.soundscapes_enabled,
        wearable_notified: settings.wearable_integration_enabled,
        start_time: new Date().toISOString(),
      },
    ]);
  } catch (error) {
    console.error('Error activating focus environment:', error);
  }
};

export const deactivateFocusEnvironment = async (): Promise<void> => {
  try {
    const settings = await getEnvironmentSettings();
    if (!settings) return;

    await triggerHapticFeedback('light');

    if (settings.smart_light_enabled) {
      await restoreSmartLight();
    }

    if (settings.soundscapes_enabled) {
      await stopSoundscape();
    }

    if (settings.wearable_integration_enabled) {
      await sendWearableCommand('stop_focus');
    }

    const { data: activeSession } = await supabase
      .from('environmental_sessions')
      .select('*')
      .eq('session_type', 'focus')
      .is('end_time', null)
      .order('start_time', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (activeSession) {
      await supabase
        .from('environmental_sessions')
        .update({ end_time: new Date().toISOString() })
        .eq('id', activeSession.id);
    }
  } catch (error) {
    console.error('Error deactivating focus environment:', error);
  }
};

export const activateSmartLight = async (color: string): Promise<void> => {
  console.log(`[Smart Light] Activating focus color: ${color}`);
};

export const restoreSmartLight = async (): Promise<void> => {
  console.log('[Smart Light] Restoring normal lighting');
};

export const playSoundscape = async (type: string): Promise<void> => {
  console.log(`[Soundscape] Playing: ${type}`);
};

export const stopSoundscape = async (): Promise<void> => {
  console.log('[Soundscape] Stopping playback');
};

export const sendWearableCommand = async (
  command: 'start_focus' | 'stop_focus' | 'pause_notifications' | 'breathe_cue'
): Promise<void> => {
  try {
    await supabase.from('wearable_commands').insert([
      {
        command_type: command,
        status: 'sent',
        sent_at: new Date().toISOString(),
      },
    ]);

    console.log(`[Wearable] Command sent: ${command}`);
  } catch (error) {
    console.error('Error sending wearable command:', error);
  }
};

export const connectWearable = async (
  deviceType: string,
  deviceId: string
): Promise<boolean> => {
  try {
    await supabase.from('wearable_connections').insert([
      {
        device_type: deviceType,
        device_id: deviceId,
        is_active: true,
        sync_status: 'connected',
        permissions_granted: {
          focus_blocks: true,
          time_saved: true,
          mood_log: true,
          health_data: false,
        },
      },
    ]);

    return true;
  } catch (error) {
    console.error('Error connecting wearable:', error);
    return false;
  }
};

export const syncHealthData = async (): Promise<HealthData | null> => {
  try {
    const today = new Date().toISOString().split('T')[0];

    const mockHealthData: HealthData = {
      date: today,
      heart_rate_avg: 72,
      stress_level: 0.35,
      sleep_hours: 7.2,
      sleep_quality: 'good',
      activity_minutes: 45,
      screen_time_correlation: 0.6,
    };

    await supabase
      .from('health_data')
      .upsert([mockHealthData], { onConflict: 'user_id,date' });

    return mockHealthData;
  } catch (error) {
    console.error('Error syncing health data:', error);
    return null;
  }
};

export const analyzeHealthTrends = async (): Promise<string[]> => {
  try {
    const insights: string[] = [];

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: recentHealth } = await supabase
      .from('health_data')
      .select('*')
      .gte('date', sevenDaysAgo.toISOString().split('T')[0])
      .order('date', { ascending: true });

    if (!recentHealth || recentHealth.length === 0) return insights;

    const avgSleep = recentHealth.reduce((sum, d) => sum + (d.sleep_hours || 0), 0) / recentHealth.length;

    if (avgSleep < 7) {
      insights.push('Consider ending screen time earlier — your average sleep is below 7 hours.');
    } else if (avgSleep >= 8) {
      insights.push('Great sleep pattern! Your rest schedule is supporting your focus.');
    }

    const avgStress = recentHealth.reduce((sum, d) => sum + (d.stress_level || 0), 0) / recentHealth.length;

    if (avgStress > 0.6) {
      insights.push('Elevated stress detected. Try adding mindful breaks between sessions.');
    }

    const highCorrelation = recentHealth.some(d => (d.screen_time_correlation || 0) > 0.7);

    if (highCorrelation) {
      insights.push('Screen time appears to impact your stress levels. Consider shorter sessions.');
    }

    return insights;
  } catch (error) {
    console.error('Error analyzing health trends:', error);
    return [];
  }
};

export const suggestDetoxTime = async (): Promise<string | null> => {
  try {
    const { data: recentHealth } = await supabase
      .from('health_data')
      .select('sleep_hours')
      .order('date', { ascending: false })
      .limit(7);

    if (!recentHealth || recentHealth.length === 0) return null;

    const avgSleep = recentHealth.reduce((sum, d) => sum + (d.sleep_hours || 0), 0) / recentHealth.length;

    if (avgSleep < 7) {
      return '21:00';
    } else if (avgSleep >= 8) {
      return '22:00';
    }

    return '21:30';
  } catch (error) {
    console.error('Error suggesting detox time:', error);
    return null;
  }
};

export const testFocusEnvironment = async (): Promise<void> => {
  await triggerHapticFeedback('medium');

  await activateSmartLight('#5A6FFF');

  setTimeout(async () => {
    await triggerHapticFeedback('light');
    await restoreSmartLight();
  }, 3000);
};

export const getWearableConnections = async (): Promise<WearableConnection[]> => {
  try {
    const { data } = await supabase
      .from('wearable_connections')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    return data || [];
  } catch (error) {
    console.error('Error getting wearable connections:', error);
    return [];
  }
};

export const disconnectWearable = async (connectionId: string): Promise<boolean> => {
  try {
    await supabase
      .from('wearable_connections')
      .update({ is_active: false, sync_status: 'disconnected' })
      .eq('id', connectionId);

    return true;
  } catch (error) {
    console.error('Error disconnecting wearable:', error);
    return false;
  }
};
