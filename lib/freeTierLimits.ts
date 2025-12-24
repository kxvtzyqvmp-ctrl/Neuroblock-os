/**
 * Free Tier Limits
 * 
 * Manages free tier limitations:
 * - 3 free focus sessions total
 * - Tracks completed sessions
 * - Checks if user can start a new session
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const FREE_SESSIONS_KEY = '@neuroblock:free_sessions_count';
const FREE_SESSIONS_LIMIT = 3;

export async function getFreeSessionsCount(): Promise<number> {
  try {
    const count = await AsyncStorage.getItem(FREE_SESSIONS_KEY);
    return count ? parseInt(count, 10) : 0;
  } catch (error) {
    console.error('[FreeTier] Error getting free sessions count:', error);
    return 0;
  }
}

export async function incrementFreeSessionsCount(): Promise<number> {
  try {
    const current = await getFreeSessionsCount();
    const newCount = current + 1;
    await AsyncStorage.setItem(FREE_SESSIONS_KEY, newCount.toString());
    console.log('[FreeTier] Incremented free sessions count to:', newCount);
    return newCount;
  } catch (error) {
    console.error('[FreeTier] Error incrementing free sessions count:', error);
    return 0;
  }
}

export async function canStartFreeSession(): Promise<boolean> {
  try {
    const count = await getFreeSessionsCount();
    return count < FREE_SESSIONS_LIMIT;
  } catch (error) {
    console.error('[FreeTier] Error checking free session limit:', error);
    return true; // Allow on error to not block users
  }
}

export async function resetFreeSessionsCount(): Promise<void> {
  try {
    await AsyncStorage.removeItem(FREE_SESSIONS_KEY);
    console.log('[FreeTier] Reset free sessions count');
  } catch (error) {
    console.error('[FreeTier] Error resetting free sessions count:', error);
  }
}

export const FREE_SESSIONS_LIMIT_VALUE = FREE_SESSIONS_LIMIT;




