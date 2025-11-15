/**
 * useFocusButton Hook
 * 
 * Manages the S.O.S. Button (Focus Button) interaction logic:
 * - Touch & hold detection
 * - Duration selection (30m → 1h → 2h → Until I stop)
 * - Haptic feedback
 * - Session start
 * 
 * Zero-friction: First use auto-detects apps and creates block list.
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { Platform, AppState, AppStateStatus } from 'react-native';
import * as Haptics from 'expo-haptics';
import { saveDetoxSettings, getDetoxSettings, saveFocusSession, getAllFocusSessions } from '@/lib/localStorage';
import type { FocusSession, DetoxSettings } from '@/lib/localStorage';
import { useAppScanner } from './useAppScanner';
import { useProStatus } from './useProStatus';

export type FocusDuration = 30 | 60 | 120 | 0; // 30m, 1h, 2h, Until I stop (0)

interface UseFocusButtonResult {
  isHolding: boolean;
  duration: FocusDuration;
  isStarting: boolean;
  onPressIn: () => void;
  onPressOut: () => void;
  canStart: boolean;
}

export function useFocusButton(): UseFocusButtonResult {
  const [isHolding, setIsHolding] = useState(false);
  const [duration, setDuration] = useState<FocusDuration>(30);
  const [isStarting, setIsStarting] = useState(false);
  const [canStart, setCanStart] = useState(false);
  
  const holdIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const holdStartTimeRef = useRef<number | null>(null);
  const durationIndexRef = useRef<number>(0);
  const { scanTopApps } = useAppScanner();
  const { hasPro } = useProStatus();

  // Duration sequence: 30m → 1h → 2h → Until I stop → 30m (loop)
  const durationSequence: FocusDuration[] = [30, 60, 120, 0];

  const checkExistingSession = useCallback(async () => {
    try {
      const allSessions = await getAllFocusSessions();
      const activeSession = Object.values(allSessions).find(
        (s: FocusSession) => s.end_time === null
      );
      setCanStart(!activeSession);
    } catch (error) {
      console.error('[useFocusButton] Error checking session:', error);
      setCanStart(true);
    }
  }, []);

  useEffect(() => {
    checkExistingSession();

    // Monitor app state to check for active sessions
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        checkExistingSession();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [checkExistingSession]);

  const onPressIn = useCallback(() => {
    if (!canStart) return;

    setIsHolding(true);
    holdStartTimeRef.current = Date.now();
    durationIndexRef.current = 0;
    setDuration(30); // Start with 30 minutes

    // Initial haptic feedback
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    // Cycle through durations while holding
    holdIntervalRef.current = setInterval(() => {
      durationIndexRef.current = (durationIndexRef.current + 1) % durationSequence.length;
      const newDuration = durationSequence[durationIndexRef.current];
      setDuration(newDuration);

      // Haptic feedback on each duration change
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    }, 1000); // Change duration every second
  }, [canStart]);

  const onPressOut = useCallback(async () => {
    if (!isHolding) return;

    setIsHolding(false);
    
    // Clear interval
    if (holdIntervalRef.current) {
      clearInterval(holdIntervalRef.current);
      holdIntervalRef.current = null;
    }

    // Haptic feedback on release
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    // Start focus session
    await startFocusSession(duration);
  }, [isHolding, duration]);

  const startFocusSession = useCallback(async (selectedDuration: FocusDuration) => {
    try {
      setIsStarting(true);

      // Get or create settings
      let settings = await getDetoxSettings();
      
      // If no settings or no apps selected, auto-detect on first use
      if (!settings || !settings.selected_apps || settings.selected_apps.length === 0) {
        // First-time setup: auto-detect top 5 apps
        const topApps = await scanTopApps(5);
        
        if (topApps.length > 0) {
          settings = {
            selected_apps: topApps.map(app => app.appName),
            daily_limit_minutes: selectedDuration === 0 ? 480 : selectedDuration, // 0 = 8 hours
            active_schedule_type: 'work_hours',
            active_schedule_start: '09:00:00',
            active_schedule_end: '17:00:00',
            pause_duration_seconds: 10,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          
          await saveDetoxSettings(settings);
          
          // Show toast (handled by parent component)
          return { 
            success: true, 
            firstTime: true, 
            message: `Blocking your top ${topApps.length} most-used apps. You can change this in Settings.`,
            settings 
          };
        }
      }

      // Update settings with selected duration
      if (settings) {
        settings.daily_limit_minutes = selectedDuration === 0 ? 480 : selectedDuration;
        settings.is_active = true;
        settings.updated_at = new Date().toISOString();
        await saveDetoxSettings(settings);
      }

      // Create focus session
      const newSession: FocusSession = {
        id: `session_${Date.now()}`,
        start_time: new Date().toISOString(),
        end_time: null,
        duration_minutes: null,
        created_at: new Date().toISOString(),
      };

      await saveFocusSession(newSession);
      
      setCanStart(false);

      return { 
        success: true, 
        firstTime: false,
        message: `Focus session started for ${selectedDuration === 0 ? '8 hours' : `${selectedDuration} minutes`}`,
        settings 
      };
    } catch (error) {
      console.error('[useFocusButton] Error starting session:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    } finally {
      setIsStarting(false);
    }
  }, [scanTopApps]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (holdIntervalRef.current) {
        clearInterval(holdIntervalRef.current);
      }
    };
  }, []);

  return {
    isHolding,
    duration,
    isStarting,
    onPressIn,
    onPressOut,
    canStart,
  };
}

