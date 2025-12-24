/**
 * useProStatus Hook
 * 
 * Simple hook that exposes the pro status from SubscriptionContext.
 * This is a convenience wrapper for components that only need to check isPro.
 * 
 * For purchase/restore operations, use useSubscription() directly.
 */

import { useSubscription } from '@/contexts/SubscriptionContext';

interface ProStatus {
  hasPro: boolean;
  isPro: boolean; // Alias for hasPro
  isLoading: boolean;
  isLoadingPro: boolean; // Alias for isLoading
  refresh: () => Promise<void>;
  refreshProStatus: () => Promise<void>; // Alias for refresh
}

export function useProStatus(): ProStatus {
  const { isPro, isLoading, isLoadingPro, refreshCustomerInfo, refreshProStatus } = useSubscription();

  return {
    hasPro: isPro,
    isPro, // Alias for consistency
    isLoading,
    isLoadingPro,
    refresh: refreshCustomerInfo,
    refreshProStatus, // Alias for consistency
  };
}
