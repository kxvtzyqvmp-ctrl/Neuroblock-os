/**
 * Hook for installed apps detection and management
 * 
 * Handles:
 * - Permission requests (Android)
 * - iOS limitation messages
 * - Loading and caching installed apps
 * - App categorization
 */

import { useState, useEffect, useCallback } from 'react';
import { Platform, Alert, Linking } from 'react-native';
import { getInstalledApps, InstalledApp } from '@/lib/installedApps';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHED_APPS_KEY = '@neuroblock:cached_installed_apps';
const CACHE_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

interface UseInstalledAppsResult {
  apps: InstalledApp[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  hasPermission: boolean;
  requestPermission: () => Promise<boolean>;
}

export function useInstalledApps(): UseInstalledAppsResult {
  const [apps, setApps] = useState<InstalledApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState(false);

  const checkPermissions = useCallback(async () => {
    if (Platform.OS === 'ios') {
      // iOS has severe limitations - show informational message
      setHasPermission(false);
      return false;
    }

    if (Platform.OS === 'android') {
      // Check if we have permission to query packages
      // This is handled in the native module
      try {
        const { checkPackageQueryPermission } = require('@/modules/screentime');
        const hasPerm = await checkPackageQueryPermission();
        setHasPermission(hasPerm);
        return hasPerm;
      } catch (err) {
        console.warn('[useInstalledApps] Permission check failed:', err);
        setHasPermission(false);
        return false;
      }
    }

    // Web always has permission (uses mock data)
    setHasPermission(true);
    return true;
  }, []);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (Platform.OS === 'ios') {
      Alert.alert(
        'iOS Limitations',
        'App blocking is limited on iOS due to system restrictions. You can still use focus timers and offscreen activities.',
        [{ text: 'OK' }]
      );
      return false;
    }

    if (Platform.OS === 'android') {
      try {
        const { requestPackageQueryPermission } = require('@/modules/screentime');
        const granted = await requestPackageQueryPermission();
        setHasPermission(granted);
        
        if (!granted) {
          Alert.alert(
            'Permission Required',
            'NeuroBlock OS needs permission to detect installed apps for blocking. Please grant permission in Settings.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Open Settings', onPress: () => Linking.openSettings() },
            ]
          );
        }
        
        return granted;
      } catch (err) {
        console.error('[useInstalledApps] Permission request failed:', err);
        return false;
      }
    }

    return true; // Web
  }, []);

  const loadCachedApps = useCallback(async (): Promise<InstalledApp[] | null> => {
    try {
      const cached = await AsyncStorage.getItem(CACHED_APPS_KEY);
      if (cached) {
        const { apps: cachedApps, timestamp } = JSON.parse(cached);
        const age = Date.now() - timestamp;
        if (age < CACHE_EXPIRY_MS) {
          return cachedApps;
        }
      }
    } catch (err) {
      console.warn('[useInstalledApps] Failed to load cache:', err);
    }
    return null;
  }, []);

  const saveCachedApps = useCallback(async (appsToCache: InstalledApp[]) => {
    try {
      await AsyncStorage.setItem(
        CACHED_APPS_KEY,
        JSON.stringify({
          apps: appsToCache,
          timestamp: Date.now(),
        })
      );
    } catch (err) {
      console.warn('[useInstalledApps] Failed to save cache:', err);
    }
  }, []);

  const loadApps = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Check permissions first
      const hasPerm = await checkPermissions();
      
      // Try to load from cache first for faster UX
      const cached = await loadCachedApps();
      if (cached && cached.length > 0) {
        setApps(cached);
      }

      // If iOS or no permission, use mock data
      if (Platform.OS === 'ios' || (!hasPerm && Platform.OS === 'android')) {
        const mockApps = await getInstalledApps(); // This returns mock data for iOS/web
        setApps(mockApps);
        await saveCachedApps(mockApps);
        setLoading(false);
        return;
      }

      // Fetch real installed apps
      const installedApps = await getInstalledApps();
      
      if (installedApps && installedApps.length > 0) {
        setApps(installedApps);
        await saveCachedApps(installedApps);
      } else {
        // Fallback to cached or mock if fetch fails
        const fallback = cached || await getInstalledApps();
        setApps(fallback);
      }
    } catch (err: any) {
      console.error('[useInstalledApps] Failed to load apps:', err);
      setError(err.message || 'Failed to load installed apps');
      
      // Fallback to cache or mock
      const cached = await loadCachedApps();
      if (cached) {
        setApps(cached);
      } else {
        const mockApps = await getInstalledApps();
        setApps(mockApps);
      }
    } finally {
      setLoading(false);
    }
  }, [checkPermissions, loadCachedApps, saveCachedApps]);

  const refresh = useCallback(async () => {
    // Clear cache and reload
    try {
      await AsyncStorage.removeItem(CACHED_APPS_KEY);
    } catch (err) {
      console.warn('[useInstalledApps] Failed to clear cache:', err);
    }
    await loadApps();
  }, [loadApps]);

  useEffect(() => {
    loadApps();
  }, [loadApps]);

  return {
    apps,
    loading,
    error,
    refresh,
    hasPermission,
    requestPermission,
  };
}

