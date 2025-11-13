import { Platform } from 'react-native';

let ScreenTimeManager: any = null;

if (Platform.OS === 'ios') {
  try {
    const { requireNativeModule } = require('expo-modules-core');
    ScreenTimeManager = requireNativeModule('ScreenTimeManager');
  } catch (error) {
    console.warn('[ScreenTime] Native module not available, using mock');
  }
}

export async function requestScreenTimeAuth(): Promise<boolean> {
  if (Platform.OS === 'web') {
    console.log('[ScreenTime] Mock: Authorization requested on web');
    return true;
  }

  if (!ScreenTimeManager) {
    console.warn('[ScreenTime] Native module not available');
    return false;
  }

  return await ScreenTimeManager.requestAuthorization();
}

export function blockApps(bundleIds: string[]): void {
  if (Platform.OS === 'web') {
    console.log('[ScreenTime] Mock: Would block apps:', bundleIds);
    return;
  }

  if (!ScreenTimeManager) {
    console.warn('[ScreenTime] Native module not available');
    return;
  }

  ScreenTimeManager.applyShieldForBundleIds(bundleIds);
}

export function clearBlock(): void {
  if (Platform.OS === 'web') {
    console.log('[ScreenTime] Mock: Would clear blocks');
    return;
  }

  if (!ScreenTimeManager) {
    console.warn('[ScreenTime] Native module not available');
    return;
  }

  ScreenTimeManager.clearShield();
}
