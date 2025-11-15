/**
 * useFocusSession Hook
 * 
 * Manages focus session state and lifecycle:
 * - isActive, remainingTime
 * - startSession(), stopSession()
 * - Persists remaining time when app goes to background
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { Platform, AppState, AppStateStatus } from 'react-native';
import { getAllFocusSessions, saveFocusSession, getDetoxSettings, saveDetoxSettings } from '@/lib/localStorage';
import type { FocusSession, DetoxSettings } from '@/lib/localStorage';

interface UseFocusSessionResult {
  isActive: boolean;
  remainingTime: number; // in seconds
  totalDuration: number; // in seconds (for progress calculation)
  startSession: (durationMinutes: number) => Promise<boolean>;
  stopSession: () => Promise<void>;
  isLoading: boolean;
}

const SESSION_STATE_KEY = '@neuroblock:session_state';

export function useFocusSession(): UseFocusSessionResult {
  const [isActive, setIsActive] = useState(false);
  const [remainingTime, setRemainingTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const backgroundTimeRef = useRef<number | null>(null);
  const sessionRef = useRef<FocusSession | null>(null);

  // Load session state on mount
  useEffect(() => {
    loadSessionState();
    
    // Monitor app state for background/foreground
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    return () => {
      subscription.remove();
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const handleAppStateChange = useCallback((nextAppState: AppStateStatus) => {
    if (nextAppState === 'background' && isActive) {
      // Save state when going to background
      backgroundTimeRef.current = Date.now();
    } else if (nextAppState === 'active' && isActive && backgroundTimeRef.current) {
      // Restore state when coming back to foreground
      const timeInBackground = Math.floor((Date.now() - backgroundTimeRef.current) / 1000);
      setRemainingTime(prev => Math.max(0, prev - timeInBackground));
      backgroundTimeRef.current = null;
    }
  }, [isActive]);

  const loadSessionState = async () => {
    try {
      setIsLoading(true);
      
      // Load active session from storage
      const allSessions = await getAllFocusSessions();
      const activeSession = Object.values(allSessions).find(
        (s: FocusSession) => s.end_time === null
      );

      if (activeSession) {
        sessionRef.current = activeSession;
        setIsActive(true);

        // Calculate remaining time
        const settings = await getDetoxSettings();
        if (settings?.daily_limit_minutes) {
          const now = Date.now();
          const start = new Date(activeSession.start_time).getTime();
          const elapsed = Math.floor((now - start) / 1000);
          const totalSeconds = settings.daily_limit_minutes * 60;
          const remaining = Math.max(0, totalSeconds - elapsed);
          setRemainingTime(remaining);
          setTotalDuration(totalSeconds);
        }
      } else {
        setIsActive(false);
        setRemainingTime(0);
        setTotalDuration(0);
      }
    } catch (error) {
      console.error('[useFocusSession] Error loading session:', error);
      setIsActive(false);
      setRemainingTime(0);
    } finally {
      setIsLoading(false);
    }
  };

  const startSession = useCallback(async (durationMinutes: number): Promise<boolean> => {
    try {
      // Create new session
      const newSession: FocusSession = {
        id: `session_${Date.now()}`,
        start_time: new Date().toISOString(),
        end_time: null,
        duration_minutes: null,
        created_at: new Date().toISOString(),
      };

      await saveFocusSession(newSession);
      sessionRef.current = newSession;

      // Update settings with duration
      const settings = await getDetoxSettings();
      if (settings) {
        settings.daily_limit_minutes = durationMinutes;
        settings.is_active = true;
        settings.updated_at = new Date().toISOString();
        await saveDetoxSettings(settings);
      }

      // Set state
      const totalSeconds = durationMinutes * 60;
      setIsActive(true);
      setRemainingTime(totalSeconds);
      setTotalDuration(totalSeconds);

      // Start countdown interval
      startCountdown();

      return true;
    } catch (error) {
      console.error('[useFocusSession] Error starting session:', error);
      return false;
    }
  }, []);

  const stopSession = useCallback(async () => {
    try {
      if (!sessionRef.current) return;

      const endTime = new Date().toISOString();
      const durationMinutes = Math.floor(
        (new Date(endTime).getTime() - new Date(sessionRef.current.start_time).getTime()) / 60000
      );

      const updatedSession: FocusSession = {
        ...sessionRef.current,
        end_time: endTime,
        duration_minutes: durationMinutes,
      };

      await saveFocusSession(updatedSession);

      // Stop countdown
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      // Reset state
      setIsActive(false);
      setRemainingTime(0);
      setTotalDuration(0);
      sessionRef.current = null;
      backgroundTimeRef.current = null;
    } catch (error) {
      console.error('[useFocusSession] Error stopping session:', error);
    }
  }, []);

  const startCountdown = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(() => {
      setRemainingTime(prev => {
        const newValue = Math.max(0, prev - 1);
        
        if (newValue === 0) {
          // Session ended
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          stopSession();
        }
        
        return newValue;
      });
    }, 1000);
  }, [stopSession]);

  // Start countdown when session becomes active
  useEffect(() => {
    if (isActive && remainingTime > 0 && !intervalRef.current) {
      startCountdown();
    } else if (!isActive && intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
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

