import { useState, useEffect } from 'react';
import { App } from '@capacitor/app';
import { Device } from '@capacitor/device';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { SystemAppTracker, type SystemApp } from '@/services/systemAppTracker';

interface AppUsageData {
  name: string;
  icon: string;
  timeUsed: number;
  timeLimit: number;
  category: string;
  packageName?: string;
}

interface ScreenTimeData {
  totalScreenTime: number;
  dailyLimit: number;
  trustScore: number;
  apps: AppUsageData[];
}

export const useDeviceTracking = () => {
  const { user } = useAuth();
  const [screenTimeData, setScreenTimeData] = useState<ScreenTimeData>({
    totalScreenTime: 0,
    dailyLimit: 360,
    trustScore: 100,
    apps: []
  });
  const [isTracking, setIsTracking] = useState(false);
  const [lastActiveTime, setLastActiveTime] = useState(Date.now());
  const [systemAppTracker] = useState(new SystemAppTracker());

  // Track app state changes
  useEffect(() => {
    if (!user) return;

    const startTracking = async () => {
      try {
        // Request device info
        const deviceInfo = await Device.getInfo();
        console.log('Device info:', deviceInfo);

        // For Android, check usage stats permission (don't request automatically)
        if (deviceInfo.platform === 'android') {
          const hasPermission = await systemAppTracker.requestUsagePermissionIfNeeded();
          if (!hasPermission) {
            console.log('Usage stats permission required for accurate tracking - will show permission banner');
          }
        }

        // Listen to app state changes
        App.addListener('appStateChange', ({ isActive }) => {
          const now = Date.now();
          
          if (isActive) {
            setLastActiveTime(now);
            setIsTracking(true);
            // Reload data when app becomes active to get fresh usage stats
            loadTodaysData();
          } else {
            // Calculate session time when app goes to background
            if (isTracking) {
              const sessionTime = Math.floor((now - lastActiveTime) / (1000 * 60)); // minutes
              updateAppUsage('ScreenWise', sessionTime);
            }
            setIsTracking(false);
          }
        });

        // Initial load of data
        await loadTodaysData();
        
      } catch (error) {
        console.error('Error starting device tracking:', error);
      }
    };

    startTracking();

    // Cleanup
    return () => {
      App.removeAllListeners();
    };
  }, [user]);

  // Periodic tracking while app is active
  useEffect(() => {
    if (!isTracking || !user) return;

    const interval = setInterval(async () => {
      const now = Date.now();
      const sessionTime = Math.floor((now - lastActiveTime) / (1000 * 60));
      
      if (sessionTime >= 1) { // Update every minute
        await updateAppUsage('ScreenWise', 1);
        setLastActiveTime(now);
      }
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [isTracking, user, lastActiveTime]);

  const loadTodaysData = async () => {
    if (!user) return;

    try {
      const today = new Date().toISOString().split('T')[0];

      // Load existing app usage data from database
      const { data: dbAppUsageData, error: appError } = await supabase
        .from('app_usage')
        .select('*')
        .eq('user_id', user.id)
        .eq('usage_date', today);

      if (appError) throw appError;

      // Get system-wide app usage
      const systemApps = await systemAppTracker.getInstalledApps();
      
      // Merge database data with system apps
      const mergedApps: AppUsageData[] = [];
      
      // Add system apps with their current usage
      for (const systemApp of systemApps) {
        const dbApp = dbAppUsageData?.find(db => db.app_package === systemApp.packageName);
        
        mergedApps.push({
          name: systemApp.name,
          icon: systemApp.icon,
          timeUsed: systemApp.timeUsed,
          timeLimit: dbApp?.time_limit || systemApp.timeLimit,
          category: systemApp.category,
          packageName: systemApp.packageName
        });

        // Update database with current usage
        await updateAppUsageInDb(systemApp.name, systemApp.packageName, systemApp.category, systemApp.timeUsed);
      }

      // Add ScreenWise app
      const screenWiseApp = dbAppUsageData?.find(db => db.app_name === 'ScreenWise');
      if (screenWiseApp) {
        mergedApps.push({
          name: screenWiseApp.app_name,
          icon: getCategoryIcon(screenWiseApp.category),
          timeUsed: screenWiseApp.time_used,
          timeLimit: screenWiseApp.time_limit,
          category: screenWiseApp.category,
          packageName: screenWiseApp.app_package || undefined
        });
      }

      // Load screen time summary
      const { data: summaryData, error: summaryError } = await supabase
        .from('screen_time_summary')
        .select('*')
        .eq('user_id', user.id)
        .eq('usage_date', today)
        .single();

      if (summaryError && summaryError.code !== 'PGRST116') {
        throw summaryError;
      }

      const totalScreenTime = mergedApps.reduce((sum, app) => sum + app.timeUsed, 0);
      
      setScreenTimeData({
        totalScreenTime,
        dailyLimit: summaryData?.daily_limit || 360,
        trustScore: summaryData?.trust_score || calculateTrustScore(mergedApps, summaryData?.daily_limit || 360),
        apps: mergedApps
      });

    } catch (error) {
      console.error('Error loading today\'s data:', error);
      // Fallback to system apps only
      try {
        const systemApps = await systemAppTracker.getInstalledApps();
        const fallbackApps: AppUsageData[] = systemApps.map(app => ({
          name: app.name,
          icon: app.icon,
          timeUsed: app.timeUsed,
          timeLimit: app.timeLimit,
          category: app.category,
          packageName: app.packageName
        }));
        
        const totalScreenTime = fallbackApps.reduce((sum, app) => sum + app.timeUsed, 0);
        
        setScreenTimeData({
          totalScreenTime,
          dailyLimit: 360,
          trustScore: calculateTrustScore(fallbackApps, 360),
          apps: fallbackApps
        });
      } catch {
        setScreenTimeData({
          totalScreenTime: 0,
          dailyLimit: 360,
          trustScore: 100,
          apps: []
        });
      }
    }
  };

  const updateAppUsageInDb = async (appName: string, packageName: string, category: string, totalMinutes: number) => {
    if (!user) return;

    try {
      const today = new Date().toISOString().split('T')[0];

      // Upsert app usage with total time (not additive)
      const { error: upsertError } = await supabase
        .from('app_usage')
        .upsert({
          user_id: user.id,
          app_name: appName,
          app_package: packageName,
          category,
          time_used: totalMinutes,
          usage_date: today
        }, {
          onConflict: 'user_id,app_name,usage_date',
          ignoreDuplicates: false
        });

      if (upsertError) throw upsertError;
      
    } catch (error) {
      console.error('Error updating app usage in db:', error);
    }
  };

  const updateAppUsage = async (appName: string, additionalMinutes: number) => {
    if (!user) return;

    try {
      const today = new Date().toISOString().split('T')[0];
      const category = appName === 'ScreenWise' ? 'Productivity' : 'Other';

      // Get current usage
      const { data: currentUsage } = await supabase
        .from('app_usage')
        .select('time_used')
        .eq('user_id', user.id)
        .eq('app_name', appName)
        .eq('usage_date', today)
        .single();

      const newTotal = (currentUsage?.time_used || 0) + additionalMinutes;

      // Upsert app usage with incremented time
      const { error: upsertError } = await supabase
        .from('app_usage')
        .upsert({
          user_id: user.id,
          app_name: appName,
          category,
          time_used: newTotal,
          usage_date: today
        }, {
          onConflict: 'user_id,app_name,usage_date',
          ignoreDuplicates: false
        });

      if (upsertError) throw upsertError;

      // Reload data to reflect changes
      await loadTodaysData();
      
    } catch (error) {
      console.error('Error updating app usage:', error);
    }
  };

  const updateDailyLimit = async (newLimit: number) => {
    if (!user) return;

    try {
      const today = new Date().toISOString().split('T')[0];

      const { error } = await supabase
        .from('screen_time_summary')
        .upsert({
          user_id: user.id,
          daily_limit: newLimit,
          usage_date: today,
          total_screen_time: screenTimeData.totalScreenTime,
          trust_score: screenTimeData.trustScore
        }, {
          onConflict: 'user_id,usage_date'
        });

      if (error) throw error;

      setScreenTimeData(prev => ({ ...prev, dailyLimit: newLimit }));
      
    } catch (error) {
      console.error('Error updating daily limit:', error);
    }
  };

  const calculateTrustScore = (apps: AppUsageData[], dailyLimit: number): number => {
    const totalUsage = apps.reduce((sum, app) => sum + app.timeUsed, 0);
    const overLimitApps = apps.filter(app => app.timeUsed > app.timeLimit).length;
    
    let score = 100;
    
    // Reduce score based on total usage vs daily limit (0-40 point penalty)
    if (totalUsage > dailyLimit) {
      const overageRatio = (totalUsage - dailyLimit) / dailyLimit;
      score -= Math.min(40, overageRatio * 30);
    }
    
    // Reduce score for each app over its limit (0-30 point penalty)
    const maxOverLimitPenalty = 30;
    const overLimitPenalty = Math.min(maxOverLimitPenalty, overLimitApps * 5);
    score -= overLimitPenalty;
    
    // Bonus for staying under limits (0-10 point bonus)
    if (totalUsage <= dailyLimit * 0.8 && overLimitApps === 0) {
      score += 10;
    }
    
    // Category-based penalties for excessive social/entertainment usage
    const socialApps = apps.filter(app => app.category === 'Social');
    const entertainmentApps = apps.filter(app => app.category === 'Entertainment');
    
    const socialUsage = socialApps.reduce((sum, app) => sum + app.timeUsed, 0);
    const entertainmentUsage = entertainmentApps.reduce((sum, app) => sum + app.timeUsed, 0);
    
    // Penalize excessive social media usage (>2 hours)
    if (socialUsage > 120) {
      score -= Math.min(15, (socialUsage - 120) / 60 * 5);
    }
    
    // Penalize excessive entertainment usage (>3 hours)
    if (entertainmentUsage > 180) {
      score -= Math.min(15, (entertainmentUsage - 180) / 60 * 3);
    }
    
    return Math.max(0, Math.floor(score));
  };

  const getCategoryIcon = (category: string): string => {
    const iconMap: { [key: string]: string } = {
      'Social': '📱',
      'Productivity': '💼',
      'Entertainment': '🎬',
      'Games': '🎮',
      'Education': '📚',
      'Health': '❤️',
      'Finance': '💰',
      'Other': '📱'
    };
    return iconMap[category] || '📱';
  };

  return {
    screenTimeData,
    isTracking,
    updateDailyLimit,
    loadTodaysData,
    updateAppUsage
  };
};