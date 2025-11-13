/*
  # Create Analytics and Cloud Sync Tables

  1. New Tables
    - `user_analytics`
      - `id` (uuid, primary key)
      - `user_id` (uuid, nullable)
      - `week_start_date` (date)
      - `weekly_focus_hours` (jsonb) - array of daily hours
      - `avg_mood` (text)
      - `top_apps` (text[]) - most used apps
      - `total_time_saved_hours` (numeric)
      - `streak_days` (integer)
      - `screen_time_reduction_percent` (numeric)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `weekly_reports`
      - `id` (uuid, primary key)
      - `user_id` (uuid, nullable)
      - `week_number` (integer)
      - `year` (integer)
      - `summary_text` (text)
      - `insights` (jsonb)
      - `milestones_reached` (text[])
      - `generated_at` (timestamptz)
    
    - `sync_metadata`
      - `id` (uuid, primary key)
      - `user_id` (uuid, nullable)
      - `last_sync_at` (timestamptz)
      - `sync_status` (text) - success, pending, failed
      - `device_id` (text)
      - `data_version` (integer)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `mood_logs`
      - `id` (uuid, primary key)
      - `user_id` (uuid, nullable)
      - `date` (date)
      - `mood` (text) - happy, calm, neutral, stressed, frustrated
      - `mood_emoji` (text)
      - `note` (text, nullable)
      - `focus_time_minutes` (integer)
      - `created_at` (timestamptz)
    
    - `data_export_requests`
      - `id` (uuid, primary key)
      - `user_id` (uuid, nullable)
      - `request_type` (text) - export, delete
      - `status` (text) - pending, completed, failed
      - `export_url` (text, nullable)
      - `requested_at` (timestamptz)
      - `completed_at` (timestamptz, nullable)
  
  2. Security
    - Enable RLS on all tables
    - Allow all operations for now (auth will be added later)
  
  3. Notes
    - Analytics calculated weekly
    - Sync metadata tracks last successful sync
    - Mood logs correlate with focus performance
    - Data export supports GDPR compliance
*/

CREATE TABLE IF NOT EXISTS user_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  week_start_date date NOT NULL,
  weekly_focus_hours jsonb DEFAULT '[]',
  avg_mood text,
  top_apps text[] DEFAULT '{}',
  total_time_saved_hours numeric(10,2) DEFAULT 0,
  streak_days integer DEFAULT 0,
  screen_time_reduction_percent numeric(5,2) DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, week_start_date)
);

CREATE TABLE IF NOT EXISTS weekly_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  week_number integer NOT NULL,
  year integer NOT NULL,
  summary_text text NOT NULL,
  insights jsonb DEFAULT '{}',
  milestones_reached text[] DEFAULT '{}',
  generated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, week_number, year)
);

CREATE TABLE IF NOT EXISTS sync_metadata (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  last_sync_at timestamptz DEFAULT now(),
  sync_status text NOT NULL DEFAULT 'success',
  device_id text,
  data_version integer DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, device_id)
);

CREATE TABLE IF NOT EXISTS mood_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  date date NOT NULL,
  mood text NOT NULL,
  mood_emoji text NOT NULL,
  note text,
  focus_time_minutes integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, date)
);

CREATE TABLE IF NOT EXISTS data_export_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  request_type text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  export_url text,
  requested_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

ALTER TABLE user_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE mood_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_export_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on user_analytics"
  ON user_analytics
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations on weekly_reports"
  ON weekly_reports
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations on sync_metadata"
  ON sync_metadata
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations on mood_logs"
  ON mood_logs
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations on data_export_requests"
  ON data_export_requests
  FOR ALL
  USING (true)
  WITH CHECK (true);