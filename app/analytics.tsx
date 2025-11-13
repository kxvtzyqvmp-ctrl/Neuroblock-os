import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { X, TrendingUp, Award, BarChart3, RefreshCw } from 'lucide-react-native';
import {
  calculateWeeklyAnalytics,
  generateWeeklyReport,
  getMoodTrends,
  getAppUsageBreakdown,
  checkMilestones,
  WeeklyAnalytics,
  WeeklyReport,
} from '@/lib/analytics';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CHART_WIDTH = SCREEN_WIDTH - 48;

export default function AnalyticsScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [analytics, setAnalytics] = useState<WeeklyAnalytics | null>(null);
  const [report, setReport] = useState<WeeklyReport | null>(null);
  const [moodTrends, setMoodTrends] = useState<any[]>([]);
  const [appUsage, setAppUsage] = useState<{ app: string; percentage: number }[]>([]);
  const [milestones, setMilestones] = useState<string[]>([]);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const [analyticsData, reportData, moods, usage, milestonesData] = await Promise.all([
        calculateWeeklyAnalytics(),
        generateWeeklyReport(),
        getMoodTrends(7),
        getAppUsageBreakdown(),
        checkMilestones(),
      ]);

      setAnalytics(analyticsData);
      setReport(reportData);
      setMoodTrends(moods);
      setAppUsage(usage);
      setMilestones(milestonesData);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadAnalytics();
  };

  const getDayName = (index: number) => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days[index];
  };

  const renderFocusChart = () => {
    if (!analytics) return null;

    const maxHours = Math.max(...analytics.weeklyFocusHours, 1);

    return (
      <View style={styles.chartContainer}>
        <View style={styles.chartHeader}>
          <BarChart3 color="#7C9DD9" size={20} strokeWidth={2} />
          <Text style={styles.chartTitle}>Weekly Focus Time</Text>
        </View>

        <View style={styles.chart}>
          <View style={styles.barsContainer}>
            {analytics.weeklyFocusHours.map((hours, index) => {
              const height = (hours / maxHours) * 120;
              return (
                <View key={index} style={styles.barWrapper}>
                  <View style={styles.barColumn}>
                    <View style={[styles.bar, { height: Math.max(height, 4) }]} />
                  </View>
                  <Text style={styles.barLabel}>{getDayName(index)}</Text>
                  <Text style={styles.barValue}>{hours.toFixed(1)}h</Text>
                </View>
              );
            })}
          </View>
        </View>

        <View style={styles.chartSummary}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Total</Text>
            <Text style={styles.summaryValue}>
              {analytics.weeklyFocusHours.reduce((sum, h) => sum + h, 0).toFixed(1)}h
            </Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Daily Avg</Text>
            <Text style={styles.summaryValue}>
              {(analytics.weeklyFocusHours.reduce((sum, h) => sum + h, 0) / 7).toFixed(1)}h
            </Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Best Day</Text>
            <Text style={styles.summaryValue}>
              {getDayName(analytics.weeklyFocusHours.indexOf(Math.max(...analytics.weeklyFocusHours)))}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const renderMoodTrends = () => {
    if (moodTrends.length === 0) return null;

    return (
      <View style={styles.chartContainer}>
        <View style={styles.chartHeader}>
          <Text style={styles.chartTitle}>Mood & Focus Correlation</Text>
        </View>

        <View style={styles.moodGrid}>
          {moodTrends.map((mood, index) => (
            <View key={index} style={styles.moodItem}>
              <Text style={styles.moodEmoji}>{mood.mood_emoji}</Text>
              <Text style={styles.moodDay}>
                {new Date(mood.date).toLocaleDateString('en', { weekday: 'short' })}
              </Text>
              <Text style={styles.moodFocus}>{(mood.focus_time_minutes / 60).toFixed(1)}h</Text>
            </View>
          ))}
        </View>

        <View style={styles.insightBox}>
          <Text style={styles.insightText}>
            Your best mood days tend to align with higher focus time. Keep the momentum going!
          </Text>
        </View>
      </View>
    );
  };

  const renderAppUsage = () => {
    if (appUsage.length === 0) return null;

    const colors = ['#8E89FB', '#7C9DD9', '#5AE38C', '#FECF5E', '#FF6B6B'];

    return (
      <View style={styles.chartContainer}>
        <View style={styles.chartHeader}>
          <Text style={styles.chartTitle}>Blocked Apps</Text>
        </View>

        <View style={styles.appList}>
          {appUsage.slice(0, 5).map((item, index) => (
            <View key={index} style={styles.appItem}>
              <View style={styles.appInfo}>
                <View style={[styles.appDot, { backgroundColor: colors[index] }]} />
                <Text style={styles.appName}>{item.app}</Text>
              </View>
              <View style={styles.appBar}>
                <View
                  style={[
                    styles.appBarFill,
                    { width: `${item.percentage}%`, backgroundColor: colors[index] },
                  ]}
                />
              </View>
            </View>
          ))}
        </View>

        {appUsage.length > 0 && (
          <Text style={styles.appNote}>
            Most blocked: {appUsage[0].app} · Staying mindful of your triggers
          </Text>
        )}
      </View>
    );
  };

  const renderMilestones = () => {
    if (milestones.length === 0) return null;

    return (
      <View style={styles.milestonesContainer}>
        <View style={styles.chartHeader}>
          <Award color="#5AE38C" size={20} strokeWidth={2} />
          <Text style={styles.chartTitle}>Milestones Reached</Text>
        </View>

        <View style={styles.milestonesGrid}>
          {milestones.map((milestone, index) => (
            <View key={index} style={styles.milestoneChip}>
              <Text style={styles.milestoneText}>{milestone}</Text>
            </View>
          ))}
        </View>
      </View>
    );
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
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
          <X color="#9BA8BA" size={24} strokeWidth={2} />
        </TouchableOpacity>

        <View style={styles.header}>
          <TrendingUp color="#7C9DD9" size={48} strokeWidth={1.5} />
          <Text style={styles.title}>Your Progress</Text>
          <Text style={styles.subtitle}>Weekly insights and analytics</Text>
        </View>

        <TouchableOpacity
          style={styles.refreshButton}
          onPress={handleRefresh}
          disabled={refreshing}
        >
          <RefreshCw
            color="#7C9DD9"
            size={18}
            strokeWidth={2}
            style={refreshing ? styles.spinning : {}}
          />
          <Text style={styles.refreshText}>
            {refreshing ? 'Refreshing...' : 'Refresh Data'}
          </Text>
        </TouchableOpacity>

        {report && (
          <View style={styles.reportCard}>
            <Text style={styles.reportTitle}>This Week's Reflection</Text>
            <Text style={styles.reportText}>{report.summary_text}</Text>

            {analytics && (
              <View style={styles.statsRow}>
                <View style={styles.statBox}>
                  <Text style={styles.statValue}>{analytics.totalTimeSavedHours}h</Text>
                  <Text style={styles.statLabel}>Time Saved</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statValue}>{analytics.streakDays}</Text>
                  <Text style={styles.statLabel}>Day Streak</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={[styles.statValue, { fontSize: 24 }]}>{analytics.avgMood}</Text>
                  <Text style={styles.statLabel}>Mood</Text>
                </View>
              </View>
            )}
          </View>
        )}

        {renderFocusChart()}
        {renderMoodTrends()}
        {renderAppUsage()}
        {renderMilestones()}

        <View style={styles.privacyNote}>
          <Text style={styles.privacyText}>Your data belongs to you. Always.</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0E14',
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
    paddingBottom: 16,
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
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: 24,
    marginBottom: 24,
    paddingVertical: 12,
    backgroundColor: '#161C26',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2A3441',
  },
  refreshText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7C9DD9',
  },
  spinning: {
    transform: [{ rotate: '45deg' }],
  },
  reportCard: {
    backgroundColor: '#161C26',
    borderRadius: 16,
    padding: 24,
    marginHorizontal: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#2A3441',
    borderLeftWidth: 4,
    borderLeftColor: '#5AE38C',
  },
  reportTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#5AE38C',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  reportText: {
    fontSize: 16,
    color: '#E8EDF4',
    lineHeight: 24,
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#0A0E14',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#7C9DD9',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: '#9BA8BA',
    textAlign: 'center',
  },
  chartContainer: {
    backgroundColor: '#161C26',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#2A3441',
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
    color: '#E8EDF4',
  },
  chart: {
    marginBottom: 16,
  },
  barsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 140,
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
    width: '70%',
    backgroundColor: '#7C9DD9',
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  barLabel: {
    fontSize: 11,
    color: '#9BA8BA',
    marginTop: 4,
  },
  barValue: {
    fontSize: 10,
    fontWeight: '600',
    color: '#E8EDF4',
  },
  chartSummary: {
    flexDirection: 'row',
    backgroundColor: '#0A0E14',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 11,
    color: '#9BA8BA',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#E8EDF4',
  },
  moodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  moodItem: {
    flex: 1,
    minWidth: 60,
    backgroundColor: '#0A0E14',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  moodEmoji: {
    fontSize: 28,
    marginBottom: 4,
  },
  moodDay: {
    fontSize: 11,
    color: '#9BA8BA',
    marginBottom: 2,
  },
  moodFocus: {
    fontSize: 12,
    fontWeight: '600',
    color: '#7C9DD9',
  },
  insightBox: {
    backgroundColor: '#0A0E14',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#8E89FB',
  },
  insightText: {
    fontSize: 13,
    color: '#E8EDF4',
    lineHeight: 18,
  },
  appList: {
    gap: 16,
  },
  appItem: {
    gap: 8,
  },
  appInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  appDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  appName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#E8EDF4',
  },
  appBar: {
    height: 8,
    backgroundColor: '#0A0E14',
    borderRadius: 4,
    overflow: 'hidden',
  },
  appBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  appNote: {
    fontSize: 12,
    color: '#9BA8BA',
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 18,
  },
  milestonesContainer: {
    backgroundColor: '#161C26',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#2A3441',
  },
  milestonesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  milestoneChip: {
    backgroundColor: 'rgba(90, 227, 140, 0.1)',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#5AE38C',
  },
  milestoneText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#5AE38C',
  },
  privacyNote: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    alignItems: 'center',
  },
  privacyText: {
    fontSize: 13,
    color: '#6B7A8F',
    textAlign: 'center',
  },
});
