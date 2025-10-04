import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.023e8dae742646b1a8c7a103d0fa8f33',
  appName: 'ScreenWise - AI Screen Time Manager',
  webDir: 'dist',
  // Uncomment the server config below ONLY for hot-reload during development
  // For production builds on device, comment it out and run: npm run build && npx cap sync android
  // server: {
  //   url: 'https://023e8dae-7426-46b1-a8c7-a103d0fa8f33.lovableproject.com?forceHideBadge=true',
  //   cleartext: true
  // },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#3b82f6",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: "LIGHT_CONTENT",
      backgroundColor: "#3b82f6"
    },
    Keyboard: {
      resize: "body",
      style: "DARK",
      resizeOnFullScreen: true
    },
    UsageTracker: {
      requestPermissions: true
    }
  },
  android: {
    allowMixedContent: true,
    permissions: [
      "android.permission.PACKAGE_USAGE_STATS",
      "android.permission.QUERY_ALL_PACKAGES"
    ]
  }
};

export default config;