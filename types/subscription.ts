export const SUBSCRIPTION_PLANS = {
  FREE: {
    id: 'free',
    name: 'Free Plan',
    price: 0,
    billingCycle: null,
    features: [
      '7 app blocks',
      'Daily detox timer',
      'Manual focus sessions',
      'Basic insights',
    ] as string[],
    limitations: {
      maxAppBlocks: 3,
      aiInsights: false,
      familyLinking: false,
      customSchedules: false,
    },
  },
  MONTHLY: {
    id: 'monthly',
    name: 'Premium Monthly',
    price: 4.99,
    billingCycle: 'monthly' as const,
    features: [
      'Unlimited app blocks',
      'Website blocking',
      'AI insights & suggestions',
      'Family/child linking',
      'Custom detox schedules',
      'Priority updates',
    ] as string[],
    limitations: {
      maxAppBlocks: -1,
      aiInsights: true,
      familyLinking: true,
      customSchedules: true,
    },
  },
  YEARLY: {
    id: 'yearly',
    name: 'Premium Yearly',
    price: 29.99,
    billingCycle: 'yearly' as const,
    features: [
      'Unlimited app blocks',
      'Website blocking',
      'AI insights & suggestions',
      'Family/child linking',
      'Custom detox schedules',
      'Priority updates',
      'Best value - Save 50%',
    ] as string[],
    limitations: {
      maxAppBlocks: -1,
      aiInsights: true,
      familyLinking: true,
      customSchedules: true,
    },
    badge: 'Best Value',
  },
  LIFETIME: {
    id: 'lifetime',
    name: 'Lifetime Premium',
    price: 49.99,
    billingCycle: 'lifetime' as const,
    features: [
      'Unlimited app blocks',
      'Website blocking',
      'AI insights & suggestions',
      'Family/child linking',
      'Custom detox schedules',
      'Priority updates',
      'All future features',
      'One-time payment',
    ] as string[],
    limitations: {
      maxAppBlocks: -1,
      aiInsights: true,
      familyLinking: true,
      customSchedules: true,
    },
    badge: 'Early Supporter',
  },
} as const;

export type PlanId = keyof typeof SUBSCRIPTION_PLANS;
export type BillingCycle = 'monthly' | 'yearly' | 'lifetime';
