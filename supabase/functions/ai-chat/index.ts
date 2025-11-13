import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface ChatRequest {
  question: string;
  context?: {
    recentStats?: any[];
    settings?: any;
    streaks?: any[];
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { question, context }: ChatRequest = await req.json();

    if (!question || typeof question !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Question is required' }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');

    if (!openaiApiKey) {
      console.error('[AI Chat] OPENAI_API_KEY not configured');
      return new Response(
        JSON.stringify({
          error: 'OpenAI API key not configured',
          fallback: 'I am here to support your journey. Could you rephrase your question?'
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const systemPrompt = `You are an empathetic AI coach for NeuroBlock OS, a digital wellbeing app.
You help users understand their screen time patterns and build better habits.
Be supportive, insightful, and concise. Focus on actionable advice.
Never be judgmental. Celebrate small wins.`;

    let contextSummary = 'User is getting started with their digital wellbeing journey.';

    if (context?.recentStats && context.recentStats.length > 0) {
      const avgTimeSaved = context.recentStats.reduce((sum: number, s: any) => sum + s.time_saved_minutes, 0) / context.recentStats.length;
      const totalFocus = context.recentStats.reduce((sum: number, s: any) => sum + s.focus_minutes, 0);
      contextSummary = `User has saved ${Math.round(avgTimeSaved)} minutes daily on average and logged ${totalFocus} total minutes of focus time over the past week.`;
    }

    if (context?.settings?.selected_apps?.length > 0) {
      contextSummary += ` They are currently blocking ${context.settings.selected_apps.length} apps.`;
    }

    if (context?.streaks && context.streaks.length > 0) {
      const focusStreak = context.streaks.find((s: any) => s.streak_type === 'focus');
      if (focusStreak) {
        contextSummary += ` Current focus streak: ${focusStreak.current_streak} days.`;
      }
    }

    const userPrompt = `Context: ${contextSummary}

User question: "${question}"

Provide a helpful, encouraging response (2-3 sentences max).`;

    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.8,
        max_tokens: 200,
      }),
    });

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.text();
      console.error('[AI Chat] OpenAI API error:', errorData);
      throw new Error('OpenAI API request failed');
    }

    const data = await openaiResponse.json();
    const aiResponse = data.choices[0]?.message?.content || 'I am here to support your journey. Could you rephrase your question?';

    return new Response(
      JSON.stringify({ response: aiResponse }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error: any) {
    console.error('[AI Chat] Error:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to generate response',
        fallback: 'I am here to support your journey. Could you rephrase your question?'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});