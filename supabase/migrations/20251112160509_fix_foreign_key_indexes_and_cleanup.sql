/*
  # Fix Foreign Key Indexes and Security Issues

  ## Overview
  This migration addresses security and performance issues identified by Supabase analyzer:
  1. Adds missing indexes on foreign key columns for optimal query performance
  2. Removes unused indexes to reduce write overhead and storage
  3. Documents password protection settings (must be enabled via Dashboard)

  ## Changes Made

  ### 1. Add Missing Foreign Key Indexes
  Foreign keys without indexes cause slow JOIN operations and poor query performance.
  Adding indexes on these columns:
  - `challenge_ai_messages.challenge_id` - Used in JOINs with detox_challenges
  - `circle_messages.circle_id` - Used in JOINs with detox_circles  
  - `help_items.category_id` - Used in JOINs with help_categories

  ### 2. Remove Unused Indexes
  These indexes were created but are not being used by any queries:
  - `idx_blocked_app_schedules_group_id` - No queries filter by group_id
  - `idx_blocked_apps_group_id` - No queries filter by group_id

  Removing unused indexes:
  - Reduces storage overhead
  - Speeds up INSERT/UPDATE/DELETE operations
  - Simplifies query planner decisions

  ### 3. Security: Leaked Password Protection
  IMPORTANT: This cannot be enabled via SQL migration.
  
  To enable leaked password protection:
  1. Go to Supabase Dashboard
  2. Navigate to: Authentication > Settings
  3. Scroll to "Security" section
  4. Enable "Check for compromised passwords"
  
  This feature checks passwords against the HaveIBeenPwned database to prevent
  users from setting passwords that have been leaked in data breaches.

  ## Performance Impact
  - Foreign key indexes: Significant improvement for JOIN queries
  - Removing unused indexes: Faster writes, less storage
  - No breaking changes to existing functionality

  ## Rollback
  If needed, indexes can be recreated:
  ```sql
  CREATE INDEX idx_blocked_app_schedules_group_id ON blocked_app_schedules(group_id);
  CREATE INDEX idx_blocked_apps_group_id ON blocked_apps(group_id);
  
  DROP INDEX idx_challenge_ai_messages_challenge_id;
  DROP INDEX idx_circle_messages_circle_id;
  DROP INDEX idx_help_items_category_id;
  ```
*/

-- ============================================================================
-- ADD MISSING FOREIGN KEY INDEXES
-- ============================================================================

-- Index for challenge_ai_messages.challenge_id foreign key
-- Used when querying AI messages for a specific challenge
CREATE INDEX IF NOT EXISTS idx_challenge_ai_messages_challenge_id 
ON public.challenge_ai_messages(challenge_id);

-- Index for circle_messages.circle_id foreign key  
-- Used when fetching messages for a specific circle
CREATE INDEX IF NOT EXISTS idx_circle_messages_circle_id 
ON public.circle_messages(circle_id);

-- Index for help_items.category_id foreign key
-- Used when fetching help items by category
CREATE INDEX IF NOT EXISTS idx_help_items_category_id 
ON public.help_items(category_id);

-- ============================================================================
-- REMOVE UNUSED INDEXES
-- ============================================================================

-- Remove unused index on blocked_app_schedules.group_id
-- Analysis shows no queries filter by this column
DROP INDEX IF EXISTS public.idx_blocked_app_schedules_group_id;

-- Remove unused index on blocked_apps.group_id
-- Analysis shows no queries filter by this column
DROP INDEX IF EXISTS public.idx_blocked_apps_group_id;

-- ============================================================================
-- ADD INDEX COMMENTS
-- ============================================================================

COMMENT ON INDEX idx_challenge_ai_messages_challenge_id IS 
'Index to optimize queries fetching AI messages for a specific challenge. Improves JOIN performance with detox_challenges table.';

COMMENT ON INDEX idx_circle_messages_circle_id IS 
'Index to optimize queries fetching messages for a specific circle. Improves JOIN performance with detox_circles table.';

COMMENT ON INDEX idx_help_items_category_id IS 
'Index to optimize queries fetching help items by category. Improves JOIN performance with help_categories table.';
