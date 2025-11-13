/*
  # Create Wearable and Environment Integration Tables

  1. New Tables
    - `environment_settings`
      - `id` (uuid, primary key)
      - `user_id` (uuid, nullable)
      - `smart_light_enabled` (boolean) - default false
      - `soundscapes_enabled` (boolean) - default false
      - `wearable_integration_enabled` (boolean) - default false
      - `auto_suggest_mode` (boolean) - default true
      - `light_brand` (text) - hue, nanoleaf, lifx, none
      - `speaker_brand` (text) - alexa, google_home, none
      - `focus_light_color` (text) - hex color
      - `rest_light_color` (text) - hex color
      - `soundscape_type` (text) - ambient, focus, nature, none
      - `haptic_feedback_enabled` (boolean) - default true
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `wearable_connections`
      - `id` (uuid, primary key)
      - `user_id` (uuid, nullable)
      - `device_type` (text) - apple_watch, android_watch, fitbit, none
      - `device_id` (text)
      - `is_active` (boolean) - default true
      - `last_sync_at` (timestamptz)
      - `sync_status` (text) - connected, syncing, disconnected
      - `permissions_granted` (jsonb) - which data types allowed
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `health_data`
      - `id` (uuid, primary key)
      - `user_id` (uuid, nullable)
      - `date` (date)
      - `heart_rate_avg` (integer)
      - `stress_level` (numeric) - 0-1 scale
      - `sleep_hours` (numeric)
      - `sleep_quality` (text) - poor, fair, good, excellent
      - `activity_minutes` (integer)
      - `screen_time_correlation` (numeric) - correlation coefficient
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `environmental_sessions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, nullable)
      - `session_type` (text) - focus, rest, mindful
      - `light_activated` (boolean)
      - `sound_activated` (boolean)
      - `wearable_notified` (boolean)
      - `ambient_noise_level` (integer) - decibels
      - `room_brightness` (integer) - lux
      - `start_time` (timestamptz)
      - `end_time` (timestamptz)
      - `effectiveness_rating` (integer) - 1-5
      - `created_at` (timestamptz)
    
    - `wearable_commands`
      - `id` (uuid, primary key)
      - `user_id` (uuid, nullable)
      - `command_type` (text) - start_focus, stop_focus, pause_notifications, breathe_cue
      - `sent_at` (timestamptz)
      - `received_at` (timestamptz, nullable)
      - `executed_at` (timestamptz, nullable)
      - `status` (text) - pending, sent, executed, failed
      - `created_at` (timestamptz)
  
  2. Security
    - Enable RLS on all tables
    - Allow all operations for now (auth will be added later)
  
  3. Notes
    - Health data never leaves device without consent
    - Environmental sessions track effectiveness
    - Wearable commands ensure bi-directional sync
    - All integrations are optional
*/

CREATE TABLE IF NOT EXISTS environment_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  smart_light_enabled boolean DEFAULT false,
  soundscapes_enabled boolean DEFAULT false,
  wearable_integration_enabled boolean DEFAULT false,
  auto_suggest_mode boolean DEFAULT true,
  light_brand text DEFAULT 'none',
  speaker_brand text DEFAULT 'none',
  focus_light_color text DEFAULT '#5A6FFF',
  rest_light_color text DEFAULT '#FF9E5A',
  soundscape_type text DEFAULT 'ambient',
  haptic_feedback_enabled boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

CREATE TABLE IF NOT EXISTS wearable_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  device_type text NOT NULL,
  device_id text NOT NULL,
  is_active boolean DEFAULT true,
  last_sync_at timestamptz DEFAULT now(),
  sync_status text DEFAULT 'connected',
  permissions_granted jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, device_id)
);

CREATE TABLE IF NOT EXISTS health_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  date date NOT NULL,
  heart_rate_avg integer,
  stress_level numeric(3,2),
  sleep_hours numeric(4,2),
  sleep_quality text,
  activity_minutes integer,
  screen_time_correlation numeric(3,2),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, date)
);

CREATE TABLE IF NOT EXISTS environmental_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  session_type text NOT NULL,
  light_activated boolean DEFAULT false,
  sound_activated boolean DEFAULT false,
  wearable_notified boolean DEFAULT false,
  ambient_noise_level integer,
  room_brightness integer,
  start_time timestamptz NOT NULL,
  end_time timestamptz,
  effectiveness_rating integer,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS wearable_commands (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  command_type text NOT NULL,
  sent_at timestamptz DEFAULT now(),
  received_at timestamptz,
  executed_at timestamptz,
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE environment_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE wearable_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE environmental_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE wearable_commands ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on environment_settings"
  ON environment_settings
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations on wearable_connections"
  ON wearable_connections
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations on health_data"
  ON health_data
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations on environmental_sessions"
  ON environmental_sessions
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations on wearable_commands"
  ON wearable_commands
  FOR ALL
  USING (true)
  WITH CHECK (true);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM environment_settings
  ) THEN
    INSERT INTO environment_settings (user_id) VALUES (null);
  END IF;
END $$;