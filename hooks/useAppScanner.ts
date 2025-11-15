/**
 * useAppScanner Hook
 * 
 * Automatically scans installed apps and identifies the top "dopamine" apps
 * (social media, games, entertainment) based on usage statistics.
 * 
 * Used for zero-friction first-time setup.
 */

import { useState, useCallback } from 'react';
import { Platform, Linking, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useInstalledApps } from './useInstalledApps';
import { InstalledApp } from '@/lib/installedApps';

const USAGE_STATS_KEY = '@neuroblock:usage_stats';
const CACHE_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

interface UsageStat {
  packageName: string;
  appName: string;
  usageMinutes: number;
  lastUsed: number;
  openCount: number;
}

interface UseAppScannerResult {
  scanning: boolean;
  scanTopApps: (count?: number) => Promise<InstalledApp[]>;
  requestUsagePermission: () => Promise<boolean>;
  hasUsagePermission: boolean;
}

export function useAppScanner(): UseAppScannerResult {
  const [scanning, setScanning] = useState(false);
  const [hasUsagePermission, setHasUsagePermission] = useState(false);
  const { apps, requestPermission } = useInstalledApps();

  const requestUsagePermission = useCallback(async (): Promise<boolean> => {
    if (Platform.OS === 'ios') {
      Alert.alert(
        'iOS Limitations',
        'App usage statistics are limited on iOS. We\'ll use a simplified detection method based on app categories.',
        [{ text: 'OK' }]
      );
      setHasUsagePermission(false);
      return false;
    }

    if (Platform.OS === 'android') {
      try {
        const granted = await requestPermission();
        setHasUsagePermission(granted);
        
        if (!granted) {
          Alert.alert(
            'Permission Required',
            'NeuroBlock OS needs access to usage statistics to identify your most-used apps. This helps create your personalized block list.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Open Settings', onPress: () => Linking.openSettings() },
            ]
          );
        }
        
        return granted;
      } catch (error) {
        console.error('[useAppScanner] Permission request failed:', error);
        return false;
      }
    }

    return false;
  }, [requestPermission]);

  const getCachedUsageStats = useCallback(async (): Promise<UsageStat[] | null> => {
    try {
      const cached = await AsyncStorage.getItem(USAGE_STATS_KEY);
      if (cached) {
        const { stats, timestamp } = JSON.parse(cached);
        const age = Date.now() - timestamp;
        if (age < CACHE_EXPIRY_MS) {
          return stats;
        }
      }
    } catch (error) {
      console.warn('[useAppScanner] Failed to load cache:', error);
    }
    return null;
  }, []);

  const saveUsageStats = useCallback(async (stats: UsageStat[]) => {
    try {
      await AsyncStorage.setItem(USAGE_STATS_KEY, JSON.stringify({
        stats,
        timestamp: Date.now(),
      }));
    } catch (error) {
      console.warn('[useAppScanner] Failed to save cache:', error);
    }
  }, []);

  const getUsageStatsFromDevice = useCallback(async (): Promise<UsageStat[]> => {
    if (Platform.OS === 'android') {
      try {
        // Try to use native module for usage stats
        const { getUsageStats } = require('@/modules/screentime');
        const stats = await getUsageStats();
        return stats || [];
      } catch (error) {
        console.warn('[useAppScanner] Native usage stats not available:', error);
        return [];
      }
    }
    
    // iOS or fallback: Use mock/category-based scoring
    return [];
  }, []);

  const scanTopApps = useCallback(async (count: number = 5): Promise<InstalledApp[]> => {
    try {
      setScanning(true);

      // Check for cached stats first
      let usageStats = await getCachedUsageStats();

      // If no cache or permission available, try to get fresh stats
      if (!usageStats || usageStats.length === 0) {
        const hasPermission = await requestUsagePermission();
        
        if (hasPermission) {
          usageStats = await getUsageStatsFromDevice();
          
          if (usageStats && usageStats.length > 0) {
            await saveUsageStats(usageStats);
          }
        }
      }

      // If we have usage stats, use them
      if (usageStats && usageStats.length > 0) {
        const sortedStats = usageStats.sort((a, b) => {
          // Sort by usage minutes, then by open count
          if (b.usageMinutes !== a.usageMinutes) {
            return b.usageMinutes - a.usageMinutes;
          }
          return b.openCount - a.openCount;
        });

        // Map to InstalledApp format
        const topAppStats = sortedStats.slice(0, count);
        const topApps = topAppStats
          .map(stat => apps.find(app => app.packageName === stat.packageName))
          .filter((app): app is InstalledApp => app !== undefined);

        if (topApps.length > 0) {
          return topApps;
        }
      }

      // Fallback: Use category-based detection (dopamine apps)
      const dopamineCategories = ['social', 'entertainment', 'games', 'shopping'];
      
      // Import categorizeApp function locally
      const { groupAppsByCategory } = require('@/lib/installedApps');
      const categories = groupAppsByCategory(apps);
      
      const dopamineCategoryIds = categories
        .filter((cat: { id: string }) => dopamineCategories.includes(cat.id))
        .map((cat: { id: string }) => cat.id);
      
      const categorizedApps = apps
        .filter(app => {
          const category = app.category || 'other';
          return dopamineCategoryIds.includes(category);
        })
        .slice(0, count);

      return categorizedApps.length > 0 ? categorizedApps : apps.slice(0, count);
    } catch (error) {
      console.error('[useAppScanner] Error scanning apps:', error);
      return [];
    } finally {
      setScanning(false);
    }
  }, [apps, getCachedUsageStats, getUsageStatsFromDevice, requestUsagePermission, saveUsageStats]);

  return {
    scanning,
    scanTopApps,
    requestUsagePermission,
    hasUsagePermission,
  };
}

