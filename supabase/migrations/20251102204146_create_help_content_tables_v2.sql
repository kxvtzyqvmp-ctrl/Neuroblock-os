/*
  # Create Help Content Tables

  1. New Tables
    - `help_categories`
      - `id` (uuid, primary key)
      - `title` (text) - Category title (Quick start guide, Troubleshooting, etc.)
      - `description` (text) - Brief description
      - `icon` (text) - Icon name for UI
      - `order` (integer) - Display order
      - `created_at` (timestamp)
    
    - `help_items`
      - `id` (uuid, primary key)
      - `category_id` (uuid, foreign key) - Links to help_categories
      - `title` (text) - Item title
      - `content` (text) - Full content in markdown
      - `order` (integer) - Display order within category
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
  
  2. Security
    - Enable RLS on both tables
    - Allow public read access (help content is public)
    - Restrict write access for future admin features

  3. Initial Data
    - Populate with Quick Start Guide content
    - Add Troubleshooting tips
    - Add Contact Support info
    - Add FAQ entries
*/

CREATE TABLE IF NOT EXISTS help_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  icon text NOT NULL,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS help_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES help_categories(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text NOT NULL,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE help_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE help_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view help categories"
  ON help_categories FOR SELECT
  USING (true);

CREATE POLICY "Anyone can view help items"
  ON help_items FOR SELECT
  USING (true);

DO $$
DECLARE
  quick_start_id uuid;
  troubleshooting_id uuid;
  contact_id uuid;
  faq_id uuid;
BEGIN
  INSERT INTO help_categories (title, description, icon, display_order)
  VALUES 
    ('Quick start guide', 'Learn the basics of Dopamine Detox', 'BookOpen', 1)
  ON CONFLICT DO NOTHING
  RETURNING id INTO quick_start_id;

  IF quick_start_id IS NULL THEN
    SELECT id INTO quick_start_id FROM help_categories WHERE title = 'Quick start guide' LIMIT 1;
  END IF;

  INSERT INTO help_categories (title, description, icon, display_order)
  VALUES 
    ('Troubleshooting', 'Fix common issues and problems', 'Wrench', 2)
  ON CONFLICT DO NOTHING
  RETURNING id INTO troubleshooting_id;

  IF troubleshooting_id IS NULL THEN
    SELECT id INTO troubleshooting_id FROM help_categories WHERE title = 'Troubleshooting' LIMIT 1;
  END IF;

  INSERT INTO help_categories (title, description, icon, display_order)
  VALUES 
    ('Contact support', 'Get help from our support team', 'MessageCircle', 3)
  ON CONFLICT DO NOTHING
  RETURNING id INTO contact_id;

  IF contact_id IS NULL THEN
    SELECT id INTO contact_id FROM help_categories WHERE title = 'Contact support' LIMIT 1;
  END IF;

  INSERT INTO help_categories (title, description, icon, display_order)
  VALUES 
    ('FAQ', 'Frequently asked questions', 'HelpCircle', 4)
  ON CONFLICT DO NOTHING
  RETURNING id INTO faq_id;

  IF faq_id IS NULL THEN
    SELECT id INTO faq_id FROM help_categories WHERE title = 'FAQ' LIMIT 1;
  END IF;

  INSERT INTO help_items (category_id, title, content, display_order)
  VALUES
    (quick_start_id, 'Welcome to Dopamine Detox', 
     E'# Welcome to Dopamine Detox\n\nDopamine Detox helps you regain control over your digital habits by limiting access to distracting apps during your most productive hours.\n\n## Getting Started\n\n1. **Select Your Apps**: Choose which apps you want to limit\n2. **Set Your Schedule**: Define when you want to focus\n3. **Configure Limits**: Set daily time limits\n4. **Enable Protection**: Lock your settings to stay committed\n\nLet''s get you set up for success!', 
     1),
    
    (quick_start_id, 'Setting Up Your First Detox Mode',
     E'# Setting Up Your First Detox Mode\n\n## Step 1: Choose Apps to Block\n\nNavigate to **Apps** and select the applications that distract you most. Common choices include:\n\n- Social media apps (Instagram, TikTok, Twitter)\n- Entertainment apps (YouTube, Netflix)\n- Games and other time-wasters\n\n## Step 2: Set Your Schedule\n\nGo to **Modes** and configure your active hours:\n\n- **Work Hours**: 9 AM - 5 PM (default)\n- **Evenings**: 6 PM - 10 PM\n- **Custom**: Create your own schedule\n\n## Step 3: Configure Daily Limits\n\nSet a daily time limit for blocked apps. Start with:\n\n- 60 minutes for beginners\n- 30 minutes for moderate users\n- 15 minutes for advanced focus\n\n## Step 4: Lock Your Settings\n\nEnable PIN protection to prevent yourself from changing settings during weak moments.',
     2),
    
    (quick_start_id, 'Understanding Pause Duration',
     E'# Understanding Pause Duration\n\nThe Pause Duration is a mindful moment before accessing a blocked app.\n\n## How It Works\n\nWhen you try to open a blocked app:\n\n1. A breathing screen appears\n2. You must wait for the countdown (10-30 seconds)\n3. Reflect on whether you really need to open the app\n4. After the pause, you can choose to proceed or go back\n\n## Benefits\n\n- **Mindfulness**: Creates awareness of habitual app usage\n- **Decision Point**: Gives you time to reconsider\n- **Reduced Impulsivity**: Breaks automatic behaviors\n\n## Recommended Settings\n\n- **Light Mode**: 10 seconds\n- **Moderate Mode**: 20 seconds\n- **Deep Focus**: 30 seconds',
     3),

    (troubleshooting_id, 'Apps Still Opening Instantly',
     E'# Apps Still Opening Instantly\n\nIf blocked apps are opening without the pause screen:\n\n## Check These Settings\n\n1. **Verify Permissions**: Ensure Dopamine Detox has accessibility permissions\n2. **Confirm Active Mode**: Check that detox mode is enabled on Dashboard\n3. **Review Schedule**: Make sure current time is within your active hours\n4. **Restart App**: Close and reopen Dopamine Detox\n\n## Advanced Solutions\n\n- Clear app cache in device settings\n- Reinstall Dopamine Detox\n- Check for app updates\n- Verify selected apps list is not empty\n\n## Still Not Working?\n\nContact our support team with:\n- Device model and OS version\n- List of apps you''re trying to block\n- Screenshots of your settings',
     1),

    (troubleshooting_id, 'PIN Not Working',
     E'# PIN Not Working\n\nIf your PIN isn''t being accepted:\n\n## Reset Your PIN\n\n1. Go to **Modes** > **Dopamine Detox Settings**\n2. Toggle off "Require PIN"\n3. Toggle it back on to set a new PIN\n\n## Common Issues\n\n- **Wrong PIN**: Carefully re-enter your 4-digit PIN\n- **Numeric Keypad**: Ensure you''re using numbers, not letters\n- **Multiple Attempts**: Wait 30 seconds after 3 failed attempts\n\n## Emergency Access\n\nIf "Emergency unlock" is enabled:\n\n1. Tap "Forgot PIN?" on the PIN entry screen\n2. Verify your identity (email or biometrics)\n3. Reset your PIN\n\n**Important**: This defeats the purpose of protection. Use sparingly!',
     2),

    (troubleshooting_id, 'Settings Keep Resetting',
     E'# Settings Keep Resetting\n\nIf your settings don''t persist:\n\n## Possible Causes\n\n1. **Storage Permissions**: Grant storage access to the app\n2. **Battery Optimization**: Disable battery optimization for Dopamine Detox\n3. **Data Cleared**: Check if device is clearing app data automatically\n\n## Fix the Issue\n\n**Android:**\n1. Settings > Apps > Dopamine Detox\n2. Storage > Clear Cache (not Clear Data)\n3. Battery > Unrestricted\n\n**iOS:**\n1. Settings > Dopamine Detox\n2. Enable Background App Refresh\n3. Check iCloud sync is enabled\n\n## Data Backup\n\nYour settings are automatically synced to the cloud. If issues persist:\n- Log out and log back in\n- Check internet connection\n- Verify cloud sync is enabled in Settings',
     3),

    (contact_id, 'Email Support',
     E'# Email Support\n\nGet help directly from our support team.\n\n## Contact Information\n\n**Email**: support@dopaminedetox.app\n\n**Response Time**: Within 24 hours\n\n## Before Contacting\n\nPlease include:\n\n1. **Device Info**: Model and OS version\n2. **App Version**: Found in Settings > About\n3. **Issue Description**: What''s happening vs. what should happen\n4. **Screenshots**: Visual aids help us help you faster\n5. **Steps to Reproduce**: What triggers the issue\n\n## Priority Support\n\nPremium subscribers receive:\n- Priority queue (response within 6 hours)\n- Direct phone support\n- Dedicated account manager\n\nUpgrade to Premium in the Subscription tab!',
     1),

    (contact_id, 'Community Forum',
     E'# Community Forum\n\nConnect with other users and share tips.\n\n## Join the Community\n\n**Forum**: community.dopaminedetox.app\n\n## What You''ll Find\n\n- **Success Stories**: Get inspired by others\n- **Tips & Tricks**: Learn advanced techniques\n- **Feature Requests**: Vote on new features\n- **Beta Testing**: Get early access to new features\n\n## Community Guidelines\n\n1. Be respectful and supportive\n2. No spam or self-promotion\n3. Stay on topic\n4. Help others when you can\n\n## Popular Topics\n\n- Productivity routines\n- App blocking strategies\n- Accountability partners\n- Digital wellness challenges',
     2),

    (contact_id, 'Report a Bug',
     E'# Report a Bug\n\nHelp us improve Dopamine Detox.\n\n## Bug Report Form\n\n**URL**: dopaminedetox.app/report-bug\n\n## What to Include\n\n### Required Information\n\n1. **Bug Description**: Clear explanation of the issue\n2. **Steps to Reproduce**: How to trigger the bug\n3. **Expected Behavior**: What should happen\n4. **Actual Behavior**: What actually happens\n\n### Optional (But Helpful)\n\n- Screenshots or screen recordings\n- Device logs\n- Network conditions when bug occurred\n- Other apps running at the time\n\n## Bug Bounty Program\n\nFind a security issue? We reward responsible disclosure:\n\n- **Critical**: $500-$2000\n- **High**: $200-$500\n- **Medium**: $50-$200\n- **Low**: Public recognition\n\nSee full terms at: dopaminedetox.app/bug-bounty',
     3),

    (faq_id, 'How does app blocking work?',
     E'# How Does App Blocking Work?\n\nDopamine Detox uses accessibility services to detect when you open a blocked app and displays a pause screen.\n\n## Technical Details\n\n1. **Detection**: Monitors app launches in real-time\n2. **Intervention**: Shows pause/breathing screen\n3. **Decision**: You choose to continue or go back\n4. **Tracking**: Logs usage for analytics\n\n## Privacy & Security\n\n- No data leaves your device\n- No screenshots or content monitoring\n- Only app names and usage times are recorded\n- All data encrypted at rest\n\n## Limitations\n\n- Requires accessibility permissions\n- May not work with system apps\n- Some launchers may bypass detection',
     1),

    (faq_id, 'Can I use this on multiple devices?',
     E'# Can I Use This on Multiple Devices?\n\nYes! Your subscription and settings sync across all devices.\n\n## How Sync Works\n\n1. Sign in with the same account on all devices\n2. Settings automatically sync via cloud\n3. Usage data combines from all devices\n4. Premium features work everywhere\n\n## Supported Platforms\n\n- **iOS**: iPhone and iPad\n- **Android**: Phones and tablets\n- **Web**: Dashboard access only (no blocking)\n\n## Device Limits\n\n- **Free**: 1 device\n- **Premium**: Unlimited devices\n- **Family**: Up to 6 family members, unlimited devices each\n\n## Managing Devices\n\nView and remove devices in:\nSettings > Account > Connected Devices',
     2),

    (faq_id, 'What happens if I uninstall the app?',
     E'# What Happens If I Uninstall?\n\n## Immediate Effects\n\n- App blocking stops working\n- All restrictions are removed\n- Blocked apps open normally\n\n## Your Data\n\n### Saved in Cloud\n\n- Settings and preferences\n- Usage history and analytics\n- Subscription status\n- Achievement progress\n\n### Lost Locally\n\n- Temporary PIN cache\n- Pending sync data\n- Local notifications\n\n## Reinstalling\n\nWhen you reinstall:\n\n1. Sign in with same account\n2. All settings restore automatically\n3. Subscription reactivates\n4. History remains intact\n\n**Note**: Usage tracking has gaps during uninstall period',
     3),

    (faq_id, 'How do I cancel my subscription?',
     E'# How Do I Cancel My Subscription?\n\n## Cancellation Process\n\n### iOS (Apple)\n\n1. Open Settings\n2. Tap your name > Subscriptions\n3. Select Dopamine Detox\n4. Tap Cancel Subscription\n\n### Android (Google Play)\n\n1. Open Google Play Store\n2. Tap Menu > Subscriptions\n3. Select Dopamine Detox\n4. Tap Cancel Subscription\n\n## What Happens Next\n\n- Premium features work until period ends\n- No refunds for current billing period\n- Automatic renewal stops\n- Data remains saved (can resubscribe anytime)\n\n## Resubscribing\n\n- All previous data restored\n- Same account and settings\n- May qualify for win-back discounts\n\n## Need Help?\n\nContact support if you''re canceling due to an issue. We''re here to help!',
     4)
  ON CONFLICT DO NOTHING;
END $$;
