# Custom Time Selection - Complete Guide

## What Was Fixed

### ❌ Previous Issue:
- Clicking "Custom" option did nothing
- No way to select custom hours
- Users couldn't set their own Detox Mode schedule

### ✅ Now Fixed:
- Full custom time picker modal
- Visual hour selection with range display
- Real-time preview of selected times
- Persists to Supabase database

---

## How It Works

### **Step 1: Click "Custom" Option**
During setup (Step 4: "When should Detox Mode be active?"):
- You'll see three options: **Work Hours**, **Evenings**, **Custom**
- Click **"Custom"** → Opens time picker modal

### **Step 2: Select Your Hours**
The modal shows:
- **24 hours** (12 AM to 11 PM) in a grid
- **Start Time** and **End Time** displays at top
- **Visual range highlighting** between selected hours

### **Step 3: Pick Start & End Times**
**How to select:**
- Click any hour → It becomes either Start or End (whichever is closer)
- Click the **Start** hour again to change it
- Click the **End** hour again to change it
- Hours between Start and End are **highlighted in blue**

**Visual feedback:**
- 🔵 **Dark blue** = Start hour (with "START" badge)
- 🔵 **Medium blue** = End hour (with "END" badge)
- 🔵 **Light blue** = Hours in between (active range)
- ⚪ **Gray** = Inactive hours

### **Step 4: Preview & Save**
- Bottom of modal shows: "Detox Mode will be active from **9 AM** to **5 PM**"
- Click **"Save Custom Time"** button
- Modal closes, returns to setup
- Custom option now shows your selected times: "9 AM – 5 PM"

---

## Features

### ✅ **24-Hour Selection Grid**
- All 24 hours displayed (12 AM, 1 AM, 2 AM... 11 PM)
- Scrollable if needed
- 12-hour format with AM/PM

### ✅ **Smart Selection**
- Click any hour → automatically chooses Start or End
- System picks whichever is closer to your click
- Can override by clicking Start/End badge directly

### ✅ **Visual Range Display**
- Hours between Start and End are highlighted
- Clear visual distinction for active period
- Supports overnight ranges (e.g., 10 PM to 6 AM)

### ✅ **Real-Time Preview**
- Top cards show current Start and End times
- Bottom text shows full sentence preview
- Updates instantly as you click hours

### ✅ **Overnight Support**
- Works for ranges that cross midnight
- Example: 10 PM to 6 AM (evenings preset)
- Visual highlighting wraps correctly

---

## User Experience Flow

### Complete Setup Example:

1. **Start Setup** → Welcome screen
2. **Select Apps** → Choose distracting apps
3. **Daily Limit** → Set time limit (e.g., 1 hour)
4. **Active Hours** → Click "Custom" 👈 **HERE**
   - Modal opens
   - See 24 hours in grid
   - Click **9 AM** → becomes Start
   - Click **5 PM** → becomes End
   - Hours 9-4 highlighted in blue
   - Preview: "Detox Mode will be active from 9 AM to 5 PM"
   - Click "Save Custom Time"
5. **Back to setup** → Custom shows "9 AM – 5 PM"
6. **Continue** → Pause Duration, Permissions, Done!

### After Setup:
- Settings saved to Supabase
- Detox Mode activates during 9 AM - 5 PM
- Outside those hours, apps are not blocked

---

## Visual Guide

### Time Picker Modal Layout:

```
┌─────────────────────────────────────┐
│  [X]    Select Active Hours    [ ]  │
├─────────────────────────────────────┤
│  Choose when Detox Mode should be   │
│            active                    │
├─────────────────────────────────────┤
│  ┌──────────────┐    ┌─────────────┐│
│  │ 🕐 START TIME │ to │ 🕐 END TIME ││
│  │   9 AM       │    │   5 PM      ││
│  └──────────────┘    └─────────────┘│
├─────────────────────────────────────┤
│  [12 AM] [1 AM]  [2 AM]  [3 AM]     │
│  [4 AM]  [5 AM]  [6 AM]  [7 AM]     │
│  [8 AM]  [9 AM]* [10 AM]△[11 AM]△   │ * = Start (dark blue)
│  [12 PM]△[1 PM]△ [2 PM]△ [3 PM]△    │ △ = In range (light blue)
│  [4 PM]△ [5 PM]**[6 PM]  [7 PM]     │ ** = End (medium blue)
│  [8 PM]  [9 PM]  [10 PM] [11 PM]    │
├─────────────────────────────────────┤
│  Detox Mode will be active from     │
│  9 AM to 5 PM                        │
│                                      │
│  [     Save Custom Time     ]       │
└─────────────────────────────────────┘
```

### Custom Option Display:

**Before selecting custom time:**
```
┌────────────────────────────────┐
│  Custom                         │
│  Set your own times             │
└────────────────────────────────┘
```

**After saving custom time:**
```
┌────────────────────────────────┐
│  Custom                    ✓    │
│  9 AM – 5 PM                    │
└────────────────────────────────┘
```

---

## Technical Details

### Props Updated:
- `activeScheduleStart` - String (HH:MM:SS format)
- `activeScheduleEnd` - String (HH:MM:SS format)
- Both passed to Step4ActiveHours component

### State Management:
- `tempStartHour` - Number (0-23) for temporary selection
- `tempEndHour` - Number (0-23) for temporary selection
- Converted to HH:MM:SS on save

### Time Format:
- **Display:** 12-hour format with AM/PM (e.g., "9 AM")
- **Storage:** 24-hour format HH:MM:SS (e.g., "09:00:00")
- **Conversion:** Automatic in formatHour() function

### Range Logic:
- **Normal range:** Start < End (e.g., 9 AM to 5 PM)
- **Overnight range:** Start > End (e.g., 10 PM to 6 AM)
- `isHourInRange()` handles both cases correctly

---

## Database Storage

### Supabase Fields:
```sql
active_schedule_type: 'custom'
active_schedule_start: '09:00:00'
active_schedule_end: '17:00:00'
```

### Example Records:

**Work Hours (9 AM - 5 PM):**
```json
{
  "active_schedule_type": "work_hours",
  "active_schedule_start": "09:00:00",
  "active_schedule_end": "17:00:00"
}
```

**Custom (7 AM - 10 PM):**
```json
{
  "active_schedule_type": "custom",
  "active_schedule_start": "07:00:00",
  "active_schedule_end": "22:00:00"
}
```

**Evenings (10 PM - 6 AM):**
```json
{
  "active_schedule_type": "evenings",
  "active_schedule_start": "22:00:00",
  "active_schedule_end": "06:00:00"
}
```

---

## Testing Checklist

### ✅ Modal Opening:
- [ ] Click "Custom" option
- [ ] Modal slides up from bottom
- [ ] Shows "Select Active Hours" title
- [ ] Displays all 24 hours in grid

### ✅ Time Selection:
- [ ] Click any hour → becomes Start or End
- [ ] Start hour shows dark blue + "START" badge
- [ ] End hour shows medium blue + "END" badge
- [ ] Hours between are light blue (highlighted)
- [ ] Top cards update to show selected times

### ✅ Range Display:
- [ ] Normal range works (e.g., 9 AM to 5 PM)
- [ ] Overnight range works (e.g., 10 PM to 6 AM)
- [ ] Visual highlighting is correct
- [ ] Preview text updates in real-time

### ✅ Saving:
- [ ] Click "Save Custom Time" button
- [ ] Modal closes
- [ ] Custom option shows selected times
- [ ] Can click "Next" to continue setup

### ✅ Persistence:
- [ ] Complete setup
- [ ] Times save to Supabase
- [ ] Go back to Step 4
- [ ] Custom option still shows correct times

### ✅ Edge Cases:
- [ ] Same hour for Start and End (0-hour range)
- [ ] 12 AM (midnight) selection works
- [ ] 12 PM (noon) selection works
- [ ] Re-opening modal shows previous selection

---

## Common Scenarios

### Scenario 1: Work-from-Home Schedule
**Goal:** Block distractions during work hours (8 AM - 6 PM)
1. Click "Custom"
2. Click **8 AM** → becomes Start
3. Click **6 PM** → becomes End
4. Preview: "8 AM to 6 PM"
5. Save → Done!

### Scenario 2: Deep Focus Morning
**Goal:** Morning focus time only (6 AM - 12 PM)
1. Click "Custom"
2. Click **6 AM** → Start
3. Click **12 PM** → End
4. Save

### Scenario 3: Evening Wind-Down
**Goal:** No distractions before bed (8 PM - 11 PM)
1. Click "Custom"
2. Click **8 PM** → Start
3. Click **11 PM** → End
4. Save

### Scenario 4: Overnight Blocking
**Goal:** Block during sleep and morning (11 PM - 7 AM)
1. Click "Custom"
2. Click **11 PM** → Start
3. Click **7 AM** → End
4. Hours from 11 PM to 7 AM highlighted
5. Save

---

## Troubleshooting

### Modal doesn't open:
- Ensure you clicked "Custom" option (not Work Hours or Evenings)
- Check for JavaScript errors in console

### Hours not selecting:
- Make sure to click directly on hour buttons
- Try clicking different hours to test

### Range looks wrong:
- For overnight ranges (e.g., 10 PM to 6 AM), the display wraps
- Hours after Start OR before End should be highlighted

### Times not saving:
- Check Supabase connection
- Verify user is authenticated
- Look for errors in console

### Custom option not showing time:
- Must save custom time first (click "Save Custom Time" button)
- Description only updates after saving

---

## Summary

**Before:** Custom option did nothing ❌

**After:** Full custom time picker with:
- ✅ 24-hour visual grid selection
- ✅ Start and End time displays
- ✅ Real-time range highlighting
- ✅ Smart automatic selection
- ✅ Preview text with full sentence
- ✅ Overnight range support
- ✅ Supabase persistence
- ✅ Beautiful modal design

**Now users can set ANY custom schedule for Detox Mode!** 🎉
