/**
 * Tracker Tab
 * 
 * Shows comprehensive tracking data for premium users:
 * - Screen time during and between schedules
 * - App blocking stats and progress
 * - Streak counters and time saved
 * 
 * Free users see a limited preview with CTA to upgrade.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  BarChart3,
  Clock,
  Shield,
  Flame,
  TrendingUp,
  Lock,
  Crown,
  Calendar,
  Zap,
  Target,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import AuroraBackground from '@/components/shared/AuroraBackground';
import BottomTabNav from '@/components/BottomTabNav';
import { useProStatus } from '@/hooks/useProStatus';
import { useFocusSession } from '@/hooks/useFocusSession';
import {
  getTodayStats,
  getWeekStats,
  getAllTimeStats,
  migrateExistingSessions,
  type TodayStats,
  type WeekStats,
  type AllTimeStats,
} from '@/lib/analytics';

const SCREEN_WIDTH = Dimensions.get('window').width;

// Metric Card Component
function MetricCard({
  icon: Icon,
  iconColor,
  title,
  value,
  subtitle,
  isLocked = false,
}: {
  icon: any;
  iconColor: string;
  title: string;
  value: string;
  subtitle?: string;
  isLocked?: boolean;
}) {
  return (
    <View style={[styles.metricCard, isLocked && styles.metricCardLocked]}>
      <View style={[styles.metricIconContainer, { backgroundColor: `${iconColor}20` }]}>
        {isLocked ? (
          <Lock color="#6B7A8F" size={20} strokeWidth={2} />
        ) : (
          <Icon color={iconColor} size={20} strokeWidth={2} />
        )}
      </View>
      <Text style={[styles.metricValue, isLocked && styles.textLocked]}>
        {isLocked ? '—' : value}
      </Text>
      <Text style={[styles.metricTitle, isLocked && styles.textLocked]}>{title}</Text>
      {subtitle && (
        <Text style={[styles.metricSubtitle, isLocked && styles.textLocked]}>{subtitle}</Text>
      )}
    </View>
  );
}

// Weekly Chart Component
function WeeklyChart({ weekStats, isLocked }: { weekStats: WeekStats | null; isLocked: boolean }) {
  if (!weekStats) {
    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>No data available</Text>
      </View>
    );
  }

  // Get week start (Sunday)
  const today = new Date();
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay()); // Go back to Sunday
  weekStart.setHours(0, 0, 0, 0);

  // Build array of 7 days (Sun-Sat)
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const chartData = days.map((dayLabel, index) => {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + index);
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    const minutes = weekStats.focusMinutesByDay[dateStr] || 0;
    return { dayLabel, minutes, dateStr };
  });

  const maxMinutes = Math.max(...chartData.map(d => d.minutes), 1);

  return (
    <View style={styles.chartContainer}>
      <View style={styles.chartHeader}>
        <BarChart3 color="#8E89FB" size={20} strokeWidth={2} />
        <Text style={styles.chartTitle}>Weekly Focus Time</Text>
      </View>
      
      <View style={styles.barsContainer}>
        {chartData.map((day, index) => {
          const height = isLocked ? 20 : Math.max((day.minutes / maxMinutes) * 100, 4);
          
          return (
            <View key={day.dateStr} style={styles.barWrapper}>
              <View style={styles.barColumn}>
                <View
                  style={[
                    styles.bar,
                    { height },
                    isLocked && styles.barLocked,
                  ]}
                />
              </View>
              <Text style={styles.barLabel}>{day.dayLabel}</Text>
              {!isLocked && (
                <Text style={styles.barValue}>
                  {day.minutes > 60
                    ? `${(day.minutes / 60).toFixed(1)}h`
                    : `${day.minutes}m`}
                </Text>
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
}

// Schedule Status Component
function ScheduleStatus({ isActive, scheduleName }: { isActive: boolean; scheduleName?: string }) {
  return (
    <View style={[styles.scheduleStatus, isActive && styles.scheduleStatusActive]}>
      <View style={styles.scheduleStatusHeader}>
        <Calendar color={isActive ? '#5AE38C' : '#6B7A8F'} size={18} strokeWidth={2} />
        <Text style={[styles.scheduleStatusTitle, isActive && styles.scheduleStatusTitleActive]}>
          {isActive ? 'Schedule Active' : 'No Active Schedule'}
        </Text>
      </View>
      <Text style={styles.scheduleStatusText}>
        {isActive
          ? `${scheduleName || 'Focus Schedule'} is currently blocking distracting apps`
          : 'Start a focus session or activate a schedule to begin blocking'}
      </Text>
    </View>
  );
}

// Locked Overlay Component
function LockedOverlay({ onUpgrade }: { onUpgrade: () => void }) {
  return (
    <View style={styles.lockedOverlay}>
      <View style={styles.lockedContent}>
        <Lock color="#FECF5E" size={48} strokeWidth={1.5} />
        <Text style={styles.lockedTitle}>Unlock Full Tracker</Text>
        <Text style={styles.lockedDescription}>
          Premium users get detailed insights, weekly charts, and complete blocking analytics.
        </Text>
        <TouchableOpacity style={styles.upgradeButton} onPress={onUpgrade}>
          <Crown color="#000000" size={20} strokeWidth={2} />
          <Text style={styles.upgradeButtonText}>Upgrade to Premium</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function TrackerScreen() {
  const router = useRouter();
  const { hasPro, isLoading: proLoading } = useProStatus();
  const { isActive: isSessionActive } = useFocusSession();
  const [todayStats, setTodayStats] = useState<TodayStats | null>(null);
  const [weekStats, setWeekStats] = useState<WeekStats | null>(null);
  const [allTimeStats, setAllTimeStats] = useState<AllTimeStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isScheduleActive, setIsScheduleActive] = useState(false);
  const [prevSessionActive, setPrevSessionActive] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Migrate existing sessions on first load
      await migrateExistingSessions();
      
      const now = new Date();
      const [today, week, allTime] = await Promise.all([
        getTodayStats(now),
        getWeekStats(now),
        getAllTimeStats(now),
      ]);

      setTodayStats(today);
      setWeekStats(week);
      setAllTimeStats(allTime);
      
      // TODO: Check if a schedule is currently active
      setIsScheduleActive(false);
    } catch (error) {
      console.error('[Tracker] Error loading data:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Refresh when session ends (isActive changes from true to false)
  useEffect(() => {
    if (prevSessionActive && !isSessionActive) {
      // Session just ended, refresh stats
      console.log('[Tracker] Session ended, refreshing stats');
      loadData();
    }
    setPrevSessionActive(isSessionActive);
  }, [isSessionActive, prevSessionActive, loadData]);

  const onRefresh = useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setRefreshing(true);
    loadData();
  }, [loadData]);

  const handleUpgrade = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    router.push('/paywall');
  };

  const formatTime = (minutes: number): string => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  if (isLoading || proLoading) {
    return (
      <View style={styles.container}>
        <AuroraBackground />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8E89FB" />
        </View>
        <BottomTabNav />
      </View>
    );
  }

  const isLocked = !hasPro;

  return (
    <View style={styles.container}>
      <AuroraBackground />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#8E89FB"
            colors={['#8E89FB']}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <BarChart3 color="#8E89FB" size={32} strokeWidth={1.5} />
          <Text style={styles.headerTitle}>Tracker</Text>
          <Text style={styles.headerSubtitle}>
            Your focus journey at a glance
          </Text>
        </View>

        {/* Schedule Status - Always visible */}
        <ScheduleStatus isActive={isScheduleActive} />

        {/* Today's Highlights */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Today</Text>
          <View style={styles.metricsRow}>
            <MetricCard
              icon={Clock}
              iconColor="#7C9DD9"
              title="Focus Time"
              value={formatTime(todayStats?.focusMinutes || 0)}
              isLocked={false}
            />
            <MetricCard
              icon={Shield}
              iconColor="#5AE38C"
              title="Blocks"
              value={`${todayStats?.blocks || 0}`}
              isLocked={false}
            />
          </View>
        </View>

        {/* Streak Card - Premium feature */}
        <View style={[styles.streakCard, isLocked && styles.cardLocked]}>
          <View style={styles.streakHeader}>
            <Flame color={isLocked ? '#6B7A8F' : '#F4A261'} size={28} strokeWidth={2} />
            <View style={styles.streakInfo}>
              <Text style={[styles.streakValue, isLocked && styles.textLocked]}>
                {isLocked ? '—' : allTimeStats?.currentStreakDays || 0}
              </Text>
              <Text style={[styles.streakLabel, isLocked && styles.textLocked]}>
                Day Streak
              </Text>
            </View>
          </View>
          <View style={styles.streakBest}>
            <Target color={isLocked ? '#6B7A8F' : '#8E89FB'} size={16} strokeWidth={2} />
            <Text style={[styles.streakBestText, isLocked && styles.textLocked]}>
              Best: {isLocked ? '—' : allTimeStats?.bestStreakDays || 0} days
            </Text>
          </View>
          {isLocked && (
            <View style={styles.lockedBadge}>
              <Lock color="#FECF5E" size={12} strokeWidth={2} />
              <Text style={styles.lockedBadgeText}>Premium</Text>
            </View>
          )}
        </View>

        {/* Weekly Chart - Premium feature */}
        <View style={[styles.section, isLocked && styles.sectionLocked]}>
          <Text style={styles.sectionTitle}>This Week</Text>
          <WeeklyChart weekStats={weekStats} isLocked={isLocked} />
          
          {!isLocked && weekStats && (
            <View style={styles.weeklyStats}>
              <View style={styles.weeklyStat}>
                <Text style={styles.weeklyStatValue}>
                  {formatTime(weekStats.totalFocusMinutes)}
                </Text>
                <Text style={styles.weeklyStatLabel}>Total Focus</Text>
              </View>
              <View style={styles.weeklyStatDivider} />
              <View style={styles.weeklyStat}>
                <Text style={styles.weeklyStatValue}>{weekStats.totalBlocks}</Text>
                <Text style={styles.weeklyStatLabel}>Blocks</Text>
              </View>
              <View style={styles.weeklyStatDivider} />
              <View style={styles.weeklyStat}>
                <Text style={styles.weeklyStatValue}>{weekStats.activeDays}/7</Text>
                <Text style={styles.weeklyStatLabel}>Active Days</Text>
              </View>
            </View>
          )}
        </View>

        {/* All-Time Stats - Premium feature */}
        <View style={[styles.section, isLocked && styles.sectionLocked]}>
          <Text style={styles.sectionTitle}>All Time</Text>
          <View style={styles.metricsRow}>
            <MetricCard
              icon={Zap}
              iconColor="#FECF5E"
              title="Time Saved"
              value={formatTime(allTimeStats?.timeSavedMinutes || 0)}
              isLocked={isLocked}
            />
            <MetricCard
              icon={TrendingUp}
              iconColor="#5AE38C"
              title="Sessions"
              value={`${allTimeStats?.totalSessions || 0}`}
              isLocked={isLocked}
            />
          </View>
          <View style={[styles.metricsRow, { marginTop: 12 }]}>
            <MetricCard
              icon={Shield}
              iconColor="#8E89FB"
              title="Total Blocks"
              value={`${allTimeStats?.totalBlocks || 0}`}
              isLocked={isLocked}
            />
            <MetricCard
              icon={Clock}
              iconColor="#7C9DD9"
              title="Focus Time"
              value={formatTime(allTimeStats?.totalFocusMinutes || 0)}
              isLocked={isLocked}
            />
          </View>
        </View>

        {/* Upgrade CTA for free users */}
        {isLocked && (
          <TouchableOpacity style={styles.upgradeBanner} onPress={handleUpgrade}>
            <Crown color="#FECF5E" size={24} strokeWidth={2} />
            <View style={styles.upgradeBannerText}>
              <Text style={styles.upgradeBannerTitle}>Unlock Full Insights</Text>
              <Text style={styles.upgradeBannerSubtitle}>
                See detailed stats, streaks, and weekly trends
              </Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Bottom padding */}
        <View style={{ height: 100 }} />
      </ScrollView>

      <BottomTabNav />
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  header: {
    marginBottom: 24,
    gap: 8,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    marginTop: 8,
  },
  headerSubtitle: {
    fontSize: 15,
    color: '#9BA8BA',
    lineHeight: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7A8F',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  sectionLocked: {
    opacity: 0.7,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  metricCard: {
    flex: 1,
    backgroundColor: 'rgba(142, 137, 251, 0.08)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(142, 137, 251, 0.15)',
    alignItems: 'center',
    gap: 8,
  },
  metricCardLocked: {
    backgroundColor: 'rgba(107, 122, 143, 0.08)',
    borderColor: 'rgba(107, 122, 143, 0.15)',
  },
  metricIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  metricTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9BA8BA',
  },
  metricSubtitle: {
    fontSize: 11,
    color: '#6B7A8F',
  },
  textLocked: {
    color: '#6B7A8F',
  },
  scheduleStatus: {
    backgroundColor: 'rgba(107, 122, 143, 0.1)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(107, 122, 143, 0.2)',
  },
  scheduleStatusActive: {
    backgroundColor: 'rgba(90, 227, 140, 0.1)',
    borderColor: 'rgba(90, 227, 140, 0.3)',
  },
  scheduleStatusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  scheduleStatusTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7A8F',
  },
  scheduleStatusTitleActive: {
    color: '#5AE38C',
  },
  scheduleStatusText: {
    fontSize: 13,
    color: '#9BA8BA',
    lineHeight: 18,
  },
  streakCard: {
    backgroundColor: 'rgba(244, 162, 97, 0.1)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(244, 162, 97, 0.2)',
    position: 'relative',
  },
  cardLocked: {
    backgroundColor: 'rgba(107, 122, 143, 0.08)',
    borderColor: 'rgba(107, 122, 143, 0.15)',
  },
  streakHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  streakInfo: {
    flex: 1,
  },
  streakValue: {
    fontSize: 36,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  streakLabel: {
    fontSize: 14,
    color: '#9BA8BA',
    fontWeight: '500',
  },
  streakBest: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
  },
  streakBestText: {
    fontSize: 13,
    color: '#8E89FB',
    fontWeight: '500',
  },
  lockedBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(254, 207, 94, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  lockedBadgeText: {
    fontSize: 11,
    color: '#FECF5E',
    fontWeight: '600',
  },
  chartContainer: {
    backgroundColor: 'rgba(142, 137, 251, 0.08)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(142, 137, 251, 0.15)',
  },
  chartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  barsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 120,
  },
  barWrapper: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  barColumn: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    width: '100%',
  },
  bar: {
    width: '60%',
    backgroundColor: '#8E89FB',
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    minHeight: 4,
  },
  barLocked: {
    backgroundColor: '#6B7A8F',
    opacity: 0.5,
  },
  barLabel: {
    fontSize: 11,
    color: '#9BA8BA',
    marginTop: 4,
  },
  barValue: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  weeklyStats: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
  },
  weeklyStat: {
    flex: 1,
    alignItems: 'center',
  },
  weeklyStatValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  weeklyStatLabel: {
    fontSize: 11,
    color: '#9BA8BA',
  },
  weeklyStatDivider: {
    width: 1,
    backgroundColor: 'rgba(142, 137, 251, 0.2)',
    marginHorizontal: 8,
  },
  lockedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(11, 11, 11, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  lockedContent: {
    alignItems: 'center',
    paddingHorizontal: 40,
    gap: 16,
  },
  lockedTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  lockedDescription: {
    fontSize: 15,
    color: '#9BA8BA',
    textAlign: 'center',
    lineHeight: 22,
  },
  upgradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FECF5E',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 16,
    marginTop: 8,
  },
  upgradeButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
  },
  upgradeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: 'rgba(254, 207, 94, 0.1)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(254, 207, 94, 0.3)',
    marginBottom: 24,
  },
  upgradeBannerText: {
    flex: 1,
  },
  upgradeBannerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FECF5E',
    marginBottom: 4,
  },
  upgradeBannerSubtitle: {
    fontSize: 13,
    color: '#9BA8BA',
  },
});

