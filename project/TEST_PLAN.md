# Dopamine Detox - Comprehensive Test Plan & Acceptance Criteria

## Overview

This document outlines the complete testing strategy for the Dopamine Detox application, including unit tests, integration tests, acceptance criteria, and platform-specific test cases.

## Table of Contents

1. [Permissions Testing](#1-permissions-testing)
2. [Blocking Engine State Machine](#2-blocking-engine-state-machine)
3. [Schedule Management](#3-schedule-management)
4. [Usage Caps & Limits](#4-usage-caps--limits)
5. [Quick Disable & Override](#5-quick-disable--override)
6. [Strict Mode & Lock](#6-strict-mode--lock)
7. [First-Run Wizard](#7-first-run-wizard)
8. [Subscription & Paywall](#8-subscription--paywall)
9. [Sync & Conflict Resolution](#9-sync--conflict-resolution)
10. [Platform-Specific Tests](#10-platform-specific-tests)
11. [Edge Cases & Error Handling](#11-edge-cases--error-handling)

---

## 1. Permissions Testing

### iOS - FamilyControls

**Acceptance Criteria:**
- ✅ App requests FamilyControls authorization on first launch
- ✅ Authorization state persists across app restarts
- ✅ App detects when authorization is revoked and shows fix card
- ✅ User can re-authorize from within app
- ✅ Blocking engine pauses when authorization is lost

**Test Cases:**

```typescript
describe('iOS Permissions', () => {
  test('should request FamilyControls on first launch', async () => {
    const service = permissionsManager.getIOSService();
    const result = await service.requestAuthorization();
    expect(result).toBe(true);
  });

  test('should detect authorization status', async () => {
    const service = permissionsManager.getIOSService();
    const status = await service.checkAuthorization();
    expect(['granted', 'denied', 'not_determined']).toContain(status);
  });

  test('should pause engine when authorization revoked', async () => {
    // Simulate revocation
    // Engine should transition to IDLE
    // UI should show "Fix" card
  });
});
```

### Android - Multi-Permission Flow

**Acceptance Criteria:**
- ✅ App requests Usage Access permission
- ✅ App requests Accessibility Service permission
- ✅ App requests Draw Over Apps permission
- ✅ App detects each permission status independently
- ✅ UI shows which permissions are missing with "Grant" buttons
- ✅ Each button opens correct system settings page
- ✅ App detects status changes when returning from settings

**Test Cases:**

```typescript
describe('Android Permissions', () => {
  test('should request all required permissions', async () => {
    const status = await permissionsManager.requestAllPermissions();
    expect(status.android.usageAccess).toBe(true);
    expect(status.android.accessibilityService).toBe(true);
    expect(status.android.drawOverApps).toBe(true);
  });

  test('should detect missing permissions', async () => {
    const missing = await getMissingPermissions();
    expect(missing).toBeInstanceOf(Array);
  });

  test('should handle permission denial gracefully', async () => {
    // Simulate user denying permission
    // App should show explanation and retry option
  });
});
```

---

## 2. Blocking Engine State Machine

### State Transitions

**Acceptance Criteria:**
- ✅ Engine starts in IDLE state
- ✅ When blocked app opened during schedule: IDLE → ELIGIBLE → MINDFUL_PAUSE
- ✅ After mindful pause timer: MINDFUL_PAUSE → ACTIVE_BLOCK
- ✅ On override granted: ACTIVE_BLOCK → COOLDOWN → IDLE
- ✅ When schedule ends: Any State → IDLE
- ✅ Quick Disable: Any State → QUICK_DISABLED → IDLE after duration

**Test Cases:**

```typescript
describe('Blocking Engine State Machine', () => {
  let engine: BlockingEngine;

  beforeEach(async () => {
    engine = BlockingEngine.getInstance();
    await engine.initialize(testUserId);
  });

  test('should start in IDLE state', () => {
    const state = engine.getState();
    expect(state.currentState).toBe('IDLE');
  });

  test('should transition to MINDFUL_PAUSE when app is eligible', async () => {
    const result = await engine.shouldBlockApp('test-app-id', 'com.instagram');
    expect(result.state).toBe('MINDFUL_PAUSE');
    expect(result.waitSeconds).toBeGreaterThan(0);
  });

  test('should transition to ACTIVE_BLOCK after pause', async () => {
    await engine.shouldBlockApp('test-app-id', 'com.instagram');

    // Fast-forward time
    jest.advanceTimersByTime(10000); // 10 seconds

    const state = engine.getState();
    expect(state.currentState).toBe('ACTIVE_BLOCK');
  });

  test('should handle override request', async () => {
    await engine.shouldBlockApp('test-app-id', 'com.instagram');
    const result = await engine.requestOverride('test-app-id', 'com.instagram');

    expect(result.granted).toBe(true);
    const state = engine.getState();
    expect(state.currentState).toBe('COOLDOWN');
  });

  test('should transition to IDLE after cooldown', async () => {
    // Setup cooldown state
    // Fast-forward past cooldown duration
    // Verify IDLE state
  });
});
```

---

## 3. Schedule Management

### Time Window Validation

**Acceptance Criteria:**
- ✅ Schedule activates at exact start time
- ✅ Schedule deactivates at exact end time
- ✅ Schedule respects day-of-week configuration
- ✅ Schedule handles midnight crossing correctly (23:00 - 01:00)
- ✅ Schedule handles DST changes
- ✅ Schedule handles timezone changes
- ✅ Multiple schedules can be active

**Test Cases:**

```typescript
describe('Schedule Management', () => {
  test('should activate schedule at start time', () => {
    const schedule = {
      startLocal: '09:00',
      endLocal: '17:00',
      daysOfWeek: [1, 2, 3, 4, 5], // Mon-Fri
      enabled: true,
    };

    // Mock current time to 09:00 Monday
    const isActive = isScheduleActive(schedule, new Date('2025-11-03T09:00:00'));
    expect(isActive).toBe(true);
  });

  test('should handle midnight crossing', () => {
    const schedule = {
      startLocal: '23:00',
      endLocal: '01:00',
      daysOfWeek: [0, 1, 2, 3, 4, 5, 6], // Every day
      enabled: true,
    };

    const midnight = new Date('2025-11-03T00:30:00');
    const isActive = isScheduleActive(schedule, midnight);
    expect(isActive).toBe(true);
  });

  test('should handle DST transition', () => {
    // Test spring forward (lose an hour)
    // Test fall back (gain an hour)
    // Ensure schedules adjust correctly
  });

  test('should handle timezone change', () => {
    // User travels from EST to PST
    // Local times should remain the same
    // UTC times should adjust
  });
});
```

---

## 4. Usage Caps & Limits

### Daily and Session Caps

**Acceptance Criteria:**
- ✅ Daily cap enforced at exact minute threshold
- ✅ Session cap enforced per app opening
- ✅ Session resets when app is closed
- ✅ Daily cap rolls over at midnight (local time)
- ✅ Usage tracked accurately across app restarts
- ✅ Usage synced to server (if enabled)

**Test Cases:**

```typescript
describe('Usage Caps', () => {
  test('should block app when daily cap reached', async () => {
    // Set Instagram daily cap to 60 minutes
    // Simulate 60 minutes of usage
    // Attempt to open app
    const result = await engine.shouldBlockApp('instagram-id', 'com.instagram');
    expect(result.shouldBlock).toBe(true);
    expect(result.reason).toContain('Daily limit');
  });

  test('should block app when session cap reached', async () => {
    // Set session cap to 15 minutes
    // Simulate 15 minutes continuous usage
    // Verify block
  });

  test('should reset session usage when app closes', async () => {
    // Open app, use for 10 minutes
    // Close app
    // Reopen app
    // Session usage should be 0
  });

  test('should roll over daily usage at midnight', async () => {
    // Set usage to 59 minutes
    // Fast-forward to 23:59
    // Fast-forward to 00:01
    // Usage should be 0
  });
});
```

---

## 5. Quick Disable & Override

### Quick Disable Functionality

**Acceptance Criteria:**
- ✅ Quick Disable pauses all blocking for N minutes
- ✅ Countdown shown in UI
- ✅ Quick Disable respects strict mode settings
- ✅ Quick Disable cannot be activated if any app in strict mode
- ✅ Quick Disable survives app restart
- ✅ Quick Disable auto-expires after duration

**Test Cases:**

```typescript
describe('Quick Disable', () => {
  test('should pause blocking for specified duration', async () => {
    const success = await engine.activateQuickDisable(15);
    expect(success).toBe(true);

    const state = engine.getState();
    expect(state.currentState).toBe('QUICK_DISABLED');
    expect(state.quickDisableUntil).toBeGreaterThan(Date.now());
  });

  test('should deny quick disable in strict mode', async () => {
    // Set plan to strict intensity
    const success = await engine.activateQuickDisable(15);
    expect(success).toBe(false);
  });

  test('should auto-expire after duration', async () => {
    await engine.activateQuickDisable(1); // 1 minute
    jest.advanceTimersByTime(61000); // 61 seconds

    const state = engine.getState();
    expect(state.currentState).toBe('IDLE');
    expect(state.quickDisableUntil).toBeNull();
  });
});
```

### Override Functionality

**Acceptance Criteria:**
- ✅ Override allowed only if plan.allowOverride = true
- ✅ Override denied if app.strict = true
- ✅ Override triggers cooldown period
- ✅ Override logged as event
- ✅ Override count tracked in stats

**Test Cases:**

```typescript
describe('Override', () => {
  test('should grant override when allowed', async () => {
    // Plan with allowOverride=true, app not strict
    const result = await engine.requestOverride('test-app', 'com.test');
    expect(result.granted).toBe(true);
  });

  test('should deny override for strict apps', async () => {
    // App marked as strict
    const result = await engine.requestOverride('test-app', 'com.strict.app');
    expect(result.granted).toBe(false);
    expect(result.reason).toContain('strict');
  });

  test('should log override event', async () => {
    await engine.requestOverride('test-app', 'com.test');

    // Check blocking_events table
    const { data } = await supabase
      .from('blocking_events')
      .select('*')
      .eq('event_type', 'override_used')
      .single();

    expect(data).toBeTruthy();
  });
});
```

---

## 6. Strict Mode & Lock

### PIN Lock

**Acceptance Criteria:**
- ✅ PIN can be set in settings
- ✅ PIN hashed before storage (never plain text)
- ✅ Strict mode changes require PIN + cooldown
- ✅ Cooldown enforced even with correct PIN
- ✅ Failed PIN attempts tracked
- ✅ Biometric authentication supported (if available)

**Test Cases:**

```typescript
describe('PIN Lock', () => {
  test('should hash PIN before storage', async () => {
    await setLockPIN('1234');

    const { data } = await supabase
      .from('user_settings')
      .select('lock_settings')
      .single();

    expect(data.lock_settings.pin).not.toBe('1234');
    expect(data.lock_settings.pin).toMatch(/^[a-f0-9]{64}$/); // SHA-256 hash
  });

  test('should require PIN to disable strict mode', async () => {
    // Enable strict mode with PIN
    // Attempt to disable without PIN
    // Should fail
  });

  test('should enforce cooldown even with correct PIN', async () => {
    // Set cooldown to 30 minutes
    // Enter correct PIN
    // Should still wait 30 minutes
  });
});
```

---

## 7. First-Run Wizard

### Complete Wizard Flow

**Acceptance Criteria:**
- ✅ All 6 steps complete successfully
- ✅ User can go back to previous steps
- ✅ App selection saves correctly
- ✅ Schedule saves correctly
- ✅ Daily/session caps save correctly
- ✅ Permissions requested at end
- ✅ Plan activated after completion

**Test Cases:**

```typescript
describe('First-Run Wizard', () => {
  test('should complete all steps', async () => {
    // Step 1: Welcome
    // Step 2: Select apps
    // Step 3: Set daily limit
    // Step 4: Set active hours
    // Step 5: Set pause duration
    // Step 6: Grant permissions

    // Verify plan created in database
    // Verify plan is active
  });

  test('should allow navigation back', () => {
    // Go to step 5
    // Click back
    // Should be on step 4
    // Data should persist
  });

  test('should validate app selection', () => {
    // Try to proceed without selecting apps
    // Should show error
  });
});
```

---

## 8. Subscription & Paywall

### Purchase Flow

**Acceptance Criteria:**
- ✅ Paywall shown after plan creation (before activation)
- ✅ Free tier features accessible without payment
- ✅ Premium features gated correctly
- ✅ Purchase updates entitlements immediately
- ✅ Restore purchases works correctly
- ✅ Subscription status synced across devices

**Test Cases:**

```typescript
describe('Subscription', () => {
  test('should show paywall at correct time', () => {
    // Complete wizard
    // Verify paywall appears before engine activation
  });

  test('should gate premium features', async () => {
    // Try to create >3 app groups (premium feature)
    // Should show upgrade prompt
  });

  test('should update entitlements on purchase', async () => {
    // Simulate purchase
    const entitlements = await getEntitlements(userId);
    expect(entitlements.premium).toBe(true);
    expect(entitlements.features).toContain('unlimited_groups');
  });

  test('should restore purchases', async () => {
    // Clear local entitlements
    // Call restore
    // Verify premium status restored
  });
});
```

---

## 9. Sync & Conflict Resolution

### Sync Logic

**Acceptance Criteria:**
- ✅ Changes sync to cloud (if enabled)
- ✅ Conflicts detected via version number + checksum
- ✅ Most recent change wins by default
- ✅ User can resolve conflicts manually
- ✅ Sync survives poor network conditions
- ✅ Local-only mode works without sync

**Test Cases:**

```typescript
describe('Sync', () => {
  test('should sync changes to cloud', async () => {
    // Enable sync
    // Modify plan
    // Wait for sync
    // Verify data in Supabase
  });

  test('should detect conflicts', async () => {
    // Modify same entity on two devices
    // Trigger sync
    // Conflict should be detected
  });

  test('should resolve conflicts with most recent', async () => {
    // Create conflict
    // Newer change should win
  });

  test('should work offline', async () => {
    // Disable network
    // Make changes
    // Changes saved locally
    // Enable network
    // Changes sync
  });
});
```

---

## 10. Platform-Specific Tests

### iOS - ManagedSettings Integration

**Test Cases:**

```typescript
describe('iOS Blocking', () => {
  test('should shield applications', async () => {
    const service = permissionsManager.getIOSService();
    const result = await service.setShieldApplications(['com.instagram', 'com.tiktok']);
    expect(result).toBe(true);
  });

  test('should shield categories', async () => {
    const result = await service.setShieldCategories(['social', 'games']);
    expect(result).toBe(true);
  });

  test('should shield web domains', async () => {
    const result = await service.setShieldWebDomains(['facebook.com', '*.twitter.com']);
    expect(result).toBe(true);
  });

  test('should remove shields', async () => {
    await service.setShieldApplications(['com.instagram']);
    const result = await service.removeAllShields();
    expect(result).toBe(true);
  });
});
```

### Android - Service Hardening

**Test Cases:**

```typescript
describe('Android Service Hardening', () => {
  test('should restart service after kill', async () => {
    // Kill accessibility service
    // Wait for auto-restart
    // Verify service is running
  });

  test('should survive device rotation', async () => {
    // Show block overlay
    // Rotate device
    // Overlay should remain
  });

  test('should handle battery optimization', async () => {
    // Enable battery optimization
    // Service should still run
    // Warning shown to user
  });

  test('should survive app update', async () => {
    // Simulate app update
    // Services should re-register
    // Blocking should resume
  });
});
```

---

## 11. Edge Cases & Error Handling

### Critical Edge Cases

**Test Cases:**

```typescript
describe('Edge Cases', () => {
  test('should handle device reboot', async () => {
    // Simulate device reboot
    // Engine should reinitialize
    // Active plan should load
    // Schedules should re-register
  });

  test('should handle OS update', async () => {
    // Simulate OS update
    // Permissions may reset
    // App should detect and prompt
  });

  test('should handle date/time changes', async () => {
    // User manually changes device time
    // Schedules should still work correctly
    // Usage tracking should be accurate
  });

  test('should handle emergency allowlist', () => {
    // Phone, Messages, Maps never blocked
    // Even in strict mode
  });

  test('should handle low storage', async () => {
    // Device running out of space
    // Critical data preserved
    // Non-critical data cleared
  });

  test('should handle database corruption', async () => {
    // Corrupt local database
    // App should detect and recover
    // Sync from cloud if available
  });
});
```

---

## Manual Testing Checklist

### Pre-Release Testing

- [ ] Install fresh on iOS device
- [ ] Install fresh on Android device
- [ ] Complete first-run wizard
- [ ] Block an app and verify behavior
- [ ] Test override flow
- [ ] Test quick disable
- [ ] Test strict mode
- [ ] Test schedule activation/deactivation
- [ ] Test daily cap enforcement
- [ ] Test session cap enforcement
- [ ] Force quit app and reopen
- [ ] Reboot device
- [ ] Revoke permissions and re-grant
- [ ] Purchase premium subscription
- [ ] Restore purchases on second device
- [ ] Test sync across devices
- [ ] Test offline mode
- [ ] Test with poor network
- [ ] Test all tab screens
- [ ] Test settings changes
- [ ] Test diagnostics screen
- [ ] Test notifications
- [ ] Test AI insights

---

## Performance Benchmarks

### Target Metrics

- App launch time: < 2 seconds
- State transition latency: < 100ms
- UI response time: < 16ms (60fps)
- Database query time: < 50ms
- Sync latency: < 5 seconds
- Memory usage: < 100MB
- Battery drain: < 2% per hour (background)

---

## Accessibility Testing

- [ ] VoiceOver/TalkBack navigation works
- [ ] All buttons have labels
- [ ] Color contrast meets WCAG AA
- [ ] Large text support
- [ ] Screen reader announces state changes
- [ ] Keyboard navigation (if applicable)

---

## Security Testing

- [ ] PIN stored as hash only
- [ ] No secrets in logs
- [ ] API keys not exposed
- [ ] RLS policies enforced
- [ ] SQL injection prevented
- [ ] XSS prevention
- [ ] Data encrypted at rest
- [ ] HTTPS only

---

## Conclusion

This test plan covers all critical functionality and edge cases. Implementation should prioritize:

1. **Unit tests** for state machine logic
2. **Integration tests** for blocking engine + native services
3. **E2E tests** for complete user flows
4. **Platform-specific tests** for iOS and Android
5. **Manual testing** before each release

**Test Coverage Target: 80%+ for critical paths**
