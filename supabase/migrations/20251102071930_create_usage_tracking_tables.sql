/*
  # Create Usage Tracking and Session Tables

  1. New Tables
    - `focus_sessions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, nullable)
      - `start_time` (timestamptz)
      - `end_time` (timestamptz, nullable)
      - `duration_minutes` (integer, nullable)
      - `created_at` (timestamptz)
    
    - `daily_stats`
      - `id` (uuid, primary key)
      - `user_id` (uuid, nullable)
      - `date` (date)
      - `time_saved_minutes` (integer) - calculated time saved from blocking
      - `mindful_pauses_count` (integer) - times user waited instead of bypassing
      - `apps_opened_count` (integer) - total app open attempts
      - `focus_minutes` (integer) - total focus session time
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `ai_insights`
      - `id` (uuid, primary key)
      - `user_id` (uuid, nullable)
      - `insight_text` (text)
      - `insight_type` (text) - progress, streak, suggestion
      - `is_read` (boolean)
      - `created_at` (timestamptz)
  
  2. Security
    - Enable RLS on all tables
    - Allow all operations for now (auth will be added later)
*/

CREATE TABLE IF NOT EXISTS focus_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  start_time timestamptz NOT NULL DEFAULT now(),
  end_time timestamptz,
  duration_minutes integer,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS daily_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  date date NOT NULL DEFAULT CURRENT_DATE,
  time_saved_minutes integer NOT NULL DEFAULT 0,
  mindful_pauses_count integer NOT NULL DEFAULT 0,
  apps_opened_count integer NOT NULL DEFAULT 0,
  focus_minutes integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, date)
);

CREATE TABLE IF NOT EXISTS ai_insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  insight_text text NOT NULL,
  insight_type text NOT NULL DEFAULT 'suggestion',
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE focus_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on focus_sessions"
  ON focus_sessions
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations on daily_stats"
  ON daily_stats
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations on ai_insights"
  ON ai_insights
  FOR ALL
  USING (true)
  WITH CHECK (true);