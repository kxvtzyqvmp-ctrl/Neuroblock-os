import { Platform } from 'react-native';
import Constants from 'expo-constants';

let Purchases: any = null;
let isInitialized = false;
let initializationPromise: Promise<void> | null = null;

// RevenueCat API Keys
// IMPORTANT: RevenueCat uses the SAME API key for both sandbox and production.
// RevenueCat automatically handles environment detection based on receipt type.
// This is the PRODUCTION iOS API key - it works for TestFlight and App Store builds.
// For iOS: https://app.revenuecat.com -> Your Project -> API Keys -> Public Apple App Store API Key
// For Android: https://app.revenuecat.com -> Your Project -> API Keys -> Public Google Play API Key
const REVENUECAT_API_KEY_IOS = 'appl_LEjdqEXUNzsAwSXHMACpsANlRIS';
// const REVENUECAT_API_KEY_ANDROID = 'goog_YOUR_ANDROID_KEY';

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
      console.log('[RevenueCat] Platform:', Platform.OS);
      
      // Get bundle identifier for logging
      const bundleId = Platform.OS === 'ios' 
        ? Constants.expoConfig?.ios?.bundleIdentifier || 'unknown'
        : Constants.expoConfig?.android?.package || 'unknown';
      
      console.log('[RevenueCat Init] Bundle ID:', bundleId);
      
      const PurchasesModule = require('react-native-purchases');
      Purchases = PurchasesModule.default;

      // Select API key based on platform
      // NOTE: RevenueCat uses the SAME key for sandbox and production.
      // RevenueCat automatically detects the environment from the receipt.
      const apiKey = Platform.select({
        ios: REVENUECAT_API_KEY_IOS,
        android: undefined, // Android key commented out for now (iOS only testing)
      });
      
      if (!apiKey) {
        console.warn('[RevenueCat] ⚠️  No API key available for platform:', Platform.OS);
        throw new Error(`RevenueCat API key not configured for ${Platform.OS}`);
      }
      
      // Log API key status (without exposing full key)
      if (apiKey.includes('YOUR_') || apiKey.includes('HERE')) {
        console.warn('[RevenueCat] ⚠️  API key not configured! Please set REVENUECAT_API_KEY_IOS and REVENUECAT_API_KEY_ANDROID in lib/revenuecatInit.ts');
      } else {
        // Log which key type we're using (same key works for both sandbox and production)
        const keyType = 'PRODUCTION'; // RevenueCat key works for both, but we log as PRODUCTION for clarity
        console.log('[RevenueCat Init] Using', keyType, 'iOS key for bundle:', bundleId);
        console.log('[RevenueCat] API key configured:', `${apiKey.substring(0, 10)}...`);
      }

      Purchases.configure({ apiKey });
      
      // Log configuration success
      console.log('[RevenueCat] ✅ Configured successfully');
      
      // Fetch offerings to verify connection
      try {
        const offerings = await Purchases.getOfferings();
        console.log('[RevenueCat] ✅ Offerings fetch successful');
        console.log('[RevenueCat] Current offering:', offerings.current?.identifier || 'None');
        console.log('[RevenueCat] Available packages:', offerings.current?.availablePackages.length || 0);
        
        // Log product identifiers for debugging
        if (offerings.current?.availablePackages && offerings.current.availablePackages.length > 0) {
          const productIds = offerings.current.availablePackages.map((pkg: any) => pkg.product.identifier);
          console.log('[RevenueCat] Offerings current packages:', productIds.join(', '));
        } else {
          console.warn('[RevenueCat] ⚠️  No packages found in current offering');
        }
      } catch (offeringsError) {
        console.warn('[RevenueCat] ⚠️  Could not fetch offerings (may be OK if no offerings configured):', offeringsError);
      }
      
      isInitialized = true;
      console.log('[RevenueCat] ✅ Initialization complete');
    } catch (error) {
      console.warn('[RevenueCat] ❌ Initialization failed (this is OK in Expo Go or development):', error);
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
