/*
  # Add Lock Settings to Detox Settings

  1. Changes
    - Add `require_pin` (boolean) - whether PIN is required to change settings
    - Add `pin_hash` (text, nullable) - hashed PIN code for security
    - Add `lock_during_active_hours` (boolean) - lock settings during active hours
    - Add `emergency_unlock_enabled` (boolean) - allow emergency unlock option
    
  2. Notes
    - PIN will be hashed before storage for security
    - Lock settings prevent unauthorized changes to detox settings
    - Emergency unlock provides a safety mechanism
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'detox_settings' AND column_name = 'require_pin'
  ) THEN
    ALTER TABLE detox_settings ADD COLUMN require_pin boolean NOT NULL DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'detox_settings' AND column_name = 'pin_hash'
  ) THEN
    ALTER TABLE detox_settings ADD COLUMN pin_hash text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'detox_settings' AND column_name = 'lock_during_active_hours'
  ) THEN
    ALTER TABLE detox_settings ADD COLUMN lock_during_active_hours boolean NOT NULL DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'detox_settings' AND column_name = 'emergency_unlock_enabled'
  ) THEN
    ALTER TABLE detox_settings ADD COLUMN emergency_unlock_enabled boolean NOT NULL DEFAULT true;
  END IF;
END $$;
