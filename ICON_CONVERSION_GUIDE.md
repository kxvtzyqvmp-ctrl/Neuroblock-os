# App Icon Conversion Guide

## ✅ Configuration Status

Your `app.json` is already correctly configured:
- **Icon Path**: `./assets/images/icon.png`
- **iOS**: Uses the same icon
- **Android**: Uses `./assets/images/icon.png` for adaptive icon
- **Splash Screen**: Uses the same icon

## 📋 Manual Conversion Steps

Since direct ICO to PNG conversion isn't available in this environment, please follow these steps:

### Option 1: Online Converter (Easiest)
1. Use an online ICO to PNG converter:
   - [CloudConvert](https://cloudconvert.com/ico-to-png)
   - [ConvertIO](https://convertio.co/ico-png/)
   - [Zamzar](https://www.zamzar.com/convert/ico-to-png/)

2. Upload your `app_icon.ico` file
3. Set output size to **1024×1024 pixels**
4. Download the converted PNG
5. Save it as `assets/images/icon.png` (replace existing file)

### Option 2: Using Image Editing Software
1. **Photoshop/GIMP**:
   - Open `app_icon.ico`
   - Resize to 1024×1024 pixels
   - Export as PNG (24-bit or 32-bit with transparency)

2. **Preview (Mac)**:
   - Open `app_icon.ico`
   - File → Export
   - Format: PNG
   - Resolution: 1024×1024

3. **Paint.NET / Paint 3D (Windows)**:
   - Open `app_icon.ico`
   - Resize to 1024×1024
   - Save as PNG

### Option 3: Using Command Line Tools (if available)
```bash
# Using ImageMagick (if installed)
magick convert app_icon.ico -resize 1024x1024 assets/images/icon.png

# Using ffmpeg (if installed)
ffmpeg -i app_icon.ico -vf scale=1024:1024 assets/images/icon.png
```

## 🎨 Icon Requirements

- **Format**: PNG
- **Size**: 1024×1024 pixels
- **Background**: Transparent (recommended) or solid color
- **Aspect Ratio**: Square (1:1)
- **File Path**: `assets/images/icon.png`

## ✅ Verification

After placing the converted PNG file:

1. Verify file exists:
   ```bash
   Test-Path assets\images\icon.png
   ```

2. Verify file size:
   ```bash
   (Get-Item assets\images\icon.png).Length
   ```
   (Should be > 20KB for a 1024×1024 PNG)

3. Validate configuration:
   ```bash
   npx expo config --type public
   ```

4. Test in build:
   ```bash
   eas build --platform ios --profile production
   ```

## 📱 Platform-Specific Notes

### iOS
- Uses `icon.png` from root icon path
- Automatically generates app icon sizes from 1024×1024 source
- Build number: **2**

### Android
- Uses `icon.png` as adaptive icon foreground
- Background color: `#0B0B0B`
- Automatically generates required icon sizes

## 🔍 Current Configuration

Your `app.json` already has:
```json
{
  "expo": {
    "icon": "./assets/images/icon.png",
    "splash": {
      "image": "./assets/images/icon.png"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/images/icon.png",
        "backgroundColor": "#0B0B0B"
      }
    }
  }
}
```

**Status**: ✅ Configuration is correct - just needs the converted PNG file!

## 🚀 After Conversion

Once you've placed the converted PNG at `assets/images/icon.png`:

1. **Build for iOS**:
   ```bash
   eas build --platform ios --profile production --auto-submit
   ```

2. **Build for Android**:
   ```bash
   eas build --platform android --profile production
   ```

The new icon will appear in:
- TestFlight builds
- App Store Connect
- Android builds
- Device home screens

