/*
  # Create Parent/Child Linking Tables

  1. New Tables
    - `user_profiles`
      - `id` (uuid, primary key)
      - `user_id` (uuid, nullable)
      - `role` (text) - parent, child, or null (standalone)
      - `linked_user_id` (uuid, nullable) - ID of linked account
      - `display_name` (text) - optional display name
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `linked_accounts`
      - `id` (uuid, primary key)
      - `parent_id` (uuid) - parent's user profile ID
      - `child_id` (uuid) - child's user profile ID
      - `pairing_code` (text, nullable) - 6-digit code for pairing
      - `status` (text) - pending, active, unlinked
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `link_history`
      - `id` (uuid, primary key)
      - `linked_account_id` (uuid)
      - `action` (text) - linked, unlinked, settings_updated
      - `performed_by` (text) - parent or child
      - `details` (jsonb) - additional action details
      - `created_at` (timestamptz)
  
  2. Security
    - Enable RLS on all tables
    - Allow all operations for now (auth will be added later)
  
  3. Notes
    - Default role is null (standalone user)
    - Pairing codes are temporary and expire
    - Child inherits parent's premium subscription
*/

CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  role text,
  linked_user_id uuid,
  display_name text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS linked_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id uuid NOT NULL,
  child_id uuid,
  pairing_code text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS link_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  linked_account_id uuid NOT NULL,
  action text NOT NULL,
  performed_by text NOT NULL,
  details jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE linked_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE link_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on user_profiles"
  ON user_profiles
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations on linked_accounts"
  ON linked_accounts
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations on link_history"
  ON link_history
  FOR ALL
  USING (true)
  WITH CHECK (true);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM user_profiles WHERE role IS NULL
  ) THEN
    INSERT INTO user_profiles (role) 
    VALUES (null);
  END IF;
END $$;