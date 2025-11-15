# Expo Go Quick Start Guide

## Development Server Started! 🚀

The Expo development server is now running in the background. Here's how to connect your iPhone:

## Steps to Connect Your Device

### 1. Install Expo Go (if not already installed)
- **Download from App Store**: https://apps.apple.com/app/expo-go/id982107779
- Open the Expo Go app on your iPhone

### 2. Connect Your iPhone
**Option A: Scan QR Code (Recommended)**
- In Expo Go, tap **"Scan QR code"**
- Scan the QR code displayed in your terminal
- The app will load automatically

**Option B: Enter URL Manually**
- In Expo Go, tap **"Enter URL manually"**
- Enter the URL shown in your terminal (usually `exp://YOUR_IP:8081`)
- Tap **"Connect"**

### 3. Wait for App to Load
- The app will download and start on your device
- First load may take a minute
- Hot reload is enabled - changes will appear automatically

## Troubleshooting

### QR Code Not Scanning
1. **Check Wi-Fi Connection**
   - Make sure your iPhone and computer are on the same Wi-Fi network
   - Try restarting Wi-Fi on both devices

2. **Check Firewall**
   - Make sure Windows Firewall isn't blocking the connection
   - Expo uses port 8081 by default

3. **Use Tunnel Mode** (if Wi-Fi issues)
   ```powershell
   npm start -- --tunnel
   ```
   This uses Expo's servers to connect, works even on different networks

### App Not Loading
1. **Check Terminal Output**
   - Look for error messages in the terminal
   - Make sure the server is running

2. **Restart Server**
   - Press `Ctrl+C` in terminal to stop server
   - Run `npm start` again

3. **Clear Cache**
   ```powershell
   npm start -- --clear
   ```

### Connection Timeout
1. **Check IP Address**
   - Make sure your computer's IP address is correct
   - You can find it with: `ipconfig` (Windows)

2. **Use Tunnel Mode**
   ```powershell
   npm start -- --tunnel
   ```
   This bypasses network issues

## Development Commands

### Start Server
```powershell
npm start
```

### Start with Tunnel (if Wi-Fi issues)
```powershell
npm start -- --tunnel
```

### Start with Clear Cache
```powershell
npm start -- --clear
```

### Stop Server
- Press `Ctrl+C` in the terminal

## Hot Reload

- Changes to your code will automatically reload on your device
- No need to restart the server
- Just save your files and watch the magic happen!

## What You Can Do

✅ Test on real device
✅ See changes instantly
✅ Debug with console logs
✅ Test device-specific features
✅ Use device sensors (camera, location, etc.)

## Limitations of Expo Go

⚠️ **Note**: Expo Go has some limitations:
- Cannot use custom native code
- Some native modules may not be available
- For full native features, use a development build

## Next Steps

1. **Test your app** on your iPhone
2. **Make changes** and see them instantly
3. **Test features** specific to your app
4. **When ready**, build a development build for full native features

## Resources

- [Expo Go Documentation](https://docs.expo.dev/get-started/expo-go/)
- [Development Builds](https://docs.expo.dev/develop/development-builds/introduction/)
- [Troubleshooting Guide](https://docs.expo.dev/troubleshooting/clear-cache/)

## Need Help?

- Check the terminal output for errors
- Review the troubleshooting section above
- See INSTALLATION_GUIDE.md for more details

