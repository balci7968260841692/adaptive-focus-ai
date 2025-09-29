// ============================================================================
// DATA HELPERS & UTILITIES
// Helper functions for working with ScreenWise data structures
// ============================================================================

import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import type { 
  CoachTrainingData, 
  OverrideTrainingData,
  PersonalityTraits,
  ScreenTimePreferences,
  HabitData,
  WellnessGoals,
  AppUsageData,
  DailyScreenTimeData
} from '@/types/dataTemplates';

// Database types
type DbUserData = Database['public']['Tables']['user_data']['Row'];
type DbUserDataInsert = Database['public']['Tables']['user_data']['Insert'];

// =========================
// USER DATA MANAGEMENT
// =========================

export class UserDataManager {
  static async saveUserData(
    userId: string, 
    dataKey: string, 
    dataType: 'habit' | 'preference' | 'goal' | 'behavior' | 'mood' | 'context',
    dataValue: Record<string, any>
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('user_data')
        .upsert({
          user_id: userId,
          data_key: dataKey,
          data_type: dataType,
          data_value: dataValue,
          updated_at: new Date().toISOString()
        } as DbUserDataInsert);

      if (error) {
        console.error('Error saving user data:', error);
        return false;
      }
      return true;
    } catch (error) {
      console.error('Error in saveUserData:', error);
      return false;
    }
  }

  static async getUserData(userId: string, dataKey?: string): Promise<DbUserData[]> {
    try {
      let query = supabase
        .from('user_data')
        .select('*')
        .eq('user_id', userId);

      if (dataKey) {
        query = query.eq('data_key', dataKey);
      }

      const { data, error } = await query.order('updated_at', { ascending: false });

      if (error) {
        console.error('Error fetching user data:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getUserData:', error);
      return [];
    }
  }

  static async deleteUserData(userId: string, dataKey: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('user_data')
        .delete()
        .eq('user_id', userId)
        .eq('data_key', dataKey);

      if (error) {
        console.error('Error deleting user data:', error);
        return false;
      }
      return true;
    } catch (error) {
      console.error('Error in deleteUserData:', error);
      return false;
    }
  }
}

// =========================
// PERSONALITY & PREFERENCES
// =========================

export class PersonalityManager {
  static async savePersonalityTraits(userId: string, traits: PersonalityTraits): Promise<boolean> {
    return UserDataManager.saveUserData(userId, 'personality_traits', 'preference', traits);
  }

  static async getPersonalityTraits(userId: string): Promise<PersonalityTraits | null> {
    const data = await UserDataManager.getUserData(userId, 'personality_traits');
    return data.length > 0 ? data[0].data_value as unknown as PersonalityTraits : null;
  }

  static async saveScreenTimePreferences(userId: string, preferences: ScreenTimePreferences): Promise<boolean> {
    return UserDataManager.saveUserData(userId, 'screen_time_preferences', 'preference', preferences);
  }

  static async getScreenTimePreferences(userId: string): Promise<ScreenTimePreferences | null> {
    const data = await UserDataManager.getUserData(userId, 'screen_time_preferences');
    return data.length > 0 ? data[0].data_value as unknown as ScreenTimePreferences : null;
  }
}

// =========================
// HABIT TRACKING
// =========================

export class HabitManager {
  static async saveHabit(userId: string, habitName: string, habitData: HabitData): Promise<boolean> {
    return UserDataManager.saveUserData(userId, `habit_${habitName}`, 'habit', habitData);
  }

  static async getHabit(userId: string, habitName: string): Promise<HabitData | null> {
    const data = await UserDataManager.getUserData(userId, `habit_${habitName}`);
    return data.length > 0 ? data[0].data_value as unknown as HabitData : null;
  }

  static async getAllHabits(userId: string): Promise<{ [habitName: string]: HabitData }> {
    const allData = await UserDataManager.getUserData(userId);
    const habits = allData.filter(item => item.data_key.startsWith('habit_'));
    
    const habitMap: { [habitName: string]: HabitData } = {};
    habits.forEach(habit => {
      const habitName = habit.data_key.replace('habit_', '');
      habitMap[habitName] = habit.data_value as unknown as HabitData;
    });
    
    return habitMap;
  }
}

// =========================
// WELLNESS GOALS
// =========================

export class WellnessManager {
  static async saveWellnessGoals(userId: string, goals: WellnessGoals): Promise<boolean> {
    return UserDataManager.saveUserData(userId, 'wellness_goals', 'goal', goals);
  }

  static async getWellnessGoals(userId: string): Promise<WellnessGoals | null> {
    const data = await UserDataManager.getUserData(userId, 'wellness_goals');
    return data.length > 0 ? data[0].data_value as unknown as WellnessGoals : null;
  }

  static updateGoalProgress(goals: WellnessGoals, metricName: string, newValue: number): WellnessGoals {
    return {
      ...goals,
      metrics: goals.metrics.map(metric => 
        metric.name === metricName 
          ? { ...metric, current_value: newValue }
          : metric
      )
    };
  }

  static calculateGoalProgress(goals: WellnessGoals): number {
    if (goals.metrics.length === 0) return 0;
    
    const totalProgress = goals.metrics.reduce((sum, metric) => {
      const progress = Math.min(metric.current_value / metric.target_value, 1);
      return sum + progress;
    }, 0);
    
    return Math.round((totalProgress / goals.metrics.length) * 100);
  }
}

// =========================
// SCREEN TIME ANALYTICS
// =========================

export class ScreenTimeAnalytics {
  static calculateTrustScore(screenTimeData: DailyScreenTimeData[]): number {
    if (screenTimeData.length === 0) return 50; // Default neutral score

    const recentData = screenTimeData.slice(-7); // Last 7 days
    let totalScore = 0;

    recentData.forEach(day => {
      let dayScore = 100;

      // Deduct points for exceeding daily limit
      if (day.total_screen_time_minutes > day.daily_limit_minutes) {
        const overageRatio = day.total_screen_time_minutes / day.daily_limit_minutes;
        dayScore -= Math.min(50, (overageRatio - 1) * 30);
      }

      // Deduct points for excessive override requests
      if (day.override_requests.length > 3) {
        dayScore -= (day.override_requests.length - 3) * 5;
      }

      // Add points for taking breaks
      dayScore += Math.min(10, day.breaks_taken * 2);

      // Add points for focus sessions
      dayScore += Math.min(10, day.focus_sessions * 3);

      totalScore += Math.max(0, Math.min(100, dayScore));
    });

    return Math.round(totalScore / recentData.length);
  }

  static identifyUsagePatterns(screenTimeData: DailyScreenTimeData[]): {
    peakHours: string[];
    problematicApps: string[];
    improvements: string[];
    streaks: { type: string; days: number }[];
  } {
    const hourUsage: { [hour: string]: number } = {};
    const appOverages: { [app: string]: number } = {};
    const consecutiveDaysWithinLimit: number = this.calculateCurrentStreak(screenTimeData);

    screenTimeData.forEach(day => {
      day.apps.forEach(app => {
        app.peak_usage_hours.forEach(hour => {
          hourUsage[hour] = (hourUsage[hour] || 0) + 1;
        });

        if (app.daily_usage_minutes > app.daily_limit_minutes) {
          appOverages[app.app_name] = (appOverages[app.app_name] || 0) + 1;
        }
      });
    });

    const peakHours = Object.entries(hourUsage)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([hour]) => hour);

    const problematicApps = Object.entries(appOverages)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([app]) => app);

    const improvements = this.generateImprovements(screenTimeData);
    const streaks = [
      { type: 'within_limit', days: consecutiveDaysWithinLimit }
    ];

    return { peakHours, problematicApps, improvements, streaks };
  }

  private static calculateCurrentStreak(screenTimeData: DailyScreenTimeData[]): number {
    let streak = 0;
    for (let i = screenTimeData.length - 1; i >= 0; i--) {
      const day = screenTimeData[i];
      if (day.total_screen_time_minutes <= day.daily_limit_minutes) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  }

  private static generateImprovements(screenTimeData: DailyScreenTimeData[]): string[] {
    const improvements: string[] = [];
    const recentData = screenTimeData.slice(-7);

    if (recentData.length === 0) return improvements;

    const avgScreenTime = recentData.reduce((sum, day) => sum + day.total_screen_time_minutes, 0) / recentData.length;
    const avgBreaks = recentData.reduce((sum, day) => sum + day.breaks_taken, 0) / recentData.length;

    if (avgScreenTime > 300) { // 5 hours
      improvements.push("Consider setting shorter daily limits to build sustainable habits");
    }

    if (avgBreaks < 3) {
      improvements.push("Try to take more breaks throughout the day");
    }

    const overrideRate = recentData.reduce((sum, day) => sum + day.override_requests.length, 0) / recentData.length;
    if (overrideRate > 2) {
      improvements.push("Focus on honoring your initial time limits more consistently");
    }

    return improvements;
  }
}

// =========================
// ML TRAINING DATA HELPERS
// =========================

export class MLTrainingDataManager {
  static formatCoachingExample(
    userInput: string,
    idealResponse: string,
    userContext: any
  ): CoachTrainingData {
    return {
      input: userInput,
      output: idealResponse,
      context: {
        user_state: {
          screen_time_minutes: userContext.screenTime || 0,
          trust_score: userContext.trustScore || 50,
          mood: userContext.mood || 'neutral',
          time_of_day: userContext.timeOfDay || 'afternoon',
          day_of_week: new Date().toLocaleDateString('en', { weekday: 'long' })
        },
        recent_activity: userContext.recentActivity || [],
        user_preferences: userContext.preferences || {
          motivation_style: 'supportive',
          communication_preference: 'gentle',
          goal_orientation: 'process',
          stress_response: 'mindfulness',
          learning_style: 'visual'
        },
        current_goals: userContext.goals || [],
        intervention_type: 'supportive',
        confidence_score: 0.8
      },
      timestamp: new Date().toISOString()
    };
  }

  static formatOverrideExample(
    request: string,
    decision: string,
    requestContext: any
  ): OverrideTrainingData {
    return {
      input: request,
      output: decision,
      context: {
        user_history: requestContext.userHistory || {
          trust_score: 75,
          recent_overrides: 1,
          average_daily_screen_time: 240,
          goal_adherence_rate: 0.8
        },
        request_details: requestContext.details || {
          app_name: 'Unknown',
          current_usage_minutes: 60,
          daily_limit_minutes: 90,
          requested_time_minutes: 30,
          time_of_day: 'afternoon',
          day_of_week: new Date().toLocaleDateString('en', { weekday: 'long' })
        },
        context_analysis: requestContext.analysis || {
          is_work_related: false,
          urgency_level: 'medium',
          justification_quality: 'fair',
          past_similar_requests: 1
        },
        decision: requestContext.decision || {
          approved: false,
          granted_time_minutes: 0,
          confidence_score: 0.7,
          reasoning: 'Insufficient justification provided'
        }
      },
      timestamp: new Date().toISOString()
    };
  }

  static exportTrainingData(coachData: CoachTrainingData[], overrideData: OverrideTrainingData[]) {
    return {
      coach_training_data: coachData,
      override_training_data: overrideData,
      export_timestamp: new Date().toISOString(),
      total_examples: coachData.length + overrideData.length,
      metadata: {
        coach_examples: coachData.length,
        override_examples: overrideData.length,
        date_range: {
          start: Math.min(
            ...coachData.map(d => new Date(d.timestamp).getTime()),
            ...overrideData.map(d => new Date(d.timestamp).getTime())
          ),
          end: Math.max(
            ...coachData.map(d => new Date(d.timestamp).getTime()),
            ...overrideData.map(d => new Date(d.timestamp).getTime())
          )
        }
      }
    };
  }
}

// =========================
// VALIDATION HELPERS
// =========================

export class DataValidator {
  static validateScreenTime(minutes: number): boolean {
    return minutes >= 0 && minutes <= 1440; // 0-24 hours
  }

  static validateTrustScore(score: number): boolean {
    return score >= 0 && score <= 100;
  }

  static validateUserData(data: DbUserData): string[] {
    const errors: string[] = [];

    if (!data.user_id) errors.push('User ID is required');
    if (!data.data_key) errors.push('Data key is required');
    if (!data.data_type) errors.push('Data type is required');
    if (!data.data_value) errors.push('Data value is required');

    return errors;
  }

  static sanitizeUserInput(input: string): string {
    return input
      .trim()
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .substring(0, 1000); // Limit length
  }
}