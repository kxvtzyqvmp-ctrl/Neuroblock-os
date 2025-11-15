/**
 * App Blocking Service
 * 
 * Simulates app blocking using AppState listeners.
 * Detects when blocked apps are opened during active detox sessions.
 * 
 * This is a simulation layer - in production, this would integrate with
 * native-level access restrictions or digital wellbeing APIs.
 */

import { AppState, AppStateStatus, Platform } from 'react-native';
import { getDetoxSettings, FocusSession } from './localStorage';
import { getAllFocusSessions } from './localStorage';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BLOCKED_APPS_KEY = '@neuroblock:blocked_apps';
const ACTIVE_SESSION_KEY = '@neuroblock:active_blocking_session';

export interface BlockedApp {
  packageName: string;
  appName: string;
}

export interface BlockingSession {
  sessionId: string;
  blockedApps: BlockedApp[];
  startTime: string;
  endTime?: string;
}

export class AppBlockingService {
  private static instance: AppBlockingService;
  private appStateSubscription: { remove: () => void } | null = null;
  private currentForegroundApp: string | null = null;
  private isMonitoring = false;
  private onBlockedAppDetected?: (appName: string, packageName: string) => void;
  private foregroundCheckInterval: ReturnType<typeof setInterval> | null = null;

  static getInstance(): AppBlockingService {
    if (!AppBlockingService.instance) {
      AppBlockingService.instance = new AppBlockingService();
    }
    return AppBlockingService.instance;
  }

  /**
   * Start monitoring for blocked apps during an active detox session
   */
  async startMonitoring(
    onBlocked: (appName: string, packageName: string) => void
  ): Promise<void> {
    if (this.isMonitoring) {
      return;
    }

    this.onBlockedAppDetected = onBlocked;
    this.isMonitoring = true;

    // Check if there's an active focus session
    const allSessions = await getAllFocusSessions();
    const activeSession = Object.values(allSessions).find(
      (s: FocusSession) => s.end_time === null
    );

    if (!activeSession) {
      console.warn('[AppBlocking] No active session, monitoring disabled');
      this.isMonitoring = false;
      return;
    }

    // Get blocked apps from settings
    const settings = await getDetoxSettings();
    if (!settings || !settings.selected_apps || settings.selected_apps.length === 0) {
      console.warn('[AppBlocking] No blocked apps configured');
      this.isMonitoring = false;
      return;
    }

    // Save blocking session
    const blockingSession: BlockingSession = {
      sessionId: activeSession.id,
      blockedApps: settings.selected_apps.map((appName) => ({
        appName,
        packageName: '', // Will be filled by native module if available
      })),
      startTime: new Date().toISOString(),
    };

    await AsyncStorage.setItem(ACTIVE_SESSION_KEY, JSON.stringify(blockingSession));

    // Set up AppState listener
    const appStateListener = async (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        await this.checkForegroundApp();
      }
    };

    this.appStateSubscription = AppState.addEventListener('change', appStateListener);

    // Initial check
    await this.checkForegroundApp();

    // Set up periodic checks (Android can check more frequently)
    if (Platform.OS === 'android') {
      this.foregroundCheckInterval = setInterval(() => {
        if (AppState.currentState === 'active') {
          this.checkForegroundApp();
        }
      }, 2000); // Check every 2 seconds on Android
    }

    console.log('[AppBlocking] Monitoring started');
  }

  /**
   * Stop monitoring for blocked apps
   */
  stopMonitoring(): void {
    if (!this.isMonitoring) {
      return;
    }

    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
      this.appStateSubscription = null;
    }

    if (this.foregroundCheckInterval) {
      clearInterval(this.foregroundCheckInterval);
      this.foregroundCheckInterval = null;
    }

    this.isMonitoring = false;
    this.onBlockedAppDetected = undefined;
    AsyncStorage.removeItem(ACTIVE_SESSION_KEY);

    console.log('[AppBlocking] Monitoring stopped');
  }

  /**
   * Check which app is currently in the foreground
   */
  private async checkForegroundApp(): Promise<void> {
    if (!this.isMonitoring) {
      return;
    }

    try {
      // Get blocking session
      const sessionData = await AsyncStorage.getItem(ACTIVE_SESSION_KEY);
      if (!sessionData) {
        return;
      }

      const session: BlockingSession = JSON.parse(sessionData);
      
      // Try to get foreground app from native module (Android only)
      let foregroundApp: string | null = null;
      
      if (Platform.OS === 'android') {
        try {
          const { getForegroundApp } = require('@/modules/screentime');
          foregroundApp = await getForegroundApp();
        } catch (err) {
          // Native module not available - use fallback
          console.warn('[AppBlocking] Native module not available:', err);
        }
      }

      // For iOS/web, we can't reliably detect foreground app
      // This is a limitation we need to document
      if (Platform.OS === 'ios' || Platform.OS === 'web') {
        // iOS/web can't detect foreground app reliably
        // Show periodic reminders instead
        return;
      }

      if (!foregroundApp) {
        return;
      }

      // Check if foreground app is in blocked list
      const isBlocked = session.blockedApps.some(
        (blocked) =>
          blocked.packageName === foregroundApp ||
          blocked.appName.toLowerCase() === foregroundApp?.toLowerCase()
      );

      if (isBlocked && this.onBlockedAppDetected) {
        const blockedApp = session.blockedApps.find(
          (b) =>
            b.packageName === foregroundApp ||
            b.appName.toLowerCase() === foregroundApp?.toLowerCase()
        );

        if (blockedApp && foregroundApp !== this.currentForegroundApp) {
          this.currentForegroundApp = foregroundApp;
          this.onBlockedAppDetected(blockedApp.appName, blockedApp.packageName);
        }
      } else if (!isBlocked) {
        this.currentForegroundApp = null;
      }
    } catch (error) {
      console.error('[AppBlocking] Error checking foreground app:', error);
    }
  }

  /**
   * Get list of currently blocked apps
   */
  async getBlockedApps(): Promise<BlockedApp[]> {
    try {
      const settings = await getDetoxSettings();
      if (!settings || !settings.selected_apps) {
        return [];
      }

      return settings.selected_apps.map((appName) => ({
        appName,
        packageName: '', // Will be filled if package name is available
      }));
    } catch (error) {
      console.error('[AppBlocking] Error getting blocked apps:', error);
      return [];
    }
  }

  /**
   * Check if a specific app is blocked
   */
  async isAppBlocked(packageName: string, appName: string): Promise<boolean> {
    const blockedApps = await this.getBlockedApps();
    return blockedApps.some(
      (b) =>
        b.packageName === packageName || b.appName.toLowerCase() === appName.toLowerCase()
    );
  }
}

export const appBlockingService = AppBlockingService.getInstance();

