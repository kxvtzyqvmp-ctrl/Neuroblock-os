# App Icon Setup Guide

This guide will help you set the new NeuroBlock logo as the app icon.

## Steps to Update the App Icon

### Option 1: Quick Setup (Recommended)

1. **Place your new icon image file** in the project root or in `assets/images/` with any name (e.g., `icon-new.png`, `logo.png`, etc.)

2. **Run the processing script:**
   ```bash
   npm run process-icon path/to/your/image.png
   ```
   
   Or if you placed it at `./assets/images/icon-new.png`:
   ```bash
   npm run process-icon
   ```

3. **The script will automatically:**
   - Resize the image to 1024×1024 pixels
   - Remove transparency (flatten with purple background)
   - Save it as `./assets/images/icon.png`
   - Optimize for App Store requirements

### Option 2: Manual Setup

1. **Prepare your image:**
   - Should be at least 1024×1024 pixels
   - PNG format preferred
   - Square aspect ratio

2. **Replace the existing icon:**
   - Copy your image file to: `./assets/images/icon.png`
   - Make sure it overwrites the existing file

3. **Validate and normalize:**
   ```bash
   node scripts/validate-icon.mjs
   ```

## What the Script Does

- ✅ Resizes to 1024×1024 pixels (required by App Store)
- ✅ Flattens transparency with purple gradient background (#4B2A88)
- ✅ Optimizes file size
- ✅ Ensures PNG format

## After Processing

1. **Verify the icon:**
   ```bash
   # Check that icon.png exists at assets/images/icon.png
   ls assets/images/icon.png
   ```

2. **Update build number** (if needed):
   ```bash
   # Edit app.json and increment ios.buildNumber
   ```

3. **Rebuild the app:**
   ```bash
   npx expo prebuild --clean
   eas build --platform ios --profile production
   ```

## Current Configuration

The icon is configured in `app.json`:
- **Icon path:** `./assets/images/icon.png`
- **Splash screen:** Uses the same icon
- **Android adaptive icon:** Uses the same icon with dark background

## Troubleshooting

### Error: "Source file not found"
- Make sure you've placed the image file in the correct location
- Check the file path is correct
- Ensure the file exists before running the script

### Error: "Sharp module not found"
- Install dependencies: `npm install`

### Icon looks stretched or cropped
- Make sure your source image is square (1:1 aspect ratio)
- The script uses "cover" mode, which maintains aspect ratio but may crop

## Notes

- The icon will be flattened (no transparency) as required by App Store guidelines
- Background color uses the brand purple (#4B2A88)
- File size will be optimized automatically



