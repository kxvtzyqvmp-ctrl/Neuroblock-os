import Constants from 'expo-constants';
import { supabase } from './supabase';

export type InsightCategory = 'motivation' | 'pattern' | 'suggestion' | 'milestone';

export interface BehaviorPattern {
  type: string;
  data: any;
  confidence: number;
}

export interface GeneratedInsight {
  message: string;
  type: 'progress' | 'streak' | 'suggestion';
  category: InsightCategory;
  actionData?: any;
}

export const analyzeUserBehavior = async (): Promise<BehaviorPattern[]> => {
  const patterns: BehaviorPattern[] = [];

  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: recentStats } = await supabase
      .from('daily_stats')
      .select('*')
      .gte('date', sevenDaysAgo.toISOString().split('T')[0])
      .order('date', { ascending: true });

    if (!recentStats || recentStats.length === 0) {
      return patterns;
    }

    const avgTimeSaved = recentStats.reduce((sum, s) => sum + s.time_saved_minutes, 0) / recentStats.length;
    const avgPauses = recentStats.reduce((sum, s) => sum + s.mindful_pauses_count, 0) / recentStats.length;
    const avgFocusTime = recentStats.reduce((sum, s) => sum + s.focus_minutes, 0) / recentStats.length;

    if (avgTimeSaved > 30) {
      patterns.push({
        type: 'high_time_saved',
        data: { avgTimeSaved, trend: 'improving' },
        confidence: 0.8,
      });
    }

    if (avgPauses > 3) {
      patterns.push({
        type: 'mindful_user',
        data: { avgPauses },
        confidence: 0.75,
      });
    }

    if (avgFocusTime > 60) {
      patterns.push({
        type: 'focus_strength',
        data: { avgFocusTime, peakTime: '9 AM - 1 PM' },
        confidence: 0.7,
      });
    }

    const lastWeekStats = recentStats.slice(0, 3);
    const thisWeekStats = recentStats.slice(-3);

    if (lastWeekStats.length > 0 && thisWeekStats.length > 0) {
      const lastWeekAvg = lastWeekStats.reduce((sum, s) => sum + s.time_saved_minutes, 0) / lastWeekStats.length;
      const thisWeekAvg = thisWeekStats.reduce((sum, s) => sum + s.time_saved_minutes, 0) / thisWeekStats.length;

      if (thisWeekAvg > lastWeekAvg * 1.15) {
        patterns.push({
          type: 'improvement_trend',
          data: { improvement: Math.round(((thisWeekAvg - lastWeekAvg) / lastWeekAvg) * 100) },
          confidence: 0.85,
        });
      }
    }

    const { data: settings } = await supabase
      .from('detox_settings')
      .select('selected_apps')
      .eq('is_active', true)
      .maybeSingle();

    if (settings && settings.selected_apps.length >= 5) {
      patterns.push({
        type: 'committed_user',
        data: { blockedAppsCount: settings.selected_apps.length },
        confidence: 0.9,
      });
    }

    return patterns;
  } catch (error) {
    console.error('Error analyzing behavior:', error);
    return patterns;
  }
};

export const generateInsights = async (): Promise<GeneratedInsight[]> => {
  const insights: GeneratedInsight[] = [];
  const patterns = await analyzeUserBehavior();

  for (const pattern of patterns) {
    let insight: GeneratedInsight | null = null;

    switch (pattern.type) {
      case 'high_time_saved':
        insight = {
          message: `You have saved an average of ${Math.round(pattern.data.avgTimeSaved)} minutes daily this week. That's powerful progress.`,
          type: 'progress',
          category: 'motivation',
        };
        break;

      case 'mindful_user':
        insight = {
          message: `You have paused and reconsidered ${Math.round(pattern.data.avgPauses)} times daily. Your mindfulness is growing.`,
          type: 'progress',
          category: 'motivation',
        };
        break;

      case 'focus_strength':
        insight = {
          message: 'Your focus periods are strongest between 9 AM and 1 PM — consider scheduling important work then.',
          type: 'suggestion',
          category: 'pattern',
          actionData: { peakTime: pattern.data.peakTime },
        };
        break;

      case 'improvement_trend':
        insight = {
          message: `You have reduced screen time by ${pattern.data.improvement}% this week compared to last. Keep it up!`,
          type: 'progress',
          category: 'motivation',
        };
        break;

      case 'committed_user':
        insight = {
          message: `You are blocking ${pattern.data.blockedAppsCount} apps — that shows real commitment to change.`,
          type: 'progress',
          category: 'milestone',
        };
        break;
    }

    if (insight) {
      insights.push(insight);
    }
  }

  if (insights.length === 0) {
    insights.push({
      message: 'Every small step counts. Start with a 10-minute focus block today.',
      type: 'suggestion',
      category: 'suggestion',
    });
  }

  return insights.slice(0, 3);
};

export const updateStreaks = async (): Promise<void> => {
  try {
    const today = new Date().toISOString().split('T')[0];

    const { data: todayStats } = await supabase
      .from('daily_stats')
      .select('*')
      .eq('date', today)
      .maybeSingle();

    if (!todayStats) return;

    const { data: focusStreak } = await supabase
      .from('user_streaks')
      .select('*')
      .eq('streak_type', 'focus')
      .maybeSingle();

    if (focusStreak) {
      const lastDate = new Date(focusStreak.last_activity_date);
      const todayDate = new Date(today);
      const daysDiff = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

      if (todayStats.focus_minutes > 0) {
        let newStreak = focusStreak.current_streak;

        if (daysDiff === 1) {
          newStreak += 1;
        } else if (daysDiff > 1) {
          newStreak = 1;
        }

        const newBest = Math.max(newStreak, focusStreak.best_streak);

        await supabase
          .from('user_streaks')
          .update({
            current_streak: newStreak,
            best_streak: newBest,
            last_activity_date: today,
            updated_at: new Date().toISOString(),
          })
          .eq('id', focusStreak.id);
      }
    }

    const { data: detoxStreak } = await supabase
      .from('user_streaks')
      .select('*')
      .eq('streak_type', 'detox_consistency')
      .maybeSingle();

    if (detoxStreak && todayStats.time_saved_minutes > 10) {
      const lastDate = new Date(detoxStreak.last_activity_date);
      const todayDate = new Date(today);
      const daysDiff = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

      let newStreak = detoxStreak.current_streak;

      if (daysDiff === 1) {
        newStreak += 1;
      } else if (daysDiff > 1) {
        newStreak = 1;
      }

      const newBest = Math.max(newStreak, detoxStreak.best_streak);

      await supabase
        .from('user_streaks')
        .update({
          current_streak: newStreak,
          best_streak: newBest,
          last_activity_date: today,
          updated_at: new Date().toISOString(),
        })
        .eq('id', detoxStreak.id);
    }
  } catch (error) {
    console.error('Error updating streaks:', error);
  }
};

export const generateAIResponse = async (question: string): Promise<string> => {
  try {
    const { data: recentStats } = await supabase
      .from('daily_stats')
      .select('*')
      .order('date', { ascending: false })
      .limit(7);

    const { data: settings } = await supabase
      .from('detox_settings')
      .select('*')
      .eq('is_active', true)
      .maybeSingle();

    const { data: streaks } = await supabase
      .from('user_streaks')
      .select('*');

    const context = {
      recentStats: recentStats || [],
      settings: settings || null,
      streaks: streaks || [],
    };

    const supabaseUrl = 
      Constants.expoConfig?.extra?.EXPO_PUBLIC_SUPABASE_URL || 
      process.env.EXPO_PUBLIC_SUPABASE_URL;
    const supabaseKey = 
      Constants.expoConfig?.extra?.EXPO_PUBLIC_SUPABASE_KEY || 
      process.env.EXPO_PUBLIC_SUPABASE_KEY;

    if (!supabaseUrl) {
      throw new Error('Supabase URL not configured');
    }

    const response = await fetch(`${supabaseUrl}/functions/v1/ai-chat`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        question,
        context,
      }),
    });

    if (!response.ok) {
      console.error('[AI] Edge function error:', response.status);
      throw new Error('Failed to get AI response');
    }

    const data = await response.json();

    if (data.error && data.fallback) {
      console.warn('[AI] API error, using fallback:', data.error);
      return data.fallback;
    }

    return data.response || "I am here to support your journey. Could you rephrase your question?";

  } catch (error) {
    console.error('Error generating AI response:', error);
    return "I am here to support your journey. Could you rephrase your question?";
  }
};

export const saveAIConversation = async (question: string, response: string, contextUsed: any) => {
  try {
    await supabase.from('ai_conversations').insert([
      {
        question,
        response,
        context_used: contextUsed,
      },
    ]);
  } catch (error) {
    console.error('Error saving conversation:', error);
  }
};
