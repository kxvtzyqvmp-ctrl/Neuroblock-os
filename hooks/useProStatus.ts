import { useState, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { initializeRevenueCat, isRevenueCatInitialized, getRevenueCatInstance } from '@/lib/revenuecatInit';

interface ProStatus {
  hasPro: boolean;
  isLoading: boolean;
  refresh: () => Promise<void>;
}

// Check if running in Expo Go
function isExpoGo(): boolean {
  try {
    return Constants.appOwnership === 'expo' || 
           Constants.executionEnvironment === 'storeClient';
  } catch {
    return false;
  }
}

export function useProStatus(): ProStatus {
  const [hasPro, setHasPro] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const initialize = async () => {
      await initializeRevenueCat();
      setIsReady(true);
    };

    initialize();
  }, []);

  const checkProStatus = useCallback(async () => {
    // Skip in web or Expo Go (RevenueCat not available)
    if (Platform.OS === 'web' || isExpoGo()) {
      setHasPro(false);
      setIsLoading(false);
      return;
    }

    if (!isRevenueCatInitialized()) {
      console.log('[useProStatus] Waiting for RevenueCat initialization...');
      setIsLoading(false);
      return;
    }

    try {
      const Purchases = getRevenueCatInstance();
      if (!Purchases) {
        // In Expo Go, Purchases will be null - this is expected
        setHasPro(false);
        setIsLoading(false);
        return;
      }

      const customerInfo = await Purchases.getCustomerInfo();
      const isPro = customerInfo.entitlements.active['Pro'] !== undefined;
      setHasPro(isPro);
    } catch (error) {
      console.warn('[useProStatus] Error checking pro status (this is OK in Expo Go):', error);
      setHasPro(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    await checkProStatus();
  }, [checkProStatus]);

  useEffect(() => {
    if (!isReady) return;

    checkProStatus();

    // Only set up listener if not in Expo Go and Purchases is available
    if (Platform.OS !== 'web' && !isExpoGo()) {
      const Purchases = getRevenueCatInstance();
      if (Purchases) {
        try {
          const listener = Purchases.addCustomerInfoUpdateListener((customerInfo: any) => {
            const isPro = customerInfo.entitlements.active['Pro'] !== undefined;
            setHasPro(isPro);
          });

          return () => {
            if (listener && typeof listener.remove === 'function') {
              listener.remove();
            }
          };
        } catch (error) {
          console.warn('[useProStatus] Error setting up listener:', error);
        }
      }
    }
  }, [checkProStatus, isReady]);

  return { hasPro, isLoading, refresh };
}
