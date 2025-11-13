/*
  # Create Detox Settings Schema

  1. New Tables
    - `detox_settings`
      - `id` (uuid, primary key)
      - `user_id` (uuid, nullable - for future auth integration)
      - `selected_apps` (text array) - list of apps to block
      - `daily_limit_minutes` (integer) - daily usage limit in minutes
      - `active_schedule_type` (text) - work_hours, evenings, custom
      - `active_schedule_start` (time) - start time for detox mode
      - `active_schedule_end` (time) - end time for detox mode
      - `pause_duration_seconds` (integer) - mindful pause duration
      - `is_active` (boolean) - whether detox mode is currently active
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
  
  2. Security
    - Enable RLS on `detox_settings` table
    - For now, allow all operations (auth will be added later)
*/

CREATE TABLE IF NOT EXISTS detox_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  selected_apps text[] NOT NULL DEFAULT '{}',
  daily_limit_minutes integer NOT NULL DEFAULT 60,
  active_schedule_type text NOT NULL DEFAULT 'work_hours',
  active_schedule_start time NOT NULL DEFAULT '09:00:00',
  active_schedule_end time NOT NULL DEFAULT '17:00:00',
  pause_duration_seconds integer NOT NULL DEFAULT 10,
  is_active boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE detox_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations for now"
  ON detox_settings
  FOR ALL
  USING (true)
  WITH CHECK (true);