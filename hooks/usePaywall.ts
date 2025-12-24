/**
 * usePaywall Hook
 * 
 * Manages paywall display and feature access based on subscription status.
 * Uses the central SubscriptionContext for pro status.
 */

import { useState, useCallback } from 'react';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { SUBSCRIPTION_PLANS } from '@/types/subscription';

interface PaywallConfig {
  feature?: string;
  message?: string;
  requiresPro?: boolean;
}

export function usePaywall() {
  const { isPro, isLoading } = useSubscription();
  const [showPaywall, setShowPaywall] = useState(false);
  const [paywallConfig, setPaywallConfig] = useState<PaywallConfig>({});

  // Check if user has access to a feature
  const checkAccess = useCallback((config: PaywallConfig = {}): boolean => {
    const requiresPro = config.requiresPro ?? true;

    // If feature doesn't require pro, allow access
    if (!requiresPro) {
      return true;
    }

    // If still loading, temporarily deny (will be rechecked)
    if (isLoading) {
      return false;
    }

    // If user has pro, allow access
    if (isPro) {
      return true;
    }

    // Show paywall and deny access
    setPaywallConfig(config);
    setShowPaywall(true);
    return false;
  }, [isPro, isLoading]);

  // Close paywall
  const closePaywall = useCallback(() => {
    setShowPaywall(false);
    setPaywallConfig({});
  }, []);

  // Feature-specific access checks
  const canAccessAI = useCallback((): boolean => {
    return checkAccess({
      feature: 'AI Coach & Insights',
      message: 'Get personalized AI-powered insights and coaching to build better digital habits.',
      requiresPro: !SUBSCRIPTION_PLANS.FREE.limitations.aiInsights,
    });
  }, [checkAccess]);

  const canAccessFamily = useCallback((): boolean => {
    return checkAccess({
      feature: 'Family Linking',
      message: 'Connect with family members and support each other\'s digital wellbeing journey.',
      requiresPro: !SUBSCRIPTION_PLANS.FREE.limitations.familyLinking,
    });
  }, [checkAccess]);

  const canAccessCustomSchedules = useCallback((): boolean => {
    return checkAccess({
      feature: 'Custom Schedules',
      message: 'Create custom detox schedules tailored to your daily routine and goals.',
      requiresPro: !SUBSCRIPTION_PLANS.FREE.limitations.customSchedules,
    });
  }, [checkAccess]);

  // Check if user can block additional apps
  const canBlockApp = useCallback((currentBlockedCount: number): boolean => {
    const maxBlocks = SUBSCRIPTION_PLANS.FREE.limitations.maxAppBlocks;

    // Pro users have unlimited blocks
    if (isPro) {
      return true;
    }

    // Check if maxBlocks is -1 (unlimited) - convert to number for comparison
    const maxBlocksNum = Number(maxBlocks);
    if (maxBlocksNum === -1) {
      return true;
    }

    // Check if within free tier limit
    if (currentBlockedCount < maxBlocks) {
      return true;
    }

    // Show paywall for exceeding limit
    return checkAccess({
      feature: 'Unlimited App Blocks',
      message: `Free plan allows blocking up to ${maxBlocks} apps. Upgrade to Premium for unlimited app blocks.`,
      requiresPro: true,
    });
  }, [isPro, checkAccess]);

  // Check remaining free blocks
  const getRemainingFreeBlocks = useCallback((currentBlockedCount: number): number => {
    if (isPro) return -1; // Unlimited
    const maxBlocks = SUBSCRIPTION_PLANS.FREE.limitations.maxAppBlocks;
    return Math.max(0, maxBlocks - currentBlockedCount);
  }, [isPro]);

  return {
    // Pro status
    isPro,
    hasPro: isPro, // Alias for backwards compatibility
    isLoading,

    // Paywall state
    showPaywall,
    paywallConfig,

    // Actions
    checkAccess,
    closePaywall,

    // Feature checks
    canAccessAI,
    canAccessFamily,
    canAccessCustomSchedules,
    canBlockApp,
    getRemainingFreeBlocks,
  };
}
