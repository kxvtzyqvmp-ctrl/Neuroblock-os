import { Platform } from 'react-native';
import Constants from 'expo-constants';

let Purchases: any = null;
let isInitialized = false;
let initializationPromise: Promise<void> | null = null;

const REVENUECAT_API_KEY_IOS = 'appl_YOUR_IOS_KEY_HERE';
const REVENUECAT_API_KEY_ANDROID = 'goog_YOUR_ANDROID_KEY_HERE';

// Check if running in Expo Go (development client doesn't support RevenueCat)
function isExpoGo(): boolean {
  try {
    return Constants.appOwnership === 'expo' || 
           Constants.executionEnvironment === 'storeClient';
  } catch {
    return false;
  }
}

export async function initializeRevenueCat(): Promise<void> {
  if (Platform.OS === 'web') {
    console.log('[RevenueCat] Web platform detected, skipping initialization');
    isInitialized = true;
    return;
  }

  // Skip initialization in Expo Go (requires development build)
  if (isExpoGo()) {
    console.log('[RevenueCat] Expo Go detected, skipping initialization (requires development build)');
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
      console.warn('[RevenueCat] Initialization failed (this is OK in Expo Go or development):', error);
      // Mark as initialized even on error to prevent retry loops
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
