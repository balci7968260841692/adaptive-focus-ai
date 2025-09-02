import { registerPlugin } from '@capacitor/core';

export interface AppUsageInfo {
  packageName: string;
  appName: string;
  totalTimeInForeground: number;
  lastTimeUsed: number;
  category?: string;
}

export interface UsageStatsResult {
  apps: AppUsageInfo[];
  success: boolean;
  error?: string;
}

export interface UsageTrackerPlugin {
  getUsageStats(options: { startTime: number; endTime: number }): Promise<UsageStatsResult>;
  requestUsageStatsPermission(): Promise<{ granted: boolean }>;
  hasUsageStatsPermission(): Promise<{ granted: boolean }>;
  getInstalledApps(): Promise<{ apps: AppUsageInfo[] }>;
}

const UsageTracker = registerPlugin<UsageTrackerPlugin>('UsageTracker', {
  web: () => import('./web').then(m => new m.UsageTrackerWeb()),
});

export default UsageTracker;