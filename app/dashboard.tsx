import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Clock, HandHelping, Play, Square, Settings2, Crown, Shield, Users, TrendingUp, RefreshCw, Bell, Sparkles } from 'lucide-react-native';
import { getDetoxSettings, getDailyStats, getAllFocusSessions, getAllAIInsights, saveAIInsight, saveFocusSession, saveDailyStats } from '@/lib/localStorage';
import type { DetoxSettings, DailyStats, FocusSession, AIInsight } from '@/lib/localStorage';
import { useProStatus } from '@/hooks/useProStatus';
import BottomNav from '@/components/BottomNav';
import FloatingNav from '@/components/FloatingNav';
import AuroraBackground from '@/components/shared/AuroraBackground';
import BreathingButton from '@/components/shared/BreathingButton';
import MetricCard from '@/components/dashboard/MetricCard';
import BlockedAppsCard from '@/components/dashboard/BlockedAppsCard';
import AIInsightCard from '@/components/dashboard/AIInsightCard';
import AICoachChat from '@/components/ai/AICoachChat';
import DailyInsightCard from '@/components/ai/DailyInsightCard';
import { generateInsights, updateStreaks } from '@/lib/aiEngine';
import { syncUserData, getTimeSinceLastSync } from '@/lib/sync';
import { nudgeEngine, getLastNotificationTime, Notification as NotificationType } from '@/lib/notifications';
import NotificationBanner from '@/components/notifications/NotificationBanner';
import { activateFocusEnvironment, deactivateFocusEnvironment } from '@/lib/environment';

export default function DashboardScreen() {
  const router = useRouter();
  const { hasPro, isLoading: proLoading } = useProStatus();
  const [currentView, setCurrentView] = useState<'dashboard' | 'coach' | 'settings'>('dashboard');
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<DetoxSettings | null>(null);
  const [dailyStats, setDailyStats] = useState<DailyStats | null>(null);
  const [activeFocusSession, setActiveFocusSession] = useState<FocusSession | null>(null);
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [focusElapsed, setFocusElapsed] = useState(0);
  // Subscription is managed via RevenueCat (useProStatus hook)
  const [dailyInsight, setDailyInsight] = useState<{ message: string; category: string } | null>(null);
  const [streaks, setStreaks] = useState<{ focus: number; detox: number }>({ focus: 0, detox: 0 });
  const [lastSync, setLastSync] = useState<string>('Checking...');
  const [syncing, setSyncing] = useState(false);
  const [activeNotification, setActiveNotification] = useState<NotificationType | null>(null);
  const [lastNotificationTime, setLastNotificationTime] = useState<string>('Never');

  const isPremium = hasPro; // Subscription managed via RevenueCat

  useEffect(() => {
    loadDashboardData();
    loadSyncStatus();
    checkForNotifications();

    const notificationInterval = setInterval(() => {
      checkForNotifications();
    }, 3600000);

    return () => clearInterval(notificationInterval);
  }, []);

  const loadSyncStatus = async () => {
    const syncTime = await getTimeSinceLastSync();
    setLastSync(syncTime);
  };

  const handleSync = async () => {
    setSyncing(true);
    await syncUserData();
    await loadSyncStatus();
    setSyncing(false);
  };

  const checkForNotifications = async () => {
    const notification = await nudgeEngine();
    if (notification) {
      setActiveNotification(notification);
    }

    const lastNotifTime = await getLastNotificationTime();
    if (lastNotifTime) {
      const date = new Date(lastNotifTime);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffHours = Math.floor(diffMs / 3600000);

      if (diffHours < 1) {
        setLastNotificationTime('Less than 1h ago');
      } else if (diffHours < 24) {
        setLastNotificationTime(`${diffHours}h ago`);
      } else {
        setLastNotificationTime(`${Math.floor(diffHours / 24)}d ago`);
      }
    }
  };

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (activeFocusSession && !activeFocusSession.end_time) {
      interval = setInterval(() => {
        const elapsed = Math.floor(
          (Date.now() - new Date(activeFocusSession.start_time).getTime()) / 60000
        );
        setFocusElapsed(elapsed);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeFocusSession]);

  const loadDashboardData = async () => {
    try {
      // Load data from local storage (offline-first approach)
      const settingsData = await getDetoxSettings();
      setSettings(settingsData);

      const today = new Date().toISOString().split('T')[0];
      let statsData = await getDailyStats(today);

      // Create default stats if none exist
      if (!statsData && settingsData) {
        statsData = {
              date: today,
              time_saved_minutes: 0,
              mindful_pauses_count: 0,
              apps_opened_count: 0,
              focus_minutes: 0,
          updated_at: new Date().toISOString(),
        };

        setDailyStats(statsData);
      } else {
        setDailyStats(statsData);
      }

      // Load active focus session from local storage
      const allSessions = await getAllFocusSessions();
      const activeSession = Object.values(allSessions).find(
        (s: FocusSession) => s.end_time === null
      ) || null;
      setActiveFocusSession(activeSession);

      if (activeSession) {
        const elapsed = Math.floor(
          (Date.now() - new Date(activeSession.start_time).getTime()) / 60000
        );
        setFocusElapsed(elapsed);
      }

      // Load AI insights from local storage
      const allInsights = await getAllAIInsights();
      const insightsArray = Object.values(allInsights)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 3);

      if (insightsArray.length > 0) {
        setInsights(insightsArray);
      } else {
        // Generate sample insights if none exist
        const generatedInsights = await generateInsights();
        if (generatedInsights.length > 0) {
          const insightsToSave = generatedInsights.map((insight, index) => ({
            id: `insight_${Date.now()}_${index}`,
            insight_text: insight.message,
            insight_type: insight.type as 'progress' | 'streak' | 'suggestion',
            is_read: false,
            created_at: new Date().toISOString(),
          }));
          setInsights(insightsToSave);
        }
      }

      // Streaks are calculated locally for now
      // TODO: Implement streak calculation in local storage
        setStreaks({
        focus: 0,
        detox: 0,
        });

      const aiInsights = await generateInsights();
      if (aiInsights.length > 0) {
        setDailyInsight({
          message: aiInsights[0].message,
          category: aiInsights[0].category,
        });
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateSampleInsights = async (
    settings: DetoxSettings | null,
    stats: DailyStats | null
  ) => {
    const sampleInsights = [];

    if (settings && settings.selected_apps && settings.selected_apps.length > 0) {
      sampleInsights.push({
        insight_text: `You've blocked ${settings.selected_apps.length} apps. Great start on your journey!`,
        insight_type: 'progress' as const,
        insight_category: 'milestone',
      });

      if (settings.selected_apps.length > 0) {
        sampleInsights.push({
          insight_text: `Consider reviewing your screen time patterns to optimize your blocking schedule.`,
          insight_type: 'suggestion' as const,
          insight_category: 'suggestion',
        });
      }
    } else {
      sampleInsights.push({
        insight_text: 'Start your journey by selecting apps to block in the Blocks tab.',
        insight_type: 'suggestion' as const,
        insight_category: 'suggestion',
      });
    }

    sampleInsights.push({
      insight_text: 'Every small step counts. Try a 10-minute focus block today.',
      insight_type: 'suggestion' as const,
      insight_category: 'motivation',
    });

    try {
      // Save insights to local storage
      const savedInsights: AIInsight[] = [];
      for (const insight of sampleInsights) {
        const saved: AIInsight = {
          id: `insight_${Date.now()}_${Math.random()}`,
          insight_text: insight.insight_text,
          insight_type: insight.insight_type,
          is_read: false,
          created_at: new Date().toISOString(),
        };
        await saveAIInsight(saved);
        savedInsights.push(saved);
      }
      setInsights(savedInsights);
    } catch (error) {
      console.error('Error saving sample insights:', error);
      setInsights([]);
    }
  };

  const startFocusSession = async () => {
    try {
      const newSession: FocusSession = {
        id: `session_${Date.now()}`,
        start_time: new Date().toISOString(),
        end_time: null,
        duration_minutes: null,
        created_at: new Date().toISOString(),
      };

      await saveFocusSession(newSession);
      setActiveFocusSession(newSession);
      setFocusElapsed(0);

      await activateFocusEnvironment();
    } catch (error) {
      console.error('Error starting focus session:', error);
    }
  };

  const endFocusSession = async () => {
    if (!activeFocusSession) return;

    try {
      const endTime = new Date().toISOString();
      const durationMinutes = Math.floor(
        (new Date(endTime).getTime() - new Date(activeFocusSession.start_time).getTime()) / 60000
      );

      await deactivateFocusEnvironment();

      // Update focus session in local storage
      const updatedSession: FocusSession = {
        ...activeFocusSession,
          end_time: endTime,
          duration_minutes: durationMinutes,
      };
      await saveFocusSession(updatedSession);

      // Update daily stats in local storage
      if (dailyStats) {
        const today = new Date().toISOString().split('T')[0];
        await saveDailyStats(today, {
            focus_minutes: dailyStats.focus_minutes + durationMinutes,
        });
      }

      setActiveFocusSession(null);
      setFocusElapsed(0);
      loadDashboardData();
    } catch (error) {
      console.error('Error ending focus session:', error);
    }
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours} h ${mins} m`;
    }
    return `${mins} m`;
  };

  if (loading || proLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#7C9DD9" />
      </View>
    );
  }

  if (currentView === 'coach') {
    return (
      <View style={styles.container}>
        <View style={styles.coachHeader}>
          <Text style={styles.coachTitle}>AI Coach</Text>
          <Text style={styles.coachSubtitle}>Ask me about your habits and progress</Text>
        </View>
        <AICoachChat />
        <BottomNav currentScreen="coach" onNavigate={setCurrentView} />
      </View>
    );
  }

  if (currentView === 'settings') {
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
          <View style={styles.header}>
            <Text style={styles.title}>Settings</Text>
            <Text style={styles.subtitle}>Manage your detox preferences</Text>
          </View>

          <TouchableOpacity
            style={styles.settingButton}
            onPress={() => router.push('/setup')}
          >
            <Settings2 color="#7C9DD9" size={20} strokeWidth={2} />
            <Text style={styles.settingButtonText}>Adjust Detox Plan</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.settingButton}
            onPress={() => router.push('/subscription')}
          >
            <Crown color="#7C9DD9" size={20} strokeWidth={2} />
            <Text style={styles.settingButtonText}>Manage Subscription</Text>
          </TouchableOpacity>

          {isPremium && (
            <TouchableOpacity
              style={styles.settingButton}
              onPress={() => router.push('/family')}
            >
              <Shield color="#7C9DD9" size={20} strokeWidth={2} />
              <Text style={styles.settingButtonText}>Family Linking</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.settingButton}
            onPress={() => router.push('/community')}
          >
            <Users color="#7C9DD9" size={20} strokeWidth={2} />
            <Text style={styles.settingButtonText}>Community & Challenges</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.settingButton}
            onPress={() => router.push('/analytics')}
          >
            <TrendingUp color="#7C9DD9" size={20} strokeWidth={2} />
            <Text style={styles.settingButtonText}>Analytics & Reports</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.settingButton}
            onPress={() => router.push('/notifications')}
          >
            <Bell color="#7C9DD9" size={20} strokeWidth={2} />
            <Text style={styles.settingButtonText}>Notifications</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.settingButton}
            onPress={() => router.push('/environment')}
          >
            <Sparkles color="#8E89FB" size={20} strokeWidth={2} />
            <Text style={styles.settingButtonText}>Environment & Wearables</Text>
          </TouchableOpacity>

          <View style={styles.notificationInfo}>
            <Text style={styles.notificationInfoText}>
              Last nudge: {lastNotificationTime}
            </Text>
          </View>

          <View style={styles.syncSection}>
            <View style={styles.syncHeader}>
              <Text style={styles.syncTitle}>Cloud Sync</Text>
              <Text style={styles.syncStatus}>Last sync: {lastSync}</Text>
            </View>
            <TouchableOpacity
              style={[styles.syncButton, syncing && styles.syncButtonDisabled]}
              onPress={handleSync}
              disabled={syncing}
            >
              <RefreshCw color="#7C9DD9" size={18} strokeWidth={2} />
              <Text style={styles.syncButtonText}>
                {syncing ? 'Syncing...' : 'Sync Now'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.placeholderBox}>
            <Text style={styles.placeholderText}>More settings coming soon</Text>
          </View>

          <View style={styles.bottomSpacer} />
        </ScrollView>
        <View style={styles.bottomFade} />
        <BottomNav currentScreen="settings" onNavigate={setCurrentView} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AuroraBackground />
      {activeNotification && (
        <NotificationBanner
          notification={activeNotification}
          onDismiss={() => setActiveNotification(null)}
        />
      )}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        scrollEnabled={true}
        bounces={true}
        alwaysBounceVertical={true}
      >
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.title}>Your Digital Sanctuary</Text>
              <Text style={styles.subtitle}>
                {activeFocusSession
                  ? `Flow state: ${focusElapsed} minutes of clarity`
                  : dailyStats
                  ? `${formatTime(dailyStats.time_saved_minutes)} reclaimed today`
                  : 'Begin your first journey into focus'}
              </Text>
            </View>
            {!isPremium && (
              <TouchableOpacity
                style={styles.upgradeButton}
                onPress={() => router.push('/subscription')}
              >
                <Crown color="#7C9DD9" size={20} strokeWidth={2} />
              </TouchableOpacity>
            )}
          </View>
          {isPremium && (
            <View style={styles.premiumBadge}>
              <Crown color="#7C9DD9" size={16} strokeWidth={2} />
              <Text style={styles.premiumText}>Premium Active</Text>
            </View>
          )}
        </View>

        {dailyInsight && (
          <View style={styles.insightContainer}>
            <DailyInsightCard
              message={dailyInsight.message}
              category={dailyInsight.category as any}
            />
          </View>
        )}

        {(streaks.focus > 0 || streaks.detox > 0) && (
          <View style={styles.streaksContainer}>
            {streaks.focus > 0 && (
              <View style={styles.streakCard}>
                <Text style={styles.streakNumber}>{streaks.focus}</Text>
                <Text style={styles.streakLabel}>Day Focus Streak</Text>
              </View>
            )}
            {streaks.detox > 0 && (
              <View style={styles.streakCard}>
                <Text style={styles.streakNumber}>{streaks.detox}</Text>
                <Text style={styles.streakLabel}>Day Detox Streak</Text>
              </View>
            )}
          </View>
        )}

        <View style={styles.metricsGrid}>
          <View style={styles.metricColumn}>
            <MetricCard
              icon={Clock}
              title="Time Saved Today"
              value={dailyStats ? formatTime(dailyStats.time_saved_minutes) : '0 m'}
            />
          </View>

          <View style={styles.metricColumn}>
            <BlockedAppsCard apps={settings?.selected_apps || []} />
          </View>

          <View style={styles.metricColumn}>
            <MetricCard
              icon={HandHelping}
              title="Mindful Pauses"
              value={dailyStats?.mindful_pauses_count.toString() || '0'}
              subtitle="times reconsidered"
            />
          </View>
        </View>

        <View style={styles.actionSection}>
          <Text style={styles.sectionTitle}>Focus Session</Text>

          {!activeFocusSession ? (
            <TouchableOpacity style={styles.primaryButton} onPress={startFocusSession}>
              <Play color="#0A0E14" size={20} strokeWidth={2} fill="#0A0E14" />
              <Text style={styles.primaryButtonText}>Start Focus Block</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.activeSessionContainer}>
              <View style={styles.sessionTimer}>
                <Text style={styles.timerLabel}>Focus Time</Text>
                <Text style={styles.timerValue}>{formatTime(focusElapsed)}</Text>
              </View>

              <TouchableOpacity style={styles.stopButton} onPress={endFocusSession}>
                <Square color="#E8EDF4" size={20} strokeWidth={2} fill="#E8EDF4" />
                <Text style={styles.stopButtonText}>End Focus Block</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.insightsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Smart Suggestions</Text>
            {!isPremium && (
              <TouchableOpacity
                style={styles.upgradeLink}
                onPress={() => router.push('/subscription')}
              >
                <Text style={styles.upgradeLinkText}>Upgrade for more</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.insightsGrid}>
            {isPremium ? (
              insights.map((insight) => (
                <AIInsightCard
                  key={insight.id}
                  text={insight.insight_text}
                  type={insight.insight_type}
                />
              ))
            ) : (
              <>
                {insights.slice(0, 1).map((insight) => (
                  <AIInsightCard
                    key={insight.id}
                    text={insight.insight_text}
                    type={insight.insight_type}
                  />
                ))}
                <TouchableOpacity
                  style={styles.lockedCard}
                  onPress={() => router.push('/subscription')}
                >
                  <Crown color="#6B7A8F" size={24} strokeWidth={1.5} />
                  <Text style={styles.lockedText}>Unlock more AI insights with Premium</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      <View style={styles.bottomFade} />
      <FloatingNav activeTab="flow" />
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
    backgroundColor: '#0B0B0B',
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
  header: {
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 24,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
    letterSpacing: -0.5,
    textShadowColor: 'rgba(163, 161, 255, 0.2)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 16,
  },
  subtitle: {
    fontSize: 16,
    color: '#C5D0E0',
    lineHeight: 24,
    letterSpacing: 0.3,
  },
  upgradeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(22, 28, 38, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(163, 161, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#A3A1FF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#161C26',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#2A3441',
  },
  premiumText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#7C9DD9',
  },
  coachHeader: {
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: '#0A0E14',
    borderBottomWidth: 1,
    borderBottomColor: '#2A3441',
  },
  coachTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#E8EDF4',
    marginBottom: 4,
  },
  coachSubtitle: {
    fontSize: 14,
    color: '#9BA8BA',
  },
  insightContainer: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  streaksContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    gap: 12,
    marginBottom: 24,
  },
  streakCard: {
    flex: 1,
    backgroundColor: '#161C26',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2A3441',
  },
  streakNumber: {
    fontSize: 32,
    fontWeight: '700',
    color: '#5AE38C',
    marginBottom: 4,
  },
  streakLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#9BA8BA',
    textAlign: 'center',
  },
  metricsGrid: {
    paddingHorizontal: 24,
    gap: 16,
    marginBottom: 32,
  },
  metricColumn: {
    width: '100%',
  },
  actionSection: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#E8EDF4',
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  upgradeLink: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  upgradeLinkText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#7C9DD9',
  },
  primaryButton: {
    backgroundColor: '#7C9DD9',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
  },
  primaryButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#0A0E14',
  },
  activeSessionContainer: {
    gap: 16,
  },
  sessionTimer: {
    backgroundColor: '#161C26',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#7C9DD9',
  },
  timerLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#9BA8BA',
    marginBottom: 8,
  },
  timerValue: {
    fontSize: 36,
    fontWeight: '700',
    color: '#7C9DD9',
  },
  stopButton: {
    backgroundColor: '#2A3441',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#3E4A5C',
  },
  stopButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#E8EDF4',
  },
  insightsSection: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  insightsGrid: {
    gap: 12,
  },
  lockedCard: {
    backgroundColor: '#161C26',
    borderRadius: 12,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#2A3441',
    borderStyle: 'dashed',
  },
  lockedText: {
    flex: 1,
    fontSize: 14,
    color: '#6B7A8F',
    lineHeight: 20,
  },
  placeholderBox: {
    backgroundColor: '#161C26',
    paddingVertical: 32,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2A3441',
    borderStyle: 'dashed',
    marginHorizontal: 24,
    marginTop: 24,
  },
  placeholderText: {
    fontSize: 14,
    color: '#6B7A8F',
    textAlign: 'center',
  },
  settingButton: {
    backgroundColor: '#161C26',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2A3441',
    marginHorizontal: 24,
    marginBottom: 12,
  },
  settingButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#E8EDF4',
  },
  syncSection: {
    backgroundColor: '#161C26',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 24,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2A3441',
  },
  syncHeader: {
    marginBottom: 12,
  },
  syncTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#E8EDF4',
    marginBottom: 4,
  },
  syncStatus: {
    fontSize: 12,
    color: '#9BA8BA',
  },
  syncButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#0A0E14',
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2A3441',
  },
  syncButtonDisabled: {
    opacity: 0.5,
  },
  syncButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7C9DD9',
  },
  notificationInfo: {
    backgroundColor: 'transparent',
    paddingHorizontal: 24,
    paddingVertical: 8,
    marginBottom: 8,
  },
  notificationInfoText: {
    fontSize: 12,
    color: '#6B7A8F',
    textAlign: 'center',
  },
});
