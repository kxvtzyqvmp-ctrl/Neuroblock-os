import { supabase } from './supabase';

export interface DetoxCircle {
  id: string;
  invite_code: string;
  member_ids: string[];
  created_at: string;
  hours_saved_today: number;
  average_streak: number;
  ai_reflection: string;
  reflection_updated_at: string;
}

export interface CircleMessage {
  id: string;
  circle_id: string;
  sender_id: string;
  message_type: 'encouragement' | 'system';
  message_text: string;
  created_at: string;
}

export interface DetoxChallenge {
  id: string;
  challenge_type: string;
  title: string;
  description: string;
  duration_days: number;
  start_date: string;
  end_date: string;
  status: 'active' | 'completed' | 'failed';
  is_circle_challenge: boolean;
  circle_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface ChallengeParticipant {
  id: string;
  challenge_id: string;
  user_profile_id: string;
  completion_percentage: number;
  current_day: number;
  daily_check_ins: any[];
  joined_at: string;
  completed_at: string | null;
}

export const CHALLENGE_TYPES = {
  social_media_fast: {
    title: '3-Day Social Media Fast',
    description: 'Take a break from social media and reclaim your attention.',
    duration: 3,
    icon: '🔒',
  },
  mindful_mornings: {
    title: '7 Days of Mindful Mornings',
    description: 'Start each day without screens for the first hour.',
    duration: 7,
    icon: '🌅',
  },
  weekend_focus: {
    title: 'Weekend Phone-Free Focus',
    description: 'Two days of deep work without phone distractions.',
    duration: 2,
    icon: '🧠',
  },
  evening_detox: {
    title: '5-Day Evening Detox',
    description: 'No screens after 8 PM for better sleep.',
    duration: 5,
    icon: '🌙',
  },
};

export const ENCOURAGEMENTS = [
  'Keep going 💪',
  'Proud of this progress 🙌',
  'One day at a time 🧘',
  "You have got this! 🌟",
  'Strong work today! 💯',
  'Inspiring effort! ✨',
];

export const generateCircleCode = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const createCircle = async (creatorProfileId: string): Promise<DetoxCircle | null> => {
  try {
    const code = generateCircleCode();

    const { data, error } = await supabase
      .from('detox_circles')
      .insert([
        {
          invite_code: code,
          member_ids: [creatorProfileId],
          ai_reflection: 'Welcome to your Detox Circle! Invite friends to start your journey together.',
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Error creating circle:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Unexpected error:', error);
    return null;
  }
};

export const joinCircleWithCode = async (
  code: string,
  profileId: string
): Promise<DetoxCircle | null> => {
  try {
    const { data: circle } = await supabase
      .from('detox_circles')
      .select('*')
      .eq('invite_code', code)
      .maybeSingle();

    if (!circle) return null;

    if (circle.member_ids.length >= 8) {
      return null;
    }

    if (circle.member_ids.includes(profileId)) {
      return circle;
    }

    const updatedMembers = [...circle.member_ids, profileId];

    const { data: updated } = await supabase
      .from('detox_circles')
      .update({ member_ids: updatedMembers })
      .eq('id', circle.id)
      .select()
      .single();

    await supabase.from('circle_messages').insert([
      {
        circle_id: circle.id,
        sender_id: 'system',
        message_type: 'system',
        message_text: 'A new member joined the circle!',
      },
    ]);

    return updated;
  } catch (error) {
    console.error('Error joining circle:', error);
    return null;
  }
};

export const leaveCircle = async (circleId: string, profileId: string): Promise<boolean> => {
  try {
    const { data: circle } = await supabase
      .from('detox_circles')
      .select('*')
      .eq('id', circleId)
      .single();

    if (!circle) return false;

    const updatedMembers = circle.member_ids.filter((id: string) => id !== profileId);

    if (updatedMembers.length === 0) {
      await supabase.from('detox_circles').delete().eq('id', circleId);
    } else {
      await supabase
        .from('detox_circles')
        .update({ member_ids: updatedMembers })
        .eq('id', circleId);
    }

    return true;
  } catch (error) {
    console.error('Error leaving circle:', error);
    return false;
  }
};

export const sendEncouragement = async (
  circleId: string,
  senderId: string,
  message: string
): Promise<boolean> => {
  try {
    await supabase.from('circle_messages').insert([
      {
        circle_id: circleId,
        sender_id: senderId,
        message_type: 'encouragement',
        message_text: message.slice(0, 100),
      },
    ]);

    return true;
  } catch (error) {
    console.error('Error sending encouragement:', error);
    return false;
  }
};

export const updateCircleStats = async (circleId: string): Promise<void> => {
  try {
    const { data: circle } = await supabase
      .from('detox_circles')
      .select('member_ids')
      .eq('id', circleId)
      .single();

    if (!circle || circle.member_ids.length === 0) return;

    const today = new Date().toISOString().split('T')[0];

    const { data: streaks } = await supabase
      .from('user_streaks')
      .select('current_streak')
      .eq('streak_type', 'detox_consistency');

    const avgStreak = streaks
      ? streaks.reduce((sum, s) => sum + s.current_streak, 0) / streaks.length
      : 0;

    const { data: stats } = await supabase
      .from('daily_stats')
      .select('time_saved_minutes')
      .eq('date', today);

    const totalTimeSaved = stats
      ? stats.reduce((sum, s) => sum + s.time_saved_minutes, 0) / 60
      : 0;

    const aiReflection = generateCircleReflection(totalTimeSaved, avgStreak, circle.member_ids.length);

    await supabase
      .from('detox_circles')
      .update({
        hours_saved_today: totalTimeSaved,
        average_streak: avgStreak,
        ai_reflection: aiReflection,
        reflection_updated_at: new Date().toISOString(),
      })
      .eq('id', circleId);
  } catch (error) {
    console.error('Error updating circle stats:', error);
  }
};

const generateCircleReflection = (
  hoursSaved: number,
  avgStreak: number,
  memberCount: number
): string => {
  if (hoursSaved > 5) {
    return `Your Circle has collectively saved ${hoursSaved.toFixed(1)} hours today — incredible progress!`;
  }

  if (avgStreak > 5) {
    return `Your Circle maintains an average ${avgStreak.toFixed(0)}-day streak. Consistency is building momentum.`;
  }

  if (memberCount > 1) {
    return `${memberCount} members supporting each other. Together, you are building healthier habits.`;
  }

  return 'Every small step counts. Your Circle is here to support your journey.';
};

export const createChallenge = async (
  challengeType: string,
  isCircleChallenge: boolean,
  circleId: string | null,
  participantId: string
): Promise<DetoxChallenge | null> => {
  try {
    const template = CHALLENGE_TYPES[challengeType as keyof typeof CHALLENGE_TYPES];

    if (!template) return null;

    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + template.duration);

    const { data: challenge } = await supabase
      .from('detox_challenges')
      .insert([
        {
          challenge_type: challengeType,
          title: template.title,
          description: template.description,
          duration_days: template.duration,
          start_date: startDate.toISOString().split('T')[0],
          end_date: endDate.toISOString().split('T')[0],
          is_circle_challenge: isCircleChallenge,
          circle_id: circleId,
          status: 'active',
        },
      ])
      .select()
      .single();

    if (!challenge) return null;

    await supabase.from('challenge_participants').insert([
      {
        challenge_id: challenge.id,
        user_profile_id: participantId,
      },
    ]);

    await generateChallengeMessages(challenge.id, template.duration);

    return challenge;
  } catch (error) {
    console.error('Error creating challenge:', error);
    return null;
  }
};

const generateChallengeMessages = async (challengeId: string, duration: number) => {
  const messages = [
    { day: 1, text: 'Welcome to your challenge! Today is about setting intentions and committing to change.', type: 'motivation' },
    { day: 2, text: 'Day 2: You have already made progress. Notice how your attention feels different.', type: 'progress' },
    { day: 3, text: 'Halfway through! You are building new patterns one day at a time.', type: 'motivation' },
    { day: 5, text: 'Day 5: The hardest days are behind you. Your consistency is showing real commitment.', type: 'progress' },
    { day: 7, text: 'Final day! Reflect on what you have learned and how you want to continue this journey.', type: 'reflection' },
  ];

  for (const msg of messages) {
    if (msg.day <= duration) {
      await supabase.from('challenge_ai_messages').insert([
        {
          challenge_id: challengeId,
          day_number: msg.day,
          message_text: msg.text,
          message_type: msg.type,
        },
      ]);
    }
  }
};

export const updateChallengeProgress = async (
  participantId: string,
  challengeId: string
): Promise<void> => {
  try {
    const { data: participant } = await supabase
      .from('challenge_participants')
      .select('*')
      .eq('id', participantId)
      .single();

    if (!participant) return;

    const { data: challenge } = await supabase
      .from('detox_challenges')
      .select('*')
      .eq('id', challengeId)
      .single();

    if (!challenge) return;

    const today = new Date();
    const startDate = new Date(challenge.start_date);
    const daysPassed = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    const progress = Math.min((daysPassed / challenge.duration_days) * 100, 100);

    await supabase
      .from('challenge_participants')
      .update({
        current_day: daysPassed,
        completion_percentage: progress,
        completed_at: progress >= 100 ? new Date().toISOString() : null,
      })
      .eq('id', participantId);

    if (progress >= 100) {
      await supabase
        .from('detox_challenges')
        .update({ status: 'completed' })
        .eq('id', challengeId);
    }
  } catch (error) {
    console.error('Error updating challenge progress:', error);
  }
};
