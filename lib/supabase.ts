import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';
import 'react-native-url-polyfill/auto';

const supabaseUrl = Constants.expoConfig?.extra?.EXPO_PUBLIC_SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = Constants.expoConfig?.extra?.EXPO_PUBLIC_SUPABASE_ANON_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
