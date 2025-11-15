# QR Code Troubleshooting Guide

## Common Issues and Solutions

### Issue 1: QR Code Not Scanning

**Symptoms:**
- Camera can't focus on QR code
- QR code appears blurry
- Scanner doesn't recognize the code

**Solutions:**
1. **Make QR code larger:**
   - Zoom in on the terminal/QR code
   - Increase terminal font size
   - Take a screenshot and zoom in

2. **Check lighting:**
   - Ensure good lighting
   - Avoid glare on screen

3. **Try manual URL entry:**
   - In Expo Go, tap "Enter URL manually"
   - Copy the URL from terminal (looks like `exp://...`)

### Issue 2: Connection Timeout / Can't Connect

**Symptoms:**
- QR code scans but app doesn't load
- "Unable to connect" error
- Connection timeout

**Solutions:**

#### Solution A: Use Tunnel Mode (Most Reliable)
```powershell
npx expo start --tunnel
```
- Works even on different networks
- Uses Expo's servers to connect
- More reliable for most situations

#### Solution B: Check Wi-Fi Connection
1. **Same Network Required:**
   - iPhone and computer must be on same Wi-Fi
   - Check Wi-Fi name matches on both devices

2. **Check IP Address:**
   ```powershell
   ipconfig
   ```
   - Look for IPv4 address (e.g., 192.168.1.x)
   - Make sure URL in terminal matches this IP

#### Solution C: Check Firewall
1. **Windows Firewall:**
   - Allow Node.js through firewall
   - Allow port 8081 (Expo default port)

2. **Antivirus:**
   - Temporarily disable to test
   - Add exception for Node.js/Expo

#### Solution D: Try Different Connection Method
1. **LAN Mode:**
   ```powershell
   npx expo start --lan
   ```

2. **Localhost (if on same device):**
   ```powershell
   npx expo start --localhost
   ```

### Issue 3: "Unable to Load" Error

**Symptoms:**
- App starts loading but fails
- Error message in Expo Go
- Blank screen

**Solutions:**

1. **Clear Expo Go Cache:**
   - In Expo Go app, shake device
   - Tap "Reload" or "Clear cache"

2. **Clear Metro Bundler Cache:**
   ```powershell
   npx expo start --clear
   ```

3. **Check for Errors:**
   - Look at terminal for error messages
   - Check if all dependencies are installed

### Issue 4: Server Not Starting

**Symptoms:**
- No QR code appears
- Terminal shows errors
- Server crashes

**Solutions:**

1. **Check Port Availability:**
   - Port 8081 might be in use
   - Try different port:
   ```powershell
   npx expo start --port 8082
   ```

2. **Reinstall Dependencies:**
   ```powershell
   npm install
   ```

3. **Check Node Version:**
   ```powershell
   node --version
   ```
   - Should be Node 18 or higher

## Step-by-Step Troubleshooting

### Step 1: Verify Server is Running
Look for these in terminal:
- ✅ QR code displayed
- ✅ "Metro waiting on..." message
- ✅ Connection URL (exp://...)

### Step 2: Try Tunnel Mode
```powershell
# Stop current server (Ctrl+C)
npx expo start --tunnel
```
Wait for "Tunnel ready" message, then scan QR code.

### Step 3: Manual URL Entry
1. Copy the URL from terminal (starts with `exp://`)
2. Open Expo Go
3. Tap "Enter URL manually"
4. Paste the URL
5. Tap "Connect"

### Step 4: Check Network
```powershell
# On Windows, check your IP
ipconfig

# Look for IPv4 Address
# Make sure it matches the URL in terminal
```

### Step 5: Test Connection
1. Open browser on iPhone
2. Go to: `http://YOUR_IP:8081` (replace YOUR_IP)
3. Should see Expo DevTools page
4. If this works, network is fine

## Alternative: Use Development Build

If Expo Go continues to have issues, use a development build:

1. **Set up credentials:**
   ```powershell
   eas credentials -p ios
   ```

2. **Build for device:**
   ```powershell
   eas build --platform ios --profile development-device
   ```

3. **Install via QR code:**
   - Build will provide installable QR code
   - Works like a regular app install

## Quick Fixes Checklist

- [ ] Server is running (see QR code in terminal)
- [ ] Using tunnel mode (`--tunnel` flag)
- [ ] Expo Go app is installed and updated
- [ ] Tried manual URL entry
- [ ] Cleared Expo Go cache
- [ ] Checked firewall settings
- [ ] Verified Wi-Fi connection
- [ ] Tried different network

## Still Not Working?

1. **Check Terminal Output:**
   - Look for error messages
   - Note any warnings

2. **Try Fresh Start:**
   ```powershell
   # Stop server (Ctrl+C)
   npx expo start --clear --tunnel
   ```

3. **Check Expo Go Version:**
   - Update Expo Go from App Store
   - Make sure it's the latest version

4. **Verify Project Setup:**
   ```powershell
   npx expo-doctor
   ```

## Contact Support

If nothing works:
- Check Expo documentation: https://docs.expo.dev/
- Expo forums: https://forums.expo.dev/
- GitHub issues: https://github.com/expo/expo/issues

