# Installation Guide - iOS Builds

## Issue: QR Code Not Working

The QR code from your EAS build won't work on physical devices because the build was created with `"simulator": true`, which means it's **only for iOS Simulator** (requires a Mac).

## Solutions

### Option 1: Use Expo Go for Development (Recommended for Quick Testing)

Expo Go allows you to run your app on physical devices without building. This is perfect for development:

1. **Start the development server:**
   ```powershell
   npm start
   # or
   npx expo start
   ```

2. **Install Expo Go on your iOS device:**
   - Download from App Store: https://apps.apple.com/app/expo-go/id982107779

3. **Scan the QR code:**
   - Open Expo Go app
   - Tap "Scan QR code"
   - Scan the QR code from your terminal
   - The app will load on your device

**Note:** Expo Go has limitations - it can't use custom native code. If your app requires native modules, you need a development build (Option 2).

### Option 2: Build for Physical Devices (Requires Apple Developer Account)

To install the app on physical devices via QR code, you need a **device build** (not simulator):

1. **Set up Apple Developer credentials:**
   ```powershell
   eas credentials -p ios
   ```
   This requires:
   - An Apple Developer account ($99/year)
   - Your Apple ID credentials
   - EAS will guide you through the setup

2. **Build for physical devices:**
   ```powershell
   eas build --platform ios --profile development-device
   ```

3. **Install on device:**
   - Once the build completes, you'll get a QR code or download link
   - Scan the QR code on your device
   - Install the app (may require trusting the developer certificate)

### Option 3: Use iOS Simulator (Mac Only)

If you have a Mac, you can install the simulator build:

1. **Download the build:**
   - Visit the build URL: https://expo.dev/accounts/thlangu/projects/neuroblock-os/builds/0c3993b4-ef46-482a-8c7e-8808c9fcc7f3
   - Download the build artifact

2. **Install on Simulator:**
   ```bash
   # On Mac, extract and install
   xcrun simctl install booted path/to/app.app
   ```

## Build Profiles Explained

### `development` (Simulator)
- **For:** iOS Simulator on Mac
- **QR Code:** ❌ Won't work on physical devices
- **Credentials:** ❌ Not required
- **Use case:** Testing on Mac Simulator

### `development-device` (Physical Device)
- **For:** Physical iOS devices
- **QR Code:** ✅ Works on physical devices
- **Credentials:** ✅ Required (Apple Developer account)
- **Use case:** Testing on real devices

### `preview` (Internal Distribution)
- **For:** Physical iOS devices
- **QR Code:** ✅ Works on physical devices
- **Credentials:** ✅ Required
- **Use case:** Internal testing, TestFlight

### `production` (App Store)
- **For:** App Store distribution
- **QR Code:** ❌ Not applicable
- **Credentials:** ✅ Required
- **Use case:** App Store release

## Quick Comparison

| Method | Physical Device | Requires Credentials | QR Code Works | Setup Time |
|--------|----------------|---------------------|---------------|------------|
| Expo Go | ✅ Yes | ❌ No | ✅ Yes | ⚡ Instant |
| Development Build (Device) | ✅ Yes | ✅ Yes | ✅ Yes | 🕐 10-20 min |
| Simulator Build | ❌ No | ❌ No | ❌ No | 🕐 10-20 min |

## Recommended Workflow

### For Development (Fastest)
1. Use **Expo Go** for quick testing on devices
2. Run `npm start` and scan QR code
3. Test features and UI

### For Testing Native Features
1. Set up Apple Developer credentials
2. Build with `development-device` profile
3. Install on physical device via QR code
4. Test native modules and features

### For Production
1. Build with `production` profile
2. Submit to TestFlight or App Store
3. Distribute to users

## Troubleshooting

### QR Code Not Working
- **Simulator build:** QR codes don't work for simulator builds on physical devices
- **Solution:** Use Expo Go or build for devices

### "Unable to Install" Error
- **Cause:** Missing or invalid Apple Developer credentials
- **Solution:** Set up credentials with `eas credentials -p ios`

### Build Takes Too Long
- **Normal:** First build takes 10-20 minutes
- **Subsequent builds:** Usually faster (5-10 minutes)
- **Tip:** Use Expo Go for quick iterations during development

## Next Steps

1. **For quick testing:** Use Expo Go (`npm start`)
2. **For device builds:** Set up credentials and build with `development-device` profile
3. **For production:** Build with `production` profile and submit to App Store

## Resources

- [Expo Go Documentation](https://docs.expo.dev/get-started/expo-go/)
- [Development Builds](https://docs.expo.dev/develop/development-builds/introduction/)
- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [Apple Developer Account](https://developer.apple.com/programs/)

