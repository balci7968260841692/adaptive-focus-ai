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

    const { request, trainingData }: OverrideRequest = await req.json();

    // Build system prompt for override evaluation
    let systemPrompt = `You are an AI assistant that evaluates requests for app time limit overrides. Your job is to make fair, balanced decisions that support the user's well-being while respecting their autonomy.

Guidelines:
- Approve reasonable requests for work, education, or important communication
- Be cautious with entertainment apps unless there's a valid reason
- Consider the user's overall usage patterns and context
- Suggest compromises when appropriate (shorter time, conditions)
- Always provide clear reasoning for your decisions

App: ${request.app}
Requested additional time: ${request.requestedTime} minutes  
User's reason: ${request.reason}
Context: ${JSON.stringify(request.context)}

Response format: Provide a decision (approve/deny/negotiate), reasoning, and any conditions or alternatives. Be concise but thorough.`;

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
          maxOutputTokens: 512,
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
  
  if (text.includes('approve') || text.includes('grant') || text.includes('allow')) {
    approved = true;
    maxTime = request.requestedTime;
  } else if (text.includes('negotiate') || text.includes('compromise') || text.includes('partial')) {
    approved = true;
    // Suggest half the requested time or 15 minutes, whichever is smaller
    maxTime = Math.min(Math.floor(request.requestedTime / 2), 15);
  }
  
  // Extract conditions (basic parsing)
  const conditions = [];
  if (text.includes('break') || text.includes('pause')) {
    conditions.push("Take regular breaks every 20 minutes");
  }
  if (text.includes('limit') || text.includes('restrict')) {
    conditions.push("Use this time specifically for the stated purpose");
  }
  
  return {
    approved,
    reasoning: aiResponse,
    confidence: 0.8,
    conditions,
    maxTime,
    negotiable: text.includes('negotiate') || text.includes('compromise')
  };
}