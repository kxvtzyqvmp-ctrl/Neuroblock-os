# Appearance Settings - User Guide

## How to Access
1. Open the app
2. Go to **More** tab (bottom navigation)
3. Tap **Appearance Settings** under "App Controls"

## Features

### 🎨 Theme Modes
Click any theme to instantly change your app's look:

- **Light** - "Bright & Clean" - Perfect for daytime
- **Dark** - "Calm & Focused" - Default dark mode
- **AMOLED** - "Pure Black" - True black for OLED screens
- **System** - "Auto" - Follows your device settings

**What Changes:**
- All backgrounds
- Text colors
- Card surfaces
- Status bar (light/dark icons)

### 💠 Accent Colors
Choose your focus color (appears on buttons, highlights, icons):

- **Violet** (#8E89FB) - Default, calm focus
- **Teal** (#4ED4C7) - Energy & clarity
- **Blue** (#5A6FFF) - Discipline
- **Amber** (#FFC46B) - Warm productivity
- **Rose** (#F6768E) - Gentle mindfulness

**What Changes:**
- All buttons and interactive elements
- Active tab indicators
- Progress bars
- Link colors
- Icon highlights

### ⚡ Animation Speed
Control how fast transitions happen:

- **Slow** - Relaxed, calming transitions (0.6× speed)
- **Normal** - Default speed (1× speed)
- **Fast** - Quick, snappy feel (1.5× speed)
- **Zen** - Almost no animations (minimal motion)

**What Changes:**
- Page transitions
- Button press feedback
- Modal animations
- All loading animations

## How It Works

1. **Tap any option** - Changes apply instantly
2. **See confirmation** - Toast message appears at top
3. **Settings saved** - Automatically persists across app restarts
4. **Feel the haptics** - Subtle vibration on iOS/Android

## Persistence

All your appearance preferences are:
- ✅ Saved automatically when you change them
- ✅ Loaded instantly when you open the app
- ✅ No flicker or delay on startup
- ✅ Synced across all screens immediately

## Tips

- **AMOLED mode** saves battery on OLED screens (iPhone X and newer, most Android flagships)
- **Zen mode** is perfect for focus sessions with minimal distractions
- **Light theme** is great for outdoor use in bright sunlight
- **System mode** automatically switches between light/dark based on your phone settings

## Technical Details

**Storage Location:** AsyncStorage
**Persistence Keys:**
- Theme: `@dopamine_detox_theme`
- Accent: `@dopamine_detox_accent`
- Animation: `@dopamine_detox_animation_speed`

**Context:** ThemeContext (React Context API)
**Real-time Updates:** Yes, all screens update immediately
