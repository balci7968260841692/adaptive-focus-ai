# Android Setup Instructions

## Prerequisites
- Android Studio installed
- Android SDK with API level 21 or higher
- Java 8 or higher

## Setup Steps

1. **Export to GitHub** and clone locally:
   ```bash
   git clone your-repo-url
   cd your-project
   npm install
   ```

2. **Add Android platform**:
   ```bash
   npx cap add android
   ```

3. **Sync the project**:
   ```bash
   npm run build
   npx cap sync android
   ```

4. **Open in Android Studio**:
   ```bash
   npx cap open android
   ```

5. **Grant Usage Stats Permission**:
   - Install the app on your device
   - Go to Settings > Apps > Special app access > Usage access
   - Find your app and enable usage access permission

6. **Run on device/emulator**:
   ```bash
   npx cap run android
   ```

## Important Notes

- The app requires **PACKAGE_USAGE_STATS** permission for real app usage tracking
- This permission must be granted manually by the user through Settings
- Without this permission, the app will show mock data
- The permission dialog will be shown automatically when the app detects Android platform

## Troubleshooting

If you encounter build issues:
1. Make sure Android SDK is properly configured
2. Check that the minimum SDK version is set to 21 or higher
3. Ensure the plugin files are in the correct Android project structure
4. Clean and rebuild the project in Android Studio

## Real vs Mock Data

- **Web/Development**: Shows realistic mock data
- **Android with permission**: Shows actual device usage stats
- **Android without permission**: Shows mock data + permission request