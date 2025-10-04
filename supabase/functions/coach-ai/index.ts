import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CoachRequest {
  userInput: string;
  context: any;
  trainingData?: any[];
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY is not set');
    }

    const { userInput, context, trainingData }: CoachRequest = await req.json();

    // Build context-aware system prompt with dynamic personality
    const personalityTraits = determinePersonality(context);
    
    let systemPrompt = `You are a ${personalityTraits.type} wellness coach helping users with their digital habits and well-being. 

CRITICAL: Keep responses SHORT, conversational, and supportive. No structured thinking or long explanations.

Your personality: ${personalityTraits.description}

Your role is to:
- Give brief, encouraging responses (1-3 sentences max)
- Offer one simple, actionable suggestion
- Be warm and supportive without being verbose
- Reference the user's current situation naturally

User Context: ${JSON.stringify(context)}
Weekly patterns: ${analyzeWeeklyPatterns(context)}
Current session context: ${getCurrentSessionContext(context)}

Respond naturally as if you're having a friendly conversation. Keep it brief and supportive.`;

    // Include training data if available
    if (trainingData && trainingData.length > 0) {
      systemPrompt += `\n\nTraining Examples:\n${trainingData.map(example => 
        `User: ${example.input}\nCoach: ${example.output}`
      ).join('\n\n')}`;
    }

    // Call Lovable AI Gateway
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userInput }
        ],
        max_tokens: 200,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Lovable AI Gateway Error:', response.status, errorData);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const generatedText = data.choices?.[0]?.message?.content || 'I understand. How can I help you with your wellness goals?';

    // Use AI-generated response directly without predetermined overrides
    const coachResponse = {
      content: generatedText,
      interventionType: "ai-generated", 
      suggestion: "", // Let the AI include suggestions in the main content
      confidence: 0.9
    };

    console.log('Coach AI Response:', coachResponse);

    return new Response(JSON.stringify(coachResponse), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in coach-ai function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      content: "I'm here to support your wellness journey. How can I help you today?",
      interventionType: "supportive",
      suggestion: "Take a moment to reflect on your digital habits and what you'd like to improve.",
      confidence: 0.5
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Enhanced helper functions
function determinePersonality(context: any): { type: string, description: string, approach: string } {
  const { screenTime, trustScore, recentActivity, timeOfDay } = context;
  
  if (trustScore > 80 && recentActivity?.includes('Work Apps')) {
    return {
      type: 'Achievement-Focused',
      description: 'You celebrate wins and help users optimize their already good habits',
      approach: 'positive reinforcement and advanced strategies'
    };
  } else if (trustScore < 40 || screenTime > 400) {
    return {
      type: 'Gentle & Compassionate',
      description: 'You approach struggles with deep empathy and never judge',
      approach: 'small, manageable steps and emotional support'
    };
  } else if (timeOfDay === 'evening' && screenTime > 200) {
    return {
      type: 'Mindful Evening Guide',
      description: 'You help users wind down and reflect on their day mindfully',
      approach: 'evening reflection and calm transition strategies'
    };
  } else {
    return {
      type: 'Balanced Motivator',
      description: 'You provide steady encouragement with practical wisdom',
      approach: 'balanced motivation and actionable insights'
    };
  }
}

function analyzeWeeklyPatterns(context: any): string {
  const { screenTime, trustScore, recentActivity } = context;
  
  // Simulate pattern analysis (in real app, this would come from actual historical data)
  const patterns = [];
  
  if (screenTime > 300) patterns.push("high daily usage trending");
  if (trustScore < 50) patterns.push("consistency challenges");
  if (recentActivity?.includes('Games')) patterns.push("entertainment focus");
  if (recentActivity?.includes('Work Apps')) patterns.push("productive usage balance");
  
  return patterns.length > 0 ? patterns.join(', ') : "building new awareness";
}

function getCurrentSessionContext(context: any): string {
  const { timeOfDay, screenTime } = context;
  const sessionContext = [];
  
  if (timeOfDay === 'morning' && screenTime < 60) sessionContext.push("fresh start energy");
  if (timeOfDay === 'afternoon' && screenTime > 200) sessionContext.push("midday usage peak");
  if (timeOfDay === 'evening') sessionContext.push("wind-down period");
  
  return sessionContext.join(', ') || "regular check-in";
}

function determineInterventionType(userInput: string, context: any): string {
  const input = userInput.toLowerCase();
  
  if (input.includes('stress') || input.includes('overwhelm') || input.includes('anxiety')) {
    return 'stress-relief';
  } else if (input.includes('focus') || input.includes('distract') || input.includes('concentrate')) {
    return 'focus-enhancement';
  } else if (input.includes('break') || input.includes('rest') || input.includes('tired')) {
    return 'break-suggestion';
  } else if (input.includes('limit') || input.includes('time') || input.includes('usage')) {
    return 'usage-awareness';
  } else {
    return 'supportive';
  }
}

function generateSuggestion(userInput: string, context: any): string {
  const suggestions = [
    "Try taking a 5-minute mindfulness break",
    "Consider setting a gentle reminder to check in with yourself",
    "What if you tried the 20-20-20 rule for your eyes?",
    "A short walk might help refresh your perspective",
    "Notice what you're feeling right now - that's a great first step"
  ];
  
  return suggestions[Math.floor(Math.random() * suggestions.length)];
}