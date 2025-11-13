# Testing the Appearance Settings

## Step-by-Step Test Guide

### 1. Navigate to Appearance Settings
1. Open the app in your browser
2. Click the **More** tab at the bottom (shield icon)
3. Scroll to "App Controls" section
4. Click **"Appearance Settings"**

### 2. Test Theme Switching
**Try each theme:**
- Click **Light** - Background should turn white, text black
- Click **Dark** - Background should turn dark blue (#0B0B0B), text white
- Click **AMOLED** - Background should turn pure black (#000000)
- Click **System** - Should follow your device's theme

**What to verify:**
- ✅ Background color changes immediately
- ✅ Text color changes for readability
- ✅ Toast message appears: "Theme: [theme name]"
- ✅ Selected theme has a colored border and check mark
- ✅ Status bar icons change (light/dark)

### 3. Test Accent Colors
**Try each color:**
- Click **Violet** - Should see purple tones
- Click **Teal** - Should see cyan/turquoise
- Click **Blue** - Should see bright blue
- Click **Amber** - Should see orange/yellow
- Click **Rose** - Should see pink/red

**What to verify:**
- ✅ Color preview circle shows the color
- ✅ Toast message appears: "Accent: [color name]"
- ✅ Selected color has a colored border
- ✅ Check mark appears on selected color

### 4. Test Animation Speed
**Try each speed:**
- Click **Slow** - Animations should feel relaxed
- Click **Normal** - Default speed
- Click **Fast** - Snappy, quick animations
- Click **Zen** - Almost no animations

**What to verify:**
- ✅ Toast message appears: "Speed: [speed name]"
- ✅ Selected speed has a colored border and check mark
- ✅ Animations actually change speed (watch the toast appear/disappear)

### 5. Test Persistence
1. Change theme to **Light**
2. Change accent to **Teal**
3. Change speed to **Fast**
4. **Close the tab completely**
5. **Reopen the app**
6. Navigate back to Appearance Settings

**What to verify:**
- ✅ Theme is still **Light**
- ✅ Accent is still **Teal**
- ✅ Speed is still **Fast**
- ✅ No flicker when app loads

### 6. Test Global Updates
1. Change theme to **AMOLED**
2. Go to **Dashboard** tab
3. Go back to **More** tab
4. Navigate around the app

**What to verify:**
- ✅ All screens use the new theme
- ✅ Accent color appears on buttons throughout app
- ✅ Changes persist across navigation

## What Each Setting Does

### Theme Changes:
- **Background color** of entire app
- **Card colors** (surfaces)
- **Text colors** (primary and secondary)
- **Border colors**
- **Status bar** icon colors

### Accent Color Changes:
- **Buttons** and interactive elements
- **Active states** and highlights
- **Icons** when active
- **Links** and calls-to-action
- **Progress indicators**

### Animation Speed Changes:
- **Page transitions** (changing tabs)
- **Button feedback** (press animations)
- **Modal animations** (popups)
- **Toast messages** (appear/disappear speed)

## Troubleshooting

### If themes don't change:
1. Check browser console for errors (F12)
2. Refresh the page
3. Clear browser cache

### If settings don't persist:
1. Check if LocalStorage is enabled
2. Try in a different browser
3. Check browser console for storage errors

### If you see errors:
1. Check the diagnostics page: More → Diagnostics
2. Look for red error messages
3. Try restarting the dev server

## Expected Behavior Summary

✅ **Instant Changes** - No delay when clicking options
✅ **Visual Feedback** - Toast messages for every change
✅ **Check Marks** - Selected options clearly marked
✅ **Persistence** - Settings save automatically
✅ **Global Updates** - All screens reflect changes
✅ **No Flicker** - Smooth loading on app start
