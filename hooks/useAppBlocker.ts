/**
 * useAppBlocker Hook
 * 
 * Centralized hook for app blocking logic.
 * Handles:
 * - Monitoring blocked apps during active sessions
 * - Triggering blocking overlay
 * - Cleaning up listeners
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { AppState, AppStateStatus, Platform } from 'react-native';
import { appBlockingService, BlockedApp } from '@/lib/appBlocking';
import { getAllFocusSessions } from '@/lib/localStorage';
import type { FocusSession } from '@/lib/localStorage';
import { getDetoxSettings } from '@/lib/localStorage';

interface UseAppBlockerResult {
  isBlocking: boolean;
  blockedApp: { appName: string; packageName: string } | null;
  startMonitoring: (onBlocked: (appName: string, packageName: string) => void) => void;
  stopMonitoring: () => void;
}

export function useAppBlocker(): UseAppBlockerResult {
  const [isBlocking, setIsBlocking] = useState(false);
  const [blockedApp, setBlockedApp] = useState<{ appName: string; packageName: string } | null>(null);
  const onBlockedCallbackRef = useRef<((appName: string, packageName: string) => void) | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const checkActiveSession = useCallback(async (): Promise<boolean> => {
    try {
      const allSessions = await getAllFocusSessions();
      const activeSession = Object.values(allSessions).find(
        (s: FocusSession) => s.end_time === null
      );
      return !!activeSession;
    } catch (error) {
      console.error('[useAppBlocker] Error checking session:', error);
      return false;
    }
  }, []);

  const startMonitoring = useCallback(async (
    onBlocked: (appName: string, packageName: string) => void
  ) => {
    if (isBlocking) {
      return; // Already monitoring
    }

    const hasActiveSession = await checkActiveSession();
    if (!hasActiveSession) {
      console.warn('[useAppBlocker] No active session, skipping monitoring');
      return;
    }

    const settings = await getDetoxSettings();
    if (!settings || !settings.selected_apps || settings.selected_apps.length === 0) {
      console.warn('[useAppBlocker] No blocked apps configured');
      return;
    }

    onBlockedCallbackRef.current = onBlocked;
    setIsBlocking(true);

      // Start the blocking service
      try {
        appBlockingService.startMonitoring((appName, packageName) => {
          setBlockedApp({ appName, packageName });
          if (onBlockedCallbackRef.current) {
            onBlockedCallbackRef.current(appName, packageName);
          }
        });
      } catch (error) {
        console.error('[useAppBlocker] Error starting monitoring:', error);
        setIsBlocking(false);
      }

    // Set up periodic checks for active session status
    intervalRef.current = setInterval(async () => {
      const stillActive = await checkActiveSession();
      if (!stillActive) {
        stopMonitoring();
      }
    }, 5000); // Check every 5 seconds

    console.log('[useAppBlocker] Monitoring started');
  }, [isBlocking, checkActiveSession]);

  const stopMonitoring = useCallback(() => {
    if (!isBlocking) {
      return;
    }

    appBlockingService.stopMonitoring();
    setIsBlocking(false);
    setBlockedApp(null);
    onBlockedCallbackRef.current = null;

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    console.log('[useAppBlocker] Monitoring stopped');
  }, [isBlocking]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopMonitoring();
    };
  }, [stopMonitoring]);

  // Monitor app state changes
  useEffect(() => {
    if (!isBlocking) return;

    const subscription = AppState.addEventListener('change', async (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        // Check if session is still active
        const stillActive = await checkActiveSession();
        if (!stillActive) {
          stopMonitoring();
        }
      }
    });

    return () => {
      subscription.remove();
    };
  }, [isBlocking, checkActiveSession, stopMonitoring]);

  return {
    isBlocking,
    blockedApp,
    startMonitoring,
    stopMonitoring,
  };
}

