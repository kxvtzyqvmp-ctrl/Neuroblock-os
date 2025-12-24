/**
 * Blocking Engine - Core State Machine
 *
 * Implements the state machine for app/website blocking with mindful pauses,
 * cooldowns, and override handling.
 *
 * State Flow:
 * IDLE → ELIGIBLE → MINDFUL_PAUSE → ACTIVE_BLOCK → COOLDOWN → IDLE
 *                                  ↓ (override)
 *                              COOLDOWN → IDLE
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';
import {
  BlockingState,
  BlockingEngineState,
  BlockingEvent,
  Plan,
  Schedule,
  AppGroup,
  AppIdentifier,
  WebRule,
} from '@/types/models';

const STORAGE_KEY_ENGINE_STATE = '@blockingEngine:state';
const STORAGE_KEY_TODAY_USAGE = '@blockingEngine:todayUsage';
const STORAGE_KEY_SESSION_USAGE = '@blockingEngine:sessionUsage';

/**
 * Main Blocking Engine Class
 */
export class BlockingEngine {
  private static instance: BlockingEngine;
  private state: BlockingEngineState;
  private activePlan: Plan | null = null;
  private stateChangeListeners: Array<(state: BlockingEngineState) => void> = [];

  private constructor() {
    this.state = this.getInitialState();
  }

  static getInstance(): BlockingEngine {
    if (!BlockingEngine.instance) {
      BlockingEngine.instance = new BlockingEngine();
    }
    return BlockingEngine.instance;
  }

  /**
   * Initialize the engine - load persisted state and active plan
   */
  async initialize(userId: string | null): Promise<void> {
    try {
      // Load persisted state
      const savedState = await AsyncStorage.getItem(STORAGE_KEY_ENGINE_STATE);
      if (savedState) {
        try {
          this.state = JSON.parse(savedState);
        } catch (parseError) {
          console.error('BlockingEngine: Failed to parse saved state, using defaults', parseError);
          this.state = this.getInitialState();
        }
      }

      // Load active plan
      if (userId) {
        await this.loadActivePlan(userId);
      }

      // Check if we need to transition states
      await this.tick();

      // Start background ticker
      this.startTicker();
    } catch (error) {
      console.error('BlockingEngine: Failed to initialize', error);
    }
  }

  /**
   * Load the user's active plan from database
   */
  private async loadActivePlan(userId: string): Promise<void> {
    try {
      const { data: plans } = await supabase
        .from('plans')
        .select(`
          *,
          schedules(*),
          app_groups(*, app_group_apps(*, app_identifiers(*))),
          web_rules(*)
        `)
        .eq('user_id', userId)
        .eq('is_active', true)
        .maybeSingle();

      if (plans) {
        this.activePlan = plans as any; // Type assertion for complex joined data
      }
    } catch (error) {
      console.error('BlockingEngine: Failed to load active plan', error);
    }
  }

  /**
   * Check if a specific app should be blocked right now
   */
  async shouldBlockApp(appId: string, bundleId: string): Promise<{
    shouldBlock: boolean;
    reason: string | null;
    state: BlockingState;
    waitSeconds: number;
  }> {
    if (!this.activePlan) {
      return { shouldBlock: false, reason: null, state: 'IDLE', waitSeconds: 0 };
    }

    // Check if Quick Disable is active
    if (this.state.quickDisableUntil && Date.now() < this.state.quickDisableUntil) {
      return { shouldBlock: false, reason: 'Quick Disable active', state: 'QUICK_DISABLED', waitSeconds: 0 };
    }

    // Check if we're in an active schedule
    const activeSchedule = this.getActiveSchedule();
    if (!activeSchedule) {
      return { shouldBlock: false, reason: 'Outside active schedule', state: 'IDLE', waitSeconds: 0 };
    }

    // Check if app is in a blocked group
    const appGroup = this.findAppGroupForApp(bundleId);
    if (!appGroup) {
      return { shouldBlock: false, reason: 'App not in any group', state: 'IDLE', waitSeconds: 0 };
    }

    // Check daily cap
    const todayUsage = await this.getTodayUsage(appId);
    if (appGroup.dailyCapMin && todayUsage >= appGroup.dailyCapMin) {
      return {
        shouldBlock: true,
        reason: `Daily limit of ${appGroup.dailyCapMin} minutes reached`,
        state: 'ACTIVE_BLOCK',
        waitSeconds: 0,
      };
    }

    // Check session cap
    const sessionUsage = await this.getSessionUsage(appId);
    if (appGroup.sessionCapMin && sessionUsage >= appGroup.sessionCapMin) {
      return {
        shouldBlock: true,
        reason: `Session limit of ${appGroup.sessionCapMin} minutes reached`,
        state: 'ACTIVE_BLOCK',
        waitSeconds: 0,
      };
    }

    // App is eligible for blocking - show mindful pause
    if (this.state.currentState === 'IDLE' || this.state.currentState === 'ELIGIBLE') {
      await this.transitionTo('MINDFUL_PAUSE', appId, bundleId);
      return {
        shouldBlock: true,
        reason: 'Mindful pause',
        state: 'MINDFUL_PAUSE',
        waitSeconds: this.activePlan.mindfulPauseSec,
      };
    }

    // Default to not blocking
    return { shouldBlock: false, reason: null, state: this.state.currentState, waitSeconds: 0 };
  }

  /**
   * User attempts to override a block
   */
  async requestOverride(appId: string, bundleId: string): Promise<{
    granted: boolean;
    reason: string;
  }> {
    if (!this.activePlan) {
      return { granted: false, reason: 'No active plan' };
    }

    // Check if overrides are allowed
    if (!this.activePlan.allowOverride) {
      return { granted: false, reason: 'Overrides are disabled' };
    }

    // Check if app is in strict mode
    const appGroup = this.findAppGroupForApp(bundleId);
    if (appGroup?.strict) {
      return { granted: false, reason: 'App is in strict mode - no overrides allowed' };
    }

    // Grant override and start cooldown
    await this.transitionTo('COOLDOWN', appId, bundleId);
    await this.logEvent('override_used', appId, null);

    return { granted: true, reason: 'Override granted' };
  }

  /**
   * Activate Quick Disable for N minutes
   */
  async activateQuickDisable(durationMin: number): Promise<boolean> {
    if (!this.activePlan) return false;

    // Check if any strict groups exist
    const hasStrictGroups = this.activePlan.groups?.some((g) => g.strict);
    if (hasStrictGroups && this.activePlan.intensity === 'strict') {
      return false; // Can't quick disable in strict mode
    }

    const disableUntil = Date.now() + durationMin * 60 * 1000;
    this.state.quickDisableUntil = disableUntil;
    this.state.currentState = 'QUICK_DISABLED';
    await this.persistState();
    this.notifyListeners();

    await this.logEvent('schedule_activated', null, null, {
      action: 'quick_disable',
      durationMin,
    });

    return true;
  }

  /**
   * Deactivate Quick Disable early
   */
  async deactivateQuickDisable(): Promise<void> {
    this.state.quickDisableUntil = null;
    this.state.currentState = 'IDLE';
    await this.persistState();
    this.notifyListeners();
  }

  /**
   * Get current engine state (for diagnostics)
   */
  getState(): BlockingEngineState {
    return { ...this.state };
  }

  /**
   * Get active plan
   */
  getActivePlan(): Plan | null {
    return this.activePlan;
  }

  /**
   * Subscribe to state changes
   */
  onStateChange(callback: (state: BlockingEngineState) => void): () => void {
    this.stateChangeListeners.push(callback);
    return () => {
      const index = this.stateChangeListeners.indexOf(callback);
      if (index > -1) {
        this.stateChangeListeners.splice(index, 1);
      }
    };
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  private getInitialState(): BlockingEngineState {
    return {
      currentState: 'IDLE',
      targetApp: null,
      targetDomain: null,
      pauseStartTime: null,
      blockStartTime: null,
      cooldownStartTime: null,
      quickDisableUntil: null,
      activeSchedule: null,
      todayUsage: new Map(),
      sessionUsage: new Map(),
      lastTransition: new Date().toISOString(),
      events: [],
    };
  }

  private async transitionTo(
    newState: BlockingState,
    appId?: string | null,
    bundleId?: string | null
  ): Promise<void> {
    const previousState = this.state.currentState;
    this.state.currentState = newState;
    this.state.lastTransition = new Date().toISOString();

    // Update timestamps based on state
    switch (newState) {
      case 'MINDFUL_PAUSE':
        this.state.pauseStartTime = Date.now();
        break;
      case 'ACTIVE_BLOCK':
        this.state.blockStartTime = Date.now();
        break;
      case 'COOLDOWN':
        this.state.cooldownStartTime = Date.now();
        break;
      case 'IDLE':
        this.state.pauseStartTime = null;
        this.state.blockStartTime = null;
        this.state.cooldownStartTime = null;
        this.state.targetApp = null;
        this.state.targetDomain = null;
        break;
    }

    await this.persistState();
    this.notifyListeners();

    console.log(`BlockingEngine: ${previousState} → ${newState}`, { appId, bundleId });
  }

  private async tick(): Promise<void> {
    const now = Date.now();

    // Check Quick Disable expiration
    if (this.state.quickDisableUntil && now >= this.state.quickDisableUntil) {
      this.state.quickDisableUntil = null;
      if (this.state.currentState === 'QUICK_DISABLED') {
        await this.transitionTo('IDLE');
      }
    }

    // Check mindful pause completion
    if (
      this.state.currentState === 'MINDFUL_PAUSE' &&
      this.state.pauseStartTime &&
      this.activePlan
    ) {
      const elapsed = (now - this.state.pauseStartTime) / 1000;
      if (elapsed >= this.activePlan.mindfulPauseSec) {
        await this.transitionTo('ACTIVE_BLOCK');
        await this.logEvent('pause_completed', this.state.targetApp?.id || null, null);
      }
    }

    // Check cooldown completion
    if (
      this.state.currentState === 'COOLDOWN' &&
      this.state.cooldownStartTime &&
      this.activePlan
    ) {
      const elapsed = (now - this.state.cooldownStartTime) / 1000;
      if (elapsed >= this.activePlan.cooldownSec) {
        await this.transitionTo('IDLE');
      }
    }

    // Check if active schedule ended
    const activeSchedule = this.getActiveSchedule();
    if (!activeSchedule && this.state.currentState !== 'IDLE') {
      await this.transitionTo('IDLE');
    }
  }

  private startTicker(): void {
    setInterval(() => {
      this.tick();
    }, 1000); // Check every second
  }

  private getActiveSchedule(): Schedule | null {
    if (!this.activePlan?.schedules) return null;

    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 = Sunday
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(
      now.getMinutes()
    ).padStart(2, '0')}`;

    for (const schedule of this.activePlan.schedules) {
      if (!schedule.enabled) continue;
      if (!schedule.daysOfWeek.includes(dayOfWeek)) continue;

      // Check if current time is within schedule window
      if (currentTime >= schedule.startLocal && currentTime <= schedule.endLocal) {
        return schedule;
      }
    }

    return null;
  }

  private findAppGroupForApp(bundleId: string): AppGroup | null {
    if (!this.activePlan?.groups) return null;

    for (const group of this.activePlan.groups) {
      const apps = (group as any).app_group_apps || [];
      for (const appLink of apps) {
        const app = appLink.app_identifiers;
        if (app?.bundle_id === bundleId) {
          return group;
        }
      }
    }

    return null;
  }

  private async getTodayUsage(appId: string): Promise<number> {
    const today = new Date().toISOString().split('T')[0];

    try {
      const { data } = await supabase
        .from('usage_stats')
        .select('total_minutes')
        .eq('app_id', appId)
        .eq('date', today)
        .maybeSingle();

      return data?.total_minutes || 0;
    } catch {
      return 0;
    }
  }

  private async getSessionUsage(appId: string): Promise<number> {
    // Session usage is tracked in memory and resets when app closes
    const usage = this.state.sessionUsage.get(appId);
    return usage || 0;
  }

  private async persistState(): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEY_ENGINE_STATE, JSON.stringify(this.state));
    } catch (error) {
      console.error('BlockingEngine: Failed to persist state', error);
    }
  }

  private notifyListeners(): void {
    for (const listener of this.stateChangeListeners) {
      try {
        listener(this.state);
      } catch (error) {
        console.error('BlockingEngine: Listener error', error);
      }
    }
  }

  private async logEvent(
    eventType: BlockingEvent['type'],
    appId: string | null,
    domain: string | null,
    metadata: Record<string, any> = {}
  ): Promise<void> {
    try {
      // Log to Supabase (if user is authenticated)
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('blocking_events').insert({
          user_id: user.id,
          event_type: eventType,
          app_id: appId,
          domain,
          state: this.state.currentState,
          metadata,
        });
      }

      // Also log to local analytics for offline-first tracking
      if (eventType === 'block_triggered' && appId) {
        try {
          const { logBlockEvent } = await import('@/lib/analytics');
          await logBlockEvent({
            appId,
            bundleId: appId, // Use appId as bundleId if bundleId not available
            durationSeconds: metadata.durationSeconds,
          });
        } catch (analyticsError) {
          console.error('BlockingEngine: Failed to log to analytics:', analyticsError);
          // Don't fail if analytics logging fails
        }
      }
    } catch (error) {
      console.error('BlockingEngine: Failed to log event', error);
    }
  }
}

// Export singleton instance
export const blockingEngine = BlockingEngine.getInstance();

/**
 * Helper function to format remaining time
 */
export function formatRemainingTime(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`;
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
}

/**
 * Calculate next schedule trigger time
 */
export function getNextScheduleTrigger(schedules: Schedule[]): { schedule: Schedule; triggerTime: Date } | null {
  const now = new Date();
  let nextTrigger: { schedule: Schedule; triggerTime: Date } | null = null;
  let minDiff = Infinity;

  for (const schedule of schedules) {
    if (!schedule.enabled) continue;

    for (let daysAhead = 0; daysAhead < 7; daysAhead++) {
      const checkDate = new Date(now);
      checkDate.setDate(checkDate.getDate() + daysAhead);
      const dayOfWeek = checkDate.getDay();

      if (schedule.daysOfWeek.includes(dayOfWeek)) {
        const [hours, minutes] = schedule.startLocal.split(':').map(Number);
        const triggerTime = new Date(checkDate);
        triggerTime.setHours(hours, minutes, 0, 0);

        const diff = triggerTime.getTime() - now.getTime();
        if (diff > 0 && diff < minDiff) {
          minDiff = diff;
          nextTrigger = { schedule, triggerTime };
        }
      }
    }
  }

  return nextTrigger;
}
