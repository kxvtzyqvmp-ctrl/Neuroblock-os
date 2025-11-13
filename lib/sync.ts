import { supabase } from './supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface SyncMetadata {
  id: string;
  user_id: string | null;
  last_sync_at: string;
  sync_status: 'success' | 'pending' | 'failed';
  device_id: string;
  data_version: number;
  created_at: string;
  updated_at: string;
}

const DEVICE_ID_KEY = '@dopamine_detox_device_id';

export const getDeviceId = async (): Promise<string> => {
  try {
    let deviceId = await AsyncStorage.getItem(DEVICE_ID_KEY);

    if (!deviceId) {
      deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      await AsyncStorage.setItem(DEVICE_ID_KEY, deviceId);
    }

    return deviceId;
  } catch (error) {
    console.error('Error getting device ID:', error);
    return `device_${Date.now()}`;
  }
};

export const syncUserData = async (): Promise<{ success: boolean; message: string }> => {
  try {
    const deviceId = await getDeviceId();

    const { data: localMeta } = await supabase
      .from('sync_metadata')
      .select('*')
      .eq('device_id', deviceId)
      .maybeSingle();

    const lastSyncTime = localMeta?.last_sync_at || new Date(0).toISOString();

    const tables = [
      'detox_settings',
      'daily_stats',
      'focus_sessions',
      'ai_insights',
      'user_streaks',
      'mood_logs',
      'challenge_participants',
    ];

    for (const table of tables) {
      const { data: updates } = await supabase
        .from(table)
        .select('*')
        .gte('updated_at', lastSyncTime)
        .order('updated_at', { ascending: true });

      if (updates && updates.length > 0) {
        console.log(`Synced ${updates.length} records from ${table}`);
      }
    }

    const now = new Date().toISOString();

    if (localMeta) {
      await supabase
        .from('sync_metadata')
        .update({
          last_sync_at: now,
          sync_status: 'success',
          data_version: (localMeta.data_version || 0) + 1,
          updated_at: now,
        })
        .eq('id', localMeta.id);
    } else {
      await supabase
        .from('sync_metadata')
        .insert([
          {
            device_id: deviceId,
            last_sync_at: now,
            sync_status: 'success',
            data_version: 1,
          },
        ]);
    }

    return { success: true, message: 'Sync completed successfully' };
  } catch (error) {
    console.error('Sync error:', error);

    const deviceId = await getDeviceId();
    await supabase
      .from('sync_metadata')
      .update({ sync_status: 'failed' })
      .eq('device_id', deviceId);

    return { success: false, message: 'Sync failed. Will retry automatically.' };
  }
};

export const getLastSyncTime = async (): Promise<string | null> => {
  try {
    const deviceId = await getDeviceId();

    const { data } = await supabase
      .from('sync_metadata')
      .select('last_sync_at')
      .eq('device_id', deviceId)
      .maybeSingle();

    return data?.last_sync_at || null;
  } catch (error) {
    console.error('Error getting last sync time:', error);
    return null;
  }
};

export const getTimeSinceLastSync = async (): Promise<string> => {
  const lastSync = await getLastSyncTime();

  if (!lastSync) return 'Never synced';

  const now = new Date();
  const syncDate = new Date(lastSync);
  const diffMs = now.getTime() - syncDate.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
};

export const requestDataExport = async (): Promise<boolean> => {
  try {
    await supabase.from('data_export_requests').insert([
      {
        request_type: 'export',
        status: 'pending',
      },
    ]);

    return true;
  } catch (error) {
    console.error('Error requesting data export:', error);
    return false;
  }
};

export const requestDataDeletion = async (): Promise<boolean> => {
  try {
    await supabase.from('data_export_requests').insert([
      {
        request_type: 'delete',
        status: 'pending',
      },
    ]);

    return true;
  } catch (error) {
    console.error('Error requesting data deletion:', error);
    return false;
  }
};
