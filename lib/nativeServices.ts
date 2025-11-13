/**
 * Native Services Abstraction Layer
 *
 * This module provides a clean interface for iOS and Android blocking services.
 * Currently implements MOCK services for testing and development.
 *
 * PRODUCTION: Replace mock implementations with actual native modules:
 * - iOS: FamilyControls, ManagedSettings, DeviceActivity frameworks
 * - Android: AccessibilityService, UsageStatsManager, VPNService
 */

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PermissionStatus } from '@/types/models';

const MOCK_PERMISSIONS_KEY = '@nativeServices:mockPermissions';
const MOCK_BLOCKED_APPS_KEY = '@nativeServices:mockBlockedApps';

// ============================================================================
// iOS SERVICES
// ============================================================================

export interface IOSBlockingService {
  requestAuthorization(): Promise<boolean>;
  checkAuthorization(): Promise<'granted' | 'denied' | 'not_determined'>;
  setShieldApplications(bundleIds: string[]): Promise<boolean>;
  setShieldCategories(categories: string[]): Promise<boolean>;
  setShieldWebDomains(domains: string[]): Promise<boolean>;
  removeAllShields(): Promise<boolean>;
  startDeviceActivityMonitoring(scheduleId: string, config: DeviceActivityConfig): Promise<boolean>;
  stopDeviceActivityMonitoring(scheduleId: string): Promise<boolean>;
}

export interface DeviceActivityConfig {
  bundleIds: string[];
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  daysOfWeek: number[];
  dailyCapMinutes?: number;
  sessionCapMinutes?: number;
}

class MockIOSBlockingService implements IOSBlockingService {
  async requestAuthorization(): Promise<boolean> {
    console.log('[MOCK] iOS: Requesting FamilyControls authorization');
    // Simulate user approval
    await new Promise((resolve) => setTimeout(resolve, 500));
    await this.setMockPermission('familyControls', 'granted');
    return true;
  }

  async checkAuthorization(): Promise<'granted' | 'denied' | 'not_determined'> {
    const perms = await this.getMockPermissions();
    return perms.ios.familyControls;
  }

  async setShieldApplications(bundleIds: string[]): Promise<boolean> {
    console.log('[MOCK] iOS: Setting shield for apps', bundleIds);
    await AsyncStorage.setItem(MOCK_BLOCKED_APPS_KEY, JSON.stringify(bundleIds));
    return true;
  }

  async setShieldCategories(categories: string[]): Promise<boolean> {
    console.log('[MOCK] iOS: Setting shield for categories', categories);
    return true;
  }

  async setShieldWebDomains(domains: string[]): Promise<boolean> {
    console.log('[MOCK] iOS: Setting shield for web domains', domains);
    return true;
  }

  async removeAllShields(): Promise<boolean> {
    console.log('[MOCK] iOS: Removing all shields');
    await AsyncStorage.removeItem(MOCK_BLOCKED_APPS_KEY);
    return true;
  }

  async startDeviceActivityMonitoring(scheduleId: string, config: DeviceActivityConfig): Promise<boolean> {
    console.log('[MOCK] iOS: Starting DeviceActivity monitoring', { scheduleId, config });
    return true;
  }

  async stopDeviceActivityMonitoring(scheduleId: string): Promise<boolean> {
    console.log('[MOCK] iOS: Stopping DeviceActivity monitoring', scheduleId);
    return true;
  }

  private async getMockPermissions(): Promise<PermissionStatus> {
    const saved = await AsyncStorage.getItem(MOCK_PERMISSIONS_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (error) {
        console.error('[MOCK] Failed to parse saved permissions, using defaults', error);
      }
    }

    const defaults: PermissionStatus = {
      ios: {
        familyControls: 'not_determined',
        notifications: 'not_determined',
        screenTime: 'not_determined',
      },
      android: {
        usageAccess: false,
        accessibilityService: false,
        drawOverApps: false,
        notificationListener: false,
        deviceAdmin: false,
        vpnService: false,
        batteryOptimization: false,
      },
      lastChecked: new Date().toISOString(),
    };
    return defaults;
  }

  private async setMockPermission(key: keyof PermissionStatus['ios'], value: any): Promise<void> {
    const perms = await this.getMockPermissions();
    perms.ios[key] = value;
    perms.lastChecked = new Date().toISOString();
    await AsyncStorage.setItem(MOCK_PERMISSIONS_KEY, JSON.stringify(perms));
  }
}

// ============================================================================
// ANDROID SERVICES
// ============================================================================

export interface AndroidBlockingService {
  requestUsageAccess(): Promise<boolean>;
  checkUsageAccess(): Promise<boolean>;
  requestAccessibilityService(): Promise<boolean>;
  checkAccessibilityService(): Promise<boolean>;
  requestDrawOverApps(): Promise<boolean>;
  checkDrawOverApps(): Promise<boolean>;
  requestNotificationListener(): Promise<boolean>;
  checkNotificationListener(): Promise<boolean>;
  requestDeviceAdmin(): Promise<boolean>;
  checkDeviceAdmin(): Promise<boolean>;
  startVPNService(domains: string[]): Promise<boolean>;
  stopVPNService(): Promise<boolean>;
  showBlockOverlay(appPackage: string, message: string, durationSec: number): Promise<void>;
  hideBlockOverlay(): Promise<void>;
  getAppUsageStats(packageName: string, startTime: number, endTime: number): Promise<UsageStats>;
  requestBatteryOptimizationExemption(): Promise<boolean>;
}

export interface UsageStats {
  totalTimeMs: number;
  firstTimeStamp: number;
  lastTimeStamp: number;
  lastTimeUsed: number;
}

class MockAndroidBlockingService implements AndroidBlockingService {
  async requestUsageAccess(): Promise<boolean> {
    console.log('[MOCK] Android: Requesting Usage Access');
    await new Promise((resolve) => setTimeout(resolve, 500));
    await this.setMockPermission('usageAccess', true);
    return true;
  }

  async checkUsageAccess(): Promise<boolean> {
    const perms = await this.getMockPermissions();
    return perms.android.usageAccess;
  }

  async requestAccessibilityService(): Promise<boolean> {
    console.log('[MOCK] Android: Requesting Accessibility Service');
    await new Promise((resolve) => setTimeout(resolve, 500));
    await this.setMockPermission('accessibilityService', true);
    return true;
  }

  async checkAccessibilityService(): Promise<boolean> {
    const perms = await this.getMockPermissions();
    return perms.android.accessibilityService;
  }

  async requestDrawOverApps(): Promise<boolean> {
    console.log('[MOCK] Android: Requesting Draw Over Apps');
    await new Promise((resolve) => setTimeout(resolve, 500));
    await this.setMockPermission('drawOverApps', true);
    return true;
  }

  async checkDrawOverApps(): Promise<boolean> {
    const perms = await this.getMockPermissions();
    return perms.android.drawOverApps;
  }

  async requestNotificationListener(): Promise<boolean> {
    console.log('[MOCK] Android: Requesting Notification Listener');
    await new Promise((resolve) => setTimeout(resolve, 500));
    await this.setMockPermission('notificationListener', true);
    return true;
  }

  async checkNotificationListener(): Promise<boolean> {
    const perms = await this.getMockPermissions();
    return perms.android.notificationListener;
  }

  async requestDeviceAdmin(): Promise<boolean> {
    console.log('[MOCK] Android: Requesting Device Admin');
    await new Promise((resolve) => setTimeout(resolve, 500));
    await this.setMockPermission('deviceAdmin', true);
    return true;
  }

  async checkDeviceAdmin(): Promise<boolean> {
    const perms = await this.getMockPermissions();
    return perms.android.deviceAdmin;
  }

  async startVPNService(domains: string[]): Promise<boolean> {
    console.log('[MOCK] Android: Starting VPN service for domains', domains);
    await this.setMockPermission('vpnService', true);
    return true;
  }

  async stopVPNService(): Promise<boolean> {
    console.log('[MOCK] Android: Stopping VPN service');
    await this.setMockPermission('vpnService', false);
    return true;
  }

  async showBlockOverlay(appPackage: string, message: string, durationSec: number): Promise<void> {
    console.log('[MOCK] Android: Showing block overlay', { appPackage, message, durationSec });
    // In production, this would launch a full-screen activity
  }

  async hideBlockOverlay(): Promise<void> {
    console.log('[MOCK] Android: Hiding block overlay');
  }

  async getAppUsageStats(packageName: string, startTime: number, endTime: number): Promise<UsageStats> {
    console.log('[MOCK] Android: Getting usage stats', { packageName, startTime, endTime });
    // Return mock data
    return {
      totalTimeMs: Math.random() * 3600000, // Random up to 1 hour
      firstTimeStamp: startTime,
      lastTimeStamp: endTime,
      lastTimeUsed: Date.now(),
    };
  }

  async requestBatteryOptimizationExemption(): Promise<boolean> {
    console.log('[MOCK] Android: Requesting battery optimization exemption');
    await this.setMockPermission('batteryOptimization', true);
    return true;
  }

  private async getMockPermissions(): Promise<PermissionStatus> {
    const saved = await AsyncStorage.getItem(MOCK_PERMISSIONS_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (error) {
        console.error('[MOCK] Failed to parse saved permissions, using defaults', error);
      }
    }

    const defaults: PermissionStatus = {
      ios: {
        familyControls: 'not_determined',
        notifications: 'not_determined',
        screenTime: 'not_determined',
      },
      android: {
        usageAccess: false,
        accessibilityService: false,
        drawOverApps: false,
        notificationListener: false,
        deviceAdmin: false,
        vpnService: false,
        batteryOptimization: false,
      },
      lastChecked: new Date().toISOString(),
    };
    return defaults;
  }

  private async setMockPermission(key: keyof PermissionStatus['android'], value: boolean): Promise<void> {
    const perms = await this.getMockPermissions();
    perms.android[key] = value;
    perms.lastChecked = new Date().toISOString();
    await AsyncStorage.setItem(MOCK_PERMISSIONS_KEY, JSON.stringify(perms));
  }
}

// ============================================================================
// UNIFIED PERMISSIONS MANAGER
// ============================================================================

export class PermissionsManager {
  private static instance: PermissionsManager;
  private iosService: IOSBlockingService;
  private androidService: AndroidBlockingService;

  private constructor() {
    // Initialize with mock services
    // In production, replace with: new NativeIOSBlockingService() / new NativeAndroidBlockingService()
    this.iosService = new MockIOSBlockingService();
    this.androidService = new MockAndroidBlockingService();
  }

  static getInstance(): PermissionsManager {
    if (!PermissionsManager.instance) {
      PermissionsManager.instance = new PermissionsManager();
    }
    return PermissionsManager.instance;
  }

  /**
   * Check all permissions and return current status
   */
  async checkAllPermissions(): Promise<PermissionStatus> {
    if (Platform.OS === 'ios') {
      const familyControls = await this.iosService.checkAuthorization();
      return {
        ios: {
          familyControls,
          notifications: 'granted', // Placeholder
          screenTime: familyControls,
        },
        android: {
          usageAccess: false,
          accessibilityService: false,
          drawOverApps: false,
          notificationListener: false,
          deviceAdmin: false,
          vpnService: false,
          batteryOptimization: false,
        },
        lastChecked: new Date().toISOString(),
      };
    } else {
      const usageAccess = await this.androidService.checkUsageAccess();
      const accessibilityService = await this.androidService.checkAccessibilityService();
      const drawOverApps = await this.androidService.checkDrawOverApps();
      const notificationListener = await this.androidService.checkNotificationListener();
      const deviceAdmin = await this.androidService.checkDeviceAdmin();
      const batteryOptimization = true; // Placeholder

      return {
        ios: {
          familyControls: 'not_determined',
          notifications: 'not_determined',
          screenTime: 'not_determined',
        },
        android: {
          usageAccess,
          accessibilityService,
          drawOverApps,
          notificationListener,
          deviceAdmin,
          vpnService: false,
          batteryOptimization,
        },
        lastChecked: new Date().toISOString(),
      };
    }
  }

  /**
   * Request all required permissions
   */
  async requestAllPermissions(): Promise<PermissionStatus> {
    if (Platform.OS === 'ios') {
      await this.iosService.requestAuthorization();
    } else {
      await this.androidService.requestUsageAccess();
      await this.androidService.requestAccessibilityService();
      await this.androidService.requestDrawOverApps();
      await this.androidService.requestNotificationListener();
      await this.androidService.requestBatteryOptimizationExemption();
    }

    return await this.checkAllPermissions();
  }

  /**
   * Get the appropriate service for current platform
   */
  getIOSService(): IOSBlockingService {
    return this.iosService;
  }

  getAndroidService(): AndroidBlockingService {
    return this.androidService;
  }
}

// Export singleton
export const permissionsManager = PermissionsManager.getInstance();

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Check if all critical permissions are granted
 */
export async function hasAllRequiredPermissions(): Promise<boolean> {
  const status = await permissionsManager.checkAllPermissions();

  if (Platform.OS === 'ios') {
    return status.ios.familyControls === 'granted';
  } else {
    return (
      status.android.usageAccess &&
      status.android.accessibilityService &&
      status.android.drawOverApps
    );
  }
}

/**
 * Get list of missing permissions with user-friendly names
 */
export async function getMissingPermissions(): Promise<Array<{ key: string; name: string; critical: boolean }>> {
  const status = await permissionsManager.checkAllPermissions();
  const missing: Array<{ key: string; name: string; critical: boolean }> = [];

  if (Platform.OS === 'ios') {
    if (status.ios.familyControls !== 'granted') {
      missing.push({
        key: 'familyControls',
        name: 'Screen Time & Family Controls',
        critical: true,
      });
    }
  } else {
    if (!status.android.usageAccess) {
      missing.push({ key: 'usageAccess', name: 'Usage Access', critical: true });
    }
    if (!status.android.accessibilityService) {
      missing.push({ key: 'accessibilityService', name: 'Accessibility Service', critical: true });
    }
    if (!status.android.drawOverApps) {
      missing.push({ key: 'drawOverApps', name: 'Display Over Other Apps', critical: true });
    }
    if (!status.android.notificationListener) {
      missing.push({ key: 'notificationListener', name: 'Notification Access', critical: false });
    }
    if (!status.android.batteryOptimization) {
      missing.push({ key: 'batteryOptimization', name: 'Battery Optimization Exemption', critical: false });
    }
  }

  return missing;
}
