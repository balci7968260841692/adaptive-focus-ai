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
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) {
      throw new Error('GEMINI_API_KEY is not set');
    }

    const { userInput, context, trainingData }: CoachRequest = await req.json();

    // Build context-aware system prompt
    let systemPrompt = `You are a supportive wellness coach helping users with their digital habits and well-being. 
    
Your role is to:
- Provide encouraging, empathetic responses
- Offer practical suggestions for improving digital wellness
- Help users understand their usage patterns
- Support healthy habit formation
- Be concise but warm in your responses

User Context: ${JSON.stringify(context)}`;

    // Include training data if available
    if (trainingData && trainingData.length > 0) {
      systemPrompt += `\n\nTraining Examples:\n${trainingData.map(example => 
        `User: ${example.input}\nCoach: ${example.output}`
      ).join('\n\n')}`;
    }

    // Call Gemini API
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: systemPrompt },
              { text: `User message: ${userInput}` }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        }
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Gemini API Error:', errorData);
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text || 'I understand. How can I help you with your wellness goals?';

    // Structure the response to match the expected CoachResponse format
    const coachResponse = {
      content: generatedText,
      interventionType: determineInterventionType(userInput, context),
      suggestion: generateSuggestion(userInput, context),
      confidence: 0.8 // Default confidence
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

// Helper functions
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