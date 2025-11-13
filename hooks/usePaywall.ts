import { useState, useCallback } from 'react';
import { useProStatus } from './useProStatus';
import { SUBSCRIPTION_PLANS } from '@/types/subscription';

interface PaywallConfig {
  feature?: string;
  message?: string;
  requiresPro?: boolean;
}

export function usePaywall() {
  const { hasPro, isLoading } = useProStatus();
  const [showPaywall, setShowPaywall] = useState(false);
  const [paywallConfig, setPaywallConfig] = useState<PaywallConfig>({});

  const checkAccess = useCallback((config: PaywallConfig = {}): boolean => {
    const requiresPro = config.requiresPro ?? true;

    if (!requiresPro) {
      return true;
    }

    if (isLoading) {
      return false;
    }

    if (hasPro) {
      return true;
    }

    setPaywallConfig(config);
    setShowPaywall(true);
    return false;
  }, [hasPro, isLoading]);

  const closePaywall = useCallback(() => {
    setShowPaywall(false);
  }, []);

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

  const canBlockApp = useCallback((currentBlockedCount: number): boolean => {
    const maxBlocks: number = SUBSCRIPTION_PLANS.FREE.limitations.maxAppBlocks;

    if (hasPro || maxBlocks === -1) {
      return true;
    }

    if (currentBlockedCount < maxBlocks) {
      return true;
    }

    return checkAccess({
      feature: 'Unlimited App Blocks',
      message: `Free plan allows blocking up to ${maxBlocks} apps. Upgrade to Premium for unlimited app blocks.`,
      requiresPro: true,
    });
  }, [hasPro, checkAccess]);

  return {
    hasPro,
    isLoading,
    showPaywall,
    paywallConfig,
    checkAccess,
    closePaywall,
    canAccessAI,
    canAccessFamily,
    canAccessCustomSchedules,
    canBlockApp,
  };
}
