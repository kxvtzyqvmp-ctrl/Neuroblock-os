/*
  # Security and Performance Fixes

  ## Changes Made
  
  1. **Add Missing Foreign Key Indexes**
     - Add index on `blocked_app_schedules.group_id` for better join performance
     - Add index on `blocked_apps.group_id` for better join performance
  
  2. **Remove Unused Indexes**
     - Drop `idx_challenge_ai_messages_challenge_id` (unused)
     - Drop `idx_circle_messages_circle_id` (unused)
     - Drop `idx_help_items_category_id` (unused)
  
  3. **Security Notes**
     - Leaked password protection must be enabled via Supabase Dashboard
     - Navigate to: Authentication > Settings > Enable "Check for compromised passwords"
     - This cannot be enabled via SQL migration
  
  ## Performance Impact
  - Foreign key indexes improve JOIN and WHERE clause performance
  - Removing unused indexes reduces write overhead and storage
  - These changes optimize query performance without affecting functionality
*/

-- ============================================================================
-- ADD MISSING FOREIGN KEY INDEXES
-- ============================================================================

-- Add index for blocked_app_schedules.group_id foreign key
CREATE INDEX IF NOT EXISTS idx_blocked_app_schedules_group_id 
ON public.blocked_app_schedules(group_id);

-- Add index for blocked_apps.group_id foreign key
CREATE INDEX IF NOT EXISTS idx_blocked_apps_group_id 
ON public.blocked_apps(group_id);

-- ============================================================================
-- REMOVE UNUSED INDEXES
-- ============================================================================

-- Drop unused index on challenge_ai_messages
DROP INDEX IF EXISTS public.idx_challenge_ai_messages_challenge_id;

-- Drop unused index on circle_messages
DROP INDEX IF EXISTS public.idx_circle_messages_circle_id;

-- Drop unused index on help_items
DROP INDEX IF EXISTS public.idx_help_items_category_id;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON INDEX idx_blocked_app_schedules_group_id IS 
'Index to optimize queries filtering blocked_app_schedules by group_id';

COMMENT ON INDEX idx_blocked_apps_group_id IS 
'Index to optimize queries filtering blocked_apps by group_id';