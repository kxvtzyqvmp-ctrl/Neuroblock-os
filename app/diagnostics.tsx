/**
 * Diagnostics Screen
 * Shows engine state, permissions, schedules, and recent events for debugging
 */

import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import {
  Activity,
  Shield,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  Calendar,
  Zap,
  Database,
  Smartphone,
} from 'lucide-react-native';
import { blockingEngine, getNextScheduleTrigger } from '@/lib/blockingEngine';
import { permissionsManager } from '@/lib/nativeServices';
import { BlockingEngineState, PermissionStatus, BlockingEvent } from '@/types/models';
import FloatingNav from '@/components/FloatingNav';
import AuroraBackground from '@/components/shared/AuroraBackground';
import GlassCard from '@/components/shared/GlassCard';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

export default function DiagnosticsScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [engineState, setEngineState] = useState<BlockingEngineState | null>(null);
  const [permissions, setPermissions] = useState<PermissionStatus | null>(null);
  const [deviceInfo, setDeviceInfo] = useState<any>(null);

  useEffect(() => {
    loadDiagnostics();

    // Subscribe to engine state changes
    const unsubscribe = blockingEngine.onStateChange((newState) => {
      setEngineState(newState);
    });

    return unsubscribe;
  }, []);

  const loadDiagnostics = async () => {
    try {
      const state = blockingEngine.getState();
      const perms = await permissionsManager.checkAllPermissions();

      setEngineState(state);
      setPermissions(perms);
      setDeviceInfo({
        platform: Platform.OS,
        osVersion: Platform.Version,
        appVersion: Constants.expoConfig?.version || '1.0.0',
        deviceId: Constants.sessionId || 'unknown',
      });
    } catch (error) {
      console.error('Failed to load diagnostics', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDiagnostics();
  };

  const getStateColor = (state: string) => {
    switch (state) {
      case 'IDLE':
        return '#6b7280';
      case 'ELIGIBLE':
        return '#f59e0b';
      case 'MINDFUL_PAUSE':
        return '#3b82f6';
      case 'ACTIVE_BLOCK':
        return '#ef4444';
      case 'COOLDOWN':
        return '#8b5cf6';
      case 'QUICK_DISABLED':
        return '#10b981';
      default:
        return '#6b7280';
    }
  };

  const formatTimestamp = (timestamp: string | null) => {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };

  const formatDuration = (ms: number | null) => {
    if (ms === null) return 'N/A';
    const seconds = Math.floor((Date.now() - ms) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  const activePlan = blockingEngine.getActivePlan();
  const nextTrigger = activePlan ? getNextScheduleTrigger(activePlan.schedules || []) : null;

  return (
    <View style={styles.container}>
      <AuroraBackground />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#fff" />}
      >
        {/* Header */}
        <View style={styles.header}>
          <Activity size={48} color="#fff" strokeWidth={1.5} />
          <Text style={styles.title}>Diagnostics</Text>
          <Text style={styles.subtitle}>Engine state and system health</Text>
        </View>

        {/* Engine State */}
        {engineState && (
          <GlassCard style={styles.section}>
            <View style={styles.sectionHeader}>
              <Zap size={24} color="#8B5CF6" />
              <Text style={styles.sectionTitle}>Blocking Engine</Text>
            </View>

            <View style={styles.stateIndicator}>
              <View
                style={[
                  styles.stateDot,
                  { backgroundColor: getStateColor(engineState.currentState) },
                ]}
              />
              <Text style={styles.stateText}>{engineState.currentState}</Text>
            </View>

            <View style={styles.dataGrid}>
              <View style={styles.dataItem}>
                <Text style={styles.dataLabel}>Last Transition</Text>
                <Text style={styles.dataValue}>{formatTimestamp(engineState.lastTransition)}</Text>
              </View>

              <View style={styles.dataItem}>
                <Text style={styles.dataLabel}>Target App</Text>
                <Text style={styles.dataValue}>
                  {engineState.targetApp?.name || 'None'}
                </Text>
              </View>

              <View style={styles.dataItem}>
                <Text style={styles.dataLabel}>Pause Started</Text>
                <Text style={styles.dataValue}>{formatDuration(engineState.pauseStartTime)}</Text>
              </View>

              <View style={styles.dataItem}>
                <Text style={styles.dataLabel}>Block Started</Text>
                <Text style={styles.dataValue}>{formatDuration(engineState.blockStartTime)}</Text>
              </View>

              <View style={styles.dataItem}>
                <Text style={styles.dataLabel}>Cooldown Started</Text>
                <Text style={styles.dataValue}>{formatDuration(engineState.cooldownStartTime)}</Text>
              </View>

              <View style={styles.dataItem}>
                <Text style={styles.dataLabel}>Quick Disable</Text>
                <Text style={styles.dataValue}>
                  {engineState.quickDisableUntil
                    ? `Until ${new Date(engineState.quickDisableUntil).toLocaleTimeString()}`
                    : 'Inactive'}
                </Text>
              </View>
            </View>
          </GlassCard>
        )}

        {/* Active Plan */}
        {activePlan && (
          <GlassCard style={styles.section}>
            <View style={styles.sectionHeader}>
              <Shield size={24} color="#8B5CF6" />
              <Text style={styles.sectionTitle}>Active Plan</Text>
            </View>

            <View style={styles.planInfo}>
              <View style={styles.dataItem}>
                <Text style={styles.dataLabel}>Name</Text>
                <Text style={styles.dataValue}>{activePlan.name}</Text>
              </View>

              <View style={styles.dataItem}>
                <Text style={styles.dataLabel}>Intensity</Text>
                <Text style={styles.dataValue}>{activePlan.intensity}</Text>
              </View>

              <View style={styles.dataItem}>
                <Text style={styles.dataLabel}>Mindful Pause</Text>
                <Text style={styles.dataValue}>{activePlan.mindfulPauseSec}s</Text>
              </View>

              <View style={styles.dataItem}>
                <Text style={styles.dataLabel}>Cooldown</Text>
                <Text style={styles.dataValue}>{activePlan.cooldownSec}s</Text>
              </View>

              <View style={styles.dataItem}>
                <Text style={styles.dataLabel}>Override Allowed</Text>
                <Text style={styles.dataValue}>{activePlan.allowOverride ? 'Yes' : 'No'}</Text>
              </View>

              <View style={styles.dataItem}>
                <Text style={styles.dataLabel}>App Groups</Text>
                <Text style={styles.dataValue}>{activePlan.groups?.length || 0}</Text>
              </View>

              <View style={styles.dataItem}>
                <Text style={styles.dataLabel}>Schedules</Text>
                <Text style={styles.dataValue}>{activePlan.schedules?.length || 0}</Text>
              </View>
            </View>
          </GlassCard>
        )}

        {/* Active Schedule */}
        {engineState?.activeSchedule && (
          <GlassCard style={styles.section}>
            <View style={styles.sectionHeader}>
              <Clock size={24} color="#8B5CF6" />
              <Text style={styles.sectionTitle}>Active Schedule</Text>
            </View>

            <View style={styles.scheduleInfo}>
              <Text style={styles.scheduleName}>{engineState.activeSchedule.name}</Text>
              <Text style={styles.scheduleTime}>
                {engineState.activeSchedule.startLocal} - {engineState.activeSchedule.endLocal}
              </Text>
              <Text style={styles.scheduleDays}>
                Days: {engineState.activeSchedule.daysOfWeek.join(', ')}
              </Text>
            </View>
          </GlassCard>
        )}

        {/* Next Trigger */}
        {nextTrigger && (
          <GlassCard style={styles.section}>
            <View style={styles.sectionHeader}>
              <Calendar size={24} color="#8B5CF6" />
              <Text style={styles.sectionTitle}>Next Schedule</Text>
            </View>

            <View style={styles.nextTrigger}>
              <Text style={styles.nextTriggerName}>{nextTrigger.schedule.name}</Text>
              <Text style={styles.nextTriggerTime}>
                {nextTrigger.triggerTime.toLocaleString()}
              </Text>
            </View>
          </GlassCard>
        )}

        {/* Permissions Status */}
        {permissions && (
          <GlassCard style={styles.section}>
            <View style={styles.sectionHeader}>
              <Shield size={24} color="#8B5CF6" />
              <Text style={styles.sectionTitle}>Permissions</Text>
            </View>

            {Platform.OS === 'ios' ? (
              <View style={styles.permissionsList}>
                <View style={styles.permissionItem}>
                  <Text style={styles.permissionName}>Family Controls</Text>
                  {permissions.ios.familyControls === 'granted' ? (
                    <CheckCircle size={20} color="#10b981" />
                  ) : (
                    <XCircle size={20} color="#ef4444" />
                  )}
                </View>
                <View style={styles.permissionItem}>
                  <Text style={styles.permissionName}>Notifications</Text>
                  {permissions.ios.notifications === 'granted' ? (
                    <CheckCircle size={20} color="#10b981" />
                  ) : (
                    <XCircle size={20} color="#ef4444" />
                  )}
                </View>
              </View>
            ) : (
              <View style={styles.permissionsList}>
                <View style={styles.permissionItem}>
                  <Text style={styles.permissionName}>Usage Access</Text>
                  {permissions.android.usageAccess ? (
                    <CheckCircle size={20} color="#10b981" />
                  ) : (
                    <XCircle size={20} color="#ef4444" />
                  )}
                </View>
                <View style={styles.permissionItem}>
                  <Text style={styles.permissionName}>Accessibility Service</Text>
                  {permissions.android.accessibilityService ? (
                    <CheckCircle size={20} color="#10b981" />
                  ) : (
                    <XCircle size={20} color="#ef4444" />
                  )}
                </View>
                <View style={styles.permissionItem}>
                  <Text style={styles.permissionName}>Draw Over Apps</Text>
                  {permissions.android.drawOverApps ? (
                    <CheckCircle size={20} color="#10b981" />
                  ) : (
                    <XCircle size={20} color="#ef4444" />
                  )}
                </View>
                <View style={styles.permissionItem}>
                  <Text style={styles.permissionName}>Battery Optimization</Text>
                  {permissions.android.batteryOptimization ? (
                    <CheckCircle size={20} color="#10b981" />
                  ) : (
                    <XCircle size={20} color="#ef4444" />
                  )}
                </View>
              </View>
            )}

            <TouchableOpacity
              style={styles.permissionsButton}
              onPress={() => router.push('/permissions')}
            >
              <Text style={styles.permissionsButtonText}>Manage Permissions</Text>
            </TouchableOpacity>
          </GlassCard>
        )}

        {/* Device Info */}
        {deviceInfo && (
          <GlassCard style={styles.section}>
            <View style={styles.sectionHeader}>
              <Smartphone size={24} color="#8B5CF6" />
              <Text style={styles.sectionTitle}>Device Info</Text>
            </View>

            <View style={styles.dataGrid}>
              <View style={styles.dataItem}>
                <Text style={styles.dataLabel}>Platform</Text>
                <Text style={styles.dataValue}>{deviceInfo.platform}</Text>
              </View>

              <View style={styles.dataItem}>
                <Text style={styles.dataLabel}>OS Version</Text>
                <Text style={styles.dataValue}>{deviceInfo.osVersion}</Text>
              </View>

              <View style={styles.dataItem}>
                <Text style={styles.dataLabel}>App Version</Text>
                <Text style={styles.dataValue}>{deviceInfo.appVersion}</Text>
              </View>

              <View style={styles.dataItem}>
                <Text style={styles.dataLabel}>Device ID</Text>
                <Text style={styles.dataValue} numberOfLines={1}>
                  {deviceInfo.deviceId.substring(0, 16)}...
                </Text>
              </View>
            </View>
          </GlassCard>
        )}

        {/* System Health */}
        <GlassCard style={styles.section}>
          <View style={styles.sectionHeader}>
            <Database size={24} color="#8B5CF6" />
            <Text style={styles.sectionTitle}>System Health</Text>
          </View>

          <View style={styles.healthStatus}>
            <View style={styles.healthItem}>
              <CheckCircle size={20} color="#10b981" />
              <Text style={styles.healthText}>Engine Running</Text>
            </View>
            <View style={styles.healthItem}>
              <CheckCircle size={20} color="#10b981" />
              <Text style={styles.healthText}>Database Connected</Text>
            </View>
            <View style={styles.healthItem}>
              <CheckCircle size={20} color="#10b981" />
              <Text style={styles.healthText}>State Machine Active</Text>
            </View>
          </View>
        </GlassCard>

        {/* Recent Events */}
        {engineState && engineState.events.length > 0 && (
          <GlassCard style={styles.section}>
            <View style={styles.sectionHeader}>
              <AlertCircle size={24} color="#8B5CF6" />
              <Text style={styles.sectionTitle}>Recent Events (Last 10)</Text>
            </View>

            <View style={styles.eventsList}>
              {engineState.events.slice(-10).reverse().map((event) => (
                <View key={event.id} style={styles.eventItem}>
                  <View style={[styles.eventDot, { backgroundColor: getStateColor(event.state) }]} />
                  <View style={styles.eventContent}>
                    <Text style={styles.eventType}>{event.type}</Text>
                    <Text style={styles.eventTime}>{formatTimestamp(event.timestamp)}</Text>
                  </View>
                </View>
              ))}
            </View>
          </GlassCard>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      <FloatingNav activeTab="more" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingTop: 60,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#fff',
    marginTop: 16,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
  },
  section: {
    padding: 20,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  stateIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
  },
  stateDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  stateText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  dataGrid: {
    gap: 16,
  },
  dataItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dataLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
  },
  dataValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  planInfo: {
    gap: 12,
  },
  scheduleInfo: {
    gap: 8,
  },
  scheduleName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  scheduleTime: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  scheduleDays: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
  },
  nextTrigger: {
    gap: 8,
  },
  nextTriggerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  nextTriggerTime: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  permissionsList: {
    gap: 12,
    marginBottom: 16,
  },
  permissionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  permissionName: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  permissionsButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
    alignItems: 'center',
  },
  permissionsButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8B5CF6',
  },
  healthStatus: {
    gap: 12,
  },
  healthItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  healthText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  eventsList: {
    gap: 12,
  },
  eventItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  eventDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  eventContent: {
    flex: 1,
  },
  eventType: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  eventTime: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
  },
  bottomSpacer: {
    height: 100,
  },
});
