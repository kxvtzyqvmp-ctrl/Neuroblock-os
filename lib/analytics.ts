import { supabase } from './supabase';

export interface WeeklyAnalytics {
  weekStartDate: string;
  weeklyFocusHours: number[];
  avgMood: string;
  topApps: string[];
  totalTimeSavedHours: number;
  streakDays: number;
  screenTimeReductionPercent: number;
}

export interface WeeklyReport {
  id: string;
  week_number: number;
  year: number;
  summary_text: string;
  insights: any;
  milestones_reached: string[];
  generated_at: string;
}

export const calculateWeeklyAnalytics = async (): Promise<WeeklyAnalytics | null> => {
  try {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - dayOfWeek);
    weekStart.setHours(0, 0, 0, 0);

    const weekStartStr = weekStart.toISOString().split('T')[0];

    const weeklyFocusHours: number[] = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];

      const { data: stats } = await supabase
        .from('daily_stats')
        .select('focus_minutes')
        .eq('date', dateStr)
        .maybeSingle();

      weeklyFocusHours.push(stats ? stats.focus_minutes / 60 : 0);
    }

    const { data: weekStats } = await supabase
      .from('daily_stats')
      .select('*')
      .gte('date', weekStartStr)
      .order('date', { ascending: true });

    const totalTimeSaved = weekStats
      ? weekStats.reduce((sum, s) => sum + s.time_saved_minutes, 0) / 60
      : 0;

    const { data: settings } = await supabase
      .from('detox_settings')
      .select('selected_apps')
      .eq('is_active', true)
      .maybeSingle();

    const topApps = settings?.selected_apps || [];

    const { data: streaks } = await supabase
      .from('user_streaks')
      .select('current_streak')
      .eq('streak_type', 'detox_consistency')
      .maybeSingle();

    const streakDays = streaks?.current_streak || 0;

    const { data: moods } = await supabase
      .from('mood_logs')
      .select('mood_emoji')
      .gte('date', weekStartStr)
      .order('date', { ascending: false });

    const avgMood = moods && moods.length > 0 ? moods[0].mood_emoji : '😊';

    const lastWeekStart = new Date(weekStart);
    lastWeekStart.setDate(weekStart.getDate() - 7);
    const lastWeekStartStr = lastWeekStart.toISOString().split('T')[0];

    const { data: lastWeekStats } = await supabase
      .from('daily_stats')
      .select('time_saved_minutes')
      .gte('date', lastWeekStartStr)
      .lt('date', weekStartStr);

    const lastWeekTotal = lastWeekStats
      ? lastWeekStats.reduce((sum, s) => sum + s.time_saved_minutes, 0)
      : 0;

    const thisWeekTotal = weekStats
      ? weekStats.reduce((sum, s) => sum + s.time_saved_minutes, 0)
      : 0;

    const reductionPercent =
      lastWeekTotal > 0 ? ((thisWeekTotal - lastWeekTotal) / lastWeekTotal) * 100 : 0;

    const analytics: WeeklyAnalytics = {
      weekStartDate: weekStartStr,
      weeklyFocusHours,
      avgMood,
      topApps: topApps.slice(0, 3),
      totalTimeSavedHours: parseFloat(totalTimeSaved.toFixed(1)),
      streakDays,
      screenTimeReductionPercent: parseFloat(reductionPercent.toFixed(1)),
    };

    await supabase
      .from('user_analytics')
      .upsert([
        {
          week_start_date: weekStartStr,
          weekly_focus_hours: weeklyFocusHours,
          avg_mood: avgMood,
          top_apps: analytics.topApps,
          total_time_saved_hours: analytics.totalTimeSavedHours,
          streak_days: streakDays,
          screen_time_reduction_percent: analytics.screenTimeReductionPercent,
          updated_at: new Date().toISOString(),
        },
      ], { onConflict: 'user_id,week_start_date' });

    return analytics;
  } catch (error) {
    console.error('Error calculating weekly analytics:', error);
    return null;
  }
};

export const generateWeeklyReport = async (): Promise<WeeklyReport | null> => {
  try {
    const analytics = await calculateWeeklyAnalytics();

    if (!analytics) return null;

    const today = new Date();
    const weekNumber = Math.ceil(
      (today.getTime() - new Date(today.getFullYear(), 0, 1).getTime()) / (1000 * 60 * 60 * 24 * 7)
    );
    const year = today.getFullYear();

    const totalFocusTime = analytics.weeklyFocusHours.reduce((sum, h) => sum + h, 0);
    const avgFocusPerDay = totalFocusTime / 7;

    let summaryText = '';

    if (analytics.screenTimeReductionPercent > 15) {
      summaryText = `Outstanding week! You reduced screen time by ${Math.abs(analytics.screenTimeReductionPercent).toFixed(0)}% and saved ${analytics.totalTimeSavedHours} hours. Your focus is transforming.`;
    } else if (analytics.screenTimeReductionPercent > 0) {
      summaryText = `Solid progress this week. You saved ${analytics.totalTimeSavedHours} hours and maintained a ${analytics.streakDays}-day streak. Keep building momentum.`;
    } else if (totalFocusTime > 10) {
      summaryText = `You logged ${totalFocusTime.toFixed(1)} hours of focused work this week. Your dedication shows real commitment to change.`;
    } else {
      summaryText = `Every step counts. You are building awareness and showing up. That's the foundation of lasting change.`;
    }

    const insights = {
      totalFocusTime: totalFocusTime.toFixed(1),
      avgFocusPerDay: avgFocusPerDay.toFixed(1),
      bestDay: analytics.weeklyFocusHours.indexOf(Math.max(...analytics.weeklyFocusHours)),
      moodTrend: analytics.avgMood,
    };

    const milestones: string[] = [];

    if (analytics.streakDays >= 7) {
      milestones.push('7-Day Detox Streak');
    }

    if (analytics.totalTimeSavedHours >= 10) {
      milestones.push('10+ Hours Saved');
    }

    if (totalFocusTime >= 15) {
      milestones.push('15+ Focus Hours');
    }

    const { data: report } = await supabase
      .from('weekly_reports')
      .upsert([
        {
          week_number: weekNumber,
          year,
          summary_text: summaryText,
          insights,
          milestones_reached: milestones,
        },
      ], { onConflict: 'user_id,week_number,year' })
      .select()
      .single();

    return report;
  } catch (error) {
    console.error('Error generating weekly report:', error);
    return null;
  }
};

export const getMoodTrends = async (days: number = 7): Promise<any[]> => {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startDateStr = startDate.toISOString().split('T')[0];

    const { data: moods } = await supabase
      .from('mood_logs')
      .select('date, mood, mood_emoji, focus_time_minutes')
      .gte('date', startDateStr)
      .order('date', { ascending: true });

    return moods || [];
  } catch (error) {
    console.error('Error getting mood trends:', error);
    return [];
  }
};

export const getAppUsageBreakdown = async (): Promise<{ app: string; percentage: number }[]> => {
  try {
    const { data: settings } = await supabase
      .from('detox_settings')
      .select('selected_apps')
      .eq('is_active', true)
      .maybeSingle();

    if (!settings || settings.selected_apps.length === 0) {
      return [];
    }

    const apps = settings.selected_apps;
    const total = apps.length;

    return apps.map((app: string, index: number) => ({
      app,
      percentage: ((total - index) / total) * 100,
    }));
  } catch (error) {
    console.error('Error getting app usage:', error);
    return [];
  }
};

export const checkMilestones = async (): Promise<string[]> => {
  try {
    const milestones: string[] = [];

    const { data: stats } = await supabase
      .from('daily_stats')
      .select('time_saved_minutes')
      .order('date', { ascending: true });

    if (stats) {
      const totalTimeSaved = stats.reduce((sum, s) => sum + s.time_saved_minutes, 0) / 60;

      if (totalTimeSaved >= 50) milestones.push('50+ Total Hours Saved');
      else if (totalTimeSaved >= 25) milestones.push('25+ Total Hours Saved');
      else if (totalTimeSaved >= 10) milestones.push('10+ Total Hours Saved');
    }

    const { data: streaks } = await supabase
      .from('user_streaks')
      .select('best_streak')
      .eq('streak_type', 'focus');

    if (streaks && streaks.length > 0) {
      const bestStreak = streaks[0].best_streak;

      if (bestStreak >= 30) milestones.push('30-Day Focus Streak');
      else if (bestStreak >= 14) milestones.push('2-Week Focus Streak');
      else if (bestStreak >= 7) milestones.push('1-Week Focus Streak');
    }

    const { data: challenges } = await supabase
      .from('challenge_participants')
      .select('*')
      .eq('completion_percentage', 100);

    if (challenges && challenges.length >= 5) {
      milestones.push('5 Challenges Completed');
    } else if (challenges && challenges.length >= 1) {
      milestones.push('First Challenge Completed');
    }

    return milestones;
  } catch (error) {
    console.error('Error checking milestones:', error);
    return [];
  }
};
