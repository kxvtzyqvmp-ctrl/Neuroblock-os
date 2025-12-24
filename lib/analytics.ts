/**
 * Analytics Module
 * 
 * Centralized usage analytics for focus sessions and block events.
 * Provides accurate date-based tracking with proper time calculations.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAllFocusSessions, FocusSession } from '@/lib/localStorage';

// Storage keys
const STORAGE_KEYS = {
  FOCUS_EVENTS: '@neuroblock:analytics:focus_events',
  BLOCK_EVENTS: '@neuroblock:analytics:block_events',
} as const;

// Data Models
export type FocusEvent = {
  id: string;             // unique
  startTime: string;      // ISO
  endTime: string;        // ISO
  durationMinutes: number;
  source: 'focus_session' | 'schedule'; // optional
};

export type BlockEvent = {
  id: string;
  appId?: string;
  bundleId?: string;
  timestamp: string;      // ISO
  durationSeconds?: number; // optional if you have it
};

// Stats Types
export type TodayStats = {
  focusMinutes: number;
  blocks: number;
  isActiveToday: boolean;   // at least 1 minute of focus
};

export type WeekStats = {
  // indexed by date string 'YYYY-MM-DD'
  focusMinutesByDay: { [dateKey: string]: number };
  totalBlocksByDay: { [dateKey: string]: number };
  activeDays: number;       // days with > 0 focus minutes
  totalFocusMinutes: number;
  totalBlocks: number;
};

export type AllTimeStats = {
  totalFocusMinutes: number;
  totalBlocks: number;
  totalSessions: number;
  timeSavedMinutes: number; // You can define as totalFocusMinutes or a custom formula
  bestStreakDays: number;   // longest streak of days with focus > 0
  currentStreakDays: number;
};

// Helper: Get date string in local timezone (YYYY-MM-DD)
function getDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Helper: Get start of day in local timezone
function getStartOfDay(date: Date): Date {
  const local = new Date(date);
  local.setHours(0, 0, 0, 0);
  return local;
}

// Helper: Get end of day in local timezone
function getEndOfDay(date: Date): Date {
  const local = new Date(date);
  local.setHours(23, 59, 59, 999);
  return local;
}

// Helper: Get week start (Sunday) in local timezone
function getWeekStart(date: Date): Date {
  const local = new Date(date);
  const day = local.getDay(); // 0 = Sunday, 6 = Saturday
  local.setDate(local.getDate() - day);
  local.setHours(0, 0, 0, 0);
  return local;
}

// Helper: Get week end (Saturday) in local timezone
function getWeekEnd(date: Date): Date {
  const weekStart = getWeekStart(date);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);
  return weekEnd;
}

// Helper: Split session across days if it crosses midnight
function splitSessionAcrossDays(
  startTime: Date,
  endTime: Date,
  durationMinutes: number
): Array<{ date: string; minutes: number }> {
  const result: Array<{ date: string; minutes: number }> = [];
  const start = new Date(startTime);
  const end = new Date(endTime);
  
  let current = new Date(start);
  
  while (current <= end) {
    const dayStart = getStartOfDay(current);
    const dayEnd = getEndOfDay(current);
    
    const sessionStart = current > dayStart ? current : dayStart;
    const sessionEnd = end < dayEnd ? end : dayEnd;
    
    const minutesInDay = Math.max(0, Math.floor((sessionEnd.getTime() - sessionStart.getTime()) / (1000 * 60)));
    
    if (minutesInDay > 0) {
      result.push({
        date: getDateString(current),
        minutes: minutesInDay,
      });
    }
    
    // Move to next day
    current = new Date(dayEnd);
    current.setMilliseconds(current.getMilliseconds() + 1);
    
    if (current > end) break;
  }
  
  return result;
}

// Storage Functions
export async function logFocusSession(session: FocusSession): Promise<void> {
  try {
    if (!session.end_time || !session.duration_minutes) {
      console.warn('[Analytics] Cannot log incomplete session:', session.id);
      return;
    }
    
    const startTime = new Date(session.start_time);
    const endTime = new Date(session.end_time);
    const durationMinutes = session.duration_minutes;
    
    // Calculate actual duration from start/end times
    const actualDurationMs = endTime.getTime() - startTime.getTime();
    const actualDurationMinutes = Math.floor(actualDurationMs / (1000 * 60));
    
    // Use actual duration if available, otherwise use stored duration
    const finalDuration = actualDurationMinutes > 0 ? actualDurationMinutes : durationMinutes;
    
    const event: FocusEvent = {
      id: session.id,
      startTime: session.start_time,
      endTime: session.end_time,
      durationMinutes: finalDuration,
      source: 'focus_session',
    };
    
    // Get existing events
    const existing = await getFocusEvents();
    
    // Check if already logged (prevent double-logging)
    if (existing.find(e => e.id === session.id)) {
      console.log('[Analytics] Session already logged:', session.id);
      return;
    }
    
    // Add new event
    existing.push(event);
    
    // Keep only last 10000 events
    const trimmed = existing.slice(-10000);
    
    await AsyncStorage.setItem(STORAGE_KEYS.FOCUS_EVENTS, JSON.stringify(trimmed));
    
    console.log('[Analytics] Logged focus session:', {
      id: session.id,
      durationMinutes: finalDuration,
      startTime: session.start_time,
      endTime: session.end_time,
    });
  } catch (error) {
    console.error('[Analytics] Error logging focus session:', error);
  }
}

export async function logBlockEvent(event: Omit<BlockEvent, 'id' | 'timestamp'>): Promise<void> {
  try {
    const blockEvent: BlockEvent = {
      ...event,
      id: `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: event.timestamp || new Date().toISOString(),
    };
    
    // Get existing events
    const existing = await getBlockEvents();
    
    // Add new event
    existing.push(blockEvent);
    
    // Keep only last 10000 events
    const trimmed = existing.slice(-10000);
    
    await AsyncStorage.setItem(STORAGE_KEYS.BLOCK_EVENTS, JSON.stringify(trimmed));
    
    console.log('[Analytics] Logged block event:', {
      id: blockEvent.id,
      appId: blockEvent.appId,
      bundleId: blockEvent.bundleId,
      timestamp: blockEvent.timestamp,
    });
  } catch (error) {
    console.error('[Analytics] Error logging block event:', error);
  }
}

// Query Functions
export async function getFocusEvents(): Promise<FocusEvent[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.FOCUS_EVENTS);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('[Analytics] Error getting focus events:', error);
    return [];
  }
}

export async function getBlockEvents(): Promise<BlockEvent[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.BLOCK_EVENTS);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('[Analytics] Error getting block events:', error);
    return [];
  }
}

export async function getTodayStats(now: Date = new Date()): Promise<TodayStats> {
  try {
    const today = getDateString(now);
    const dayStart = getStartOfDay(now);
    const dayEnd = getEndOfDay(now);
    
    // Get all focus events
    const focusEvents = await getFocusEvents();
    
    // Filter events that overlap with today
    let focusMinutes = 0;
    const todayEvents = focusEvents.filter(event => {
      const start = new Date(event.startTime);
      const end = new Date(event.endTime);
      
      // Check if event overlaps with today
      if (end < dayStart || start > dayEnd) {
        return false;
      }
      
      // Calculate minutes in today
      const sessionStart = start > dayStart ? start : dayStart;
      const sessionEnd = end < dayEnd ? end : dayEnd;
      const minutesInDay = Math.floor((sessionEnd.getTime() - sessionStart.getTime()) / (1000 * 60));
      
      focusMinutes += Math.max(0, minutesInDay);
      return true;
    });
    
    // Get all block events for today
    const blockEvents = await getBlockEvents();
    const todayBlocks = blockEvents.filter(event => {
      const eventDate = new Date(event.timestamp);
      return getDateString(eventDate) === today;
    });
    
    return {
      focusMinutes: Math.round(focusMinutes),
      blocks: todayBlocks.length,
      isActiveToday: focusMinutes >= 1,
    };
  } catch (error) {
    console.error('[Analytics] Error getting today stats:', error);
    return {
      focusMinutes: 0,
      blocks: 0,
      isActiveToday: false,
    };
  }
}

export async function getWeekStats(now: Date = new Date()): Promise<WeekStats> {
  try {
    const weekStart = getWeekStart(now);
    const weekEnd = getWeekEnd(now);
    
    // Initialize day maps
    const focusMinutesByDay: { [dateKey: string]: number } = {};
    const totalBlocksByDay: { [dateKey: string]: number } = {};
    
    // Initialize all 7 days
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(date.getDate() + i);
      const dateStr = getDateString(date);
      focusMinutesByDay[dateStr] = 0;
      totalBlocksByDay[dateStr] = 0;
    }
    
    // Get all focus events
    const focusEvents = await getFocusEvents();
    
    // Process each event
    for (const event of focusEvents) {
      const start = new Date(event.startTime);
      const end = new Date(event.endTime);
      
      // Check if event overlaps with this week
      if (end < weekStart || start > weekEnd) {
        continue;
      }
      
      // Split session across days
      const daySplits = splitSessionAcrossDays(start, end, event.durationMinutes);
      
      for (const split of daySplits) {
        if (focusMinutesByDay.hasOwnProperty(split.date)) {
          focusMinutesByDay[split.date] += split.minutes;
        }
      }
    }
    
    // Get all block events for this week
    const blockEvents = await getBlockEvents();
    for (const event of blockEvents) {
      const eventDate = new Date(event.timestamp);
      const dateStr = getDateString(eventDate);
      
      if (totalBlocksByDay.hasOwnProperty(dateStr)) {
        totalBlocksByDay[dateStr] += 1;
      }
    }
    
    // Calculate totals
    const totalFocusMinutes = Object.values(focusMinutesByDay).reduce((sum, mins) => sum + mins, 0);
    const totalBlocks = Object.values(totalBlocksByDay).reduce((sum, blocks) => sum + blocks, 0);
    const activeDays = Object.values(focusMinutesByDay).filter(mins => mins > 0).length;
    
    return {
      focusMinutesByDay,
      totalBlocksByDay,
      activeDays,
      totalFocusMinutes: Math.round(totalFocusMinutes),
      totalBlocks,
    };
  } catch (error) {
    console.error('[Analytics] Error getting week stats:', error);
    return {
      focusMinutesByDay: {},
      totalBlocksByDay: {},
      activeDays: 0,
      totalFocusMinutes: 0,
      totalBlocks: 0,
    };
  }
}

export async function getAllTimeStats(now: Date = new Date()): Promise<AllTimeStats> {
  try {
    const focusEvents = await getFocusEvents();
    const blockEvents = await getBlockEvents();
    
    // Calculate totals
    const totalFocusMinutes = focusEvents.reduce((sum, event) => sum + event.durationMinutes, 0);
    const totalBlocks = blockEvents.length;
    const totalSessions = focusEvents.length;
    
    // Calculate time saved (using total focus minutes as proxy)
    const timeSavedMinutes = totalFocusMinutes;
    
    // Calculate streaks
    const daysWithFocus = new Set<string>();
    
    for (const event of focusEvents) {
      const start = new Date(event.startTime);
      const end = new Date(event.endTime);
      
      // Get all days this session spans
      const daySplits = splitSessionAcrossDays(start, end, event.durationMinutes);
      for (const split of daySplits) {
        if (split.minutes > 0) {
          daysWithFocus.add(split.date);
        }
      }
    }
    
    // Sort dates
    const sortedDates = Array.from(daysWithFocus).sort();
    
    // Calculate current streak (from today backwards)
    let currentStreakDays = 0;
    const today = getDateString(now);
    let checkDate = new Date(now);
    
    while (true) {
      const dateStr = getDateString(checkDate);
      if (sortedDates.includes(dateStr)) {
        currentStreakDays++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
    
    // Calculate best streak
    let bestStreakDays = 0;
    let currentStreak = 0;
    let lastDate: string | null = null;
    
    for (const dateStr of sortedDates) {
      if (lastDate === null) {
        currentStreak = 1;
      } else {
        const last = new Date(lastDate);
        const current = new Date(dateStr);
        const diffDays = Math.floor((current.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) {
          currentStreak++;
        } else {
          bestStreakDays = Math.max(bestStreakDays, currentStreak);
          currentStreak = 1;
        }
      }
      
      lastDate = dateStr;
    }
    
    bestStreakDays = Math.max(bestStreakDays, currentStreak);
    
    return {
      totalFocusMinutes: Math.round(totalFocusMinutes),
      totalBlocks,
      totalSessions,
      timeSavedMinutes: Math.round(timeSavedMinutes),
      bestStreakDays,
      currentStreakDays,
    };
  } catch (error) {
    console.error('[Analytics] Error getting all time stats:', error);
    return {
      totalFocusMinutes: 0,
      totalBlocks: 0,
      totalSessions: 0,
      timeSavedMinutes: 0,
      bestStreakDays: 0,
      currentStreakDays: 0,
    };
  }
}

// Migration: Import existing focus sessions from localStorage
export async function migrateExistingSessions(): Promise<void> {
  try {
    const existingSessions = await getAllFocusSessions();
    const focusEvents = await getFocusEvents();
    const existingIds = new Set(focusEvents.map(e => e.id));
    
    let migrated = 0;
    
    for (const session of Object.values(existingSessions)) {
      // Skip if already migrated
      if (existingIds.has(session.id)) {
        continue;
      }
      
      // Only migrate completed sessions
      if (session.end_time && session.duration_minutes) {
        await logFocusSession(session);
        migrated++;
      }
    }
    
    if (migrated > 0) {
      console.log(`[Analytics] Migrated ${migrated} existing sessions`);
    }
  } catch (error) {
    console.error('[Analytics] Error migrating existing sessions:', error);
  }
}
