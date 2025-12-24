/**
 * useFocusDuration Hook
 * 
 * Manages focus duration state and persistence:
 * - Stores selected duration in AsyncStorage
 * - Loads saved duration on mount
 * - Provides duration selection functionality
 */

import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const FOCUS_DURATION_KEY = '@neuroblock:focus_duration';
const DEFAULT_DURATION = 60; // 60 minutes (1 hour)

export interface FocusDuration {
  minutes: number;
  displayName: string;
}

// Preset duration mapping (minutes to seconds)
export const PRESET_DURATIONS_SECONDS = {
  '5m': 5 * 60,
  '15m': 15 * 60,
  '30m': 30 * 60,
  '1h': 60 * 60,
  '2h': 2 * 60 * 60,
  '3h': 3 * 60 * 60,
  '8h': 8 * 60 * 60,
} as const;

export const PRESET_DURATIONS: FocusDuration[] = [
  { minutes: 5, displayName: '5m' },
  { minutes: 15, displayName: '15m' },
  { minutes: 30, displayName: '30m' },
  { minutes: 60, displayName: '1h' },
  { minutes: 120, displayName: '2h' },
  { minutes: 180, displayName: '3h' },
  { minutes: 480, displayName: '8h' },
];

interface UseFocusDurationReturn {
  duration: number; // in minutes
  isLoading: boolean;
  setDuration: (minutes: number) => Promise<void>;
  saveDuration: (minutes: number) => Promise<void>;
  loadDuration: () => Promise<void>;
}

export function useFocusDuration(): UseFocusDurationReturn {
  const [duration, setDurationState] = useState<number>(DEFAULT_DURATION);
  const [isLoading, setIsLoading] = useState(true);

  // Load saved duration on mount
  useEffect(() => {
    loadDuration();
  }, []);

  const loadDuration = useCallback(async () => {
    try {
      setIsLoading(true);
      const savedDuration = await AsyncStorage.getItem(FOCUS_DURATION_KEY);
      
      if (savedDuration) {
        const parsed = JSON.parse(savedDuration);
        setDurationState(parsed);
        console.log('[useFocusDuration] Loaded saved duration:', parsed, 'minutes');
      } else {
        // Use default if no saved duration
        setDurationState(DEFAULT_DURATION);
        console.log('[useFocusDuration] Using default duration:', DEFAULT_DURATION, 'minutes');
      }
    } catch (error) {
      console.error('[useFocusDuration] Error loading duration:', error);
      setDurationState(DEFAULT_DURATION);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const saveDuration = useCallback(async (minutes: number) => {
    try {
      // Update state synchronously first for immediate UI update
      setDurationState(minutes);
      console.log('[useFocusDuration] Updated duration state to:', minutes, 'minutes');
      // Save to AsyncStorage (await to ensure it completes)
      await AsyncStorage.setItem(FOCUS_DURATION_KEY, JSON.stringify(minutes));
      console.log('[useFocusDuration] Duration saved to storage:', minutes, 'minutes');
    } catch (error) {
      console.error('[useFocusDuration] Error in saveDuration:', error);
      throw error;
    }
  }, []);

  const setDuration = useCallback(async (minutes: number) => {
    // Update state immediately (synchronously) before async save
    setDurationState(minutes);
    console.log('[useFocusDuration] setDuration called, updated state to:', minutes, 'minutes');
    // Save to storage (fire and forget - don't block)
    AsyncStorage.setItem(FOCUS_DURATION_KEY, JSON.stringify(minutes)).catch((error) => {
      console.error('[useFocusDuration] Error saving duration to storage:', error);
    });
  }, []);

  return {
    duration,
    isLoading,
    setDuration,
    saveDuration,
    loadDuration,
  };
}

