# Native Implementation Guide

## Overview

This guide provides detailed instructions for implementing the native blocking services required for iOS and Android platforms. The app currently uses **mock implementations** that simulate blocking behavior. This document explains how to replace them with actual native modules.

---

## Table of Contents

1. [iOS Implementation](#ios-implementation)
2. [Android Implementation](#android-implementation)
3. [Bridge Layer](#bridge-layer)
4. [Testing Native Modules](#testing-native-modules)
5. [Deployment Considerations](#deployment-considerations)

---

## iOS Implementation

### Required Frameworks

```xml
<!-- Info.plist -->
<key>NSFamilyControlsUsageDescription</key>
<string>We need access to Screen Time to block distracting apps during your detox schedule.</string>
```

### Entitlements

```xml
<!-- YourApp.entitlements -->
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>com.apple.developer.family-controls</key>
    <true/>
    <key>com.apple.developer.device-activity</key>
    <true/>
    <key>com.apple.developer.managed-settings</key>
    <true/>
</dict>
</plist>
```

### Swift Implementation

#### 1. Authorization Module

```swift
// IOSBlockingModule.swift
import Foundation
import FamilyControls
import ManagedSettings
import DeviceActivity

@objc(IOSBlockingModule)
class IOSBlockingModule: NSObject {

    private let center = AuthorizationCenter.shared
    private let store = ManagedSettingsStore()
    private let deviceActivityCenter = DeviceActivityCenter()

    // MARK: - Authorization

    @objc
    func requestAuthorization(_ resolve: @escaping RCTPromiseResolveBlock,
                             reject: @escaping RCTPromiseRejectBlock) {
        Task {
            do {
                try await center.requestAuthorization(for: .individual)
                resolve(true)
            } catch {
                reject("AUTH_ERROR", "Failed to authorize", error)
            }
        }
    }

    @objc
    func checkAuthorization(_ resolve: @escaping RCTPromiseResolveBlock,
                           reject: @escaping RCTPromiseRejectBlock) {
        let status = center.authorizationStatus
        switch status {
        case .notDetermined:
            resolve("not_determined")
        case .denied:
            resolve("denied")
        case .approved:
            resolve("granted")
        @unknown default:
            resolve("not_determined")
        }
    }

    // MARK: - Shield Applications

    @objc
    func setShieldApplications(_ bundleIds: [String],
                              resolve: @escaping RCTPromiseResolveBlock,
                              reject: @escaping RCTPromiseRejectBlock) {
        Task {
            do {
                // Convert bundle IDs to ApplicationTokens
                let tokens = Set(bundleIds.compactMap { bundleId in
                    // You'll need to query available apps and match by bundle ID
                    // This requires FamilyActivitySelection
                    return getApplicationToken(for: bundleId)
                })

                store.shield.applications = tokens
                resolve(true)
            } catch {
                reject("SHIELD_ERROR", "Failed to shield apps", error)
            }
        }
    }

    @objc
    func setShieldCategories(_ categories: [String],
                            resolve: @escaping RCTPromiseResolveBlock,
                            reject: @escaping RCTPromiseRejectBlock) {
        Task {
            do {
                let activityCategories = Set(categories.compactMap { category in
                    return mapCategoryToActivityCategory(category)
                })

                store.shield.applicationCategories = .specific(activityCategories)
                resolve(true)
            } catch {
                reject("SHIELD_ERROR", "Failed to shield categories", error)
            }
        }
    }

    @objc
    func setShieldWebDomains(_ domains: [String],
                            resolve: @escaping RCTPromiseResolveBlock,
                            reject: @escaping RCTPromiseRejectBlock) {
        Task {
            do {
                let webDomains = Set(domains.compactMap { domain in
                    return WebDomain(domain: domain)
                })

                store.shield.webDomains = webDomains
                resolve(true)
            } catch {
                reject("SHIELD_ERROR", "Failed to shield domains", error)
            }
        }
    }

    @objc
    func removeAllShields(_ resolve: @escaping RCTPromiseResolveBlock,
                         reject: @escaping RCTPromiseRejectBlock) {
        store.shield.applications = nil
        store.shield.applicationCategories = nil
        store.shield.webDomains = nil
        resolve(true)
    }

    // MARK: - Device Activity Monitoring

    @objc
    func startDeviceActivityMonitoring(_ scheduleId: String,
                                       config: [String: Any],
                                       resolve: @escaping RCTPromiseResolveBlock,
                                       reject: @escaping RCTPromiseRejectBlock) {
        Task {
            do {
                guard let bundleIds = config["bundleIds"] as? [String],
                      let startTime = config["startTime"] as? String,
                      let endTime = config["endTime"] as? String,
                      let daysOfWeek = config["daysOfWeek"] as? [Int] else {
                    reject("INVALID_CONFIG", "Invalid configuration", nil)
                    return
                }

                // Parse times
                let startComponents = parseTimeString(startTime)
                let endComponents = parseTimeString(endTime)

                // Create schedule
                let schedule = DeviceActivitySchedule(
                    intervalStart: startComponents,
                    intervalEnd: endComponents,
                    repeats: true,
                    warningTime: nil
                )

                // Convert bundle IDs to tokens
                let tokens = Set(bundleIds.compactMap { getApplicationToken(for: $0) })

                // Create activity name
                let activityName = DeviceActivityName(scheduleId)

                // Start monitoring
                try deviceActivityCenter.startMonitoring(
                    activityName,
                    during: schedule
                )

                // Configure shields for this activity
                store.shield.applications = tokens

                resolve(true)
            } catch {
                reject("MONITOR_ERROR", "Failed to start monitoring", error)
            }
        }
    }

    @objc
    func stopDeviceActivityMonitoring(_ scheduleId: String,
                                      resolve: @escaping RCTPromiseResolveBlock,
                                      reject: @escaping RCTPromiseRejectBlock) {
        let activityName = DeviceActivityName(scheduleId)
        deviceActivityCenter.stopMonitoring([activityName])
        resolve(true)
    }

    // MARK: - Helper Methods

    private func getApplicationToken(for bundleId: String) -> ApplicationToken? {
        // This requires FamilyActivitySelection or querying system apps
        // Implementation depends on your app's architecture
        return nil // Placeholder
    }

    private func mapCategoryToActivityCategory(_ category: String) -> ActivityCategory? {
        switch category {
        case "social":
            return .socialNetworking
        case "entertainment":
            return .entertainment
        case "games":
            return .games
        case "productivity":
            return .productivity
        default:
            return nil
        }
    }

    private func parseTimeString(_ timeString: String) -> DateComponents {
        let parts = timeString.split(separator: ":")
        var components = DateComponents()
        components.hour = Int(parts[0])
        components.minute = Int(parts[1])
        return components
    }

    // MARK: - React Native Bridge

    @objc
    static func requiresMainQueueSetup() -> Bool {
        return false
    }
}
```

#### 2. Shield Configuration Extension

You'll also need a Shield Configuration Extension:

```swift
// ShieldConfigurationExtension.swift
import ManagedSettings
import UIKit

class ShieldConfigurationExtension: ShieldConfigurationDataSource {

    override func configuration(shielding application: Application) -> ShieldConfiguration {
        return ShieldConfiguration(
            backgroundBlurStyle: .systemUltraThinMaterialDark,
            backgroundColor: UIColor.black,
            icon: UIImage(systemName: "hand.raised.fill"),
            title: ShieldConfiguration.Label(
                text: "Mindful Pause",
                color: .white
            ),
            subtitle: ShieldConfiguration.Label(
                text: "Take a moment to reflect before opening this app.",
                color: .lightGray
            ),
            primaryButtonLabel: ShieldConfiguration.Label(
                text: "OK",
                color: .white
            ),
            primaryButtonBackgroundColor: UIColor.systemPurple
        )
    }

    override func configuration(shielding webDomain: WebDomain) -> ShieldConfiguration {
        return ShieldConfiguration(
            backgroundBlurStyle: .systemUltraThinMaterialDark,
            backgroundColor: UIColor.black,
            icon: UIImage(systemName: "hand.raised.fill"),
            title: ShieldConfiguration.Label(
                text: "Website Blocked",
                color: .white
            ),
            subtitle: ShieldConfiguration.Label(
                text: "This website is blocked during your detox schedule.",
                color: .lightGray
            ),
            primaryButtonLabel: nil,
            primaryButtonBackgroundColor: nil
        )
    }
}
```

#### 3. React Native Bridge File

```objc
// IOSBlockingModule.m
#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(IOSBlockingModule, NSObject)

RCT_EXTERN_METHOD(requestAuthorization:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(checkAuthorization:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(setShieldApplications:(NSArray *)bundleIds
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(setShieldCategories:(NSArray *)categories
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(setShieldWebDomains:(NSArray *)domains
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(removeAllShields:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(startDeviceActivityMonitoring:(NSString *)scheduleId
                  config:(NSDictionary *)config
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(stopDeviceActivityMonitoring:(NSString *)scheduleId
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)

@end
```

---

## Android Implementation

### Required Permissions

```xml
<!-- AndroidManifest.xml -->
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <uses-permission android:name="android.permission.PACKAGE_USAGE_STATS" />
    <uses-permission android:name="android.permission.SYSTEM_ALERT_WINDOW" />
    <uses-permission android:name="android.permission.BIND_ACCESSIBILITY_SERVICE" />
    <uses-permission android:name="android.permission.BIND_NOTIFICATION_LISTENER_SERVICE" />
    <uses-permission android:name="android.permission.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE" />

    <application>
        <!-- Accessibility Service -->
        <service
            android:name=".BlockingAccessibilityService"
            android:permission="android.permission.BIND_ACCESSIBILITY_SERVICE"
            android:exported="true">
            <intent-filter>
                <action android:name="android.accessibilityservice.AccessibilityService" />
            </intent-filter>
            <meta-data
                android:name="android.accessibilityservice"
                android:resource="@xml/accessibility_service_config" />
        </service>

        <!-- Blocking Overlay Activity -->
        <activity
            android:name=".BlockingOverlayActivity"
            android:theme="@style/Theme.Transparent.Fullscreen"
            android:launchMode="singleTop"
            android:excludeFromRecents="true"
            android:exported="false" />

        <!-- Foreground Service -->
        <service
            android:name=".BlockingForegroundService"
            android:exported="false" />
    </application>
</manifest>
```

### Kotlin Implementation

#### 1. Accessibility Service

```kotlin
// BlockingAccessibilityService.kt
package com.dopaminedetox

import android.accessibilityservice.AccessibilityService
import android.content.Intent
import android.view.accessibility.AccessibilityEvent

class BlockingAccessibilityService : AccessibilityService() {

    private val blockedApps = mutableSetOf<String>()
    private var isEnabled = true

    override fun onServiceConnected() {
        super.onServiceConnected()
        // Load blocked apps from storage
        loadBlockedApps()
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        if (!isEnabled || event == null) return

        if (event.eventType == AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED) {
            val packageName = event.packageName?.toString() ?: return

            // Check if this app should be blocked
            if (shouldBlockApp(packageName)) {
                showBlockingOverlay(packageName)
            }
        }
    }

    private fun shouldBlockApp(packageName: String): Boolean {
        // Check against blocked apps list
        if (!blockedApps.contains(packageName)) return false

        // Check if we're in an active schedule
        if (!isInActiveSchedule()) return false

        // Check usage caps
        if (hasExceededCap(packageName)) return true

        // Trigger mindful pause
        return true
    }

    private fun showBlockingOverlay(packageName: String) {
        val intent = Intent(this, BlockingOverlayActivity::class.java).apply {
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP)
            putExtra("packageName", packageName)
        }
        startActivity(intent)

        // Return to home
        performGlobalAction(GLOBAL_ACTION_HOME)
    }

    private fun isInActiveSchedule(): Boolean {
        // Query native module or shared preferences
        return true // Placeholder
    }

    private fun hasExceededCap(packageName: String): Boolean {
        // Check usage stats
        return false // Placeholder
    }

    private fun loadBlockedApps() {
        // Load from SharedPreferences or database
        // This should be called whenever the blocked apps list changes
    }

    override fun onInterrupt() {
        // Handle interruption
    }

    // Public API for React Native
    companion object {
        @JvmStatic
        fun updateBlockedApps(apps: Set<String>) {
            // Update the service's blocked apps list
        }

        @JvmStatic
        fun setEnabled(enabled: Boolean) {
            // Enable/disable blocking
        }
    }
}
```

#### 2. Blocking Overlay Activity

```kotlin
// BlockingOverlayActivity.kt
package com.dopaminedetox

import android.app.Activity
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.view.WindowManager
import android.widget.TextView
import kotlinx.coroutines.*

class BlockingOverlayActivity : Activity() {

    private var mindfulPauseDuration = 10 // seconds
    private var remainingSeconds = mindfulPauseDuration
    private val handler = Handler(Looper.getMainLooper())

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_blocking_overlay)

        // Make fullscreen and prevent escape
        window.addFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN)
        window.addFlags(WindowManager.LayoutParams.FLAG_NOT_TOUCHABLE)
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)

        val packageName = intent.getStringExtra("packageName") ?: ""
        val appName = getAppName(packageName)

        // Setup UI
        findViewById<TextView>(R.id.appName).text = appName
        findViewById<TextView>(R.id.message).text = "Take a mindful pause before opening this app."

        val timerText = findViewById<TextView>(R.id.timer)

        // Start countdown
        val countdownRunnable = object : Runnable {
            override fun run() {
                if (remainingSeconds > 0) {
                    timerText.text = remainingSeconds.toString()
                    remainingSeconds--
                    handler.postDelayed(this, 1000)
                } else {
                    // Pause completed, show block screen
                    showBlockScreen()
                }
            }
        }
        handler.post(countdownRunnable)
    }

    private fun showBlockScreen() {
        findViewById<TextView>(R.id.message).text =
            "This app is blocked during your detox schedule."
        findViewById<TextView>(R.id.timer).text = ""

        // Log event
        logBlockEvent()

        // Auto-close after 3 seconds
        handler.postDelayed({
            finish()
        }, 3000)
    }

    private fun getAppName(packageName: String): String {
        return try {
            val appInfo = packageManager.getApplicationInfo(packageName, 0)
            packageManager.getApplicationLabel(appInfo).toString()
        } catch (e: Exception) {
            packageName
        }
    }

    private fun logBlockEvent() {
        // Send event to React Native or native bridge
    }

    override fun onBackPressed() {
        // Prevent back button
    }

    override fun onDestroy() {
        super.onDestroy()
        handler.removeCallbacksAndMessages(null)
    }
}
```

#### 3. Usage Stats Manager

```kotlin
// UsageStatsManager.kt
package com.dopaminedetox

import android.app.usage.UsageStats
import android.app.usage.UsageStatsManager
import android.content.Context

class AppUsageManager(private val context: Context) {

    private val usageStatsManager = context.getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager

    fun getAppUsage(packageName: String, startTime: Long, endTime: Long): Long {
        val stats = usageStatsManager.queryUsageStats(
            UsageStatsManager.INTERVAL_DAILY,
            startTime,
            endTime
        )

        val appStats = stats.find { it.packageName == packageName }
        return appStats?.totalTimeInForeground ?: 0L
    }

    fun getTodayUsage(packageName: String): Long {
        val calendar = java.util.Calendar.getInstance()
        calendar.set(Calendar.HOUR_OF_DAY, 0)
        calendar.set(Calendar.MINUTE, 0)
        calendar.set(Calendar.SECOND, 0)

        val startTime = calendar.timeInMillis
        val endTime = System.currentTimeMillis()

        return getAppUsage(packageName, startTime, endTime)
    }

    fun getSessionUsage(packageName: String): Long {
        // Track session usage (since app was opened)
        // This requires more sophisticated tracking
        return 0L // Placeholder
    }
}
```

#### 4. React Native Module

```kotlin
// AndroidBlockingModule.kt
package com.dopaminedetox

import android.content.Intent
import android.provider.Settings
import com.facebook.react.bridge.*

class AndroidBlockingModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName() = "AndroidBlockingModule"

    @ReactMethod
    fun requestUsageAccess(promise: Promise) {
        try {
            val intent = Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS)
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            reactApplicationContext.startActivity(intent)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }

    @ReactMethod
    fun checkUsageAccess(promise: Promise) {
        val hasAccess = hasUsageStatsPermission()
        promise.resolve(hasAccess)
    }

    @ReactMethod
    fun requestAccessibilityService(promise: Promise) {
        try {
            val intent = Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS)
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            reactApplicationContext.startActivity(intent)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }

    @ReactMethod
    fun checkAccessibilityService(promise: Promise) {
        val isEnabled = isAccessibilityServiceEnabled()
        promise.resolve(isEnabled)
    }

    @ReactMethod
    fun setBlockedApps(apps: ReadableArray, promise: Promise) {
        try {
            val appSet = mutableSetOf<String>()
            for (i in 0 until apps.size()) {
                apps.getString(i)?.let { appSet.add(it) }
            }

            BlockingAccessibilityService.updateBlockedApps(appSet)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }

    @ReactMethod
    fun getAppUsageStats(packageName: String, startTime: Double, endTime: Double, promise: Promise) {
        try {
            val usageManager = AppUsageManager(reactApplicationContext)
            val usage = usageManager.getAppUsage(
                packageName,
                startTime.toLong(),
                endTime.toLong()
            )

            val result = Arguments.createMap().apply {
                putDouble("totalTimeMs", usage.toDouble())
            }

            promise.resolve(result)
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }

    private fun hasUsageStatsPermission(): Boolean {
        val usageStatsManager = reactApplicationContext
            .getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager
        val time = System.currentTimeMillis()
        val stats = usageStatsManager.queryUsageStats(
            UsageStatsManager.INTERVAL_DAILY,
            time - 1000 * 10,
            time
        )
        return stats != null && stats.isNotEmpty()
    }

    private fun isAccessibilityServiceEnabled(): Boolean {
        // Check if BlockingAccessibilityService is enabled
        return false // Placeholder
    }
}
```

---

## Bridge Layer

### TypeScript Interface

Replace the mock implementations in `lib/nativeServices.ts` with:

```typescript
import { NativeModules } from 'react-native';

const { IOSBlockingModule, AndroidBlockingModule } = NativeModules;

class NativeIOSBlockingService implements IOSBlockingService {
  async requestAuthorization(): Promise<boolean> {
    return await IOSBlockingModule.requestAuthorization();
  }

  async checkAuthorization(): Promise<'granted' | 'denied' | 'not_determined'> {
    return await IOSBlockingModule.checkAuthorization();
  }

  async setShieldApplications(bundleIds: string[]): Promise<boolean> {
    return await IOSBlockingModule.setShieldApplications(bundleIds);
  }

  // ... implement other methods
}

class NativeAndroidBlockingService implements AndroidBlockingService {
  async requestUsageAccess(): Promise<boolean> {
    return await AndroidBlockingModule.requestUsageAccess();
  }

  async checkUsageAccess(): Promise<boolean> {
    return await AndroidBlockingModule.checkUsageAccess();
  }

  // ... implement other methods
}
```

---

## Testing Native Modules

### iOS Testing

```bash
# Run on iOS simulator
npx expo run:ios

# Test with real device (required for FamilyControls)
npx expo run:ios --device
```

### Android Testing

```bash
# Run on Android emulator
npx expo run:android

# Test with real device
npx expo run:android --device
```

---

## Deployment Considerations

### iOS App Store

1. **Entitlements**: FamilyControls requires special approval from Apple
2. **Privacy Policy**: Must explain Screen Time usage
3. **Shield Extension**: Must be included in build

### Google Play Store

1. **Accessibility Service**: Declare usage in console
2. **Privacy Policy**: Explain all permissions
3. **Target SDK**: Must target Android 13+ (API 33)

### App Review Tips

- Provide test accounts
- Include demo video
- Explain all permissions clearly
- Highlight user benefits

---

## Conclusion

This guide provides the foundation for implementing native blocking services. The mock implementations can remain for development and testing, while production builds use the native modules.

**Next Steps:**
1. Implement iOS Swift module
2. Implement Android Kotlin module
3. Create native bridges
4. Test on real devices
5. Submit for app store review
