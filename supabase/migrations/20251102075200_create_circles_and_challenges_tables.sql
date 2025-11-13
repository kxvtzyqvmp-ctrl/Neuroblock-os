/*
  # Create Community Circles and Challenges Tables

  1. New Tables
    - `detox_circles`
      - `id` (uuid, primary key)
      - `invite_code` (text, unique) - 6-digit code for joining
      - `member_ids` (text[]) - array of member profile IDs
      - `created_at` (timestamptz)
      - `hours_saved_today` (numeric) - collective hours
      - `average_streak` (numeric) - average circle streak
      - `ai_reflection` (text) - daily AI message
      - `reflection_updated_at` (timestamptz)
    
    - `circle_messages`
      - `id` (uuid, primary key)
      - `circle_id` (uuid) - references detox_circles
      - `sender_id` (text) - profile ID or display name
      - `message_type` (text) - encouragement, system
      - `message_text` (text) - max 100 chars
      - `created_at` (timestamptz)
    
    - `detox_challenges`
      - `id` (uuid, primary key)
      - `challenge_type` (text) - social_media_fast, mindful_mornings, etc.
      - `title` (text)
      - `description` (text)
      - `duration_days` (integer)
      - `start_date` (date)
      - `end_date` (date)
      - `status` (text) - active, completed, failed
      - `is_circle_challenge` (boolean) - group or solo
      - `circle_id` (uuid, nullable)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `challenge_participants`
      - `id` (uuid, primary key)
      - `challenge_id` (uuid)
      - `user_profile_id` (text)
      - `completion_percentage` (numeric)
      - `current_day` (integer)
      - `daily_check_ins` (jsonb) - array of check-in data
      - `joined_at` (timestamptz)
      - `completed_at` (timestamptz, nullable)
    
    - `challenge_ai_messages`
      - `id` (uuid, primary key)
      - `challenge_id` (uuid)
      - `day_number` (integer)
      - `message_text` (text)
      - `message_type` (text) - motivation, progress, reflection
      - `created_at` (timestamptz)
  
  2. Security
    - Enable RLS on all tables
    - Allow all operations for now (auth will be added later)
  
  3. Notes
    - Circles limited to 8 members maximum
    - Challenges can be 1-7 days
    - AI generates daily messages for challenges
    - Circle stats update daily
*/

CREATE TABLE IF NOT EXISTS detox_circles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invite_code text UNIQUE NOT NULL,
  member_ids text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  hours_saved_today numeric(10,2) DEFAULT 0,
  average_streak numeric(5,2) DEFAULT 0,
  ai_reflection text DEFAULT 'Welcome to your Detox Circle!',
  reflection_updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS circle_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  circle_id uuid NOT NULL REFERENCES detox_circles(id) ON DELETE CASCADE,
  sender_id text NOT NULL,
  message_type text NOT NULL DEFAULT 'encouragement',
  message_text text NOT NULL,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT message_length_check CHECK (length(message_text) <= 100)
);

CREATE TABLE IF NOT EXISTS detox_challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_type text NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  duration_days integer NOT NULL DEFAULT 3,
  start_date date NOT NULL,
  end_date date NOT NULL,
  status text NOT NULL DEFAULT 'active',
  is_circle_challenge boolean DEFAULT false,
  circle_id uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT duration_check CHECK (duration_days >= 1 AND duration_days <= 7)
);

CREATE TABLE IF NOT EXISTS challenge_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id uuid NOT NULL REFERENCES detox_challenges(id) ON DELETE CASCADE,
  user_profile_id text NOT NULL,
  completion_percentage numeric(5,2) DEFAULT 0,
  current_day integer DEFAULT 1,
  daily_check_ins jsonb DEFAULT '[]',
  joined_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  UNIQUE(challenge_id, user_profile_id)
);

CREATE TABLE IF NOT EXISTS challenge_ai_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id uuid NOT NULL REFERENCES detox_challenges(id) ON DELETE CASCADE,
  day_number integer NOT NULL,
  message_text text NOT NULL,
  message_type text NOT NULL DEFAULT 'motivation',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE detox_circles ENABLE ROW LEVEL SECURITY;
ALTER TABLE circle_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE detox_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_ai_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on detox_circles"
  ON detox_circles
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations on circle_messages"
  ON circle_messages
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations on detox_challenges"
  ON detox_challenges
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations on challenge_participants"
  ON challenge_participants
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations on challenge_ai_messages"
  ON challenge_ai_messages
  FOR ALL
  USING (true)
  WITH CHECK (true);