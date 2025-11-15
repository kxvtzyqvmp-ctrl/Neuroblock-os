import { Platform } from 'react-native';

let ScreenTimeManager: any = null;
let InstalledAppsManager: any = null;

if (Platform.OS === 'ios') {
  try {
    const { requireNativeModule } = require('expo-modules-core');
    ScreenTimeManager = requireNativeModule('ScreenTimeManager');
  } catch (error) {
    console.warn('[ScreenTime] Native module not available, using mock');
  }
}

if (Platform.OS === 'android') {
  try {
    const { requireNativeModule } = require('expo-modules-core');
    InstalledAppsManager = requireNativeModule('InstalledAppsManager');
  } catch (error) {
    console.warn('[InstalledApps] Native module not available, using mock');
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

/**
 * Get all installed applications (Android only)
 * Requires QUERY_ALL_PACKAGES permission
 */
export async function getInstalledApplications(): Promise<any[]> {
  if (Platform.OS === 'web' || Platform.OS === 'ios') {
    console.log('[InstalledApps] Not available on this platform');
    return [];
  }

  if (!InstalledAppsManager) {
    console.warn('[InstalledApps] Native module not available, using mock');
    return [];
  }

  try {
    const apps = await InstalledAppsManager.getInstalledApps();
    return apps || [];
  } catch (error) {
    console.error('[InstalledApps] Error getting installed apps:', error);
    return [];
  }
}

/**
 * Check if we have permission to query packages (Android)
 */
export async function checkPackageQueryPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') {
    return true; // iOS/web don't need this permission
  }

  if (!InstalledAppsManager) {
    return false;
  }

  try {
    return await InstalledAppsManager.checkPermission();
  } catch (error) {
    console.error('[InstalledApps] Error checking permission:', error);
    return false;
  }
}

/**
 * Request permission to query packages (Android)
 */
export async function requestPackageQueryPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') {
    return true; // iOS/web don't need this permission
  }

  if (!InstalledAppsManager) {
    return false;
  }

  try {
    return await InstalledAppsManager.requestPermission();
  } catch (error) {
    console.error('[InstalledApps] Error requesting permission:', error);
    return false;
  }
}

/**
 * Get the currently active foreground app (Android only)
 */
export async function getForegroundApp(): Promise<string | null> {
  if (Platform.OS !== 'android') {
    return null; // iOS/web can't detect foreground app
  }

  if (!InstalledAppsManager) {
    return null;
  }

  try {
    return await InstalledAppsManager.getForegroundApp();
  } catch (error) {
    console.error('[InstalledApps] Error getting foreground app:', error);
    return null;
  }
}
