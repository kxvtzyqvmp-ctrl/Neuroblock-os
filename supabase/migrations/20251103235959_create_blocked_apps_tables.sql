/*
  # Blocked Apps and Categories Tables

  1. New Tables
    - `blocked_app_groups`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `name` (text) - Group name like "Weekend Social Media"
      - `is_active` (boolean) - Whether blocking is currently enabled
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `blocked_apps`
      - `id` (uuid, primary key)
      - `group_id` (uuid, references blocked_app_groups)
      - `app_name` (text) - Name of the app
      - `category` (text) - Category like 'social', 'games', etc.
      - `is_blocked` (boolean) - Current blocking status
      - `created_at` (timestamptz)
    
    - `blocked_app_schedules`
      - `id` (uuid, primary key)
      - `group_id` (uuid, references blocked_app_groups)
      - `day_of_week` (text) - 'Su', 'M', 'T', 'W', 'Th', 'F', 'Sa'
      - `is_active` (boolean)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own blocked apps
*/

-- Create blocked_app_groups table
CREATE TABLE IF NOT EXISTS blocked_app_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE blocked_app_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own app groups"
  ON blocked_app_groups FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own app groups"
  ON blocked_app_groups FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own app groups"
  ON blocked_app_groups FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own app groups"
  ON blocked_app_groups FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create blocked_apps table
CREATE TABLE IF NOT EXISTS blocked_apps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid REFERENCES blocked_app_groups(id) ON DELETE CASCADE NOT NULL,
  app_name text NOT NULL,
  category text NOT NULL,
  is_blocked boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE blocked_apps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view apps in own groups"
  ON blocked_apps FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM blocked_app_groups
      WHERE blocked_app_groups.id = blocked_apps.group_id
      AND blocked_app_groups.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert apps in own groups"
  ON blocked_apps FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM blocked_app_groups
      WHERE blocked_app_groups.id = blocked_apps.group_id
      AND blocked_app_groups.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update apps in own groups"
  ON blocked_apps FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM blocked_app_groups
      WHERE blocked_app_groups.id = blocked_apps.group_id
      AND blocked_app_groups.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM blocked_app_groups
      WHERE blocked_app_groups.id = blocked_apps.group_id
      AND blocked_app_groups.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete apps in own groups"
  ON blocked_apps FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM blocked_app_groups
      WHERE blocked_app_groups.id = blocked_apps.group_id
      AND blocked_app_groups.user_id = auth.uid()
    )
  );

-- Create blocked_app_schedules table
CREATE TABLE IF NOT EXISTS blocked_app_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid REFERENCES blocked_app_groups(id) ON DELETE CASCADE NOT NULL,
  day_of_week text NOT NULL,
  is_active boolean DEFAULT true
);

ALTER TABLE blocked_app_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view schedules in own groups"
  ON blocked_app_schedules FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM blocked_app_groups
      WHERE blocked_app_groups.id = blocked_app_schedules.group_id
      AND blocked_app_groups.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert schedules in own groups"
  ON blocked_app_schedules FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM blocked_app_groups
      WHERE blocked_app_groups.id = blocked_app_schedules.group_id
      AND blocked_app_groups.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update schedules in own groups"
  ON blocked_app_schedules FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM blocked_app_groups
      WHERE blocked_app_groups.id = blocked_app_schedules.group_id
      AND blocked_app_groups.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM blocked_app_groups
      WHERE blocked_app_groups.id = blocked_app_schedules.group_id
      AND blocked_app_groups.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete schedules in own groups"
  ON blocked_app_schedules FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM blocked_app_groups
      WHERE blocked_app_groups.id = blocked_app_schedules.group_id
      AND blocked_app_groups.user_id = auth.uid()
    )
  );

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_blocked_app_groups_user_id ON blocked_app_groups(user_id);
CREATE INDEX IF NOT EXISTS idx_blocked_apps_group_id ON blocked_apps(group_id);
CREATE INDEX IF NOT EXISTS idx_blocked_app_schedules_group_id ON blocked_app_schedules(group_id);
