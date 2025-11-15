# Database Setup Guide

## Overview

This guide explains how to set up the Supabase database for NeuroBlock OS by running the migration files.

## Prerequisites

- Supabase account and project
- Access to your Supabase project dashboard
- SQL Editor access in Supabase

## Step 1: Access Supabase SQL Editor

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project: `nbwqwzesodququanqcyj`
3. Navigate to **SQL Editor** in the left sidebar
4. Click **New Query** to create a new SQL query

## Step 2: Run Migrations

The migration files are located in the `supabase/migrations/` directory. Run them in **chronological order** based on their timestamps:

### Core Tables (Run First)

1. **`20251102071159_create_detox_settings_table.sql`** - Creates the main `detox_settings` table
2. **`20251102071930_create_usage_tracking_tables.sql`** - Creates `daily_stats`, `focus_sessions`, `ai_insights` tables
3. **`20251102072711_create_subscriptions_table.sql`** - Creates `user_subscriptions` table
4. **`20251102073545_create_linked_accounts_tables.sql`** - Creates linked accounts tables

### Additional Features

5. **`20251102074539_create_ai_behavior_tracking_tables.sql`** - AI behavior tracking
6. **`20251102075200_create_circles_and_challenges_tables.sql`** - Community features
7. **`20251102080139_create_analytics_and_sync_tables.sql`** - Analytics and sync
8. **`20251102080828_create_notifications_tables.sql`** - Notifications
9. **`20251102082154_create_wearable_environment_tables.sql`** - Environment monitoring
10. **`20251103235959_create_blocked_apps_tables.sql`** - App blocking features

### Updates and Fixes

11. **`20251102203358_add_lock_settings_to_detox_settings.sql`** - Adds lock settings to detox_settings
12. **`20251102204146_create_help_content_tables_v2.sql`** - Help content tables
13. **`20251102235540_create_privacy_and_export_tables.sql`** - Privacy and data export

### Indexes and Performance

14. **`20251111050309_add_missing_indexes_and_security_fixes.sql`** - Missing indexes
15. **`20251112160509_fix_foreign_key_indexes_and_cleanup.sql`** - Foreign key fixes
16. **`20251112161005_correct_index_usage_based_on_actual_queries.sql`** - Index corrections
17. **`20251112161311_comprehensive_foreign_key_indexes.sql`** - Comprehensive indexes

## Quick Start: Run All Migrations

1. Open the SQL Editor in Supabase
2. Copy the contents of each migration file (in order)
3. Paste into the SQL Editor
4. Click **Run** (or press `Ctrl+Enter`)
5. Verify success (should show "Success. No rows returned" or similar)

## Verify Installation

After running migrations, verify the tables were created:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

You should see tables like:
- `detox_settings`
- `daily_stats`
- `focus_sessions`
- `ai_insights`
- `user_subscriptions`
- etc.

## Troubleshooting

### Error: "Could not find the table 'public.detox_settings'"

**Solution:** Run the migration `20251102071159_create_detox_settings_table.sql` in the Supabase SQL Editor.

### Error: "relation already exists"

**Solution:** This means the table already exists. You can either:
- Skip that migration
- Drop the table first (if you want to recreate it):
  ```sql
  DROP TABLE IF EXISTS detox_settings CASCADE;
  ```

### Error: "permission denied"

**Solution:** Make sure you have proper permissions in your Supabase project. Contact your project administrator.

## After Setup

Once all migrations are run:

1. **Restart your Expo server:**
   ```bash
   npm run start:go
   ```

2. **Reload the app in Expo Go**

3. **Verify the app connects:**
   - Check the terminal for: `[Supabase] Configuration loaded successfully`
   - The warning about placeholder configuration should disappear
   - Database operations should work without errors

## Need Help?

If you encounter issues:
1. Check the Supabase Dashboard > Logs for detailed error messages
2. Verify your Supabase URL and key are correct in `app.json`
3. Ensure all migrations ran successfully
4. Check that Row Level Security (RLS) policies are active

