/**
 * Schedule Storage
 * 
 * Manages storage for recurring schedules including:
 * - Schedule creation, editing, deletion
 * - Schedule activation/deactivation
 * - Persistence to AsyncStorage
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  SCHEDULES: '@neuroblock:schedules',
  ACTIVE_SCHEDULE: '@neuroblock:active_schedule',
} as const;

// Types
export interface Schedule {
  id: string;
  name: string;
  isActive: boolean;
  blockedApps: string[];
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
  daysOfWeek: number[]; // 0 = Sunday, 6 = Saturday
  createdAt: string;
  updatedAt: string;
}

export interface ScheduleFormData {
  name: string;
  blockedApps: string[];
  startTime: string;
  endTime: string;
  daysOfWeek: number[];
}

// Generate unique ID
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Get all schedules
export async function getAllSchedules(): Promise<Schedule[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.SCHEDULES);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('[ScheduleStorage] Error getting schedules:', error);
    return [];
  }
}

// Get a single schedule by ID
export async function getSchedule(id: string): Promise<Schedule | null> {
  try {
    const schedules = await getAllSchedules();
    return schedules.find(s => s.id === id) || null;
  } catch (error) {
    console.error('[ScheduleStorage] Error getting schedule:', error);
    return null;
  }
}

// Create a new schedule
export async function createSchedule(data: ScheduleFormData): Promise<Schedule> {
  try {
    const schedules = await getAllSchedules();
    
    const newSchedule: Schedule = {
      id: generateId(),
      name: data.name,
      isActive: false,
      blockedApps: data.blockedApps,
      startTime: data.startTime,
      endTime: data.endTime,
      daysOfWeek: data.daysOfWeek,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    schedules.push(newSchedule);
    await AsyncStorage.setItem(STORAGE_KEYS.SCHEDULES, JSON.stringify(schedules));
    
    console.log('[ScheduleStorage] Created schedule:', newSchedule.id);
    return newSchedule;
  } catch (error) {
    console.error('[ScheduleStorage] Error creating schedule:', error);
    throw error;
  }
}

// Update an existing schedule
export async function updateSchedule(id: string, updates: Partial<ScheduleFormData>): Promise<Schedule | null> {
  try {
    const schedules = await getAllSchedules();
    const index = schedules.findIndex(s => s.id === id);
    
    if (index === -1) {
      console.warn('[ScheduleStorage] Schedule not found:', id);
      return null;
    }
    
    schedules[index] = {
      ...schedules[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    
    await AsyncStorage.setItem(STORAGE_KEYS.SCHEDULES, JSON.stringify(schedules));
    
    console.log('[ScheduleStorage] Updated schedule:', id);
    return schedules[index];
  } catch (error) {
    console.error('[ScheduleStorage] Error updating schedule:', error);
    throw error;
  }
}

// Delete a schedule
export async function deleteSchedule(id: string): Promise<boolean> {
  try {
    const schedules = await getAllSchedules();
    const filtered = schedules.filter(s => s.id !== id);
    
    if (filtered.length === schedules.length) {
      console.warn('[ScheduleStorage] Schedule not found for deletion:', id);
      return false;
    }
    
    await AsyncStorage.setItem(STORAGE_KEYS.SCHEDULES, JSON.stringify(filtered));
    
    // Clear active schedule if it was deleted
    const activeId = await getActiveScheduleId();
    if (activeId === id) {
      await setActiveSchedule(null);
    }
    
    console.log('[ScheduleStorage] Deleted schedule:', id);
    return true;
  } catch (error) {
    console.error('[ScheduleStorage] Error deleting schedule:', error);
    return false;
  }
}

// Toggle schedule active state
export async function toggleScheduleActive(id: string): Promise<Schedule | null> {
  try {
    const schedules = await getAllSchedules();
    const schedule = schedules.find(s => s.id === id);
    
    if (!schedule) {
      return null;
    }
    
    // If activating this schedule, deactivate all others
    if (!schedule.isActive) {
      for (const s of schedules) {
        s.isActive = s.id === id;
      }
      await setActiveSchedule(id);
    } else {
      schedule.isActive = false;
      await setActiveSchedule(null);
    }
    
    await AsyncStorage.setItem(STORAGE_KEYS.SCHEDULES, JSON.stringify(schedules));
    
    return schedule;
  } catch (error) {
    console.error('[ScheduleStorage] Error toggling schedule:', error);
    return null;
  }
}

// Get active schedule ID
export async function getActiveScheduleId(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(STORAGE_KEYS.ACTIVE_SCHEDULE);
  } catch (error) {
    console.error('[ScheduleStorage] Error getting active schedule:', error);
    return null;
  }
}

// Set active schedule
export async function setActiveSchedule(id: string | null): Promise<void> {
  try {
    if (id) {
      await AsyncStorage.setItem(STORAGE_KEYS.ACTIVE_SCHEDULE, id);
    } else {
      await AsyncStorage.removeItem(STORAGE_KEYS.ACTIVE_SCHEDULE);
    }
  } catch (error) {
    console.error('[ScheduleStorage] Error setting active schedule:', error);
  }
}

// Get currently active schedule
export async function getActiveSchedule(): Promise<Schedule | null> {
  try {
    const id = await getActiveScheduleId();
    if (!id) return null;
    return await getSchedule(id);
  } catch (error) {
    console.error('[ScheduleStorage] Error getting active schedule:', error);
    return null;
  }
}

// Check if current time is within schedule
export function isWithinSchedule(schedule: Schedule): boolean {
  const now = new Date();
  const currentDay = now.getDay();
  
  // Check if today is a scheduled day
  if (!schedule.daysOfWeek.includes(currentDay)) {
    return false;
  }
  
  // Parse start and end times
  const [startHour, startMin] = schedule.startTime.split(':').map(Number);
  const [endHour, endMin] = schedule.endTime.split(':').map(Number);
  
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;
  
  // Handle overnight schedules
  if (endMinutes < startMinutes) {
    // Schedule spans midnight
    return currentMinutes >= startMinutes || currentMinutes < endMinutes;
  }
  
  return currentMinutes >= startMinutes && currentMinutes < endMinutes;
}

// Get the next scheduled time
export function getNextScheduledTime(schedule: Schedule): Date | null {
  const now = new Date();
  const currentDay = now.getDay();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  
  const [startHour, startMin] = schedule.startTime.split(':').map(Number);
  const startMinutes = startHour * 60 + startMin;
  
  // Sort days of week
  const sortedDays = [...schedule.daysOfWeek].sort((a, b) => a - b);
  
  // Find next occurrence
  for (let i = 0; i < 7; i++) {
    const checkDay = (currentDay + i) % 7;
    
    if (sortedDays.includes(checkDay)) {
      // If it's today, check if start time is in the future
      if (i === 0 && currentMinutes >= startMinutes) {
        continue;
      }
      
      const nextDate = new Date(now);
      nextDate.setDate(now.getDate() + i);
      nextDate.setHours(startHour, startMin, 0, 0);
      
      return nextDate;
    }
  }
  
  return null;
}

// Get formatted schedule time string
export function formatScheduleTime(schedule: Schedule): string {
  const formatTime = (time: string) => {
    const [hour, minute] = time.split(':').map(Number);
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`;
  };
  
  return `${formatTime(schedule.startTime)} - ${formatTime(schedule.endTime)}`;
}

// Get formatted days string
export function formatScheduleDays(days: number[]): string {
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  if (days.length === 7) return 'Every day';
  if (days.length === 5 && !days.includes(0) && !days.includes(6)) return 'Weekdays';
  if (days.length === 2 && days.includes(0) && days.includes(6)) return 'Weekends';
  
  return days.sort((a, b) => a - b).map(d => dayNames[d]).join(', ');
}

// Reset all schedules (for testing/reset)
export async function resetSchedules(): Promise<void> {
  try {
    await Promise.all([
      AsyncStorage.removeItem(STORAGE_KEYS.SCHEDULES),
      AsyncStorage.removeItem(STORAGE_KEYS.ACTIVE_SCHEDULE),
    ]);
    console.log('[ScheduleStorage] Reset all schedules');
  } catch (error) {
    console.error('[ScheduleStorage] Error resetting schedules:', error);
  }
}

