/*
  # Create User Subscriptions Table

  1. New Tables
    - `user_subscriptions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, nullable - for future auth integration)
      - `plan` (text) - free, premium
      - `billing_cycle` (text) - monthly, yearly, lifetime
      - `start_date` (timestamptz)
      - `end_date` (timestamptz, nullable)
      - `is_active` (boolean)
      - `price_paid` (numeric) - amount paid for subscription
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
  
  2. Security
    - Enable RLS on `user_subscriptions` table
    - Allow all operations for now (auth will be added later)
  
  3. Notes
    - Default plan is 'free'
    - Premium features unlocked when plan='premium' and is_active=true
*/

CREATE TABLE IF NOT EXISTS user_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  plan text NOT NULL DEFAULT 'free',
  billing_cycle text,
  start_date timestamptz DEFAULT now(),
  end_date timestamptz,
  is_active boolean NOT NULL DEFAULT true,
  price_paid numeric(10,2),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on user_subscriptions"
  ON user_subscriptions
  FOR ALL
  USING (true)
  WITH CHECK (true);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM user_subscriptions WHERE plan = 'free'
  ) THEN
    INSERT INTO user_subscriptions (plan, is_active) 
    VALUES ('free', true);
  END IF;
END $$;