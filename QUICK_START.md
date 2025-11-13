# Quick Start Guide - Git Setup & EAS iOS Build

## Step-by-Step Instructions

### 1. Install Git

**Download and Install:**
- Visit: https://git-scm.com/download/win
- Download the latest 64-bit installer
- Run the installer with default settings
- **Important**: Restart your terminal/Cursor after installation

**Verify Installation:**
```powershell
git --version
```

You should see: `git version 2.xx.x.windows.x`

### 2. Configure Git (First Time Only)

Set your name and email:
```powershell
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

### 3. Initialize Git Repository

**Option A: Use the automated script**
```powershell
.\init-git.ps1
```

**Option B: Manual setup**
```powershell
git init
git add .
git commit -m "Initial commit - Expo project setup"
```

### 4. Verify Setup

Run the verification script:
```powershell
.\setup-git.ps1
```

### 5. Run EAS iOS Build

Once Git is set up and the repository is initialized:
```powershell
eas build --platform ios
```

### 6. Answer Build Prompts

When prompted during the build:

1. **iOS Encryption Compliance:**
   - Question: "iOS app only uses standard/exempt encryption?"
   - Answer: **Yes** (for most Expo apps using HTTPS and standard APIs)

2. **Apple Developer Credentials:**
   - EAS will guide you through credential setup
   - You may need to provide your Apple Developer account credentials
   - EAS can manage certificates automatically

### 7. Monitor Build

- Build will be queued on EAS servers
- You'll receive a build URL to monitor progress
- Builds typically take 10-20 minutes
- You'll be notified when complete

## Troubleshooting

### Git Not Found After Installation
1. **Restart your terminal** - Required for PATH changes
2. **Restart Cursor/VS Code** - If using integrated terminal
3. Verify PATH includes Git: `$env:PATH -split ';' | Select-String git`

### Build Fails with Git Error
- Make sure Git is installed and in PATH
- Verify with: `git --version`
- Initialize repository: `git init`
- Create initial commit: `git add . && git commit -m "Initial commit"`

### Encryption Compliance Question
- Most Expo apps use standard encryption (HTTPS, standard APIs)
- Answer **Yes** to the encryption compliance question
- This can be configured in Apple Developer account settings

## Quick Reference

```powershell
# Install Git (download from https://git-scm.com/download/win)
# Then restart terminal

# Configure Git
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"

# Initialize repository
git init
git add .
git commit -m "Initial commit"

# Run build
eas build --platform ios
```

## Additional Resources

- **Git Setup Guide**: See `GIT_SETUP.md` for detailed instructions
- **Build Instructions**: See `BUILD_INSTRUCTIONS.md` for build details
- **EAS Documentation**: https://docs.expo.dev/build/introduction/
- **iOS Build Guide**: https://docs.expo.dev/build-reference/ios-builds/

## Next Steps After Successful Build

1. **Test the build** on a device
2. **Submit to TestFlight**: `eas submit --platform ios`
3. **Submit to App Store**: `eas submit --platform ios --latest`

## Need Help?

- Check the troubleshooting section above
- Review `GIT_SETUP.md` for Git installation help
- Review `BUILD_INSTRUCTIONS.md` for build details
- EAS Support: https://docs.expo.dev/build/introduction/


