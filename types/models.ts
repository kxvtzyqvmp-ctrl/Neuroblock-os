/**
 * Core Data Models for NeuroBlock OS
 * Single source of truth for all app data structures
 */

// ============================================================================
// USER & PROFILE
// ============================================================================

export interface UserProfile {
  id: string;
  email: string | null;
  authProvider: 'apple' | 'google' | 'email' | 'anonymous';
  premium: boolean;
  locale: string;
  timezone: string;
  displayName: string | null;
  role: 'parent' | 'child' | 'individual';
  linkedUserId: string | null;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// PLAN & INTENSITY
// ============================================================================

export type PlanIntensity = 'gentle' | 'standard' | 'strict';

export interface Plan {
  id: string;
  userId: string | null;
  name: string;
  intensity: PlanIntensity;
  mindfulPauseSec: number; // Duration of mindful pause before blocking
  cooldownSec: number; // Cooldown after override
  allowOverride: boolean; // Can user override blocks?
  isActive: boolean;
  schedules: Schedule[];
  groups: AppGroup[];
  webRules: WebRule[];
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// SCHEDULES
// ============================================================================

export interface Schedule {
  id: string;
  planId: string;
  name: string;
  daysOfWeek: number[]; // 0=Sunday, 1=Monday, etc.
  startLocal: string; // HH:mm format
  endLocal: string; // HH:mm format
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// APP GROUPS & BLOCKING
// ============================================================================

export interface AppGroup {
  id: string;
  planId: string;
  name: string;
  apps: AppIdentifier[];
  categories: AppCategory[];
  sessionCapMin: number | null; // Max minutes per session
  dailyCapMin: number | null; // Max minutes per day
  strict: boolean; // No override allowed
  color: string; // For UI grouping
  icon: string; // Icon name
  createdAt: string;
  updatedAt: string;
}

export interface AppIdentifier {
  id: string;
  bundleId: string; // iOS bundle ID or Android package name
  name: string;
  platform: 'ios' | 'android' | 'both';
  category: AppCategory;
  icon: string | null;
}

export type AppCategory =
  | 'social'
  | 'entertainment'
  | 'games'
  | 'news'
  | 'shopping'
  | 'dating'
  | 'browsers'
  | 'productivity'
  | 'communication'
  | 'other';

// ============================================================================
// WEB BLOCKING
// ============================================================================

export interface WebRule {
  id: string;
  planId: string;
  domains: string[]; // e.g., ["facebook.com", "*.twitter.com"]
  mode: 'block' | 'allow';
  strict: boolean; // No override allowed
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// USAGE STATISTICS
// ============================================================================

export interface UsageStats {
  id: string;
  userId: string | null;
  date: string; // YYYY-MM-DD
  appId: string;
  appName: string;
  totalMinutes: number;
  sessions: number;
  opens: number;
  blocked: number; // Times blocked
  overrides: number; // Times user overrode block
  createdAt: string;
  updatedAt: string;
}

export interface DailyAggregate {
  date: string;
  totalScreenTime: number;
  timeSaved: number;
  mindfulPauses: number;
  blockedAttempts: number;
  focusMinutes: number;
  topApps: Array<{ appId: string; appName: string; minutes: number }>;
}

// ============================================================================
// SETTINGS
// ============================================================================

export interface Settings {
  id: string;
  userId: string | null;
  quickDisableMin: number; // Duration for quick disable feature
  theme: 'dark' | 'light' | 'system';
  notifications: NotificationSettings;
  lock: LockSettings;
  privacy: PrivacySettings;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationSettings {
  dailyDigest: boolean;
  nudge: boolean;
  weeklyReport: boolean;
  achievement: boolean;
  friendActivity: boolean;
}

export interface LockSettings {
  enabled: boolean;
  pin: string | null; // Hashed PIN
  useBiometric: boolean;
  cooldownMin: number; // Minutes before allowing changes in strict mode
  lastUnlock: string | null;
}

export interface PrivacySettings {
  syncEnabled: boolean; // Opt into cloud sync
  analyticsEnabled: boolean; // Opt into usage analytics
  shareWithFamily: boolean; // Share stats with linked accounts
  localOnly: boolean; // All data stays on device
}

// ============================================================================
// ENTITLEMENTS & SUBSCRIPTION
// ============================================================================

export interface Entitlements {
  id: string;
  userId: string;
  premium: boolean;
  expiresAt: string | null; // ISO date or null for lifetime
  features: PremiumFeature[];
  billingCycle: 'monthly' | 'yearly' | 'lifetime' | null;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  appleTransactionId: string | null;
  googlePurchaseToken: string | null;
  createdAt: string;
  updatedAt: string;
}

export type PremiumFeature =
  | 'multi_device_sync'
  | 'category_blocking'
  | 'web_blocking'
  | 'strict_lock'
  | 'family_linking'
  | 'ai_insights'
  | 'custom_themes'
  | 'unlimited_groups'
  | 'priority_support';

// ============================================================================
// BLOCKING ENGINE STATE
// ============================================================================

export type BlockingState =
  | 'IDLE'
  | 'ELIGIBLE'
  | 'MINDFUL_PAUSE'
  | 'ACTIVE_BLOCK'
  | 'COOLDOWN'
  | 'QUICK_DISABLED';

export interface BlockingEngineState {
  currentState: BlockingState;
  targetApp: AppIdentifier | null;
  targetDomain: string | null;
  pauseStartTime: number | null;
  blockStartTime: number | null;
  cooldownStartTime: number | null;
  quickDisableUntil: number | null;
  activeSchedule: Schedule | null;
  todayUsage: Map<string, number>; // appId -> minutes
  sessionUsage: Map<string, number>; // appId -> minutes
  lastTransition: string;
  events: BlockingEvent[];
}

export interface BlockingEvent {
  id: string;
  timestamp: string;
  type: 'block_triggered' | 'override_used' | 'pause_completed' | 'schedule_activated' | 'cap_exceeded';
  appId: string | null;
  domain: string | null;
  state: BlockingState;
  metadata: Record<string, any>;
}

// ============================================================================
// FOCUS SESSIONS
// ============================================================================

export interface FocusSession {
  id: string;
  userId: string | null;
  startTime: string;
  endTime: string | null;
  durationMinutes: number | null;
  type: 'manual' | 'scheduled' | 'ai_suggested';
  environmentMode: 'deep_focus' | 'flow' | 'mindful';
  completed: boolean;
  createdAt: string;
}

// ============================================================================
// AI & INSIGHTS
// ============================================================================

export interface AIInsight {
  id: string;
  userId: string | null;
  insightText: string;
  insightType: 'progress' | 'streak' | 'suggestion' | 'warning' | 'achievement';
  priority: 'low' | 'medium' | 'high';
  isRead: boolean;
  actionable: boolean;
  actionLink: string | null; // Deep link to relevant screen
  createdAt: string;
}

export interface AICoachMessage {
  id: string;
  userId: string | null;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

// ============================================================================
// ACCOUNTABILITY & FAMILY
// ============================================================================

export interface AccountabilityLink {
  id: string;
  userId: string;
  buddyId: string;
  status: 'pending' | 'active' | 'paused';
  shareLevel: 'basic' | 'detailed'; // basic=streaks only, detailed=full stats
  approvalRequired: boolean; // Buddy must approve unlocks
  createdAt: string;
  updatedAt: string;
}

export interface UnlockRequest {
  id: string;
  requesterId: string;
  approverId: string;
  appId: string;
  reason: string;
  status: 'pending' | 'approved' | 'denied';
  expiresAt: string;
  createdAt: string;
  respondedAt: string | null;
}

// ============================================================================
// STREAKS & ACHIEVEMENTS
// ============================================================================

export interface Streak {
  id: string;
  userId: string;
  type: 'focus' | 'detox' | 'no_override' | 'daily_goal';
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string; // YYYY-MM-DD
  updatedAt: string;
}

export interface Achievement {
  id: string;
  key: string; // Unique achievement identifier
  name: string;
  description: string;
  icon: string;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  requirement: number;
  progress: number;
  unlocked: boolean;
  unlockedAt: string | null;
}

// ============================================================================
// SYNC & CONFLICT RESOLUTION
// ============================================================================

export interface SyncMetadata {
  id: string;
  userId: string;
  entityType: 'plan' | 'settings' | 'stats' | 'profile';
  entityId: string;
  version: number;
  lastModified: string;
  deviceId: string;
  checksum: string;
}

export interface SyncConflict {
  id: string;
  entityType: string;
  entityId: string;
  localVersion: any;
  remoteVersion: any;
  resolution: 'local' | 'remote' | 'merged' | 'manual';
  resolvedAt: string | null;
}

// ============================================================================
// PERMISSIONS
// ============================================================================

export interface PermissionStatus {
  ios: {
    familyControls: 'granted' | 'denied' | 'not_determined';
    notifications: 'granted' | 'denied' | 'not_determined';
    screenTime: 'granted' | 'denied' | 'not_determined';
  };
  android: {
    usageAccess: boolean;
    accessibilityService: boolean;
    drawOverApps: boolean;
    notificationListener: boolean;
    deviceAdmin: boolean;
    vpnService: boolean;
    batteryOptimization: boolean;
  };
  lastChecked: string;
}

// ============================================================================
// FEATURE FLAGS
// ============================================================================

export interface FeatureFlags {
  webBlockingDNS: boolean;
  aiInsights: boolean;
  accountability: boolean;
  familyLinking: boolean;
  vpnBlocking: boolean;
  strictMode: boolean;
  diagnostics: boolean;
  betaFeatures: boolean;
}

// ============================================================================
// DIAGNOSTICS
// ============================================================================

export interface DiagnosticInfo {
  engineState: BlockingEngineState;
  permissions: PermissionStatus;
  activeSchedules: Schedule[];
  nextTriggers: Array<{ schedule: Schedule; triggerTime: string }>;
  recentEvents: BlockingEvent[];
  systemHealth: {
    servicesRunning: boolean;
    lastHeartbeat: string;
    errorCount: number;
    lastError: string | null;
  };
  deviceInfo: {
    platform: 'ios' | 'android';
    osVersion: string;
    appVersion: string;
    deviceId: string;
  };
}
