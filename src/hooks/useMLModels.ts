import { useState, useEffect, useCallback } from 'react';
import { pipeline } from '@huggingface/transformers';

export interface TrainingData {
  input: string;
  output: string;
  context?: Record<string, any>;
  timestamp?: Date;
}

export interface ModelConfig {
  modelName: string;
  task: string;
  device?: 'cpu' | 'webgpu';
  quantized?: boolean;
}

export interface CoachResponse {
  message: string;
  confidence: number;
  suggestion?: string;
  intervention?: 'gentle' | 'firm' | 'supportive';
}

export interface OverrideDecision {
  approved: boolean;
  timeGranted?: number;
  reasoning: string;
  confidence: number;
  conditions?: string[];
}

const useMLModels = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [models, setModels] = useState<{
    coach: any | null;
    override: any | null;
  }>({
    coach: null,
    override: null
  });
  
  const [trainingData, setTrainingData] = useState<{
    coach: TrainingData[];
    override: TrainingData[];
  }>({
    coach: [],
    override: []
  });

  // Initialize models
  const initializeModels = useCallback(async () => {
    setIsLoading(true);
    try {
      // For now, use lightweight models as templates
      // These will be replaced with your trained models
      const coachModel = await pipeline(
        'text-generation',
        'microsoft/DialoGPT-small',
        { device: 'cpu' }
      );

      const overrideModel = await pipeline(
        'text-classification',
        'cardiffnlp/twitter-roberta-base-sentiment-latest',
        { device: 'cpu' }
      );

      setModels({
        coach: coachModel,
        override: overrideModel
      });
    } catch (error) {
      console.error('Failed to initialize ML models:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Coach AI - Generates supportive responses and habit coaching
  const generateCoachResponse = useCallback(async (
    userInput: string,
    context: {
      screenTime: number;
      trustScore: number;
      recentActivity: string[];
      timeOfDay: string;
    }
  ): Promise<CoachResponse> => {
    if (!models.coach) {
      // Fallback template responses until model is loaded
      return generateTemplateCoachResponse(userInput, context);
    }

    try {
      // This is a template - you'll replace with your trained model logic
      const prompt = `Context: User screen time: ${context.screenTime}min, Trust: ${context.trustScore}%, Time: ${context.timeOfDay}
User says: "${userInput}"
Coach response:`;

      const result = await models.coach(prompt, {
        max_new_tokens: 100,
        temperature: 0.7,
        do_sample: true,
      });

      return {
        message: result[0].generated_text.split('Coach response:')[1]?.trim() || 'I understand. Let me help you build better habits.',
        confidence: 0.8,
        intervention: determineInterventionType(userInput, context),
        suggestion: generateSuggestion(context)
      };
    } catch (error) {
      console.error('Coach model error:', error);
      return generateTemplateCoachResponse(userInput, context);
    }
  }, [models.coach]);

  // Override AI - Makes decisions about time limit overrides
  const evaluateOverrideRequest = useCallback(async (
    request: {
      reason: string;
      requestedTime: number;
      currentApp: string;
      userHistory: {
        trustScore: number;
        recentOverrides: number;
        timeOfDay: string;
      };
    }
  ): Promise<OverrideDecision> => {
    if (!models.override) {
      // Fallback template logic until model is loaded
      return generateTemplateOverrideDecision(request);
    }

    try {
      // This is a template - you'll replace with your trained model logic
      const prompt = `Override request analysis:
Reason: "${request.reason}"
Requested time: ${request.requestedTime} minutes
App: ${request.currentApp}
Trust score: ${request.userHistory.trustScore}%
Recent overrides: ${request.userHistory.recentOverrides}
Time: ${request.userHistory.timeOfDay}`;

      const result = await models.override(prompt);
      
      const approved = result[0].label === 'POSITIVE' || result[0].score > 0.6;
      const confidence = result[0].score;

      return {
        approved,
        timeGranted: approved ? Math.min(request.requestedTime, calculateMaxTime(request)) : 0,
        reasoning: generateReasoning(approved, request, confidence),
        confidence,
        conditions: approved ? generateConditions(request) : undefined
      };
    } catch (error) {
      console.error('Override model error:', error);
      return generateTemplateOverrideDecision(request);
    }
  }, [models.override]);

  // Add training data
  const addTrainingData = useCallback((
    type: 'coach' | 'override',
    data: TrainingData
  ) => {
    setTrainingData(prev => ({
      ...prev,
      [type]: [...prev[type], { ...data, timestamp: new Date() }]
    }));
  }, []);

  // Export training data for model training
  const exportTrainingData = useCallback((type?: 'coach' | 'override') => {
    if (type) {
      return trainingData[type];
    }
    return trainingData;
  }, [trainingData]);

  // Initialize models on mount
  useEffect(() => {
    initializeModels();
  }, [initializeModels]);

  return {
    isLoading,
    models,
    generateCoachResponse,
    evaluateOverrideRequest,
    addTrainingData,
    exportTrainingData,
    trainingData: trainingData.coach.length + trainingData.override.length
  };
};

// Template functions (fallbacks until models are trained)
const generateTemplateCoachResponse = (userInput: string, context: any): CoachResponse => {
  const lowTrust = context.trustScore < 60;
  const highScreenTime = context.screenTime > 300; // 5+ hours
  
  let message = "I'm here to help you build better screen time habits.";
  let intervention: 'gentle' | 'firm' | 'supportive' = 'supportive';
  
  if (lowTrust && highScreenTime) {
    message = "I notice you've been struggling with screen time lately. That's okay - building new habits takes time. Let's start small.";
    intervention = 'firm';
  } else if (highScreenTime) {
    message = "You've had quite a bit of screen time today. How are you feeling? Maybe it's time for a mindful break?";
    intervention = 'gentle';
  } else if (lowTrust) {
    message = "I can see you're working on building trust with your screen time goals. Every small step counts!";
    intervention = 'supportive';
  }

  return {
    message,
    confidence: 0.7,
    intervention,
    suggestion: generateSuggestion(context)
  };
};

const generateTemplateOverrideDecision = (request: any): OverrideDecision => {
  const isWorkRelated = request.reason.toLowerCase().includes('work') || 
                       request.reason.toLowerCase().includes('project');
  const isUrgent = request.reason.toLowerCase().includes('urgent') ||
                   request.reason.toLowerCase().includes('important');
  const highTrust = request.userHistory.trustScore > 70;
  const fewRecentOverrides = request.userHistory.recentOverrides < 3;

  const approved = (isWorkRelated && isUrgent && highTrust) || 
                   (fewRecentOverrides && request.requestedTime <= 15);

  return {
    approved,
    timeGranted: approved ? Math.min(request.requestedTime, 30) : 0,
    reasoning: approved 
      ? "Request approved based on context and trust score"
      : "Request needs more specific justification or trust building",
    confidence: 0.75,
    conditions: approved ? ["Take a 5-minute break after granted time"] : undefined
  };
};

const determineInterventionType = (input: string, context: any): 'gentle' | 'firm' | 'supportive' => {
  if (context.trustScore < 40) return 'firm';
  if (context.screenTime > 400) return 'gentle';
  return 'supportive';
};

const generateSuggestion = (context: any): string => {
  if (context.screenTime > 300) {
    return "Try the 20-20-20 rule: Every 20 minutes, look at something 20 feet away for 20 seconds.";
  }
  return "You're doing great! Keep up the balanced screen time.";
};

const calculateMaxTime = (request: any): number => {
  if (request.userHistory.trustScore > 80) return 45;
  if (request.userHistory.trustScore > 60) return 30;
  return 15;
};

const generateReasoning = (approved: boolean, request: any, confidence: number): string => {
  if (approved) {
    return `Approved based on ${confidence > 0.8 ? 'strong' : 'moderate'} justification and user history.`;
  }
  return "Request lacks sufficient justification or conflicts with wellness goals.";
};

const generateConditions = (request: any): string[] => {
  const conditions = [];
  if (request.requestedTime > 20) {
    conditions.push("Take a 5-minute break halfway through");
  }
  if (request.userHistory.recentOverrides > 1) {
    conditions.push("This is your limit for today");
  }
  return conditions;
};

export default useMLModels;