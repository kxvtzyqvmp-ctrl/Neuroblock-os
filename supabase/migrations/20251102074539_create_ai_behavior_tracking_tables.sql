/*
  # Create AI Behavior Tracking Tables

  1. New Tables
    - `user_behavior_patterns`
      - `id` (uuid, primary key)
      - `user_id` (uuid, nullable)
      - `pattern_type` (text) - peak_usage_time, high_risk_app, focus_strength, etc.
      - `pattern_data` (jsonb) - flexible data storage
      - `confidence_score` (numeric) - 0-1 scale
      - `detected_at` (timestamptz)
      - `created_at` (timestamptz)
    
    - `user_streaks`
      - `id` (uuid, primary key)
      - `user_id` (uuid, nullable)
      - `streak_type` (text) - focus, detox_consistency, time_saved
      - `current_streak` (integer)
      - `best_streak` (integer)
      - `last_activity_date` (date)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `ai_conversations`
      - `id` (uuid, primary key)
      - `user_id` (uuid, nullable)
      - `question` (text)
      - `response` (text)
      - `context_used` (jsonb) - data points used to generate response
      - `created_at` (timestamptz)
  
  2. Updates to Existing Tables
    - Modify `ai_insights` to add `insight_category` and `action_data`
  
  3. Security
    - Enable RLS on all tables
    - Allow all operations for now (auth will be added later)
  
  4. Notes
    - AI learns from patterns over time
    - Insights regenerate daily at app open
    - Streak data updates on each successful activity
*/

CREATE TABLE IF NOT EXISTS user_behavior_patterns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  pattern_type text NOT NULL,
  pattern_data jsonb NOT NULL DEFAULT '{}',
  confidence_score numeric(3,2) DEFAULT 0.0,
  detected_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_streaks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  streak_type text NOT NULL,
  current_streak integer NOT NULL DEFAULT 0,
  best_streak integer NOT NULL DEFAULT 0,
  last_activity_date date DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, streak_type)
);

CREATE TABLE IF NOT EXISTS ai_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  question text NOT NULL,
  response text NOT NULL,
  context_used jsonb,
  created_at timestamptz DEFAULT now()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ai_insights' AND column_name = 'insight_category'
  ) THEN
    ALTER TABLE ai_insights ADD COLUMN insight_category text DEFAULT 'general';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ai_insights' AND column_name = 'action_data'
  ) THEN
    ALTER TABLE ai_insights ADD COLUMN action_data jsonb;
  END IF;
END $$;

ALTER TABLE user_behavior_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on user_behavior_patterns"
  ON user_behavior_patterns
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations on user_streaks"
  ON user_streaks
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations on ai_conversations"
  ON ai_conversations
  FOR ALL
  USING (true)
  WITH CHECK (true);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM user_streaks WHERE streak_type = 'focus'
  ) THEN
    INSERT INTO user_streaks (streak_type, current_streak, best_streak) 
    VALUES 
      ('focus', 0, 0),
      ('detox_consistency', 0, 0),
      ('time_saved', 0, 0);
  END IF;
END $$;