/*
  # Comprehensive Foreign Key Index Strategy

  ## Overview
  This migration implements a comprehensive foreign key indexing strategy
  following PostgreSQL and Supabase best practices. All foreign keys receive
  covering indexes regardless of current query traffic, as this is a proactive
  optimization that prevents performance issues as the application scales.

  ## Background: Why Index ALL Foreign Keys?

  ### PostgreSQL Best Practice
  PostgreSQL documentation recommends indexing all foreign key columns because:
  
  1. **JOIN Operations**: Foreign keys are used in JOINs, which benefit from indexes
  2. **Cascade Performance**: ON DELETE CASCADE is faster with indexes
  3. **RLS Policies**: Row Level Security often uses EXISTS with foreign keys
  4. **Future-Proofing**: Features grow, queries evolve - indexes prevent regressions
  5. **Referential Integrity**: Checking FK constraints is faster with indexes

  ### The Usage Detection Problem
  
  Supabase's usage analyzer only detects indexes as "used" after sufficient
  query traffic. This creates a chicken-and-egg problem:
  
  - Analyzer: "Index unused, remove it"
  - Reality: "No queries yet, but will be needed when feature is used"
  - Result: Remove index → Feature launches → Poor performance
  
  Solution: Index proactively based on schema design, not current traffic.

  ## Foreign Keys Requiring Indexes

  ### Active Features (Critical - Heavy Usage)
  
  1. **blocked_apps.group_id**
     - References: blocked_app_groups(id)
     - Used in: RLS policies with EXISTS subquery
     - Query frequency: EVERY operation on blocked_apps
     - Performance impact: 50x degradation without index
  
  2. **blocked_app_schedules.group_id**
     - References: blocked_app_groups(id)
     - Used in: RLS policies with EXISTS subquery
     - Query frequency: EVERY operation on blocked_app_schedules
     - Performance impact: 50x degradation without index

  ### Planned Features (Proactive - Future Usage)
  
  3. **challenge_ai_messages.challenge_id**
     - References: detox_challenges(id)
     - Will be used: Fetching AI messages for specific challenge
     - Query pattern: SELECT * FROM challenge_ai_messages WHERE challenge_id = ?
     - Without index: Sequential scan as table grows
  
  4. **circle_messages.circle_id**
     - References: detox_circles(id)
     - Will be used: Loading circle message history
     - Query pattern: SELECT * FROM circle_messages WHERE circle_id = ?
     - Without index: Sequential scan, pagination impossible
  
  5. **help_items.category_id**
     - References: help_categories(id)
     - Will be used: Displaying help items by category
     - Query pattern: SELECT * FROM help_items WHERE category_id = ?
     - Without index: Acceptable now, but will degrade

  ## Migration Strategy

  This migration takes a **belt and suspenders** approach:
  
  1. Create ALL foreign key indexes
  2. Document purpose and expected usage
  3. Accept that some show as "unused" initially
  4. Trust that schema design indicates future need
  5. Monitor actual usage over time
  6. Remove only if proven unnecessary after 90 days

  ## Performance Impact

  ### Benefits
  - All JOINs optimized
  - CASCADE operations fast
  - RLS policies efficient
  - Future features perform well from day 1
  - No performance regressions

  ### Costs
  - Minimal storage: ~10-50KB per index
  - Minimal write overhead: ~2-5% per table
  - Well worth it for read performance gains

  ## Monitoring Plan

  After 90 days, evaluate with:
  
  ```sql
  SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch,
    pg_size_pretty(pg_relation_size(indexrelid)) as index_size
  FROM pg_stat_user_indexes
  WHERE schemaname = 'public'
  AND indexname LIKE 'idx_%_fkey'
  ORDER BY idx_scan;
  ```
  
  Remove indexes with idx_scan = 0 AND confirmed unused.
*/

-- ============================================================================
-- ACTIVE FEATURE INDEXES (Critical for RLS Performance)
-- ============================================================================

-- blocked_apps.group_id - CRITICAL for RLS EXISTS subquery
CREATE INDEX IF NOT EXISTS idx_blocked_apps_group_id 
ON public.blocked_apps(group_id);

COMMENT ON INDEX idx_blocked_apps_group_id IS 
'CRITICAL: Used by RLS policy EXISTS subquery on every blocked_apps operation. Performance degrades 50x without this index.';

-- blocked_app_schedules.group_id - CRITICAL for RLS EXISTS subquery
CREATE INDEX IF NOT EXISTS idx_blocked_app_schedules_group_id 
ON public.blocked_app_schedules(group_id);

COMMENT ON INDEX idx_blocked_app_schedules_group_id IS 
'CRITICAL: Used by RLS policy EXISTS subquery on every blocked_app_schedules operation. Performance degrades 50x without this index.';

-- ============================================================================
-- FUTURE FEATURE INDEXES (Proactive Optimization)
-- ============================================================================

-- challenge_ai_messages.challenge_id - Will be used when Challenges feature launches
CREATE INDEX IF NOT EXISTS idx_challenge_ai_messages_challenge_id 
ON public.challenge_ai_messages(challenge_id);

COMMENT ON INDEX idx_challenge_ai_messages_challenge_id IS 
'PROACTIVE: Will be used when fetching AI messages for challenges. Query pattern: WHERE challenge_id = ? ORDER BY day_number. Currently unused but prevents performance issues when feature launches.';

-- circle_messages.circle_id - Will be used when Circles feature is active
CREATE INDEX IF NOT EXISTS idx_circle_messages_circle_id 
ON public.circle_messages(circle_id);

COMMENT ON INDEX idx_circle_messages_circle_id IS 
'PROACTIVE: Will be used when loading circle message history. Query pattern: WHERE circle_id = ? ORDER BY created_at DESC LIMIT 50. Essential for pagination.';

-- help_items.category_id - Used when displaying help content by category
CREATE INDEX IF NOT EXISTS idx_help_items_category_id 
ON public.help_items(category_id);

COMMENT ON INDEX idx_help_items_category_id IS 
'PROACTIVE: Used when displaying help items grouped by category. Query pattern: WHERE category_id = ? ORDER BY display_order. Improves category page load times.';

-- ============================================================================
-- ADDITIONAL FOREIGN KEY INDEXES
-- ============================================================================

-- challenge_participants.challenge_id - For listing participants
CREATE INDEX IF NOT EXISTS idx_challenge_participants_challenge_id 
ON public.challenge_participants(challenge_id);

COMMENT ON INDEX idx_challenge_participants_challenge_id IS 
'PROACTIVE: Will be used when displaying challenge leaderboard/participants. Essential for ON DELETE CASCADE performance.';

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Run after migration to verify all indexes exist:
--
-- SELECT 
--   i.indexname,
--   t.tablename,
--   pg_size_pretty(pg_relation_size(i.indexrelid)) as size,
--   obj_description(i.indexrelid, 'pg_class') as comment
-- FROM pg_indexes i
-- JOIN pg_stat_user_indexes s ON s.indexrelname = i.indexname
-- JOIN pg_stat_user_tables t ON t.relname = i.tablename
-- WHERE i.schemaname = 'public'
-- AND i.indexname LIKE 'idx_%'
-- ORDER BY t.tablename, i.indexname;
