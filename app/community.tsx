import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Users, Plus, X, Send, Target, Calendar, TrendingUp, Heart } from 'lucide-react-native';
import { supabase, UserProfile } from '@/lib/supabase';
import FloatingNav from '@/components/FloatingNav';
import AuroraBackground from '@/components/shared/AuroraBackground';
import {
  DetoxCircle,
  DetoxChallenge,
  ChallengeParticipant,
  CircleMessage,
  createCircle,
  joinCircleWithCode,
  leaveCircle,
  sendEncouragement,
  updateCircleStats,
  createChallenge,
  updateChallengeProgress,
  CHALLENGE_TYPES,
  ENCOURAGEMENTS,
} from '@/lib/community';

export default function CommunityScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [myCircle, setMyCircle] = useState<DetoxCircle | null>(null);
  const [myChallenge, setMyChallenge] = useState<{
    challenge: DetoxChallenge;
    participant: ChallengeParticipant;
  } | null>(null);
  const [circleMessages, setCircleMessages] = useState<CircleMessage[]>([]);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showChallengeModal, setShowChallengeModal] = useState(false);
  const [showEncouragementModal, setShowEncouragementModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadCommunityData();
  }, []);

  const loadCommunityData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        console.log('[Community] No authenticated user found');
        setLoading(false);
        return;
      }

      let { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!profile) {
        const { data: newProfile, error: insertError } = await supabase
          .from('user_profiles')
          .insert([{ user_id: user.id, role: null }])
          .select()
          .maybeSingle();

        if (insertError) {
          console.error('[Community] Error creating profile:', insertError);
          setLoading(false);
          return;
        }

        profile = newProfile;
      }

      if (!profile || !profile.id) {
        console.error('[Community] Profile is invalid or missing ID');
        setLoading(false);
        return;
      }

      setUserProfile(profile);

      const { data: circles } = await supabase
        .from('detox_circles')
        .select('*')
        .contains('member_ids', [profile.id]);

      if (circles && circles.length > 0) {
        const circle = circles[0];
        setMyCircle(circle);

        await updateCircleStats(circle.id);

        const { data: messages } = await supabase
          .from('circle_messages')
          .select('*')
          .eq('circle_id', circle.id)
          .order('created_at', { ascending: false })
          .limit(10);

        setCircleMessages(messages || []);
      }

      const { data: participants } = await supabase
        .from('challenge_participants')
        .select('*, detox_challenges(*)')
        .eq('user_profile_id', profile.id)
        .eq('detox_challenges.status', 'active')
        .maybeSingle();

      if (participants && participants.detox_challenges) {
        setMyChallenge({
          challenge: participants.detox_challenges,
          participant: participants,
        });

        await updateChallengeProgress(participants.id, participants.challenge_id);
      }
    } catch (error) {
      console.error('Error loading community data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCircle = async () => {
    if (!userProfile?.id) {
      console.error('[Community] Cannot create circle: no user profile');
      return;
    }

    setProcessing(true);
    const circle = await createCircle(userProfile.id);

    if (circle) {
      setMyCircle(circle);
    }

    setProcessing(false);
  };

  const handleJoinCircle = async () => {
    if (!inviteCode || inviteCode.length !== 6) {
      setError('Please enter a valid 6-digit code');
      return;
    }

    if (!userProfile?.id) {
      setError('User profile not loaded. Please try again.');
      return;
    }

    setProcessing(true);
    setError('');

    const circle = await joinCircleWithCode(inviteCode, userProfile.id);

    if (circle) {
      setMyCircle(circle);
      setShowJoinModal(false);
      setInviteCode('');
      await loadCommunityData();
    } else {
      setError('Invalid code or circle is full');
    }

    setProcessing(false);
  };

  const handleLeaveCircle = async () => {
    if (!myCircle?.id || !userProfile?.id) {
      console.error('[Community] Cannot leave circle: missing data');
      return;
    }

    setProcessing(true);
    const success = await leaveCircle(myCircle.id, userProfile.id);

    if (success) {
      setMyCircle(null);
      setCircleMessages([]);
      setShowLeaveModal(false);
    }

    setProcessing(false);
  };

  const handleSendEncouragement = async (message: string) => {
    if (!myCircle?.id || !userProfile) {
      console.error('[Community] Cannot send encouragement: missing data');
      return;
    }

    const displayName = userProfile.display_name || 'Member';
    const success = await sendEncouragement(myCircle.id, displayName, message);

    if (success) {
      setShowEncouragementModal(false);
      await loadCommunityData();
    }
  };

  const handleStartChallenge = async (challengeType: string) => {
    if (!userProfile?.id) {
      console.error('[Community] Cannot start challenge: no user profile');
      return;
    }

    setProcessing(true);

    const challenge = await createChallenge(
      challengeType,
      !!myCircle,
      myCircle?.id || null,
      userProfile.id
    );

    if (challenge) {
      setShowChallengeModal(false);
      await loadCommunityData();
    }

    setProcessing(false);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#7C9DD9" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AuroraBackground />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        scrollEnabled={true}
        bounces={true}
        alwaysBounceVertical={true}
      >
        <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
          <X color="#9BA8BA" size={24} strokeWidth={2} />
        </TouchableOpacity>

        <View style={styles.header}>
          <Users color="#7C9DD9" size={48} strokeWidth={1.5} />
          <Text style={styles.title}>Community</Text>
          <Text style={styles.subtitle}>Connect and grow together</Text>
        </View>

        {myCircle ? (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Your Detox Circle</Text>
              <TouchableOpacity onPress={() => setShowLeaveModal(true)}>
                <Text style={styles.leaveText}>Leave</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.circleCard}>
              <View style={styles.aiReflection}>
                <Heart color="#5AE38C" size={20} strokeWidth={2} />
                <Text style={styles.reflectionText}>{myCircle.ai_reflection}</Text>
              </View>

              <View style={styles.statsGrid}>
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>{myCircle.hours_saved_today.toFixed(1)}h</Text>
                  <Text style={styles.statLabel}>Saved Today</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>{myCircle.average_streak.toFixed(0)}</Text>
                  <Text style={styles.statLabel}>Avg Streak</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>{myCircle.member_ids.length}/8</Text>
                  <Text style={styles.statLabel}>Members</Text>
                </View>
              </View>

              <View style={styles.inviteSection}>
                <Text style={styles.inviteLabel}>Invite Code:</Text>
                <Text style={styles.inviteCode}>{myCircle.invite_code}</Text>
              </View>

              <TouchableOpacity
                style={styles.encourageButton}
                onPress={() => setShowEncouragementModal(true)}
              >
                <Send color="#7C9DD9" size={18} strokeWidth={2} />
                <Text style={styles.encourageButtonText}>Send Encouragement</Text>
              </TouchableOpacity>

              {circleMessages.length > 0 && (
                <View style={styles.messagesSection}>
                  <Text style={styles.messagesTitle}>Recent Messages</Text>
                  {circleMessages.slice(0, 5).map((msg) => (
                    <View key={msg.id} style={styles.messageItem}>
                      <Text style={styles.messageSender}>{msg.sender_id}</Text>
                      <Text style={styles.messageText}>{msg.message_text}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>
        ) : (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Join a Detox Circle</Text>
            <View style={styles.emptyCard}>
              <Users color="#6B7A8F" size={40} strokeWidth={1.5} />
              <Text style={styles.emptyTitle}>No Circle Yet</Text>
              <Text style={styles.emptyText}>
                Connect with others for shared accountability and support
              </Text>

              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={handleCreateCircle}
                  disabled={processing}
                >
                  <Plus color="#0A0E14" size={18} strokeWidth={2} />
                  <Text style={styles.primaryButtonText}>Create Circle</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={() => setShowJoinModal(true)}
                >
                  <Text style={styles.secondaryButtonText}>Join with Code</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Detox Challenges</Text>

          {myChallenge ? (
            <View style={styles.challengeCard}>
              <View style={styles.challengeHeader}>
                <Target color="#8E89FB" size={24} strokeWidth={2} />
                <Text style={styles.challengeTitle}>{myChallenge.challenge.title}</Text>
              </View>

              <Text style={styles.challengeDescription}>
                {myChallenge.challenge.description}
              </Text>

              <View style={styles.progressSection}>
                <View style={styles.progressHeader}>
                  <Text style={styles.progressLabel}>Progress</Text>
                  <Text style={styles.progressPercentage}>
                    {myChallenge.participant.completion_percentage.toFixed(0)}%
                  </Text>
                </View>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      { width: `${myChallenge.participant.completion_percentage}%` },
                    ]}
                  />
                </View>
                <Text style={styles.progressDays}>
                  Day {myChallenge.participant.current_day} of {myChallenge.challenge.duration_days}
                </Text>
              </View>

              <View style={styles.challengeFooter}>
                <Calendar color="#9BA8BA" size={16} strokeWidth={2} />
                <Text style={styles.challengeDates}>
                  {new Date(myChallenge.challenge.start_date).toLocaleDateString()} -{' '}
                  {new Date(myChallenge.challenge.end_date).toLocaleDateString()}
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.challengesGrid}>
              {Object.entries(CHALLENGE_TYPES).map(([key, challenge]) => (
                <TouchableOpacity
                  key={key}
                  style={styles.challengeOption}
                  onPress={() => handleStartChallenge(key)}
                >
                  <Text style={styles.challengeIcon}>{challenge.icon}</Text>
                  <Text style={styles.challengeOptionTitle}>{challenge.title}</Text>
                  <Text style={styles.challengeOptionDuration}>{challenge.duration} days</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <View style={styles.guidelinesSection}>
          <TrendingUp color="#7C9DD9" size={20} strokeWidth={2} />
          <Text style={styles.guidelinesText}>Encourage. Never compare.</Text>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      <View style={styles.bottomFade} />

      <Modal visible={showJoinModal} transparent animationType="fade">
        <Pressable
          style={styles.modalOverlay}
          onPress={() => !processing && setShowJoinModal(false)}
        >
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>Join a Circle</Text>

            <TextInput
              style={styles.input}
              placeholder="Enter 6-digit code"
              placeholderTextColor="#6B7A8F"
              value={inviteCode}
              onChangeText={setInviteCode}
              keyboardType="number-pad"
              maxLength={6}
            />

            {error && <Text style={styles.errorText}>{error}</Text>}

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowJoinModal(false)}
                disabled={processing}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.confirmButton, processing && styles.confirmButtonProcessing]}
                onPress={handleJoinCircle}
                disabled={processing}
              >
                {processing ? (
                  <ActivityIndicator size="small" color="#0A0E14" />
                ) : (
                  <Text style={styles.confirmButtonText}>Join</Text>
                )}
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={showEncouragementModal} transparent animationType="fade">
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowEncouragementModal(false)}
        >
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>Send Encouragement</Text>
            <Text style={styles.modalSubtitle}>Choose a message to send:</Text>

            <View style={styles.encouragementGrid}>
              {ENCOURAGEMENTS.map((message, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.encouragementChip}
                  onPress={() => handleSendEncouragement(message)}
                >
                  <Text style={styles.encouragementText}>{message}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={showLeaveModal} transparent animationType="fade">
        <Pressable
          style={styles.modalOverlay}
          onPress={() => !processing && setShowLeaveModal(false)}
        >
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>Leave Circle?</Text>
            <Text style={styles.modalDescription}>
              You'll lose access to the group and can only rejoin with an invite code.
            </Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowLeaveModal(false)}
                disabled={processing}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.dangerButton, processing && styles.confirmButtonProcessing]}
                onPress={handleLeaveCircle}
                disabled={processing}
              >
                {processing ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.dangerButtonText}>Leave</Text>
                )}
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
      <FloatingNav activeTab="circles" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0B0B',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0A0E14',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 120,
  },
  bottomSpacer: {
    height: 40,
  },
  bottomFade: {
    position: 'absolute',
    bottom: 80,
    left: 0,
    right: 0,
    height: 80,
    backgroundColor: 'transparent',
    pointerEvents: 'none',
  },
  closeButton: {
    position: 'absolute',
    top: 60,
    right: 24,
    zIndex: 10,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 80,
    paddingBottom: 32,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#E8EDF4',
    textAlign: 'center',
    marginTop: 24,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#9BA8BA',
    textAlign: 'center',
  },
  section: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#E8EDF4',
    marginBottom: 16,
  },
  leaveText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FF6B6B',
  },
  circleCard: {
    backgroundColor: '#161C26',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#2A3441',
  },
  aiReflection: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: '#0A0E14',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderLeftWidth: 3,
    borderLeftColor: '#5AE38C',
  },
  reflectionText: {
    flex: 1,
    fontSize: 14,
    color: '#E8EDF4',
    lineHeight: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#0A0E14',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#7C9DD9',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: '#9BA8BA',
    textAlign: 'center',
  },
  inviteSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0A0E14',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  inviteLabel: {
    fontSize: 13,
    color: '#9BA8BA',
  },
  inviteCode: {
    fontSize: 18,
    fontWeight: '700',
    color: '#E8EDF4',
    letterSpacing: 2,
  },
  encourageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#0A0E14',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2A3441',
    marginBottom: 16,
  },
  encourageButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7C9DD9',
  },
  messagesSection: {
    borderTopWidth: 1,
    borderTopColor: '#2A3441',
    paddingTop: 16,
  },
  messagesTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9BA8BA',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  messageItem: {
    marginBottom: 12,
  },
  messageSender: {
    fontSize: 12,
    fontWeight: '600',
    color: '#7C9DD9',
    marginBottom: 4,
  },
  messageText: {
    fontSize: 14,
    color: '#E8EDF4',
    lineHeight: 20,
  },
  emptyCard: {
    backgroundColor: '#161C26',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2A3441',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#E8EDF4',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#9BA8BA',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  actionButtons: {
    width: '100%',
    gap: 12,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#7C9DD9',
    paddingVertical: 14,
    borderRadius: 12,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0A0E14',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2A3441',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#7C9DD9',
  },
  challengeCard: {
    backgroundColor: '#161C26',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#2A3441',
  },
  challengeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  challengeTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#E8EDF4',
    flex: 1,
  },
  challengeDescription: {
    fontSize: 14,
    color: '#9BA8BA',
    lineHeight: 20,
    marginBottom: 20,
  },
  progressSection: {
    marginBottom: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#9BA8BA',
  },
  progressPercentage: {
    fontSize: 16,
    fontWeight: '700',
    color: '#5AE38C',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#0A0E14',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#5AE38C',
    borderRadius: 4,
  },
  progressDays: {
    fontSize: 12,
    color: '#9BA8BA',
  },
  challengeFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  challengeDates: {
    fontSize: 12,
    color: '#9BA8BA',
  },
  challengesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  challengeOption: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#161C26',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2A3441',
  },
  challengeIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  challengeOptionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#E8EDF4',
    textAlign: 'center',
    marginBottom: 4,
  },
  challengeOptionDuration: {
    fontSize: 12,
    color: '#9BA8BA',
  },
  guidelinesSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  guidelinesText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#7C9DD9',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#161C26',
    borderRadius: 20,
    padding: 32,
    marginHorizontal: 24,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#E8EDF4',
    textAlign: 'center',
    marginBottom: 16,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#9BA8BA',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalDescription: {
    fontSize: 15,
    color: '#9BA8BA',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  input: {
    width: '100%',
    backgroundColor: '#0A0E14',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    color: '#E8EDF4',
    fontSize: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2A3441',
    textAlign: 'center',
    letterSpacing: 4,
  },
  errorText: {
    fontSize: 13,
    color: '#FF6B6B',
    textAlign: 'center',
    marginBottom: 16,
  },
  encouragementGrid: {
    gap: 12,
  },
  encouragementChip: {
    backgroundColor: '#0A0E14',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2A3441',
    alignItems: 'center',
  },
  encouragementText: {
    fontSize: 16,
    color: '#E8EDF4',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: 'transparent',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2A3441',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#9BA8BA',
  },
  confirmButton: {
    flex: 1,
    backgroundColor: '#7C9DD9',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmButtonProcessing: {
    opacity: 0.7,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0A0E14',
  },
  dangerButton: {
    flex: 1,
    backgroundColor: '#FF6B6B',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  dangerButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
