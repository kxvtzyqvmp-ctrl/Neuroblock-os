import { Platform } from 'react-native';

let Purchases: any = null;
let isInitialized = false;
let initializationPromise: Promise<void> | null = null;

const REVENUECAT_API_KEY_IOS = 'appl_YOUR_IOS_KEY_HERE';
const REVENUECAT_API_KEY_ANDROID = 'goog_YOUR_ANDROID_KEY_HERE';

export async function initializeRevenueCat(): Promise<void> {
  if (Platform.OS === 'web') {
    console.log('[RevenueCat] Web platform detected, skipping initialization');
    isInitialized = true;
    return;
  }

  if (isInitialized) {
    console.log('[RevenueCat] Already initialized');
    return;
  }

  if (initializationPromise) {
    console.log('[RevenueCat] Initialization in progress, waiting...');
    return initializationPromise;
  }

  initializationPromise = (async () => {
    try {
      console.log('[RevenueCat] Starting initialization...');
      const PurchasesModule = require('react-native-purchases');
      Purchases = PurchasesModule.default;

      const apiKey = Platform.OS === 'ios' ? REVENUECAT_API_KEY_IOS : REVENUECAT_API_KEY_ANDROID;

      Purchases.configure({ apiKey });
      isInitialized = true;
      console.log('[RevenueCat] Initialized successfully');
    } catch (error) {
      console.warn('[RevenueCat] Initialization failed (this is OK in development):', error);
      isInitialized = true;
    }
  })();

  return initializationPromise;
}

export function isRevenueCatInitialized(): boolean {
  return isInitialized;
}

export function getRevenueCatInstance(): any {
  if (Platform.OS === 'web') {
    return null;
  }

  if (!isInitialized) {
    console.warn('[RevenueCat] Attempted to get instance before initialization');
    return null;
  }

  return Purchases;
}
