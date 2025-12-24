/**
 * Tracker Storage
 * 
 * Manages storage for tracker data including:
 * - Screen time tracking
 * - Blocking stats (apps blocked, time saved)
 * - Streak data
 * - Progress metrics
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  TRACKER_STATS: '@neuroblock:tracker_stats',
  DAILY_TRACKER: '@neuroblock:daily_tracker',
  STREAK_DATA: '@neuroblock:streak_data',
  BLOCKING_EVENTS: '@neuroblock:blocking_events',
} as const;

// Types
export interface TrackerStats {
  totalTimeSavedMinutes: number;
  totalBlocksTriggered: number;
  totalFocusSessions: number;
  totalFocusMinutes: number;
  longestStreak: number;
  currentStreak: number;
  lastActiveDate: string | null;
  updatedAt: string;
}

export interface DailyTrackerData {
  date: string;
  focusMinutes: number;
  blocksTriggered: number;
  timeSavedMinutes: number;
  appsBlocked: string[];
  schedulesActive: number;
  isScheduleDay: boolean;
}

export interface BlockingEvent {
  id: string;
  timestamp: string;
  appName: string;
  duration: number; // seconds blocked/deterred
  wasBlocked: boolean;
  scheduleId?: string;
}

// Default values
const DEFAULT_STATS: TrackerStats = {
  totalTimeSavedMinutes: 0,
  totalBlocksTriggered: 0,
  totalFocusSessions: 0,
  totalFocusMinutes: 0,
  longestStreak: 0,
  currentStreak: 0,
  lastActiveDate: null,
  updatedAt: new Date().toISOString(),
};

// Helper functions
export function getTodayDateString(): string {
  return new Date().toISOString().split('T')[0];
}

function isConsecutiveDay(dateStr1: string, dateStr2: string): boolean {
  const date1 = new Date(dateStr1);
  const date2 = new Date(dateStr2);
  const diffTime = Math.abs(date2.getTime() - date1.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays === 1;
}

// Tracker Stats
export async function getTrackerStats(): Promise<TrackerStats> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.TRACKER_STATS);
    return data ? JSON.parse(data) : DEFAULT_STATS;
  } catch (error) {
    console.error('[TrackerStorage] Error getting tracker stats:', error);
    return DEFAULT_STATS;
  }
}

export async function updateTrackerStats(updates: Partial<TrackerStats>): Promise<void> {
  try {
    const current = await getTrackerStats();
    const updated = {
      ...current,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    await AsyncStorage.setItem(STORAGE_KEYS.TRACKER_STATS, JSON.stringify(updated));
  } catch (error) {
    console.error('[TrackerStorage] Error updating tracker stats:', error);
  }
}

// Daily Tracker
export async function getDailyTracker(date?: string): Promise<DailyTrackerData | null> {
  try {
    const targetDate = date || getTodayDateString();
    const allData = await getAllDailyTracker();
    return allData[targetDate] || null;
  } catch (error) {
    console.error('[TrackerStorage] Error getting daily tracker:', error);
    return null;
  }
}

export async function getAllDailyTracker(): Promise<Record<string, DailyTrackerData>> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.DAILY_TRACKER);
    return data ? JSON.parse(data) : {};
  } catch (error) {
    console.error('[TrackerStorage] Error getting all daily tracker:', error);
    return {};
  }
}

export async function updateDailyTracker(date: string, updates: Partial<DailyTrackerData>): Promise<void> {
  try {
    const allData = await getAllDailyTracker();
    const current = allData[date] || {
      date,
      focusMinutes: 0,
      blocksTriggered: 0,
      timeSavedMinutes: 0,
      appsBlocked: [],
      schedulesActive: 0,
      isScheduleDay: false,
    };
    
    allData[date] = {
      ...current,
      ...updates,
    };
    
    await AsyncStorage.setItem(STORAGE_KEYS.DAILY_TRACKER, JSON.stringify(allData));
  } catch (error) {
    console.error('[TrackerStorage] Error updating daily tracker:', error);
  }
}

// Streak Management
export async function updateStreak(): Promise<{ currentStreak: number; longestStreak: number }> {
  try {
    const stats = await getTrackerStats();
    const today = getTodayDateString();
    
    let newCurrentStreak = stats.currentStreak;
    let newLongestStreak = stats.longestStreak;
    
    if (stats.lastActiveDate) {
      if (stats.lastActiveDate === today) {
        // Already logged today, no change
        return { currentStreak: newCurrentStreak, longestStreak: newLongestStreak };
      } else if (isConsecutiveDay(stats.lastActiveDate, today)) {
        // Consecutive day - increment streak
        newCurrentStreak += 1;
      } else {
        // Streak broken - reset to 1
        newCurrentStreak = 1;
      }
    } else {
      // First activity
      newCurrentStreak = 1;
    }
    
    // Update longest streak if needed
    if (newCurrentStreak > newLongestStreak) {
      newLongestStreak = newCurrentStreak;
    }
    
    await updateTrackerStats({
      currentStreak: newCurrentStreak,
      longestStreak: newLongestStreak,
      lastActiveDate: today,
    });
    
    return { currentStreak: newCurrentStreak, longestStreak: newLongestStreak };
  } catch (error) {
    console.error('[TrackerStorage] Error updating streak:', error);
    return { currentStreak: 0, longestStreak: 0 };
  }
}

// Blocking Events
export async function logBlockingEvent(event: Omit<BlockingEvent, 'id' | 'timestamp'>): Promise<void> {
  try {
    const events = await getBlockingEvents();
    const newEvent: BlockingEvent = {
      ...event,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
    };
    
    events.push(newEvent);
    
    // Keep only last 1000 events
    const trimmedEvents = events.slice(-1000);
    await AsyncStorage.setItem(STORAGE_KEYS.BLOCKING_EVENTS, JSON.stringify(trimmedEvents));
    
    // Update daily tracker
    const today = getTodayDateString();
    const dailyData = await getDailyTracker(today);
    const currentAppsBlocked = dailyData?.appsBlocked || [];
    
    await updateDailyTracker(today, {
      blocksTriggered: (dailyData?.blocksTriggered || 0) + 1,
      timeSavedMinutes: (dailyData?.timeSavedMinutes || 0) + Math.ceil(event.duration / 60),
      appsBlocked: [...new Set([...currentAppsBlocked, event.appName])],
    });
    
    // Update total stats
    const stats = await getTrackerStats();
    await updateTrackerStats({
      totalBlocksTriggered: stats.totalBlocksTriggered + 1,
      totalTimeSavedMinutes: stats.totalTimeSavedMinutes + Math.ceil(event.duration / 60),
    });
    
    // Update streak
    await updateStreak();
  } catch (error) {
    console.error('[TrackerStorage] Error logging blocking event:', error);
  }
}

export async function getBlockingEvents(limit?: number): Promise<BlockingEvent[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.BLOCKING_EVENTS);
    const events: BlockingEvent[] = data ? JSON.parse(data) : [];
    return limit ? events.slice(-limit) : events;
  } catch (error) {
    console.error('[TrackerStorage] Error getting blocking events:', error);
    return [];
  }
}

// Focus Session Logging
export async function logFocusSession(durationMinutes: number): Promise<void> {
  try {
    const today = getTodayDateString();
    const dailyData = await getDailyTracker(today);
    
    await updateDailyTracker(today, {
      focusMinutes: (dailyData?.focusMinutes || 0) + durationMinutes,
    });
    
    const stats = await getTrackerStats();
    await updateTrackerStats({
      totalFocusSessions: stats.totalFocusSessions + 1,
      totalFocusMinutes: stats.totalFocusMinutes + durationMinutes,
    });
    
    await updateStreak();
  } catch (error) {
    console.error('[TrackerStorage] Error logging focus session:', error);
  }
}

// Get Weekly Summary
export async function getWeeklySummary(): Promise<{
  totalFocusMinutes: number;
  totalBlocks: number;
  totalTimeSaved: number;
  activeDays: number;
  dailyData: DailyTrackerData[];
}> {
  try {
    const allDaily = await getAllDailyTracker();
    const today = new Date();
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const weeklyData: DailyTrackerData[] = [];
    let totalFocusMinutes = 0;
    let totalBlocks = 0;
    let totalTimeSaved = 0;
    let activeDays = 0;
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayData = allDaily[dateStr];
      if (dayData) {
        weeklyData.push(dayData);
        totalFocusMinutes += dayData.focusMinutes;
        totalBlocks += dayData.blocksTriggered;
        totalTimeSaved += dayData.timeSavedMinutes;
        if (dayData.focusMinutes > 0 || dayData.blocksTriggered > 0) {
          activeDays++;
        }
      } else {
        weeklyData.push({
          date: dateStr,
          focusMinutes: 0,
          blocksTriggered: 0,
          timeSavedMinutes: 0,
          appsBlocked: [],
          schedulesActive: 0,
          isScheduleDay: false,
        });
      }
    }
    
    return {
      totalFocusMinutes,
      totalBlocks,
      totalTimeSaved,
      activeDays,
      dailyData: weeklyData.reverse(),
    };
  } catch (error) {
    console.error('[TrackerStorage] Error getting weekly summary:', error);
    return {
      totalFocusMinutes: 0,
      totalBlocks: 0,
      totalTimeSaved: 0,
      activeDays: 0,
      dailyData: [],
    };
  }
}

// Reset tracker data (for testing/reset)
export async function resetTrackerData(): Promise<void> {
  try {
    await Promise.all([
      AsyncStorage.removeItem(STORAGE_KEYS.TRACKER_STATS),
      AsyncStorage.removeItem(STORAGE_KEYS.DAILY_TRACKER),
      AsyncStorage.removeItem(STORAGE_KEYS.STREAK_DATA),
      AsyncStorage.removeItem(STORAGE_KEYS.BLOCKING_EVENTS),
    ]);
    console.log('[TrackerStorage] Reset all tracker data');
  } catch (error) {
    console.error('[TrackerStorage] Error resetting tracker data:', error);
  }
}

