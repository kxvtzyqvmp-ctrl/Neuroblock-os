import {
  saveCircle,
  getAllCircles,
  deleteCircle,
  saveCircleMessage,
  getCircleMessages,
  saveChallenge,
  getAllChallenges,
  saveParticipant,
  getAllParticipants,
  generateId,
  generateInviteCode,
  type DetoxCircle,
  type DetoxChallenge,
  type ChallengeParticipant,
  type CircleMessage,
} from './localCommunityStorage';

// Types are now imported from localCommunityStorage
// Re-export them for backward compatibility
export type { DetoxCircle, DetoxChallenge, ChallengeParticipant, CircleMessage } from './localCommunityStorage';

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
    const code = generateInviteCode();
    const circle: DetoxCircle = {
      id: generateId(),
      invite_code: code,
      member_ids: [creatorProfileId],
      ai_reflection: 'Welcome to your Detox Circle! Invite friends to start your journey together.',
      hours_saved_today: 0,
      average_streak: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    await saveCircle(circle);
    return circle;
  } catch (error) {
    console.error('[Community] Error creating circle:', error);
    return null;
  }
};

export const joinCircleWithCode = async (
  code: string,
  profileId: string
): Promise<DetoxCircle | null> => {
  try {
    const circles = await getAllCircles();
    const circle = Object.values(circles).find(c => c.invite_code === code);

    if (!circle) return null;

    if (circle.member_ids.length >= 8) {
      return null;
    }

    if (circle.member_ids.includes(profileId)) {
      return circle;
    }

    const updatedMembers = [...circle.member_ids, profileId];
    const updated: DetoxCircle = {
      ...circle,
      member_ids: updatedMembers,
      updated_at: new Date().toISOString(),
    };

    await saveCircle(updated);

    // Add system message
    await saveCircleMessage({
      id: generateId(),
      circle_id: circle.id,
      sender_id: 'system',
      message_text: 'A new member joined the circle!',
      created_at: new Date().toISOString(),
    });

    return updated;
  } catch (error) {
    console.error('[Community] Error joining circle:', error);
    return null;
  }
};

export const leaveCircle = async (circleId: string, profileId: string): Promise<boolean> => {
  try {
    const circles = await getAllCircles();
    const circle = circles[circleId];

    if (!circle) return false;

    const updatedMembers = circle.member_ids.filter((id: string) => id !== profileId);

    if (updatedMembers.length === 0) {
      await deleteCircle(circleId);
    } else {
      const updated: DetoxCircle = {
        ...circle,
        member_ids: updatedMembers,
        updated_at: new Date().toISOString(),
      };
      await saveCircle(updated);
    }

    return true;
  } catch (error) {
    console.error('[Community] Error leaving circle:', error);
    return false;
  }
};

export const sendEncouragement = async (
  circleId: string,
  senderId: string,
  message: string
): Promise<boolean> => {
  try {
    await saveCircleMessage({
      id: generateId(),
      circle_id: circleId,
      sender_id: senderId,
      message_text: message.slice(0, 100),
      created_at: new Date().toISOString(),
    });

    return true;
  } catch (error) {
    console.error('[Community] Error sending encouragement:', error);
    return false;
  }
};

export const updateCircleStats = async (circleId: string): Promise<void> => {
  try {
    const circles = await getAllCircles();
    const circle = circles[circleId];

    if (!circle || circle.member_ids.length === 0) return;

    // For local storage, calculate simple stats
    // In a real app, you'd aggregate from local stats
    const avgStreak = 0; // Placeholder - could calculate from local data
    const totalTimeSaved = 0; // Placeholder - could calculate from local daily_stats

    const aiReflection = generateCircleReflection(totalTimeSaved, avgStreak, circle.member_ids.length);

    const updated: DetoxCircle = {
      ...circle,
      hours_saved_today: totalTimeSaved,
      average_streak: avgStreak,
      ai_reflection: aiReflection,
      updated_at: new Date().toISOString(),
    };

    await saveCircle(updated);
  } catch (error) {
    console.error('[Community] Error updating circle stats:', error);
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

    const challenge: DetoxChallenge = {
      id: generateId(),
      challenge_type: challengeType,
      title: template.title,
      description: template.description,
      duration_days: template.duration,
      start_date: startDate.toISOString().split('T')[0],
      end_date: endDate.toISOString().split('T')[0],
      is_circle_challenge: isCircleChallenge,
      circle_id: circleId,
      status: 'active',
      created_at: new Date().toISOString(),
    };

    await saveChallenge(challenge);

    // Create participant
    const participant: ChallengeParticipant = {
      id: generateId(),
      challenge_id: challenge.id,
      user_profile_id: participantId,
      current_day: 1,
      completion_percentage: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    await saveParticipant(participant);

    // Generate challenge messages (stored locally if needed)
    await generateChallengeMessages(challenge.id, template.duration);

    return challenge;
  } catch (error) {
    console.error('[Community] Error creating challenge:', error);
    return null;
  }
};

const generateChallengeMessages = async (challengeId: string, duration: number) => {
  // Challenge messages are generated on-demand in local mode
  // No need to pre-store them
  console.log(`[Community] Challenge ${challengeId} created with ${duration} day duration`);
};

export const updateChallengeProgress = async (
  participantId: string,
  challengeId: string
): Promise<void> => {
  try {
    const participants = await getAllParticipants();
    const participant = participants[participantId];

    if (!participant) return;

    const challenges = await getAllChallenges();
    const challenge = challenges[challengeId];

    if (!challenge) return;

    const today = new Date();
    const startDate = new Date(challenge.start_date);
    const daysPassed = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    const progress = Math.min((daysPassed / challenge.duration_days) * 100, 100);

    const updatedParticipant: ChallengeParticipant = {
      ...participant,
      current_day: daysPassed,
      completion_percentage: progress,
      updated_at: new Date().toISOString(),
    };

    await saveParticipant(updatedParticipant);

    if (progress >= 100) {
      const updatedChallenge: DetoxChallenge = {
        ...challenge,
        status: 'completed',
      };
      await saveChallenge(updatedChallenge);
    }
  } catch (error) {
    console.error('[Community] Error updating challenge progress:', error);
  }
};
