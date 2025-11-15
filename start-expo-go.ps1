# Start Expo in Expo Go mode (not development client)
# This script forces Expo Go mode even when expo-dev-client is installed

Write-Host "Starting Expo in Expo Go mode..." -ForegroundColor Green
Write-Host "This will work with the Expo Go app from the App Store" -ForegroundColor Yellow
Write-Host ""

# Set environment variable to disable dev client
$env:EXPO_USE_DEV_CLIENT = "false"

# Start Expo
npx expo start --clear

