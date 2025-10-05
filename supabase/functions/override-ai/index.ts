import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface OverrideRequest {
  request: {
    app: string;
    requestedTime: number;
    reason: string;
    context: any;
  };
  currentUsageData?: {
    totalScreenTime: number;
    dailyLimit: number;
    trustScore: number;
    apps: Array<{
      name: string;
      timeUsed: number;
      timeLimit: number;
      category: string;
    }>;
  };
  trainingData?: any[];
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) {
      throw new Error('GEMINI_API_KEY is not set');
    }

    const { request, currentUsageData, trainingData }: OverrideRequest = await req.json();

// Build comprehensive system prompt for smart override evaluation
    let systemPrompt = `You are a wellness-focused AI that helps users manage screen time intelligently. Evaluate override requests based on usage patterns, context, and user well-being.

DECISION FRAMEWORK:
1. Assess if request is reasonable given current usage
2. Consider user's trust score and recent behavior
3. Evaluate time of day and app category appropriateness
4. Make contextual decisions that promote healthy habits

CURRENT USAGE CONTEXT:
${currentUsageData ? `
📱 Daily Usage: ${currentUsageData.totalScreenTime}/${currentUsageData.dailyLimit} minutes (${Math.round((currentUsageData.totalScreenTime/currentUsageData.dailyLimit)*100)}% of limit)
🎯 Trust Score: ${currentUsageData.trustScore}/100
⚠️ Over-limit apps: ${currentUsageData.apps.filter(app => app.timeUsed > app.timeLimit).map(app => `${app.name} (${app.timeUsed}/${app.timeLimit}min, +${app.timeUsed-app.timeLimit}min over)`).join(', ') || 'None'}
📊 Top categories: ${currentUsageData.apps.sort((a, b) => b.timeUsed - a.timeUsed).slice(0, 3).map(app => `${app.category}: ${app.timeUsed}min`).join(', ')}
` : 'Usage data unavailable'}

REQUEST DETAILS:
🎯 App: ${request.app}
⏱️ Requested time: ${request.requestedTime} minutes
💭 User reason: "${request.reason}"
🔍 Context: Time ${request.context.timeOfDay}, Trust: ${request.context.trustScore}/100

DECISION CRITERIA:
- DENY if: User is >120% daily limit OR trust score <30 OR requesting entertainment apps late evening
- APPROVE if: Work/education apps during work hours OR trust score >80 AND reasonable request
- NEGOTIATE if: Borderline cases - offer alternatives, conditions, or reduced time

RESPONSE RULES:
- Start clearly: "Approved: [reason]" OR "Denied: [reason]" OR "I can offer: [alternative]"
- Be specific about time allocations and conditions
- Suggest healthy alternatives for denied requests
- Keep response under 100 words, friendly but firm tone

Time context: ${new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 17 ? 'Afternoon' : 'Evening'}`;

    // Include training data if available
    if (trainingData && trainingData.length > 0) {
      systemPrompt += `\n\nTraining Examples:\n${trainingData.map(example => 
        `Request: ${example.input}\nDecision: ${example.output}`
      ).join('\n\n')}`;
    }

    // Call Gemini API
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: systemPrompt }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.4,
          topK: 40,
          topP: 0.9,
          maxOutputTokens: 200,
        }
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Gemini API Error:', errorData);
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // Enhanced parsing for better decision accuracy
    const decision = parseEnhancedDecision(generatedText, request);

    console.log('Override AI Decision:', decision);

    return new Response(JSON.stringify(decision), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in override-ai function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      approved: false,
      reasoning: "Unable to process request at this time. Please try again later.",
      confidence: 0.5,
      conditions: [],
      maxTime: 0
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function parseEnhancedDecision(aiResponse: string, request: any) {
  const text = aiResponse.toLowerCase();
  const originalResponse = aiResponse;
  
  // Enhanced decision parsing with better logic
  let approved = false;
  let maxTime = 0;
  let confidence = 0.7;
  let negotiable = true;
  
  // Determine approval status with more nuanced detection
  if (text.includes('approved:') || text.includes('approve') || text.includes('granted') || text.includes('yes, you can')) {
    approved = true;
    confidence = 0.9;
  } else if (text.includes('denied:') || text.includes('deny') || text.includes('cannot approve') || text.includes('not granting')) {
    approved = false;
    confidence = 0.9;
    negotiable = false;
  } else if (text.includes('i can offer') || text.includes('instead, i can') || text.includes('how about')) {
    approved = true; // It's a counter-offer
    confidence = 0.8;
    negotiable = true;
  }
  
  // Extract time more intelligently
  const timeMatches = text.match(/(\d+)\s*(?:minute|min)/g);
  if (timeMatches) {
    const numbers = timeMatches.map(match => parseInt(match.match(/\d+/)[0]));
    // Use the first mentioned time if it's a counter-offer, otherwise the largest
    if (text.includes('i can offer') || text.includes('instead')) {
      maxTime = numbers[0] || 0;
    } else {
      maxTime = approved ? Math.max(...numbers) : 0;
    }
  } else if (approved) {
    maxTime = Math.min(request.requestedTime, 30); // Cap at 30 minutes if no specific time
  }
  
  // Extract conditions from the response
  const conditions = [];
  if (text.includes('condition') || text.includes('requirement') || text.includes('must')) {
    conditions.push('Follow the AI\'s specific guidance');
  }
  if (text.includes('break') || text.includes('pause')) {
    conditions.push('Take a break as suggested');
  }
  if (text.includes('work') && text.includes('only')) {
    conditions.push('Use only for work purposes');
  }
  
  // Determine app adjustments based on AI suggestion
  const appLimitAdjustments = [];
  if (text.includes('reduce') || text.includes('cut back') || text.includes('less time')) {
    // AI is suggesting to reduce usage elsewhere - we'll let the frontend handle this
  }
  
  return {
    approved,
    reasoning: originalResponse,
    confidence,
    conditions,
    maxTime,
    appLimitAdjustments,
    negotiable
  };
}