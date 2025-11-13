# EAS Build Instructions

## Prerequisites

1. **Git Installation** (Recommended)
   - Download and install Git from: https://git-scm.com/download/win
   - Restart your terminal after installation
   - Initialize git repository: `git init`

2. **EAS CLI Authentication**
   - You're already authenticated as: `thlangu`
   - Verify with: `eas whoami`

3. **Apple Developer Account**
   - You need an active Apple Developer account
   - EAS will help you set up credentials if needed

## iOS Build Process

### Step 1: Initialize Git (if not already done)
```bash
git init
git add .
git commit -m "Initial commit"
```

### Step 2: Run iOS Build
```bash
eas build --platform ios
```

### Step 3: Answer Prompts

During the build, you'll be asked:

1. **iOS Encryption Compliance Question:**
   - "iOS app only uses standard/exempt encryption?"
   - Answer: **Yes** (for most Expo apps)
   - Learn more: https://developer.apple.com/documentation/Security/complying-with-encryption-export-regulations

2. **Apple Developer Credentials:**
   - EAS will guide you through setting up credentials
   - You may need to provide your Apple Developer account credentials
   - EAS can manage certificates and provisioning profiles automatically

### Step 4: Monitor Build

- The build will be queued on EAS servers
- You'll receive a build URL to monitor progress
- Builds typically take 10-20 minutes
- You'll be notified when the build is complete

## Build Profiles

- **Production**: `eas build --platform ios --profile production`
- **Preview**: `eas build --platform ios --profile preview`
- **Development**: `eas build --platform ios --profile development`

## Troubleshooting

### Git Not Found
If you don't want to install Git, you can use:
```bash
$env:EAS_NO_VCS=1
eas build --platform ios
```

### Encryption Compliance
- Most Expo apps use standard encryption (HTTPS, standard APIs)
- Answer "Yes" to the encryption compliance question
- This can be configured in your Apple Developer account settings

### Credentials Setup
If you need to set up credentials:
```bash
eas credentials
```

This will guide you through:
- Apple Developer account authentication
- Certificate management
- Provisioning profile setup

## Build Status

Check build status:
```bash
eas build:list
```

## Download Build

Once the build is complete, download it:
```bash
eas build:list
# Find your build ID and download
eas build:download [build-id]
```

## Next Steps

After a successful build:
1. Test the build on a device
2. Submit to TestFlight: `eas submit --platform ios`
3. Submit to App Store: `eas submit --platform ios --latest`

## Additional Resources

- EAS Build Docs: https://docs.expo.dev/build/introduction/
- iOS Build Guide: https://docs.expo.dev/build-reference/ios-builds/
- Apple Developer: https://developer.apple.com/


