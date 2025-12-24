# App Blocking Architecture - NeuroBlock OS

This document outlines all files, components, and hooks related to app blocking functionality.

## Core Files

### 1. **`hooks/useAppBlocker.ts`**
**Purpose**: Centralized React hook for app blocking logic during active focus sessions.

**Key Functionality**:
- Monitors blocked apps during active sessions
- Checks for active focus session status
- Starts/stops blocking service monitoring
- Tracks which app was blocked and triggers callbacks
- Manages AppState listeners for background/foreground detection
- Periodically checks if session is still active (every 5 seconds)
- Cleans up listeners on unmount

**State Management**:
- `isBlocking`: Boolean indicating if monitoring is active
- `blockedApp`: Object containing appName and packageName of currently blocked app
- `startMonitoring(onBlocked)`: Starts monitoring and sets callback
- `stopMonitoring()`: Stops monitoring and resets state

---

### 2. **`lib/appBlocking.ts`**
**Purpose**: Singleton service class that implements the actual blocking detection logic.

**Key Functionality**:
- **AppBlockingService Class**: Main service managing blocking state
- Monitors foreground app changes using AppState listeners
- Checks if current foreground app is in blocked list (Android only)
- Uses native module (`@/modules/screentime`) to get foreground app on Android
- iOS/web limitations: Cannot reliably detect foreground app
- Periodic checks every 2 seconds on Android
- Persists blocking session state in AsyncStorage
- Manages blocked apps list from `DetoxSettings.selected_apps`

**Key Methods**:
- `startMonitoring(onBlocked)`: Starts monitoring for blocked apps
- `stopMonitoring()`: Stops monitoring and cleans up
- `checkForegroundApp()`: Checks which app is in foreground and triggers callback if blocked
- `getBlockedApps()`: Returns list of currently blocked apps
- `isAppBlocked(packageName, appName)`: Checks if specific app is blocked

---

### 3. **`components/BlockingOverlay.tsx`**
**Purpose**: Fullscreen modal overlay displayed when a blocked app is detected.

**Key Functionality**:
- Displays fullscreen blocking message with animations
- Shows different UI for iOS (limitations message) vs Android (actual blocking)
- Displays blocked app name and remaining session time
- Animated fade-in/scale animations
- Haptic feedback on show
- "Back to Focus" button to dismiss overlay
- iOS-specific warning about system limitations

**Props**:
- `visible`: Boolean to show/hide overlay
- `blockedAppName`: Name of the blocked app
- `remainingTime`: Optional remaining time string (HH:MM:SS format)
- `onDismiss`: Callback when user dismisses overlay

---

### 4. **`components/MindfulCostOverlay.tsx`**
**Purpose**: Pro-tier overlay for "Mindful Cost" feature - shows data-driven intervention instead of hard blocking.

**Key Functionality**:
- Displays neutral, data-driven message when user attempts to open blocked app
- Shows attempt count (e.g., "This is your 4th attempt")
- Displays remaining time in focus session
- Auto-dismisses after 2 seconds with fade animation
- Shows observation text: "Notice the pattern."
- More gentle than hard blocking - reflects behavior back to user
- Haptic warning feedback

**Props**:
- `visible`: Boolean to show/hide overlay
- `appName`: Name of the app user tried to open
- `attemptCount`: Number of times user tried to open this app
- `remainingTime`: Remaining time string
- `onDismiss`: Callback when overlay dismisses

---

### 5. **`components/ManageAppsModal.tsx`**
**Purpose**: Bottom sheet modal for selecting which apps to block.

**Key Functionality**:
- Displays categorized list of installed apps
- Allows users to toggle apps on/off for blocking
- Search functionality to find apps quickly
- "Select All" and "Deselect All" for categories
- Paywall integration: Enforces free tier limit (7 apps)
- Shows premium upgrade prompt when limit reached
- Saves selected apps to `DetoxSettings.selected_apps` in AsyncStorage
- Memoized components for performance optimization
- Uses `SectionList` with virtualization for large app lists

**Key Features**:
- Category-based grouping (Social, Entertainment, Games, etc.)
- Visual indicators for selected apps (checkmarks)
- Disabled state when at free tier limit
- Toast notifications on save
- Loading states and skeleton loaders

---

### 6. **`lib/installedApps.ts`**
**Purpose**: Utility functions for fetching, categorizing, and searching installed apps.

**Key Functionality**:
- `getInstalledApps()`: Fetches installed apps from native module (Android) or returns mock data (iOS/web)
- `categorizeApp()`: Auto-categorizes apps using keyword matching
- `groupAppsByCategory()`: Groups apps into categories (Social, Entertainment, Games, etc.)
- `searchApps()`: Filters apps by search query (name, package, category)
- Mock data fallback for iOS/web where native detection isn't available
- 12 predefined categories with keyword matching

**Categories**:
- Social (Instagram, Facebook, Twitter, etc.)
- Entertainment (YouTube, Netflix, Spotify, etc.)
- Games (Candy Crush, Minecraft, Roblox, etc.)
- Productivity (Gmail, Slack, Notion, etc.)
- Shopping, News, Travel, Food, Fitness, Finance, Education, Utilities, Other

---

### 7. **`hooks/useInstalledApps.ts`**
**Purpose**: React hook for managing installed apps list with caching and permissions.

**Key Functionality**:
- Loads installed apps on mount
- Checks and requests Android permissions (`QUERY_ALL_PACKAGES`)
- iOS limitation handling (shows alert, uses mock data)
- 24-hour caching of app list in AsyncStorage
- Refreshes app list on demand
- Handles permission requests and settings navigation
- Error handling with fallback to cached or mock data

**State Management**:
- `apps`: Array of InstalledApp objects
- `loading`: Boolean for loading state
- `error`: Error message string
- `hasPermission`: Boolean indicating permission status
- `refresh()`: Clears cache and reloads apps
- `requestPermission()`: Requests permission and returns result

---

### 8. **`lib/blockingEngine.ts`**
**Purpose**: Advanced state machine for blocking logic with mindful pauses, cooldowns, and schedules (legacy/unused).

**Key Functionality**:
- State machine implementation: IDLE → ELIGIBLE → MINDFUL_PAUSE → ACTIVE_BLOCK → COOLDOWN
- Quick Disable feature for temporary disabling
- Schedule-based blocking (time-of-day, days-of-week)
- Daily and session usage caps
- Override handling with cooldown periods
- Supabase integration for plan loading and event logging
- Persists state in AsyncStorage
- Periodic ticker for state transitions

**Note**: This appears to be an older, more complex blocking system that may not be actively used. The current app uses the simpler `appBlocking.ts` service.

---

### 9. **`components/blocked-apps/BlockedAppsManager.tsx`**
**Purpose**: Full-screen component for managing blocked apps (legacy/alternative UI).

**Key Functionality**:
- Displays categorized app list with search
- Toggle apps on/off for blocking
- Supabase integration for saving blocked apps
- Paywall enforcement for free tier limits
- Loads existing blocked apps from database
- Save functionality with loading states
- Similar to `ManageAppsModal` but full-screen

**Note**: This appears to be an alternative implementation to `ManageAppsModal` and may not be actively used in the current app flow.

---

### 10. **`components/dashboard/BlockedAppsCard.tsx`**
**Purpose**: Display card showing currently blocked apps (dashboard widget).

**Key Functionality**:
- Shows up to 3 blocked app names
- Displays total count of blocked apps
- Simple visual card component
- Used for displaying blocked apps summary on dashboard

**Props**:
- `apps`: Array of app name strings

---

### 11. **`app/apps.tsx`**
**Purpose**: Screen wrapper for blocked apps management.

**Key Functionality**:
- Wraps `BlockedAppsManager` component
- Provides AuroraBackground and FloatingNav
- Simple screen container

---

### 12. **`components/setup/Step2SelectApps.tsx`**
**Purpose**: Onboarding step for selecting initial apps to block.

**Key Functionality**:
- Shows popular apps in a grid
- Allows selecting up to 3 apps (onboarding limit)
- Visual checkmarks for selected apps
- Disables selection when limit reached
- Used during initial app setup flow

**Note**: This is for onboarding only, not the main blocking management UI.

---

## Data Storage

### **`lib/localStorage.ts`**
**Purpose**: Defines storage schema for blocked apps.

**Storage Key**:
- `selected_apps`: String array of app names to block
- Stored in `DetoxSettings` object in AsyncStorage

**Related Functions**:
- `getDetoxSettings()`: Loads settings including `selected_apps`
- `saveDetoxSettings()`: Saves settings including `selected_apps`

---

## Integration Points

### **`components/FocusButton.tsx`**
- Button that opens `ManageAppsModal` via `onManageApps` callback
- Shows "Manage Blocked Apps" button when session is not active

### **`app/home.tsx`**
- Main home screen that integrates `FocusButton` and `ManageAppsModal`
- Manages modal visibility state

### **`hooks/useFocusSession.ts`**
- Manages focus session state
- Used by `useAppBlocker` to check if session is active

### **`modules/screentime.ts`**
- Native module interface for Android
- Provides `getForegroundApp()` to detect current app
- Handles permissions (`QUERY_ALL_PACKAGES`, `PACKAGE_USAGE_STATS`)

---

## Workflow Summary

1. **App Selection**: User selects apps to block via `ManageAppsModal` → Saved to `DetoxSettings.selected_apps`

2. **Session Start**: User starts focus session via `FocusButton` → `useFocusSession` manages session state

3. **Monitoring Start**: `useAppBlocker` hook detects active session → Starts `AppBlockingService` monitoring

4. **Detection**: `AppBlockingService` checks foreground app every 2 seconds (Android) → If blocked app detected, triggers callback

5. **Overlay Display**: `BlockingOverlay` or `MindfulCostOverlay` (Pro) is shown with blocking message

6. **Session End**: When session ends → `useAppBlocker` stops monitoring → Overlay dismissed

---

## Platform Limitations

### **Android**:
- Full support for app detection via native module
- Can monitor foreground app changes
- Requires `QUERY_ALL_PACKAGES` permission

### **iOS**:
- Cannot reliably detect foreground app
- Blocking overlay shows limitations message instead
- Focus timer still works for self-discipline

### **Web**:
- Uses mock data for apps
- Cannot detect foreground app
- Focus timer functionality only

---

## Key Constants & Limits

- **Free Tier Limit**: 7 apps (defined in `SUBSCRIPTION_PLANS.FREE.limitations.maxAppBlocks`)
- **Monitoring Interval**: 2 seconds (Android)
- **Session Check Interval**: 5 seconds (background check)
- **Cache Duration**: 24 hours (installed apps list)



