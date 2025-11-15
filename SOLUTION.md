# Solution: Fix QR Code Not Working

## Problem Identified

Your terminal shows:
- `"Using development build"`
- URL starting with `exp+neuroblock-os://expo-development-client/`
- QR code that doesn't scan properly

**Root Cause:** Your project has `expo-dev-client` installed, which forces Expo to use **development client mode** instead of **Expo Go mode**. Development client requires a custom-built app, not the Expo Go app from the App Store.

## Solutions

### Solution 1: Switch to Expo Go Mode (Quick Fix)

**In your terminal, when Expo is running:**
1. Look at the terminal menu
2. You should see: `Press s switch to Expo Go`
3. **Press `s`** to switch to Expo Go mode
4. A new QR code will appear that works with Expo Go!

### Solution 2: Start with Expo Go Script (Recommended)

**Stop the current server (Ctrl+C), then run:**

```powershell
npm run start:go
```

Or directly:
```powershell
.\start-expo-go.ps1
```

This script:
- Sets `EXPO_USE_DEV_CLIENT=false` environment variable
- Starts Expo in Expo Go mode
- Generates a QR code compatible with Expo Go app

### Solution 3: Temporarily Remove expo-dev-client (For Expo Go Only)

If you only need Expo Go (not development builds):

1. **Temporarily remove from package.json:**
   - Open `package.json`
   - Remove or comment out: `"expo-dev-client": "~6.0.17",`
   - Run: `npm install`

2. **Start Expo:**
   ```powershell
   npm start
   ```

3. **When you need development builds again:**
   - Add `expo-dev-client` back
   - Run: `npm install`

### Solution 4: Use Development Build (Requires Building)

If you want to use the development client:

1. **Set up credentials:**
   ```powershell
   eas credentials -p ios
   ```

2. **Build for device:**
   ```powershell
   eas build --platform ios --profile development-device
   ```

3. **Install the build on your device:**
   - Scan the QR code from the build
   - Install the app on your device
   - Then the QR code will work

## Recommended Workflow

### For Quick Development (Expo Go)
```powershell
npm run start:go
```
- Works immediately
- No build needed
- Uses Expo Go app
- QR code works instantly

### For Native Features (Development Build)
```powershell
# First time: Set up credentials
eas credentials -p ios

# Build for device
eas build --platform ios --profile development-device

# Install on device, then:
npm start
```
- Requires build
- Supports custom native code
- Uses custom development client

## Quick Fix Right Now

**In your terminal:**
1. If server is running, **press `s`** to switch to Expo Go mode
2. If server is not running, run: `npm run start:go`
3. Scan the new QR code with Expo Go app
4. It should work!

## Troubleshooting

### QR Code Still Doesn't Work After Switching

1. **Clear cache and restart:**
   ```powershell
   npm run start:go
   # Or if using npm start, press 'c' to clear cache
   ```

2. **Use tunnel mode:**
   ```powershell
   $env:EXPO_USE_DEV_CLIENT = "false"
   npx expo start --tunnel --clear
   ```

3. **Manual URL entry:**
   - Copy the `exp://` URL from terminal
   - In Expo Go: Tap "Enter URL manually"
   - Paste the URL
   - Tap "Connect"

### Still Having Issues?

1. **Verify Expo Go is installed and updated:**
   - App Store → Search "Expo Go"
   - Update if needed

2. **Check terminal output:**
   - Should say "Expo Go" mode, not "development build"
   - URL should start with `exp://` not `exp+neuroblock-os://`

3. **Try different connection method:**
   - Tunnel mode (works across networks)
   - LAN mode (same network)
   - Manual URL entry

## Summary

- **Problem:** Development client mode (requires custom build)
- **Solution:** Switch to Expo Go mode (press `s` or use `npm run start:go`)
- **Result:** QR code works with Expo Go app from App Store

