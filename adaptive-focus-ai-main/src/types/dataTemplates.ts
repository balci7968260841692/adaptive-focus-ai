// ============================================================================
// SCREENWISE DATA TEMPLATES
// This file defines the expected data structures for all core features
// ============================================================================

// =========================
// USER PROFILE DATA
// =========================
export interface UserProfile {
  user_id: string;
  display_name: string;
  avatar_url?: string;
  bio?: string;
  age?: number;
  timezone: string;
  created_at: string;
  updated_at: string;
}

// =========================
// USER DATA COLLECTION (for ML training and personalization)
// =========================
export interface UserDataEntry {
  user_id: string;
  data_key: string;
  data_type: 'habit' | 'preference' | 'goal' | 'behavior' | 'mood' | 'context';
  data_value: Record<string, any>;
  collected_at: string;
  updated_at: string;
}

// Sample user data structures
export interface HabitData {
  habit_name: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  target_value: number;
  current_streak: number;
  best_streak: number;
  difficulty_level: 1 | 2 | 3 | 4 | 5;
  triggers: string[];
  rewards: string[];
  obstacles: string[];
}

export interface ScreenTimePreferences {
  daily_limit_minutes: number;
  break_interval_minutes: number;
  strictness_level: 'flexible' | 'moderate' | 'strict';
  focus_periods: {
    start_time: string; // "09:00"
    end_time: string;   // "17:00"
    strict_mode: boolean;
  }[];
  app_categories: {
    [category: string]: {
      priority: 'high' | 'medium' | 'low';
      daily_limit_minutes: number;
      allowed_override_minutes: number;
    };
  };
}

export interface PersonalityTraits {
  motivation_style: 'encouraging' | 'challenging' | 'analytical' | 'supportive';
  communication_preference: 'direct' | 'gentle' | 'detailed' | 'brief';
  goal_orientation: 'achievement' | 'process' | 'social' | 'personal';
  stress_response: 'problem_solving' | 'emotional_support' | 'distraction' | 'mindfulness';
  learning_style: 'visual' | 'auditory' | 'kinesthetic' | 'reading';
}

export interface WellnessGoals {
  primary_goal: string;
  target_date: string;
  metrics: {
    name: string;
    target_value: number;
    current_value: number;
    unit: string;
  }[];
  milestones: {
    description: string;
    target_date: string;
    completed: boolean;
  }[];
}

// =========================
// ML TRAINING DATA TEMPLATES
// =========================
export interface CoachTrainingData {
  input: string;
  output: string;
  context: {
    user_state: {
      screen_time_minutes: number;
      trust_score: number;
      mood: 'happy' | 'stressed' | 'tired' | 'motivated' | 'frustrated' | 'calm';
      time_of_day: 'morning' | 'afternoon' | 'evening' | 'night';
      day_of_week: string;
    };
    recent_activity: string[];
    user_preferences: PersonalityTraits;
    current_goals: string[];
    intervention_type: 'gentle' | 'firm' | 'supportive';
    confidence_score: number;
  };
  timestamp: string;
}

export interface OverrideTrainingData {
  input: string; // User's override request
  output: string; // Decision with reasoning
  context: {
    user_history: {
      trust_score: number;
      recent_overrides: number;
      average_daily_screen_time: number;
      goal_adherence_rate: number;
    };
    request_details: {
      app_name: string;
      current_usage_minutes: number;
      daily_limit_minutes: number;
      requested_time_minutes: number;
      time_of_day: string;
      day_of_week: string;
    };
    context_analysis: {
      is_work_related: boolean;
      urgency_level: 'low' | 'medium' | 'high';
      justification_quality: 'poor' | 'fair' | 'good' | 'excellent';
      past_similar_requests: number;
    };
    decision: {
      approved: boolean;
      granted_time_minutes: number;
      confidence_score: number;
      reasoning: string;
      conditions?: string[];
    };
  };
  timestamp: string;
}

// =========================
// FUTURE MESSAGES
// =========================
export interface FutureMessage {
  id: string;
  user_id: string;
  title: string;
  message: string;
  delivery_date: string;
  is_delivered: boolean;
  created_at: string;
  updated_at: string;
}

// Sample future message templates
export const FUTURE_MESSAGE_TEMPLATES = {
  daily_motivation: {
    title: "Daily Check-in from Past You",
    message: "Hey future me! How did today go? Remember, progress isn't always linear. Celebrate the small wins and learn from the challenges. You've got this! 💪"
  },
  weekly_reflection: {
    title: "Weekly Reflection Time",
    message: "It's been a week since I set this reminder. Take a moment to reflect: What went well? What could be improved? What am I grateful for this week?"
  },
  goal_milestone: {
    title: "Goal Check: Screen Time Habits",
    message: "Remember when you started this journey? You wanted to reduce screen time by 2 hours daily. How are you doing? Be honest but kind to yourself."
  },
  habit_reminder: {
    title: "Habit Reminder from Your Committed Self",
    message: "Past you was really determined to build this habit. Don't break the chain! Even if you can only do 5 minutes today, that's better than zero."
  }
};

// =========================
// APP USAGE & SCREEN TIME DATA
// =========================
export interface AppUsageData {
  app_name: string;
  category: 'social' | 'productivity' | 'entertainment' | 'games' | 'utilities' | 'health' | 'education';
  daily_usage_minutes: number;
  daily_limit_minutes: number;
  weekly_average_minutes: number;
  sessions_count: number;
  average_session_minutes: number;
  peak_usage_hours: string[]; // ["14:00", "15:00", "20:00"]
  override_requests: number;
  override_approvals: number;
  last_used: string;
}

export interface DailyScreenTimeData {
  date: string; // "2024-01-15"
  total_screen_time_minutes: number;
  daily_limit_minutes: number;
  apps: AppUsageData[];
  breaks_taken: number;
  focus_sessions: number;
  trust_score: number;
  mood_ratings: {
    time: string;
    mood: string;
    energy: number; // 1-10
  }[];
  override_requests: {
    app: string;
    requested_time: number;
    granted_time: number;
    reason: string;
    approved: boolean;
    timestamp: string;
  }[];
}

// =========================
// AI MODEL CONFIGURATIONS
// =========================
export interface ModelConfig {
  model_name: string;
  model_type: 'coach' | 'override';
  version: string;
  training_data_count: number;
  last_trained: string;
  performance_metrics: {
    accuracy: number;
    user_satisfaction: number;
    intervention_success_rate: number;
  };
  personalization_level: number; // 0-100
  active: boolean;
}

// =========================
// COACHING INSIGHTS & PATTERNS
// =========================
export interface CoachingInsight {
  insight_type: 'pattern' | 'recommendation' | 'achievement' | 'warning';
  title: string;
  description: string;
  confidence: number;
  actionable_steps: string[];
  relevant_data: Record<string, any>;
  generated_at: string;
  user_feedback?: 'helpful' | 'not_helpful' | 'partially_helpful';
}

// =========================
// SAMPLE DATA FOR DEVELOPMENT/TESTING
// =========================
export const SAMPLE_USER_DATA: UserDataEntry[] = [
  {
    user_id: "user-123",
    data_key: "screen_time_preferences",
    data_type: "preference",
    data_value: {
      daily_limit_minutes: 360,
      break_interval_minutes: 30,
      strictness_level: "moderate",
      focus_periods: [
        { start_time: "09:00", end_time: "12:00", strict_mode: true },
        { start_time: "13:00", end_time: "17:00", strict_mode: true }
      ]
    },
    collected_at: "2024-01-15T10:00:00Z",
    updated_at: "2024-01-15T10:00:00Z"
  },
  {
    user_id: "user-123",
    data_key: "personality_traits",
    data_type: "preference",
    data_value: {
      motivation_style: "encouraging",
      communication_preference: "gentle",
      goal_orientation: "process",
      stress_response: "mindfulness",
      learning_style: "visual"
    },
    collected_at: "2024-01-15T10:05:00Z",
    updated_at: "2024-01-15T10:05:00Z"
  },
  {
    user_id: "user-123",
    data_key: "current_mood",
    data_type: "mood",
    data_value: {
      mood: "motivated",
      energy_level: 8,
      stress_level: 3,
      focus_level: 7,
      context: "Just finished morning routine, ready to tackle the day"
    },
    collected_at: "2024-01-15T10:10:00Z",
    updated_at: "2024-01-15T10:10:00Z"
  }
];

export const SAMPLE_COACHING_TRAINING_DATA: CoachTrainingData[] = [
  {
    input: "I've been on my phone for 5 hours today and I feel terrible about myself",
    output: "I hear that you're feeling overwhelmed by your screen time today. Five hours can feel like a lot, and it's completely normal to feel frustrated. Let's not focus on guilt - instead, let's think about what we can do right now. How about taking a 10-minute walk outside? Fresh air can help reset your mindset, and then we can work on a gentle plan for the rest of the day.",
    context: {
      user_state: {
        screen_time_minutes: 300,
        trust_score: 45,
        mood: "frustrated",
        time_of_day: "afternoon",
        day_of_week: "Wednesday"
      },
      recent_activity: ["social media", "news apps", "games"],
      user_preferences: {
        motivation_style: "supportive",
        communication_preference: "gentle",
        goal_orientation: "process", 
        stress_response: "mindfulness",
        learning_style: "visual"
      },
      current_goals: ["reduce daily screen time to 4 hours", "increase outdoor time"],
      intervention_type: "supportive",
      confidence_score: 0.85
    },
    timestamp: "2024-01-15T14:30:00Z"
  }
];

export const SAMPLE_OVERRIDE_TRAINING_DATA: OverrideTrainingData[] = [
  {
    input: "I need 30 more minutes on Slack to finish coordinating with my team for tomorrow's presentation",
    output: "APPROVED: 20 minutes. Your request is work-related with good justification. I'm granting 20 minutes instead of 30 to help maintain balance. Please take a 2-minute break every 10 minutes during this time.",
    context: {
      user_history: {
        trust_score: 78,
        recent_overrides: 1,
        average_daily_screen_time: 280,
        goal_adherence_rate: 0.82
      },
      request_details: {
        app_name: "Slack",
        current_usage_minutes: 45,
        daily_limit_minutes: 60,
        requested_time_minutes: 30,
        time_of_day: "evening",
        day_of_week: "Monday"
      },
      context_analysis: {
        is_work_related: true,
        urgency_level: "medium",
        justification_quality: "good",
        past_similar_requests: 2
      },
      decision: {
        approved: true,
        granted_time_minutes: 20,
        confidence_score: 0.92,
        reasoning: "Work-related request with specific deadline and good trust score",
        conditions: ["Take 2-minute breaks every 10 minutes", "This is your limit for today"]
      }
    },
    timestamp: "2024-01-15T18:45:00Z"
  }
];

// =========================
// DATA VALIDATION SCHEMAS
// =========================
export const DATA_VALIDATION_RULES = {
  screen_time_minutes: { min: 0, max: 1440 }, // 0-24 hours
  trust_score: { min: 0, max: 100 },
  energy_level: { min: 1, max: 10 },
  confidence_score: { min: 0, max: 1 },
  daily_limit_minutes: { min: 30, max: 720 }, // 30min - 12 hours
  break_interval_minutes: { min: 5, max: 120 } // 5min - 2 hours
};