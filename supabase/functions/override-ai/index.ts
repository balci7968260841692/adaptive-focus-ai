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

    // Build system prompt for override evaluation with current usage context
    let systemPrompt = `You are an AI assistant that evaluates requests for app time limit overrides based on current usage patterns.

CRITICAL: Respond with a simple, conversational explanation of your decision. No JSON, no structured format, no verbose reasoning.

Current Usage Analysis:
${currentUsageData ? `
- Total screen time today: ${currentUsageData.totalScreenTime} minutes (limit: ${currentUsageData.dailyLimit} minutes)
- Trust score: ${currentUsageData.trustScore}/100
- Apps currently over limit: ${currentUsageData.apps.filter(app => app.timeUsed > app.timeLimit).map(app => `${app.name} (${app.timeUsed}/${app.timeLimit}min)`).join(', ') || 'None'}
- Most used categories: ${currentUsageData.apps.sort((a, b) => b.timeUsed - a.timeUsed).slice(0, 3).map(app => `${app.category}: ${app.timeUsed}min`).join(', ')}
` : 'Usage data not available'}

Current Request:
- App: ${request.app}
- Requested additional time: ${request.requestedTime} minutes  
- User's reason: ${request.reason}
- Context: ${JSON.stringify(request.context)}

Smart Negotiation Guidelines:
- If user is near/over daily limit, suggest redistributing time from less important apps
- For work/education requests, be more generous but set conditions
- For entertainment apps, consider current usage patterns and trust score
- Offer specific alternatives (e.g., "I can give you 15 minutes if you take a 5-minute break from social media")
- Consider time of day and usage patterns

Respond naturally with your decision and reasoning. Start with "Approved", "Denied", or "I can offer" for negotiations. Be specific about any time redistributions or conditions.`;

    // Include training data if available
    if (trainingData && trainingData.length > 0) {
      systemPrompt += `\n\nTraining Examples:\n${trainingData.map(example => 
        `Request: ${example.input}\nDecision: ${example.output}`
      ).join('\n\n')}`;
    }

    // Call Gemini API
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`, {
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
          temperature: 0.3,
          topK: 20,
          topP: 0.8,
          maxOutputTokens: 150,
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

    // Parse the AI response to extract decision, reasoning, etc.
    const decision = parseDecision(generatedText, request);

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

function parseDecision(aiResponse: string, request: any) {
  const text = aiResponse.toLowerCase();
  
  // Determine decision
  let approved = false;
  let maxTime = 0;
  let appLimitAdjustments = [];
  
  if (text.includes('approved') || text.includes('approve') || text.includes('grant') || text.includes('allow')) {
    approved = true;
    maxTime = request.requestedTime;
  } else if (text.includes('i can offer') || text.includes('negotiate') || text.includes('compromise') || text.includes('partial')) {
    approved = true;
    // Extract number from "I can offer X minutes"
    const offerMatch = text.match(/offer (?:you )?(\d+)/);
    if (offerMatch) {
      maxTime = parseInt(offerMatch[1]);
    } else {
      maxTime = Math.min(Math.floor(request.requestedTime / 2), 15);
    }
  }
  
  // Extract app limit redistributions
  const redistributeMatches = text.match(/reduce (\w+) by (\d+)/g);
  if (redistributeMatches) {
    redistributeMatches.forEach(match => {
      const [, appName, minutes] = match.match(/reduce (\w+) by (\d+)/) || [];
      if (appName && minutes) {
        appLimitAdjustments.push({
          app: appName,
          adjustment: -parseInt(minutes),
          reason: 'Redistributed for override request'
        });
      }
    });
  }
  
  // Extract time reallocation suggestions
  const reallocationMatches = text.match(/take (\d+) minutes? from (\w+)/g);
  if (reallocationMatches) {
    reallocationMatches.forEach(match => {
      const [, minutes, appName] = match.match(/take (\d+) minutes? from (\w+)/) || [];
      if (appName && minutes) {
        appLimitAdjustments.push({
          app: appName,
          adjustment: -parseInt(minutes),
          reason: 'Time reallocated for override'
        });
      }
    });
  }
  
  // Extract conditions (enhanced parsing)
  const conditions = [];
  if (text.includes('break') || text.includes('pause')) {
    conditions.push("Take regular breaks every 20 minutes");
  }
  if (text.includes('limit') || text.includes('restrict') || text.includes('specifically')) {
    conditions.push("Use this time specifically for the stated purpose");
  }
  if (text.includes('focus') || text.includes('productive')) {
    conditions.push("Focus on productive tasks during this time");
  }
  if (text.includes('check in') || text.includes('review')) {
    conditions.push("I'll check your usage and adjust if needed");
  }
  
  return {
    approved,
    reasoning: aiResponse,
    confidence: 0.8,
    conditions,
    maxTime,
    appLimitAdjustments,
    negotiable: text.includes('negotiate') || text.includes('compromise') || text.includes('i can offer')
  };
}