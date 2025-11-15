/**
 * Detox Timer Screen
 * 
 * Customizable detox timer with countdown functionality.
 * Users can set any duration and start/pause/end sessions.
 * Duration is saved to AsyncStorage for persistence.
 */

import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Platform,
  Alert,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Timer, Play, Pause, Square, ChevronLeft, Settings } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import AuroraBackground from '@/components/shared/AuroraBackground';
import FloatingNav from '@/components/FloatingNav';
import { saveDetoxTimerDuration, getDetoxTimerDuration, saveFocusSession, getAllFocusSessions, saveDailyStats, getDailyStats } from '@/lib/localStorage';
import type { FocusSession } from '@/lib/localStorage';

export default function DetoxTimerScreen() {
  const router = useRouter();
  const [durationMinutes, setDurationMinutes] = useState<number>(25);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(25 * 60);
  const [currentSession, setCurrentSession] = useState<FocusSession | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Load saved duration preference
    const loadDuration = async () => {
      const saved = await getDetoxTimerDuration();
      setDurationMinutes(saved);
      setRemainingSeconds(saved * 60);
    };
    loadDuration();

    // Check for active session
    const checkActiveSession = async () => {
      const allSessions = await getAllFocusSessions();
      const activeSession = Object.values(allSessions).find(
        (s: FocusSession) => s.end_time === null
      );
      if (activeSession) {
        setCurrentSession(activeSession);
        // Calculate remaining time based on session start and saved duration
        const sessionStart = new Date(activeSession.start_time).getTime();
        const now = Date.now();
        const elapsed = Math.floor((now - sessionStart) / 1000);
        const saved = await getDetoxTimerDuration();
        const total = saved * 60;
        const remaining = Math.max(0, total - elapsed);
        setRemainingSeconds(remaining);
        if (remaining > 0) {
          setIsRunning(true);
        }
      }
    };
    checkActiveSession();

    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    if (isRunning && !isPaused && remainingSeconds > 0) {
      intervalRef.current = setInterval(() => {
        setRemainingSeconds((prev) => {
          if (prev <= 1) {
            handleTimerComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, isPaused, remainingSeconds]);

  const handleTimerComplete = async () => {
    if (Platform.OS !== 'web') {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    
    Alert.alert(
      'Timer Complete! 🎉',
      'Great job completing your detox session!',
      [{ text: 'OK', onPress: () => handleEndSession(true) }]
    );
  };

  const handleStart = async () => {
    try {
      // Save duration preference
      await saveDetoxTimerDuration(durationMinutes);
      
      // Create new focus session
      const newSession: FocusSession = {
        id: `session_${Date.now()}`,
        start_time: new Date().toISOString(),
        end_time: null,
        duration_minutes: null,
        created_at: new Date().toISOString(),
      };
      
      await saveFocusSession(newSession);
      setCurrentSession(newSession);
      setRemainingSeconds(durationMinutes * 60);
      setIsRunning(true);
      setIsPaused(false);

      if (Platform.OS !== 'web') {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
    } catch (error) {
      console.error('Error starting timer:', error);
      Alert.alert('Error', 'Failed to start timer');
    }
  };

  const handlePause = async () => {
    setIsPaused(true);
    setIsRunning(false);
    if (Platform.OS !== 'web') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleResume = () => {
    setIsPaused(false);
    setIsRunning(true);
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleEndSession = async (completed: boolean = false) => {
    if (!currentSession) return;

    try {
      const endTime = new Date().toISOString();
      const durationMinutes = Math.floor(
        (new Date(endTime).getTime() - new Date(currentSession.start_time).getTime()) / 60000
      );

      const updatedSession: FocusSession = {
        ...currentSession,
        end_time: endTime,
        duration_minutes: durationMinutes,
      };

      await saveFocusSession(updatedSession);

      // Update daily stats
      const today = new Date().toISOString().split('T')[0];
      const todayStats = await getDailyStats(today);
      await saveDailyStats(today, {
        focus_minutes: (todayStats?.focus_minutes || 0) + durationMinutes,
      });

      setCurrentSession(null);
      setIsRunning(false);
      setIsPaused(false);
      setRemainingSeconds(durationMinutes * 60);

      if (Platform.OS !== 'web') {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
    } catch (error) {
      console.error('Error ending session:', error);
      Alert.alert('Error', 'Failed to end session');
    }
  };

  const handleEndEarly = () => {
    Alert.alert(
      'End Session Early?',
      'Are you sure you want to end this detox session?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'End Session',
          style: 'destructive',
          onPress: () => handleEndSession(false),
        },
      ]
    );
  };

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const quickDurations = [5, 10, 15, 25, 30, 45, 60, 90, 120];

  return (
    <View style={styles.container}>
      <AuroraBackground />

      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
          },
        ]}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ChevronLeft color="#FFFFFF" size={24} strokeWidth={2} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Detox Timer</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {!isRunning && !currentSession ? (
            <>
              <View style={styles.setupSection}>
                <Timer color="#8E89FB" size={64} strokeWidth={1.5} />
                <Text style={styles.sectionTitle}>Set Duration</Text>
                <Text style={styles.sectionSubtitle}>
                  Choose how long you want to focus
                </Text>

                <View style={styles.durationInputContainer}>
                  <TextInput
                    style={styles.durationInput}
                    value={durationMinutes.toString()}
                    onChangeText={(text) => {
                      const value = parseInt(text) || 0;
                      if (value >= 1 && value <= 480) {
                        setDurationMinutes(value);
                        setRemainingSeconds(value * 60);
                      }
                    }}
                    keyboardType="number-pad"
                    placeholder="25"
                    placeholderTextColor="#6B7A8F"
                  />
                  <Text style={styles.durationLabel}>minutes</Text>
                </View>

                <View style={styles.quickDurations}>
                  <Text style={styles.quickDurationsLabel}>Quick Select:</Text>
                  <View style={styles.quickDurationsGrid}>
                    {quickDurations.map((mins) => (
                      <TouchableOpacity
                        key={mins}
                        style={[
                          styles.quickDurationButton,
                          durationMinutes === mins && styles.quickDurationButtonActive,
                        ]}
                        onPress={() => {
                          setDurationMinutes(mins);
                          setRemainingSeconds(mins * 60);
                          if (Platform.OS !== 'web') {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          }
                        }}
                      >
                        <Text
                          style={[
                            styles.quickDurationText,
                            durationMinutes === mins && styles.quickDurationTextActive,
                          ]}
                        >
                          {mins}m
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.startButton}
                  onPress={handleStart}
                >
                  <LinearGradient
                    colors={['#8E89FB', '#4ED4C7']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.startButtonGradient}
                  >
                    <Play color="#FFFFFF" size={24} strokeWidth={2.5} fill="#FFFFFF" />
                    <Text style={styles.startButtonText}>Start Timer</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              <View style={styles.timerSection}>
                <View style={styles.timerCircle}>
                  <LinearGradient
                    colors={['rgba(142, 137, 251, 0.2)', 'rgba(78, 212, 199, 0.2)']}
                    style={styles.timerCircleGradient}
                  >
                    <Text style={styles.timerText}>{formatTime(remainingSeconds)}</Text>
                    <Text style={styles.timerLabel}>remaining</Text>
                  </LinearGradient>
                </View>

                <View style={styles.timerControls}>
                  {isPaused ? (
                    <TouchableOpacity
                      style={styles.controlButton}
                      onPress={handleResume}
                    >
                      <LinearGradient
                        colors={['#8E89FB', '#4ED4C7']}
                        style={styles.controlButtonGradient}
                      >
                        <Play color="#FFFFFF" size={28} strokeWidth={2.5} fill="#FFFFFF" />
                      </LinearGradient>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={styles.controlButton}
                      onPress={handlePause}
                    >
                      <LinearGradient
                        colors={['#5AE38C', '#4ED4C7']}
                        style={styles.controlButtonGradient}
                      >
                        <Pause color="#FFFFFF" size={28} strokeWidth={2.5} fill="#FFFFFF" />
                      </LinearGradient>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    style={styles.controlButton}
                    onPress={handleEndEarly}
                  >
                    <LinearGradient
                      colors={['#F87171', '#EF4444']}
                      style={styles.controlButtonGradient}
                    >
                      <Square color="#FFFFFF" size={24} strokeWidth={2.5} fill="#FFFFFF" />
                    </LinearGradient>
                  </TouchableOpacity>
                </View>

                <Text style={styles.sessionInfo}>
                  {isPaused ? 'Paused' : 'Focusing...'} • {durationMinutes} min session
                </Text>
              </View>
            </>
          )}
        </ScrollView>
      </Animated.View>

      <FloatingNav activeTab="more" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0B0B',
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(142, 137, 251, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 140,
  },
  setupSection: {
    alignItems: 'center',
    paddingTop: 40,
  },
  sectionTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 24,
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 16,
    color: '#9BA8BA',
    textAlign: 'center',
    marginBottom: 40,
  },
  durationInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
  },
  durationInput: {
    width: 120,
    height: 80,
    backgroundColor: 'rgba(142, 137, 251, 0.1)',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#8E89FB',
    color: '#FFFFFF',
    fontSize: 48,
    fontWeight: '700',
    textAlign: 'center',
    marginRight: 16,
  },
  durationLabel: {
    fontSize: 20,
    color: '#9BA8BA',
    fontWeight: '600',
  },
  quickDurations: {
    width: '100%',
    marginBottom: 40,
  },
  quickDurationsLabel: {
    fontSize: 14,
    color: '#6B7A8F',
    marginBottom: 12,
    textAlign: 'center',
  },
  quickDurationsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
  },
  quickDurationButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(142, 137, 251, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(142, 137, 251, 0.2)',
  },
  quickDurationButtonActive: {
    backgroundColor: '#8E89FB',
    borderColor: '#8E89FB',
  },
  quickDurationText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9BA8BA',
  },
  quickDurationTextActive: {
    color: '#FFFFFF',
  },
  startButton: {
    width: '100%',
    height: 60,
    borderRadius: 16,
    overflow: 'hidden',
  },
  startButtonGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  timerSection: {
    alignItems: 'center',
    paddingTop: 60,
  },
  timerCircle: {
    width: 280,
    height: 280,
    borderRadius: 140,
    marginBottom: 48,
    overflow: 'hidden',
  },
  timerCircleGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#8E89FB',
    borderRadius: 140,
  },
  timerText: {
    fontSize: 64,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  timerLabel: {
    fontSize: 16,
    color: '#9BA8BA',
    fontWeight: '500',
  },
  timerControls: {
    flexDirection: 'row',
    gap: 24,
    marginBottom: 24,
  },
  controlButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    overflow: 'hidden',
  },
  controlButtonGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sessionInfo: {
    fontSize: 14,
    color: '#6B7A8F',
    textAlign: 'center',
  },
});

