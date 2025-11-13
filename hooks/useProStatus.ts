import { useState, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';
import { initializeRevenueCat, isRevenueCatInitialized, getRevenueCatInstance } from '@/lib/revenuecatInit';

interface ProStatus {
  hasPro: boolean;
  isLoading: boolean;
  refresh: () => Promise<void>;
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
    if (Platform.OS === 'web') {
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
        setHasPro(false);
        setIsLoading(false);
        return;
      }

      const customerInfo = await Purchases.getCustomerInfo();
      const isPro = customerInfo.entitlements.active['Pro'] !== undefined;
      setHasPro(isPro);
    } catch (error) {
      console.error('[useProStatus] Error checking pro status:', error);
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

    if (Platform.OS !== 'web') {
      const Purchases = getRevenueCatInstance();
      if (Purchases) {
        const listener = Purchases.addCustomerInfoUpdateListener((customerInfo: any) => {
          const isPro = customerInfo.entitlements.active['Pro'] !== undefined;
          setHasPro(isPro);
        });

        return () => {
          if (listener && typeof listener.remove === 'function') {
            listener.remove();
          }
        };
      }
    }
  }, [checkProStatus, isReady]);

  return { hasPro, isLoading, refresh };
}
