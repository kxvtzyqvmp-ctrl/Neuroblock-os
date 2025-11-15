/**
 * LocalStorage utilities for offline-first app
 * 
 * Replaces Supabase database calls with local storage using AsyncStorage.
 * All user data is stored locally and synced when online (future feature).
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  DETOX_SETTINGS: '@neuroblock:detox_settings',
  DAILY_STATS: '@neuroblock:daily_stats',
  FOCUS_SESSIONS: '@neuroblock:focus_sessions',
  AI_INSIGHTS: '@neuroblock:ai_insights',
  DETOX_TIMER_DURATION: '@neuroblock:detox_timer_duration',
} as const;

// Detox Settings
export interface DetoxSettings {
  selected_apps: string[];
  daily_limit_minutes: number;
  active_schedule_type: 'work_hours' | 'evenings' | 'custom';
  active_schedule_start: string;
  active_schedule_end: string;
  pause_duration_seconds: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export async function saveDetoxSettings(settings: Partial<DetoxSettings>): Promise<void> {
  try {
    const existing = await getDetoxSettings();
    const updated = {
      ...existing,
      ...settings,
      updated_at: new Date().toISOString(),
      created_at: existing?.created_at || new Date().toISOString(),
    };
    await AsyncStorage.setItem(STORAGE_KEYS.DETOX_SETTINGS, JSON.stringify(updated));
  } catch (error) {
    console.error('[LocalStorage] Error saving detox settings:', error);
    throw error;
  }
}

export async function getDetoxSettings(): Promise<DetoxSettings | null> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.DETOX_SETTINGS);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('[LocalStorage] Error getting detox settings:', error);
    return null;
  }
}

// Daily Stats
export interface DailyStats {
  date: string;
  time_saved_minutes: number;
  mindful_pauses_count: number;
  apps_opened_count: number;
  focus_minutes: number;
  updated_at: string;
}

export async function saveDailyStats(date: string, stats: Partial<DailyStats>): Promise<void> {
  try {
    const allStats = await getAllDailyStats();
    const updated = {
      ...allStats[date],
      ...stats,
      date,
      updated_at: new Date().toISOString(),
    };
    allStats[date] = updated;
    await AsyncStorage.setItem(STORAGE_KEYS.DAILY_STATS, JSON.stringify(allStats));
  } catch (error) {
    console.error('[LocalStorage] Error saving daily stats:', error);
    throw error;
  }
}

export async function getDailyStats(date: string): Promise<DailyStats | null> {
  try {
    const allStats = await getAllDailyStats();
    return allStats[date] || null;
  } catch (error) {
    console.error('[LocalStorage] Error getting daily stats:', error);
    return null;
  }
}

export async function getAllDailyStats(): Promise<Record<string, DailyStats>> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.DAILY_STATS);
    return data ? JSON.parse(data) : {};
  } catch (error) {
    console.error('[LocalStorage] Error getting all daily stats:', error);
    return {};
  }
}

// Focus Sessions
export interface FocusSession {
  id: string;
  start_time: string;
  end_time: string | null;
  duration_minutes: number | null;
  created_at: string;
}

export async function saveFocusSession(session: FocusSession): Promise<void> {
  try {
    const sessions = await getAllFocusSessions();
    sessions[session.id] = session;
    await AsyncStorage.setItem(STORAGE_KEYS.FOCUS_SESSIONS, JSON.stringify(sessions));
  } catch (error) {
    console.error('[LocalStorage] Error saving focus session:', error);
    throw error;
  }
}

export async function getAllFocusSessions(): Promise<Record<string, FocusSession>> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.FOCUS_SESSIONS);
    return data ? JSON.parse(data) : {};
  } catch (error) {
    console.error('[LocalStorage] Error getting focus sessions:', error);
    return {};
  }
}

// AI Insights
export interface AIInsight {
  id: string;
  insight_text: string;
  insight_type: 'progress' | 'streak' | 'suggestion';
  is_read: boolean;
  created_at: string;
}

export async function saveAIInsight(insight: AIInsight): Promise<void> {
  try {
    const insights = await getAllAIInsights();
    insights[insight.id] = insight;
    await AsyncStorage.setItem(STORAGE_KEYS.AI_INSIGHTS, JSON.stringify(insights));
  } catch (error) {
    console.error('[LocalStorage] Error saving AI insight:', error);
    throw error;
  }
}

export async function getAllAIInsights(): Promise<Record<string, AIInsight>> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.AI_INSIGHTS);
    return data ? JSON.parse(data) : {};
  } catch (error) {
    console.error('[LocalStorage] Error getting AI insights:', error);
    return {};
  }
}

// Detox Timer Settings
export async function saveDetoxTimerDuration(minutes: number): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.DETOX_TIMER_DURATION, JSON.stringify(minutes));
  } catch (error) {
    console.error('[LocalStorage] Error saving detox timer duration:', error);
    throw error;
  }
}

export async function getDetoxTimerDuration(): Promise<number> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.DETOX_TIMER_DURATION);
    return data ? JSON.parse(data) : 25; // Default 25 minutes
  } catch (error) {
    console.error('[LocalStorage] Error getting detox timer duration:', error);
    return 25; // Default 25 minutes
  }
}

// Clear all data (for testing/reset)
export async function clearAllData(): Promise<void> {
  try {
    await Promise.all([
      AsyncStorage.removeItem(STORAGE_KEYS.DETOX_SETTINGS),
      AsyncStorage.removeItem(STORAGE_KEYS.DAILY_STATS),
      AsyncStorage.removeItem(STORAGE_KEYS.FOCUS_SESSIONS),
      AsyncStorage.removeItem(STORAGE_KEYS.AI_INSIGHTS),
      AsyncStorage.removeItem(STORAGE_KEYS.DETOX_TIMER_DURATION),
    ]);
  } catch (error) {
    console.error('[LocalStorage] Error clearing data:', error);
    throw error;
  }
}

