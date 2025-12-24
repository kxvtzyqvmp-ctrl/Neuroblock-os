/**
 * AppStateContext - Manages app state without authentication
 * 
 * Tracks:
 * - Onboarding completion status
 * - Free trial status and expiration
 * - Subscription status (via RevenueCat)
 * 
 * Flow:
 * - First launch → Onboarding
 * - After onboarding → Free trial (1 day)
 * - After trial → Paywall
 * - After subscription → Full access
 */

import { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage keys
const STORAGE_KEYS = {
  HAS_COMPLETED_ONBOARDING: '@neuroblock:has_completed_onboarding',
  TRIAL_START_DATE: '@neuroblock:trial_start_date',
  HAS_SUBSCRIPTION: '@neuroblock:has_subscription',
} as const;

// Trial duration: 1 day in milliseconds
const TRIAL_DURATION_MS = 24 * 60 * 60 * 1000;

interface AppStateContextType {
  hasCompletedOnboarding: boolean;
  trialStartDate: string | null;
  isTrialActive: boolean;
  hasSubscription: boolean;
  isLoading: boolean;
  completeOnboarding: () => Promise<void>;
  startTrial: () => Promise<void>;
  setHasSubscription: (value: boolean) => Promise<void>;
  resetApp: () => Promise<void>;
}

const AppStateContext = createContext<AppStateContextType>({
  hasCompletedOnboarding: false,
  trialStartDate: null,
  isTrialActive: false,
  hasSubscription: false,
  isLoading: true,
  completeOnboarding: async () => {},
  startTrial: async () => {},
  setHasSubscription: async () => {},
  resetApp: async () => {},
});

export const useAppState = () => useContext(AppStateContext);

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [trialStartDate, setTrialStartDate] = useState<string | null>(null);
  const [hasSubscription, setHasSubscription] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(Date.now()); // Force recalculation

  // Load app state from storage on mount
  useEffect(() => {
    loadAppState();
  }, []);

  // Check trial status immediately when app comes to foreground
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active' && trialStartDate && !hasSubscription) {
        // Update currentTime immediately when app becomes active to check trial status
        setCurrentTime(Date.now());
      }
    });

    return () => {
      subscription.remove();
    };
  }, [trialStartDate, hasSubscription]);

  const loadAppState = async () => {
    try {
      const [onboarding, trialDate, subscription] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.HAS_COMPLETED_ONBOARDING),
        AsyncStorage.getItem(STORAGE_KEYS.TRIAL_START_DATE),
        AsyncStorage.getItem(STORAGE_KEYS.HAS_SUBSCRIPTION),
      ]);

      setHasCompletedOnboarding(onboarding === 'true');
      
      if (trialDate) {
        setTrialStartDate(trialDate);
      }
      
      if (subscription === 'true') {
        setHasSubscription(true);
      }

      setIsLoading(false);
    } catch (error) {
      console.error('[AppState] Error loading app state:', error);
      setIsLoading(false);
    }
  };

  // Check if trial is still active - memoized and reactive
  const isTrialActive = useMemo((): boolean => {
    if (!trialStartDate) return false;
    if (hasSubscription) return true; // Subscription overrides trial
    
    const start = new Date(trialStartDate).getTime();
    const now = currentTime; // Use reactive currentTime
    const elapsed = now - start;
    
    return elapsed < TRIAL_DURATION_MS;
  }, [trialStartDate, hasSubscription, currentTime]);

  // Periodically check trial expiration when trial is active
  useEffect(() => {
    // Only set up interval if there's an active trial (without subscription)
    if (!trialStartDate || hasSubscription) return;

    // Calculate when the trial will expire
    const start = new Date(trialStartDate).getTime();
    const expirationTime = start + TRIAL_DURATION_MS;
    const now = Date.now();
    const timeUntilExpiration = expirationTime - now;

    // If already expired, update immediately
    if (timeUntilExpiration <= 0) {
      setCurrentTime(Date.now());
      return;
    }

    // Update immediately to ensure current state
    setCurrentTime(Date.now());

    // Set up interval to check expiration (check every minute, or at expiration time)
    const checkInterval = Math.min(60000, timeUntilExpiration); // Check every minute or at expiration
    const timeoutId = setTimeout(() => {
      setCurrentTime(Date.now());
    }, checkInterval);

    // Also set up a periodic check (every 5 minutes) to catch expiration
    const intervalId = setInterval(() => {
      setCurrentTime(Date.now());
    }, 5 * 60 * 1000); // Check every 5 minutes

    return () => {
      clearTimeout(timeoutId);
      clearInterval(intervalId);
    };
  }, [trialStartDate, hasSubscription]);

  const startTrialFunc = useCallback(async () => {
    try {
      const startDate = new Date().toISOString();
      await AsyncStorage.setItem(STORAGE_KEYS.TRIAL_START_DATE, startDate);
      setTrialStartDate(startDate);
    } catch (error) {
      console.error('[AppState] Error starting trial:', error);
    }
  }, []);

  const completeOnboarding = useCallback(async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.HAS_COMPLETED_ONBOARDING, 'true');
      setHasCompletedOnboarding(true);
      
      // Automatically start trial when onboarding completes
      await startTrialFunc();
    } catch (error) {
      console.error('[AppState] Error completing onboarding:', error);
    }
  }, [startTrialFunc]);

  const updateSubscription = useCallback(async (value: boolean) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.HAS_SUBSCRIPTION, value.toString());
      setHasSubscription(value);
    } catch (error) {
      console.error('[AppState] Error setting subscription:', error);
    }
  }, []);

  const resetApp = useCallback(async () => {
    try {
      await Promise.all([
        AsyncStorage.removeItem(STORAGE_KEYS.HAS_COMPLETED_ONBOARDING),
        AsyncStorage.removeItem(STORAGE_KEYS.TRIAL_START_DATE),
        AsyncStorage.removeItem(STORAGE_KEYS.HAS_SUBSCRIPTION),
      ]);
      
      setHasCompletedOnboarding(false);
      setTrialStartDate(null);
      setHasSubscription(false);
      setCurrentTime(Date.now()); // Reset current time
    } catch (error) {
      console.error('[AppState] Error resetting app:', error);
    }
  }, []);

  const value = useMemo(() => ({
    hasCompletedOnboarding,
    trialStartDate,
    isTrialActive, // Now reactive via useMemo
    hasSubscription,
    isLoading,
    completeOnboarding,
    startTrial: startTrialFunc,
    setHasSubscription: updateSubscription,
    resetApp,
  }), [
    hasCompletedOnboarding,
    trialStartDate,
    isTrialActive,
    hasSubscription,
    isLoading,
    completeOnboarding,
    startTrialFunc,
    updateSubscription,
    resetApp,
  ]);

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

