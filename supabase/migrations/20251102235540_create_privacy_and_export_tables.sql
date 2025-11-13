/*
  # Create Privacy and Export Tables

  1. New Tables
    - `privacy_settings`
      - `id` (uuid, primary key)
      - `user_id` (uuid, nullable - for future auth)
      - `analytics_enabled` (boolean) - Anonymous usage analytics
      - `crash_reports_enabled` (boolean) - Automatic crash reporting
      - `usage_data_collection` (boolean) - Collect usage data for insights
      - `share_anonymous_data` (boolean) - Share data for research
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `data_exports`
      - `id` (uuid, primary key)
      - `user_id` (uuid, nullable - for future auth)
      - `export_type` (text) - json, csv, pdf
      - `export_data` (jsonb) - The exported data
      - `created_at` (timestamp)
  
  2. Security
    - Enable RLS on all tables
    - Allow all operations for now (auth will be added later)
*/

CREATE TABLE IF NOT EXISTS privacy_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  analytics_enabled boolean NOT NULL DEFAULT true,
  crash_reports_enabled boolean NOT NULL DEFAULT true,
  usage_data_collection boolean NOT NULL DEFAULT true,
  share_anonymous_data boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS data_exports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  export_type text NOT NULL,
  export_data jsonb NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE privacy_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_exports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on privacy_settings"
  ON privacy_settings FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations on data_exports"
  ON data_exports FOR ALL
  USING (true)
  WITH CHECK (true);
