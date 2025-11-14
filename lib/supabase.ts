import { createClient, SupabaseClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';
import 'react-native-url-polyfill/auto';

// Get Supabase configuration from environment variables or expo config
const supabaseUrl = 
  Constants.expoConfig?.extra?.EXPO_PUBLIC_SUPABASE_URL || 
  process.env.EXPO_PUBLIC_SUPABASE_URL ||
  'https://placeholder.supabase.co'; // Fallback for development

const supabaseAnonKey = 
  Constants.expoConfig?.extra?.EXPO_PUBLIC_SUPABASE_ANON_KEY || 
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'; // Placeholder key for development

// Check if we have valid Supabase credentials (not placeholders)
const hasValidConfig = 
  supabaseUrl && 
  supabaseUrl !== 'https://placeholder.supabase.co' &&
  supabaseUrl.startsWith('https://') &&
  supabaseAnonKey && 
  supabaseAnonKey !== 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

// Create Supabase client with fallback values if configuration is missing
// This prevents the app from crashing when Supabase isn't configured
let supabase: SupabaseClient;

try {
  // Always provide valid-looking URLs to pass Supabase validation
  // The client will be created but won't work if using placeholder values
  supabase = createClient(supabaseUrl, supabaseAnonKey);
  
  if (!hasValidConfig) {
    console.warn('[Supabase] Using placeholder configuration. Supabase features will not work. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY to enable.');
  }
} catch (error) {
  console.error('[Supabase] Failed to create client:', error);
  // Create a minimal client that won't crash but won't work
  supabase = createClient('https://placeholder.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0') as SupabaseClient;
}

export { supabase };

// Export a helper to check if Supabase is properly configured
export const isSupabaseConfigured = (): boolean => {
  return hasValidConfig;
};

export interface DetoxSettings {
  id: string;
  user_id: string | null;
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

export interface FocusSession {
  id: string;
  user_id: string | null;
  start_time: string;
  end_time: string | null;
  duration_minutes: number | null;
  created_at: string;
}

export interface DailyStats {
  id: string;
  user_id: string | null;
  date: string;
  time_saved_minutes: number;
  mindful_pauses_count: number;
  apps_opened_count: number;
  focus_minutes: number;
  created_at: string;
  updated_at: string;
}

export interface AIInsight {
  id: string;
  user_id: string | null;
  insight_text: string;
  insight_type: 'progress' | 'streak' | 'suggestion';
  is_read: boolean;
  created_at: string;
}

export interface UserSubscription {
  id: string;
  user_id: string | null;
  plan: 'free' | 'premium';
  billing_cycle: 'monthly' | 'yearly' | 'lifetime' | null;
  start_date: string;
  end_date: string | null;
  is_active: boolean;
  price_paid: number | null;
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  id: string;
  user_id: string | null;
  role: 'parent' | 'child' | null;
  linked_user_id: string | null;
  display_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface LinkedAccount {
  id: string;
  parent_id: string;
  child_id: string | null;
  pairing_code: string | null;
  status: 'pending' | 'active' | 'unlinked';
  created_at: string;
  updated_at: string;
}

export interface LinkHistory {
  id: string;
  linked_account_id: string;
  action: 'linked' | 'unlinked' | 'settings_updated';
  performed_by: 'parent' | 'child';
  details: any;
  created_at: string;
}
