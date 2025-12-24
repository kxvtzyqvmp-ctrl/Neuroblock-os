/**
 * useFocusSession Hook
 * 
 * Manages focus session state and lifecycle:
 * - isActive, remainingTime
 * - startSession(durationSeconds), stopSession()
 * - Persists remaining time when app goes to background
 * 
 * REFACTORED: Timer does NOT store duration internally.
 * Duration must be passed as argument to startSession().
 * This makes sticky-state bugs impossible by design.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { Platform, AppState, AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAllFocusSessions, saveFocusSession, getDetoxSettings, saveDetoxSettings } from '@/lib/localStorage';
import { triggerFocusReminder } from '@/lib/localNotifications';
import { logFocusSession } from '@/lib/analytics';
import type { FocusSession, DetoxSettings } from '@/lib/localStorage';

interface UseFocusSessionResult {
  isActive: boolean;
  remainingTime: number; // in seconds
  totalDuration: number; // in seconds (for progress calculation)
  startSession: (durationSeconds: number) => Promise<boolean>; // REQUIRED: duration must be passed
  stopSession: () => Promise<void>;
  isLoading: boolean;
}

const SESSION_STATE_KEY = '@neuroblock:session_state';
const REMAINING_TIME_KEY = '@neuroblock:remaining_time';
const SESSION_START_TIME_KEY = '@neuroblock:session_start_time';

export function useFocusSession(): UseFocusSessionResult {
  // REFACTORED: Timer does NOT store duration internally
  // Duration is passed as argument to startSession() - makes sticky-state bugs impossible
  const [isActive, setIsActive] = useState(false);
  const [remainingTime, setRemainingTime] = useState(0); // Start at 0, set only by startSession()
  const [totalDuration, setTotalDuration] = useState(0); // Set only by startSession()
  const [isLoading, setIsLoading] = useState(true);
  
  // Single interval ref - ensures only one countdown interval exists at a time
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const backgroundTimeRef = useRef<number | null>(null);
  const sessionRef = useRef<FocusSession | null>(null);
  const startTimeRef = useRef<number | null>(null);

  // Load session state on mount
  useEffect(() => {
    loadSessionState();
    
    // Monitor app state for background/foreground
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    return () => {
      subscription.remove();
      // CRITICAL: Always clear interval on unmount to prevent leaks
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []);

  const handleAppStateChange = useCallback(async (nextAppState: AppStateStatus) => {
    if (nextAppState === 'background' && isActive && remainingTime > 0) {
      // Save state when going to background
      backgroundTimeRef.current = Date.now();
      try {
        await AsyncStorage.setItem(REMAINING_TIME_KEY, JSON.stringify(remainingTime));
        if (startTimeRef.current) {
          await AsyncStorage.setItem(SESSION_START_TIME_KEY, JSON.stringify(startTimeRef.current));
        }
      } catch (error) {
        console.error('[useFocusSession] Error saving remaining time:', error);
      }
    } else if (nextAppState === 'active' && isActive && backgroundTimeRef.current) {
      // Restore state when coming back to foreground
      const timeInBackground = Math.floor((Date.now() - backgroundTimeRef.current) / 1000);
      setRemainingTime(prev => {
        const newValue = Math.max(0, prev - timeInBackground);
        // Save updated remaining time
        AsyncStorage.setItem(REMAINING_TIME_KEY, JSON.stringify(newValue)).catch(console.error);
        return newValue;
      });
      backgroundTimeRef.current = null;
    }
  }, [isActive, remainingTime]);

  const loadSessionState = async () => {
    try {
      setIsLoading(true);
      
      // Load active session from storage
      const allSessions = await getAllFocusSessions();
      const activeSession = Object.values(allSessions).find(
        (s: FocusSession) => s.end_time === null
      );

      if (activeSession) {
        // CRITICAL: Restore active session from storage
        // This only happens on app restart - we restore the exact session that was running
        sessionRef.current = activeSession;
        setIsActive(true);

        // Calculate remaining time from session start time and duration
        const now = Date.now();
        const start = new Date(activeSession.start_time).getTime();
        const elapsed = Math.floor((now - start) / 1000);
        
        // Get duration from session (if stored) or from settings
        let durationMinutes: number;
        if (activeSession.duration_minutes !== null && activeSession.duration_minutes !== undefined) {
          // Use duration from session if available
          durationMinutes = activeSession.duration_minutes;
        } else {
          // Fallback to settings or default to 60 minutes
          const settings = await getDetoxSettings();
          durationMinutes = settings?.daily_limit_minutes || 60;
        }
        
        const totalSeconds = durationMinutes * 60;
        const remaining = Math.max(0, totalSeconds - elapsed);
        
        // Restore the session state (this is only for app restart, not for new sessions)
        setRemainingTime(remaining);
        setTotalDuration(totalSeconds);
        startTimeRef.current = start;
        
        // Save remaining time for persistence
        await AsyncStorage.setItem(REMAINING_TIME_KEY, JSON.stringify(remaining));
        await AsyncStorage.setItem(SESSION_START_TIME_KEY, JSON.stringify(start));
        
        // Auto-stop if session expired while app was closed
        if (remaining === 0) {
          await stopSession();
        }
      } else {
        // Clear any saved remaining time if no active session
        // REFACTORED: Don't set remainingTime here - it will be set when startSession() is called
        setIsActive(false);
        setRemainingTime(0);
        setTotalDuration(0);
        startTimeRef.current = null;
        await AsyncStorage.removeItem(REMAINING_TIME_KEY);
        await AsyncStorage.removeItem(SESSION_START_TIME_KEY);
      }
    } catch (error) {
      console.error('[useFocusSession] Error loading session:', error);
      setIsActive(false);
      setRemainingTime(0);
      setTotalDuration(0);
    } finally {
      setIsLoading(false);
    }
  };

  // Store stopSession in ref to avoid circular dependency
  const stopSessionRef = useRef<(() => Promise<void>) | null>(null);

  // CRITICAL: Single countdown function - ensures only one interval exists
  // This function is called only when session is active and interval doesn't exist
  const startCountdown = useCallback(() => {
    // Safety: Always clear any existing interval first
    if (intervalRef.current) {
      console.log('[useFocusSession] Clearing existing interval before starting new one');
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    console.log('[useFocusSession] Starting countdown interval');
    intervalRef.current = setInterval(() => {
      setRemainingTime(prev => {
        const newValue = Math.max(0, prev - 1);
        
        // Persist remaining time every second while active
        AsyncStorage.setItem(REMAINING_TIME_KEY, JSON.stringify(newValue)).catch(console.error);
        
        if (newValue === 0) {
          // Session ended naturally
          console.log('[useFocusSession] Session ended (timer reached 0)');
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          // Use ref to avoid circular dependency
          if (stopSessionRef.current) {
            stopSessionRef.current();
          }
        }
        
        return newValue;
      });
    }, 1000);
  }, []);

  // REFACTORED: startSession REQUIRES durationSeconds as argument
  // Timer does NOT store duration internally - duration must be passed from UI
  // This makes sticky-state bugs impossible by design
  const startSession = useCallback(async (durationSeconds: number): Promise<boolean> => {
    try {
      // Validate duration: minimum 5 minutes (300 seconds), maximum 8 hours (28800 seconds)
      const durationMinutes = durationSeconds / 60;
      if (durationMinutes < 5 || durationMinutes > 480) {
        console.error('[useFocusSession] Invalid duration:', durationSeconds, 'seconds (', durationMinutes, 'minutes)');
        return false;
      }
      
      console.log('[useFocusSession] startSession called with duration:', durationSeconds, 'seconds (', durationMinutes, 'minutes)');

      // CRITICAL: Stop any existing session/interval first to ensure clean state
      // This prevents duplicate intervals
      if (intervalRef.current) {
        console.log('[useFocusSession] Clearing existing interval before starting new session');
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      // If there's an active session, stop it first (clean transition)
      if (sessionRef.current && sessionRef.current.end_time === null) {
        console.log('[useFocusSession] Stopping existing session before starting new one');
        // End the previous session properly
        const endTime = new Date().toISOString();
        const updatedSession: FocusSession = {
          ...sessionRef.current,
          end_time: endTime,
        };
        await saveFocusSession(updatedSession);
      }

      // Create new session with duration stored
      const startTime = new Date();
      const newSession: FocusSession = {
        id: `session_${Date.now()}`,
        start_time: startTime.toISOString(),
        end_time: null,
        duration_minutes: durationMinutes, // Store duration in session
        created_at: new Date().toISOString(),
      };

      await saveFocusSession(newSession);
      sessionRef.current = newSession;

      // Update settings with duration (for compatibility)
      const settings = await getDetoxSettings();
      if (settings) {
        settings.daily_limit_minutes = durationMinutes;
        settings.is_active = true;
        settings.updated_at = new Date().toISOString();
        await saveDetoxSettings(settings);
      }

      // CRITICAL: ALWAYS reset timeLeft from the durationSeconds argument
      // This is the ONLY place we set the full duration - makes sticky-state bugs impossible
      const startTimestamp = startTime.getTime();
      
      setIsActive(true);
      setRemainingTime(durationSeconds); // Always reset from argument (not from any internal state)
      setTotalDuration(durationSeconds);
      startTimeRef.current = startTimestamp;
      backgroundTimeRef.current = null;

      // Save remaining time and start time for persistence
      await AsyncStorage.setItem(REMAINING_TIME_KEY, JSON.stringify(durationSeconds));
      await AsyncStorage.setItem(SESSION_START_TIME_KEY, JSON.stringify(startTimestamp));

      // CRITICAL: Start countdown interval (only one should exist)
      // The useEffect will also try to start it, but this ensures it starts immediately
      startCountdown();

      // Trigger focus reminder notification
      try {
        await triggerFocusReminder();
      } catch (error) {
        console.error('[useFocusSession] Error triggering focus reminder:', error);
        // Don't fail session start if notification fails
      }

      return true;
    } catch (error) {
      console.error('[useFocusSession] Error starting session:', error);
      // Clean up on error
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return false;
    }
    // REFACTORED: No dependencies on duration - duration is passed as argument
    // This ensures the callback never captures stale duration values
  }, [startCountdown]);

  const stopSession = useCallback(async () => {
    try {
      console.log('[useFocusSession] stopSession called');
      
      // CRITICAL: Stop countdown interval FIRST to prevent any further ticks
      if (intervalRef.current) {
        console.log('[useFocusSession] Clearing countdown interval');
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      if (sessionRef.current) {
        const endTime = new Date().toISOString();
        const actualDurationMinutes = Math.floor(
          (new Date(endTime).getTime() - new Date(sessionRef.current.start_time).getTime()) / 60000
        );

        // Use original duration from session or actual duration
        const durationMinutes = sessionRef.current.duration_minutes || actualDurationMinutes;

        const updatedSession: FocusSession = {
          ...sessionRef.current,
          end_time: endTime,
          duration_minutes: durationMinutes,
        };

        await saveFocusSession(updatedSession);
        
        // Log to analytics (only if session has valid end time and duration)
        if (updatedSession.end_time && updatedSession.duration_minutes && updatedSession.duration_minutes > 0) {
          try {
            await logFocusSession(updatedSession);
            console.log('[useFocusSession] Session logged to analytics');
          } catch (analyticsError) {
            console.error('[useFocusSession] Error logging session to analytics:', analyticsError);
            // Don't fail session stop if analytics logging fails
          }
        }
      }

      // CRITICAL: Fully reset timer state to prevent sticky-state bugs
      setIsActive(false);
      setRemainingTime(0);
      setTotalDuration(0);
      sessionRef.current = null;
      startTimeRef.current = null;
      backgroundTimeRef.current = null;

      // Clear saved remaining time to prevent restoring old duration
      await AsyncStorage.removeItem(REMAINING_TIME_KEY);
      await AsyncStorage.removeItem(SESSION_START_TIME_KEY);
      
      console.log('[useFocusSession] Session stopped and reset');
    } catch (error) {
      console.error('[useFocusSession] Error stopping session:', error);
      // Even on error, ensure interval is cleared and state is reset
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setIsActive(false);
      setRemainingTime(0);
      setTotalDuration(0);
    }
    // No dependencies - timer doesn't store duration
  }, []);

  // Store stopSession in ref for startCountdown to use
  useEffect(() => {
    stopSessionRef.current = stopSession;
  }, [stopSession]);

  // CRITICAL: Manage countdown interval lifecycle
  // This ensures only one interval exists and it's properly cleaned up
  useEffect(() => {
    if (isActive && remainingTime > 0) {
      // Only start if interval doesn't exist (prevents duplicates)
      if (!intervalRef.current) {
        console.log('[useFocusSession] Starting countdown via useEffect');
        startCountdown();
      }
    } else if (!isActive) {
      // Always clear interval when inactive (safety cleanup)
      if (intervalRef.current) {
        console.log('[useFocusSession] Clearing interval (session inactive)');
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
    
    // Cleanup on unmount or dependency change
    return () => {
      if (intervalRef.current) {
        console.log('[useFocusSession] Cleanup: clearing interval');
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isActive, remainingTime, startCountdown]);

  return {
    isActive,
    remainingTime,
    totalDuration,
    startSession,
    stopSession,
    isLoading,
  };
}

