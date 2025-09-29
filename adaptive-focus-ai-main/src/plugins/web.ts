import { WebPlugin } from '@capacitor/core';
import type { UsageTrackerPlugin, UsageStatsResult, AppUsageInfo } from './UsageTracker';

export class UsageTrackerWeb extends WebPlugin implements UsageTrackerPlugin {
  async getUsageStats(options: { startTime: number; endTime: number }): Promise<UsageStatsResult> {
    console.log('getUsageStats called with options:', options);
    
    // Mock data for web development
    const mockApps: AppUsageInfo[] = [
      {
        packageName: 'com.instagram.android',
        appName: 'Instagram',
        totalTimeInForeground: Math.floor(Math.random() * 120) + 30,
        lastTimeUsed: Date.now() - Math.random() * 86400000,
        category: 'Social'
      },
      {
        packageName: 'com.google.android.youtube',
        appName: 'YouTube',
        totalTimeInForeground: Math.floor(Math.random() * 200) + 60,
        lastTimeUsed: Date.now() - Math.random() * 86400000,
        category: 'Entertainment'
      },
      {
        packageName: 'com.whatsapp',
        appName: 'WhatsApp',
        totalTimeInForeground: Math.floor(Math.random() * 90) + 20,
        lastTimeUsed: Date.now() - Math.random() * 86400000,
        category: 'Social'
      }
    ];

    return {
      apps: mockApps,
      success: true
    };
  }

  async requestUsageStatsPermission(): Promise<{ granted: boolean }> {
    console.log('requestUsageStatsPermission called - returning true for web');
    return { granted: true };
  }

  async hasUsageStatsPermission(): Promise<{ granted: boolean }> {
    console.log('hasUsageStatsPermission called - returning true for web');
    return { granted: true };
  }

  async getInstalledApps(): Promise<{ apps: AppUsageInfo[] }> {
    const result = await this.getUsageStats({ startTime: Date.now() - 86400000, endTime: Date.now() });
    return { apps: result.apps };
  }
}