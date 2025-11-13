import OpenAI from 'openai';
import { Platform } from 'react-native';

let openaiClient: OpenAI | null = null;

export function initializeOpenAI(): OpenAI | null {
  if (Platform.OS === 'web') {
    console.warn('[OpenAI] Direct client usage not recommended on web. Use edge function instead.');
    return null;
  }

  if (openaiClient) {
    return openaiClient;
  }

  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey || apiKey === 'your_openai_api_key_here') {
    console.warn('[OpenAI] API key not configured');
    return null;
  }

  try {
    openaiClient = new OpenAI({
      apiKey: apiKey,
    });
    console.log('[OpenAI] Client initialized successfully');
    return openaiClient;
  } catch (error) {
    console.error('[OpenAI] Failed to initialize:', error);
    return null;
  }
}

export function getOpenAIClient(): OpenAI | null {
  if (!openaiClient) {
    return initializeOpenAI();
  }
  return openaiClient;
}

export async function callOpenAI(
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  options?: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
  }
): Promise<string> {
  const client = getOpenAIClient();

  if (!client) {
    throw new Error('OpenAI client not initialized. Please configure OPENAI_API_KEY.');
  }

  try {
    const completion = await client.chat.completions.create({
      model: options?.model || 'gpt-4o-mini',
      messages: messages,
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens ?? 500,
    });

    return completion.choices[0]?.message?.content || 'No response generated.';
  } catch (error: any) {
    console.error('[OpenAI] API call failed:', error);
    throw new Error(`OpenAI API error: ${error.message}`);
  }
}

export async function generateAIInsight(
  userContext: {
    avgTimeSaved?: number;
    avgPauses?: number;
    avgFocusTime?: number;
    blockedAppsCount?: number;
    currentStreak?: number;
    recentTrend?: string;
  }
): Promise<string> {
  const systemPrompt = `You are an empathetic AI coach for NeuroBlock OS, a digital wellbeing app.
Your role is to provide encouraging, personalized insights based on user behavior patterns.
Keep responses concise (1-2 sentences), positive, and actionable.
Focus on progress, not perfection.`;

  const userPrompt = `Generate a motivational insight based on this user data:
- Average time saved daily: ${userContext.avgTimeSaved || 0} minutes
- Average mindful pauses: ${userContext.avgPauses || 0} per day
- Average focus time: ${userContext.avgFocusTime || 0} minutes
- Blocked apps count: ${userContext.blockedAppsCount || 0}
- Current streak: ${userContext.currentStreak || 0} days
- Recent trend: ${userContext.recentTrend || 'starting out'}`;

  try {
    return await callOpenAI([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ]);
  } catch (error) {
    console.error('[OpenAI] Failed to generate insight:', error);
    return 'Every small step counts. Keep going!';
  }
}

export async function generateAIResponse(
  question: string,
  context: {
    recentStats?: any[];
    settings?: any;
    streaks?: any[];
  }
): Promise<string> {
  const systemPrompt = `You are an empathetic AI coach for NeuroBlock OS, a digital wellbeing app.
You help users understand their screen time patterns and build better habits.
Be supportive, insightful, and concise. Focus on actionable advice.
Never be judgmental. Celebrate small wins.`;

  let contextSummary = 'User is getting started with their digital wellbeing journey.';

  if (context.recentStats && context.recentStats.length > 0) {
    const avgTimeSaved = context.recentStats.reduce((sum: number, s: any) => sum + s.time_saved_minutes, 0) / context.recentStats.length;
    const totalFocus = context.recentStats.reduce((sum: number, s: any) => sum + s.focus_minutes, 0);
    contextSummary = `User has saved ${Math.round(avgTimeSaved)} minutes daily on average and logged ${totalFocus} total minutes of focus time over the past week.`;
  }

  if (context.settings?.selected_apps?.length > 0) {
    contextSummary += ` They are currently blocking ${context.settings.selected_apps.length} apps.`;
  }

  if (context.streaks && context.streaks.length > 0) {
    const focusStreak = context.streaks.find((s: any) => s.streak_type === 'focus');
    if (focusStreak) {
      contextSummary += ` Current focus streak: ${focusStreak.current_streak} days.`;
    }
  }

  const userPrompt = `Context: ${contextSummary}

User question: "${question}"

Provide a helpful, encouraging response (2-3 sentences max).`;

  try {
    return await callOpenAI([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ], {
      temperature: 0.8,
      maxTokens: 200,
    });
  } catch (error) {
    console.error('[OpenAI] Failed to generate response:', error);
    return 'I am here to support your journey. Could you rephrase your question?';
  }
}
