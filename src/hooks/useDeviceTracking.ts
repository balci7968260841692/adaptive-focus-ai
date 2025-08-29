import { useState, useEffect } from 'react';
import { App } from '@capacitor/app';
import { Device } from '@capacitor/device';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

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

  // Track app state changes
  useEffect(() => {
    if (!user) return;

    const startTracking = async () => {
      try {
        // Request device info
        const deviceInfo = await Device.getInfo();
        console.log('Device info:', deviceInfo);

        // Listen to app state changes
        App.addListener('appStateChange', ({ isActive }) => {
          const now = Date.now();
          
          if (isActive) {
            setLastActiveTime(now);
            setIsTracking(true);
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

      // Load app usage data
      const { data: appUsageData, error: appError } = await supabase
        .from('app_usage')
        .select('*')
        .eq('user_id', user.id)
        .eq('usage_date', today);

      if (appError) throw appError;

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

      // Transform data
      const apps: AppUsageData[] = appUsageData?.map(app => ({
        name: app.app_name,
        icon: getCategoryIcon(app.category),
        timeUsed: app.time_used,
        timeLimit: app.time_limit,
        category: app.category,
        packageName: app.app_package || undefined
      })) || [];

      const totalScreenTime = apps.reduce((sum, app) => sum + app.timeUsed, 0);
      
      setScreenTimeData({
        totalScreenTime,
        dailyLimit: summaryData?.daily_limit || 360,
        trustScore: summaryData?.trust_score || calculateTrustScore(apps, summaryData?.daily_limit || 360),
        apps
      });

    } catch (error) {
      console.error('Error loading today\'s data:', error);
      // Use default/demo data if real data fails to load
      setScreenTimeData({
        totalScreenTime: 0,
        dailyLimit: 360,
        trustScore: 100,
        apps: []
      });
    }
  };

  const updateAppUsage = async (appName: string, additionalMinutes: number) => {
    if (!user) return;

    try {
      const today = new Date().toISOString().split('T')[0];
      const category = appName === 'ScreenWise' ? 'Productivity' : 'Other';

      // Upsert app usage
      const { error: upsertError } = await supabase
        .from('app_usage')
        .upsert({
          user_id: user.id,
          app_name: appName,
          category,
          time_used: additionalMinutes,
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
    
    // Reduce score based on total usage vs daily limit
    if (totalUsage > dailyLimit) {
      score -= Math.min(30, (totalUsage - dailyLimit) / dailyLimit * 50);
    }
    
    // Reduce score for each app over its limit
    score -= overLimitApps * 10;
    
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