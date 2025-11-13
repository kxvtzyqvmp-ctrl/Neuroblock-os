/*
  # Create Smart Notifications Tables

  1. New Tables
    - `notification_preferences`
      - `id` (uuid, primary key)
      - `user_id` (uuid, nullable)
      - `focus_reminders_enabled` (boolean) - default true
      - `motivation_boosts_enabled` (boolean) - default true
      - `predictive_nudges_enabled` (boolean) - default true
      - `challenge_updates_enabled` (boolean) - default true
      - `checkin_reminders_enabled` (boolean) - default true
      - `quiet_hours_start` (text) - e.g., "22:00"
      - `quiet_hours_end` (text) - e.g., "07:00"
      - `max_daily_notifications` (integer) - default 3
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `notifications`
      - `id` (uuid, primary key)
      - `user_id` (uuid, nullable)
      - `notification_type` (text) - focus, motivation, nudge, checkin, challenge
      - `title` (text)
      - `message` (text)
      - `icon` (text) - emoji or icon name
      - `priority` (text) - high, normal, low
      - `context_data` (jsonb) - additional context
      - `scheduled_for` (timestamptz)
      - `sent_at` (timestamptz, nullable)
      - `read_at` (timestamptz, nullable)
      - `dismissed_at` (timestamptz, nullable)
      - `action_taken` (text, nullable) - pause_apps, remind_later, ignore
      - `created_at` (timestamptz)
    
    - `notification_history`
      - `id` (uuid, primary key)
      - `user_id` (uuid, nullable)
      - `date` (date)
      - `notifications_sent` (integer)
      - `notifications_read` (integer)
      - `notifications_acted` (integer)
      - `created_at` (timestamptz)
    
    - `predictive_patterns`
      - `id` (uuid, primary key)
      - `user_id` (uuid, nullable)
      - `pattern_type` (text) - high_risk_time, app_trigger, mood_dip
      - `time_of_day` (text)
      - `confidence_score` (numeric)
      - `trigger_app` (text, nullable)
      - `detected_at` (timestamptz)
      - `last_occurred` (timestamptz)
      - `occurrence_count` (integer)
      - `created_at` (timestamptz)
  
  2. Security
    - Enable RLS on all tables
    - Allow all operations for now (auth will be added later)
  
  3. Notes
    - Notifications limited to 3 per day by default
    - Quiet hours prevent all notifications
    - Pattern detection runs hourly
    - History tracks engagement metrics
*/

CREATE TABLE IF NOT EXISTS notification_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  focus_reminders_enabled boolean DEFAULT true,
  motivation_boosts_enabled boolean DEFAULT true,
  predictive_nudges_enabled boolean DEFAULT true,
  challenge_updates_enabled boolean DEFAULT true,
  checkin_reminders_enabled boolean DEFAULT true,
  quiet_hours_start text DEFAULT '22:00',
  quiet_hours_end text DEFAULT '07:00',
  max_daily_notifications integer DEFAULT 3,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  notification_type text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  icon text DEFAULT '🔔',
  priority text DEFAULT 'normal',
  context_data jsonb DEFAULT '{}',
  scheduled_for timestamptz DEFAULT now(),
  sent_at timestamptz,
  read_at timestamptz,
  dismissed_at timestamptz,
  action_taken text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS notification_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  date date NOT NULL,
  notifications_sent integer DEFAULT 0,
  notifications_read integer DEFAULT 0,
  notifications_acted integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, date)
);

CREATE TABLE IF NOT EXISTS predictive_patterns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  pattern_type text NOT NULL,
  time_of_day text NOT NULL,
  confidence_score numeric(3,2) DEFAULT 0.5,
  trigger_app text,
  detected_at timestamptz DEFAULT now(),
  last_occurred timestamptz DEFAULT now(),
  occurrence_count integer DEFAULT 1,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE predictive_patterns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on notification_preferences"
  ON notification_preferences
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations on notifications"
  ON notifications
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations on notification_history"
  ON notification_history
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations on predictive_patterns"
  ON predictive_patterns
  FOR ALL
  USING (true)
  WITH CHECK (true);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM notification_preferences
  ) THEN
    INSERT INTO notification_preferences (user_id) VALUES (null);
  END IF;
END $$;