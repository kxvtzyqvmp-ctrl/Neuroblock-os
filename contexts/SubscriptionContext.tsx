/**
 * SubscriptionContext - Central source of truth for subscription status
 * 
 * Manages:
 * - isPro status (persisted locally for fast boot, verified with RevenueCat)
 * - Purchase and restore flows
 * - Real-time subscription updates
 * 
 * Entitlement ID: 'Pro' (configured in lib/revenuecatConfig.ts)
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { Platform, Alert, AppState, AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { getRevenueCatInstance, isRevenueCatInitialized } from '@/lib/revenuecatInit';
import { RC_ENTITLEMENT_ID } from '@/lib/revenuecatConfig';

// Storage key for persisting pro status
const PRO_STATUS_KEY = '@neuroblock:pro_status';

interface SubscriptionContextType {
  isPro: boolean;
  isLoading: boolean;
  isLoadingPro: boolean; // Alias for isLoading
  refreshCustomerInfo: () => Promise<void>;
  refreshProStatus: () => Promise<void>; // Alias for refreshCustomerInfo
  handlePurchase: (pkg: any) => Promise<{ success: boolean; error?: string }>;
  handleRestore: () => Promise<{ success: boolean; restored: boolean; error?: string }>;
  lastRefreshError: string | null; // Track if RevenueCat is unreachable
}

const SubscriptionContext = createContext<SubscriptionContextType>({
  isPro: false,
  isLoading: true,
  isLoadingPro: true,
  refreshCustomerInfo: async () => {},
  refreshProStatus: async () => {},
  handlePurchase: async () => ({ success: false }),
  handleRestore: async () => ({ success: false, restored: false }),
  lastRefreshError: null,
});

export const useSubscription = () => useContext(SubscriptionContext);

// Check if running in Expo Go
function isExpoGo(): boolean {
  try {
    return Constants.appOwnership === 'expo' || 
           Constants.executionEnvironment === 'storeClient';
  } catch {
    return false;
  }
}

// Check if Pro entitlement is active from customerInfo
function checkEntitlementActive(customerInfo: any): boolean {
  if (!customerInfo?.entitlements?.active) return false;
  
  const entitlement = customerInfo.entitlements.active[RC_ENTITLEMENT_ID];
  return !!entitlement;
}

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const [isPro, setIsPro] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [lastRefreshError, setLastRefreshError] = useState<string | null>(null);

  // Load persisted pro status on mount (fast boot)
  useEffect(() => {
    loadPersistedStatus();
  }, []);

  // Verify with RevenueCat after initial load
  useEffect(() => {
    if (!isLoading) {
      // Small delay to ensure RevenueCat is ready
      const timer = setTimeout(() => {
        refreshCustomerInfo();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  // Refresh Pro status when app comes to foreground
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        // Refresh Pro status when app becomes active
        refreshCustomerInfo();
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  // Load persisted status from AsyncStorage
  const loadPersistedStatus = async () => {
    try {
      const stored = await AsyncStorage.getItem(PRO_STATUS_KEY);
      if (stored === 'true') {
        setIsPro(true);
        console.log('[Subscription] Loaded persisted pro status: true');
      }
    } catch (error) {
      console.warn('[Subscription] Error loading persisted status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Persist pro status to AsyncStorage
  const persistProStatus = async (status: boolean) => {
    try {
      await AsyncStorage.setItem(PRO_STATUS_KEY, status.toString());
      console.log('[Subscription] Persisted pro status:', status);
    } catch (error) {
      console.warn('[Subscription] Error persisting status:', error);
    }
  };

  // Update pro status and persist
  const updateProStatus = useCallback(async (status: boolean) => {
    setIsPro(status);
    await persistProStatus(status);
  }, []);

  // Refresh customer info from RevenueCat
  const refreshCustomerInfo = useCallback(async () => {
    // Skip in web or Expo Go
    if (Platform.OS === 'web' || isExpoGo()) {
      console.log('[Subscription] Skipping refresh (web/Expo Go)');
      setLastRefreshError(null);
      return;
    }

    if (!isRevenueCatInitialized()) {
      console.log('[Subscription] RevenueCat not initialized yet');
      setLastRefreshError('RevenueCat not initialized');
      return;
    }

    const Purchases = getRevenueCatInstance();
    if (!Purchases) {
      console.log('[Subscription] Purchases instance not available');
      setLastRefreshError('Purchases instance not available');
      return;
    }

    try {
      const customerInfo = await Purchases.getCustomerInfo();
      const entitlement = customerInfo?.entitlements?.active?.[RC_ENTITLEMENT_ID];
      const hasPro = !!entitlement;
      
      // Debug logging (only in dev)
      if (__DEV__) {
        console.log('[Subscription] Refreshed customer info:');
        console.log('  - RC_ENTITLEMENT_ID:', RC_ENTITLEMENT_ID);
        console.log('  - hasPro:', hasPro);
        console.log('  - entitlement:', entitlement ? 'active' : 'not found');
        console.log('  - All entitlements:', Object.keys(customerInfo?.entitlements?.active || {}));
        if (entitlement) {
          console.log('  - Entitlement details:', {
            identifier: entitlement.identifier,
            isActive: entitlement.isActive,
            willRenew: entitlement.willRenew,
            periodType: entitlement.periodType,
          });
        }
      }
      
      await updateProStatus(hasPro);
      setLastRefreshError(null); // Clear error on success
    } catch (error: any) {
      console.warn('[Subscription] Error refreshing customer info:', error);
      setLastRefreshError(error.message || 'Unable to refresh subscription status');
      // Keep last known isPro status on error (don't update)
    }
  }, [updateProStatus]);

  // Handle purchase
  const handlePurchase = useCallback(async (pkg: any): Promise<{ success: boolean; error?: string }> => {
    if (Platform.OS === 'web' || isExpoGo()) {
      return { success: false, error: 'Purchases are only available on iOS and Android.' };
    }

    if (!isRevenueCatInitialized()) {
      return { success: false, error: 'Purchase system is not ready. Please try again.' };
    }

    const Purchases = getRevenueCatInstance();
    if (!Purchases) {
      return { success: false, error: 'Purchase system is not available.' };
    }

    try {
      console.log('[Subscription] Starting purchase for package:', pkg.identifier);
      
      const purchaseInfo = await Purchases.purchasePackage(pkg);
      const { customerInfo } = purchaseInfo;

      // Check entitlement from the fresh customerInfo returned by purchase
      const entitlement = customerInfo?.entitlements?.active?.[RC_ENTITLEMENT_ID];
      const hasPro = !!entitlement;
      
      // Debug logging
      if (__DEV__) {
        console.log('[Subscription] Purchase complete:');
        console.log('  - RC_ENTITLEMENT_ID:', RC_ENTITLEMENT_ID);
        console.log('  - hasPro:', hasPro);
        console.log('  - entitlement:', entitlement ? 'active' : 'not found');
        console.log('  - All entitlements:', Object.keys(customerInfo?.entitlements?.active || {}));
        if (entitlement) {
          console.log('  - Entitlement details:', {
            identifier: entitlement.identifier,
            isActive: entitlement.isActive,
            willRenew: entitlement.willRenew,
            periodType: entitlement.periodType,
          });
        }
      }

      if (hasPro) {
        // Update pro status immediately
        await updateProStatus(true);
        setLastRefreshError(null);
        return { success: true };
      } else {
        // Purchase completed but entitlement not active - this is the only time to show this error
        return { 
          success: false, 
          error: 'Purchase completed but access was not granted. Please try Restore Purchases or contact support.' 
        };
      }
    } catch (error: any) {
      console.error('[Subscription] Purchase error:', error);
      
      // User cancelled - not an error
      if (error.userCancelled) {
        return { success: false };
      }

      return { 
        success: false, 
        error: error.message || 'Unable to complete purchase. Please try again.' 
      };
    }
  }, [updateProStatus]);

  // Handle restore purchases
  const handleRestore = useCallback(async (): Promise<{ success: boolean; restored: boolean; error?: string }> => {
    if (Platform.OS === 'web' || isExpoGo()) {
      return { success: false, restored: false, error: 'Restore is only available on iOS and Android.' };
    }

    if (!isRevenueCatInitialized()) {
      return { success: false, restored: false, error: 'Purchase system is not ready.' };
    }

    const Purchases = getRevenueCatInstance();
    if (!Purchases) {
      return { success: false, restored: false, error: 'Purchase system is not available.' };
    }

    try {
      console.log('[Subscription] Starting restore purchases');
      
      const customerInfo = await Purchases.restorePurchases();
      const entitlement = customerInfo?.entitlements?.active?.[RC_ENTITLEMENT_ID];
      const hasPro = !!entitlement;

      // Debug logging
      if (__DEV__) {
        console.log('[Subscription] Restore complete:');
        console.log('  - RC_ENTITLEMENT_ID:', RC_ENTITLEMENT_ID);
        console.log('  - hasPro:', hasPro);
        console.log('  - entitlement:', entitlement ? 'active' : 'not found');
        console.log('  - All entitlements:', Object.keys(customerInfo?.entitlements?.active || {}));
      }

      if (hasPro) {
        await updateProStatus(true);
        return { success: true, restored: true };
      } else {
        return { success: true, restored: false };
      }
    } catch (error: any) {
      console.error('[Subscription] Restore error:', error);
      return { 
        success: false, 
        restored: false, 
        error: error.message || 'Unable to restore purchases. Please try again.' 
      };
    }
  }, [updateProStatus]);

  // Set up RevenueCat listener for real-time updates
  useEffect(() => {
    if (Platform.OS === 'web' || isExpoGo()) return;

    const setupListener = () => {
      const Purchases = getRevenueCatInstance();
      if (!Purchases || !isRevenueCatInitialized()) return;

      try {
        const listener = Purchases.addCustomerInfoUpdateListener((customerInfo: any) => {
          const entitlement = customerInfo?.entitlements?.active?.[RC_ENTITLEMENT_ID];
          const hasPro = !!entitlement;
          
          if (__DEV__) {
            console.log('[Subscription] Customer info updated:');
            console.log('  - RC_ENTITLEMENT_ID:', RC_ENTITLEMENT_ID);
            console.log('  - hasPro:', hasPro);
            console.log('  - All entitlements:', Object.keys(customerInfo?.entitlements?.active || {}));
          }
          
          updateProStatus(hasPro);
        });

        return () => {
          if (listener && typeof listener.remove === 'function') {
            listener.remove();
          }
        };
      } catch (error) {
        console.warn('[Subscription] Error setting up listener:', error);
      }
    };

    // Delay to ensure RevenueCat is ready
    const timer = setTimeout(setupListener, 1000);
    return () => clearTimeout(timer);
  }, [updateProStatus]);

  const value = useMemo(() => ({
    isPro,
    isLoading,
    isLoadingPro: isLoading, // Alias for consistency
    refreshCustomerInfo,
    refreshProStatus: refreshCustomerInfo, // Alias for consistency
    handlePurchase,
    handleRestore,
    lastRefreshError,
  }), [isPro, isLoading, refreshCustomerInfo, handlePurchase, handleRestore, lastRefreshError]);

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}

