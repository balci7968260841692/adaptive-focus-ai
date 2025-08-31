import { Device } from '@capacitor/device';
import { AppLauncher } from '@capacitor/app-launcher';

export interface SystemApp {
  name: string;
  packageName: string;
  category: string;
  icon: string;
  timeUsed: number;
  timeLimit: number;
  lastUsed?: Date;
}

export class SystemAppTracker {
  private mockApps: SystemApp[] = [
    {
      name: 'Instagram',
      packageName: 'com.instagram.android',
      category: 'Social',
      icon: '📷',
      timeUsed: Math.floor(Math.random() * 120) + 30,
      timeLimit: 60,
      lastUsed: new Date(Date.now() - Math.random() * 86400000)
    },
    {
      name: 'TikTok',
      packageName: 'com.tiktok.android',
      category: 'Entertainment',
      icon: '🎵',
      timeUsed: Math.floor(Math.random() * 180) + 45,
      timeLimit: 90,
      lastUsed: new Date(Date.now() - Math.random() * 86400000)
    },
    {
      name: 'WhatsApp',
      packageName: 'com.whatsapp',
      category: 'Social',
      icon: '💬',
      timeUsed: Math.floor(Math.random() * 90) + 20,
      timeLimit: 120,
      lastUsed: new Date(Date.now() - Math.random() * 86400000)
    },
    {
      name: 'YouTube',
      packageName: 'com.google.android.youtube',
      category: 'Entertainment',
      icon: '📺',
      timeUsed: Math.floor(Math.random() * 200) + 60,
      timeLimit: 120,
      lastUsed: new Date(Date.now() - Math.random() * 86400000)
    },
    {
      name: 'Gmail',
      packageName: 'com.google.android.gm',
      category: 'Productivity',
      icon: '📧',
      timeUsed: Math.floor(Math.random() * 60) + 15,
      timeLimit: 90,
      lastUsed: new Date(Date.now() - Math.random() * 86400000)
    },
    {
      name: 'Chrome',
      packageName: 'com.android.chrome',
      category: 'Productivity',
      icon: '🌐',
      timeUsed: Math.floor(Math.random() * 150) + 40,
      timeLimit: 180,
      lastUsed: new Date(Date.now() - Math.random() * 86400000)
    },
    {
      name: 'Spotify',
      packageName: 'com.spotify.music',
      category: 'Entertainment',
      icon: '🎶',
      timeUsed: Math.floor(Math.random() * 100) + 30,
      timeLimit: 180,
      lastUsed: new Date(Date.now() - Math.random() * 86400000)
    },
    {
      name: 'Twitter',
      packageName: 'com.twitter.android',
      category: 'Social',
      icon: '🐦',
      timeUsed: Math.floor(Math.random() * 80) + 20,
      timeLimit: 60,
      lastUsed: new Date(Date.now() - Math.random() * 86400000)
    }
  ];

  async getInstalledApps(): Promise<SystemApp[]> {
    try {
      const deviceInfo = await Device.getInfo();
      
      // In a real implementation, you would use platform-specific APIs here:
      // - Android: UsageStatsManager API
      // - iOS: Screen Time API (requires special entitlements)
      
      if (deviceInfo.platform === 'web') {
        // Return mock data for web/development
        return this.getMockAppsWithDynamicUsage();
      }
      
      // For mobile platforms, you would implement real device API calls here
      // For now, return enhanced mock data
      return this.getMockAppsWithDynamicUsage();
      
    } catch (error) {
      console.error('Error getting installed apps:', error);
      return this.getMockAppsWithDynamicUsage();
    }
  }

  private getMockAppsWithDynamicUsage(): SystemApp[] {
    // Simulate realistic usage patterns
    return this.mockApps.map(app => ({
      ...app,
      timeUsed: this.simulateRealisticUsage(app),
      lastUsed: new Date(Date.now() - Math.random() * 3600000) // Last hour
    }));
  }

  private simulateRealisticUsage(app: SystemApp): number {
    const baseUsage = app.timeUsed;
    const variance = baseUsage * 0.3; // 30% variance
    const usage = Math.max(0, baseUsage + (Math.random() - 0.5) * variance);
    
    // Add some time-based patterns
    const hour = new Date().getHours();
    if (hour >= 9 && hour <= 17) {
      // Work hours - more productivity apps
      if (app.category === 'Productivity') {
        return Math.floor(usage * 1.5);
      }
    } else if (hour >= 18 && hour <= 23) {
      // Evening - more entertainment/social
      if (app.category === 'Entertainment' || app.category === 'Social') {
        return Math.floor(usage * 1.3);
      }
    }
    
    return Math.floor(usage);
  }

  async getAppUsageStats(packageName: string): Promise<number> {
    // In a real implementation, this would query the system for actual usage stats
    const app = this.mockApps.find(a => a.packageName === packageName);
    return app ? this.simulateRealisticUsage(app) : 0;
  }

  async canOpenApp(packageName: string): Promise<boolean> {
    try {
      const result = await AppLauncher.canOpenUrl({ url: packageName });
      return result.value;
    } catch {
      return false;
    }
  }

  // Method to be called periodically to update usage stats
  updateUsageStats(): void {
    // In a real implementation, this would:
    // 1. Query the system for current usage stats
    // 2. Update the database with new data
    // 3. Calculate trends and patterns
    console.log('Updating system-wide usage stats...');
  }
}