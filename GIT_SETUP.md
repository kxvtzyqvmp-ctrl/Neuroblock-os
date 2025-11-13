# Git Setup Guide for EAS Builds

## Step 1: Install Git

### Download Git for Windows
1. Visit: https://git-scm.com/download/win
2. Download the latest version (64-bit installer recommended)
3. Run the installer

### Installation Options (Recommended Settings)
- **Editor**: Choose your preferred editor (VS Code, Notepad++, etc.)
- **Default branch name**: `main` (recommended)
- **PATH environment**: Select "Git from the command line and also from 3rd-party software"
- **HTTPS transport**: Use the OpenSSL library
- **Line ending conversions**: Select "Checkout Windows-style, commit Unix-style line endings"
- **Terminal emulator**: Use Windows' default console window
- **Default behavior**: Let Git decide

### Complete Installation
1. Click "Install" and wait for completion
2. **Restart your terminal/command prompt** after installation
3. Verify installation (see Step 2 below)

## Step 2: Verify Git Installation

After installing and restarting your terminal, run:

```powershell
git --version
```

You should see something like: `git version 2.xx.x.windows.x`

## Step 3: Configure Git (First Time Setup)

Set your name and email:

```powershell
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

## Step 4: Initialize Git Repository

Navigate to your project directory and run:

```powershell
cd "C:\Users\thlangu\Desktop\NeuroBlock OS"
git init
git add .
git commit -m "Initial commit - Expo project setup"
```

## Step 5: Run EAS Build

Once Git is set up, you can run:

```powershell
eas build --platform ios
```

## Troubleshooting

### Git command not found after installation
1. **Restart your terminal** - This is required for PATH changes to take effect
2. **Restart VS Code/Cursor** - If using an integrated terminal
3. **Check PATH**: The Git installer should have added Git to your PATH automatically

### Verify PATH
```powershell
$env:PATH -split ';' | Select-String git
```

You should see Git paths in the output.

### Manual PATH Addition (if needed)
If Git is installed but not in PATH:
1. Find Git installation (usually `C:\Program Files\Git\bin`)
2. Add it to System PATH:
   - Right-click "This PC" → Properties → Advanced system settings
   - Click "Environment Variables"
   - Edit "Path" under System variables
   - Add: `C:\Program Files\Git\bin`

## Next Steps

After Git is installed and verified:
1. Initialize the repository (Step 4)
2. Run the iOS build: `eas build --platform ios`
3. Follow the build prompts (encryption compliance, etc.)

## Quick Install Command (Using Winget - if available)

If you have Windows Package Manager (Winget) installed:

```powershell
winget install --id Git.Git -e --source winget
```

Then restart your terminal and proceed with Step 2.


