/**
 * Local Community Storage
 * 
 * Offline-first storage for community features (circles, challenges, messages).
 * Replaces Supabase database calls with AsyncStorage.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage keys
const STORAGE_KEYS = {
  GUEST_PROFILE: '@neuroblock:guest_profile',
  DETOX_CIRCLES: '@neuroblock:detox_circles',
  CHALLENGES: '@neuroblock:challenges',
  CHALLENGE_PARTICIPANTS: '@neuroblock:challenge_participants',
  CIRCLE_MESSAGES: '@neuroblock:circle_messages',
} as const;

// Guest Profile Interface
export interface GuestProfile {
  id: string;
  name: string;
  display_name: string;
  streak_count: number;
  challenge_history: string[];
  created_at: string;
  updated_at: string;
}

// Detox Circle
export interface DetoxCircle {
  id: string;
  invite_code: string;
  ai_reflection: string;
  hours_saved_today: number;
  average_streak: number;
  member_ids: string[];
  created_at: string;
  updated_at: string;
}

// Detox Challenge
export interface DetoxChallenge {
  id: string;
  challenge_type: string;
  title: string;
  description: string;
  duration_days: number;
  start_date: string;
  end_date: string;
  is_circle_challenge: boolean;
  circle_id: string | null;
  status: 'active' | 'completed' | 'abandoned';
  created_at: string;
}

// Challenge Participant
export interface ChallengeParticipant {
  id: string;
  challenge_id: string;
  user_profile_id: string;
  current_day: number;
  completion_percentage: number;
  created_at: string;
  updated_at: string;
}

// Circle Message
export interface CircleMessage {
  id: string;
  circle_id: string;
  sender_id: string;
  message_text: string;
  created_at: string;
}

// Get or create guest profile
export async function getGuestProfile(): Promise<GuestProfile> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.GUEST_PROFILE);
    if (data) {
      return JSON.parse(data);
    }

    // Create default guest profile
    const guestProfile: GuestProfile = {
      id: 'local-user',
      name: 'Guest',
      display_name: 'Guest User',
      streak_count: 0,
      challenge_history: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    await AsyncStorage.setItem(STORAGE_KEYS.GUEST_PROFILE, JSON.stringify(guestProfile));
    return guestProfile;
  } catch (error) {
    console.error('[LocalCommunity] Error getting guest profile:', error);
    // Return default profile on error
    return {
      id: 'local-user',
      name: 'Guest',
      display_name: 'Guest User',
      streak_count: 0,
      challenge_history: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }
}

export async function updateGuestProfile(updates: Partial<GuestProfile>): Promise<void> {
  try {
    const profile = await getGuestProfile();
    const updated = {
      ...profile,
      ...updates,
      updated_at: new Date().toISOString(),
    };
    await AsyncStorage.setItem(STORAGE_KEYS.GUEST_PROFILE, JSON.stringify(updated));
  } catch (error) {
    console.error('[LocalCommunity] Error updating guest profile:', error);
  }
}

// Detox Circles
export async function getAllCircles(): Promise<Record<string, DetoxCircle>> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.DETOX_CIRCLES);
    return data ? JSON.parse(data) : {};
  } catch (error) {
    console.error('[LocalCommunity] Error getting circles:', error);
    return {};
  }
}

export async function saveCircle(circle: DetoxCircle): Promise<void> {
  try {
    const circles = await getAllCircles();
    circles[circle.id] = circle;
    await AsyncStorage.setItem(STORAGE_KEYS.DETOX_CIRCLES, JSON.stringify(circles));
  } catch (error) {
    console.error('[LocalCommunity] Error saving circle:', error);
  }
}

export async function deleteCircle(circleId: string): Promise<void> {
  try {
    const circles = await getAllCircles();
    delete circles[circleId];
    await AsyncStorage.setItem(STORAGE_KEYS.DETOX_CIRCLES, JSON.stringify(circles));
  } catch (error) {
    console.error('[LocalCommunity] Error deleting circle:', error);
  }
}

// Challenges
export async function getAllChallenges(): Promise<Record<string, DetoxChallenge>> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.CHALLENGES);
    return data ? JSON.parse(data) : {};
  } catch (error) {
    console.error('[LocalCommunity] Error getting challenges:', error);
    return {};
  }
}

export async function saveChallenge(challenge: DetoxChallenge): Promise<void> {
  try {
    const challenges = await getAllChallenges();
    challenges[challenge.id] = challenge;
    await AsyncStorage.setItem(STORAGE_KEYS.CHALLENGES, JSON.stringify(challenges));
  } catch (error) {
    console.error('[LocalCommunity] Error saving challenge:', error);
  }
}

// Challenge Participants
export async function getAllParticipants(): Promise<Record<string, ChallengeParticipant>> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.CHALLENGE_PARTICIPANTS);
    return data ? JSON.parse(data) : {};
  } catch (error) {
    console.error('[LocalCommunity] Error getting participants:', error);
    return {};
  }
}

export async function saveParticipant(participant: ChallengeParticipant): Promise<void> {
  try {
    const participants = await getAllParticipants();
    participants[participant.id] = participant;
    await AsyncStorage.setItem(STORAGE_KEYS.CHALLENGE_PARTICIPANTS, JSON.stringify(participants));
  } catch (error) {
    console.error('[LocalCommunity] Error saving participant:', error);
  }
}

// Circle Messages
export async function getCircleMessages(circleId: string): Promise<CircleMessage[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.CIRCLE_MESSAGES);
    const allMessages: Record<string, CircleMessage[]> = data ? JSON.parse(data) : {};
    return allMessages[circleId] || [];
  } catch (error) {
    console.error('[LocalCommunity] Error getting messages:', error);
    return [];
  }
}

export async function saveCircleMessage(message: CircleMessage): Promise<void> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.CIRCLE_MESSAGES);
    const allMessages: Record<string, CircleMessage[]> = data ? JSON.parse(data) : {};
    
    if (!allMessages[message.circle_id]) {
      allMessages[message.circle_id] = [];
    }
    
    allMessages[message.circle_id].push(message);
    // Sort by created_at descending and keep only last 50 messages per circle
    allMessages[message.circle_id].sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    allMessages[message.circle_id] = allMessages[message.circle_id].slice(0, 50);
    
    await AsyncStorage.setItem(STORAGE_KEYS.CIRCLE_MESSAGES, JSON.stringify(allMessages));
  } catch (error) {
    console.error('[LocalCommunity] Error saving message:', error);
  }
}

// Helper: Generate random ID
export function generateId(): string {
  return `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Helper: Generate 6-digit invite code
export function generateInviteCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

