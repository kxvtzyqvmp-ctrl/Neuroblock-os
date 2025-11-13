/**
 * Permissions Screen
 * Shows all required permissions with status and quick fixes
 */

import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Shield, Check, X, AlertCircle, ExternalLink, RefreshCw } from 'lucide-react-native';
import { permissionsManager, getMissingPermissions } from '@/lib/nativeServices';
import { PermissionStatus } from '@/types/models';
import FloatingNav from '@/components/FloatingNav';
import AuroraBackground from '@/components/shared/AuroraBackground';
import GlassCard from '@/components/shared/GlassCard';

export default function PermissionsScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [permissions, setPermissions] = useState<PermissionStatus | null>(null);
  const [missingPerms, setMissingPerms] = useState<Array<{ key: string; name: string; critical: boolean }>>([]);

  useEffect(() => {
    loadPermissions();
  }, []);

  const loadPermissions = async () => {
    try {
      const status = await permissionsManager.checkAllPermissions();
      const missing = await getMissingPermissions();
      setPermissions(status);
      setMissingPerms(missing);
    } catch (error) {
      console.error('Failed to load permissions', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadPermissions();
  };

  const handleRequestAll = async () => {
    setLoading(true);
    await permissionsManager.requestAllPermissions();
    await loadPermissions();
  };

  const getPermissionCards = () => {
    if (!permissions) return [];

    if (Platform.OS === 'ios') {
      return [
        {
          key: 'familyControls',
          name: 'Family Controls',
          description: 'Required to block apps and monitor screen time',
          critical: true,
          granted: permissions.ios.familyControls === 'granted',
          status: permissions.ios.familyControls,
        },
        {
          key: 'notifications',
          name: 'Notifications',
          description: 'Get reminders and daily insights',
          critical: false,
          granted: permissions.ios.notifications === 'granted',
          status: permissions.ios.notifications,
        },
      ];
    } else {
      return [
        {
          key: 'usageAccess',
          name: 'Usage Access',
          description: 'Track app usage time and sessions',
          critical: true,
          granted: permissions.android.usageAccess,
        },
        {
          key: 'accessibilityService',
          name: 'Accessibility Service',
          description: 'Detect foreground apps and block them',
          critical: true,
          granted: permissions.android.accessibilityService,
        },
        {
          key: 'drawOverApps',
          name: 'Display Over Other Apps',
          description: 'Show blocking overlays',
          critical: true,
          granted: permissions.android.drawOverApps,
        },
        {
          key: 'notificationListener',
          name: 'Notification Listener',
          description: 'Enhanced blocking detection',
          critical: false,
          granted: permissions.android.notificationListener,
        },
        {
          key: 'batteryOptimization',
          name: 'Battery Optimization',
          description: 'Keep blocking service running in background',
          critical: false,
          granted: permissions.android.batteryOptimization,
        },
      ];
    }
  };

  const allGranted = missingPerms.filter((p) => p.critical).length === 0;

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
          <Shield size={48} color="#fff" strokeWidth={1.5} />
          <Text style={styles.title}>Permissions</Text>
          <Text style={styles.subtitle}>Grant these permissions for full functionality</Text>
        </View>

        {/* Status Card */}
        {!loading && (
          <GlassCard style={styles.statusCard}>
            <View style={styles.statusHeader}>
              {allGranted ? (
                <View style={[styles.statusIcon, styles.statusIconSuccess]}>
                  <Check size={24} color="#10b981" />
                </View>
              ) : (
                <View style={[styles.statusIcon, styles.statusIconWarning]}>
                  <AlertCircle size={24} color="#f59e0b" />
                </View>
              )}
              <View style={styles.statusText}>
                <Text style={styles.statusTitle}>
                  {allGranted ? 'All Set!' : `${missingPerms.length} Missing`}
                </Text>
                <Text style={styles.statusSubtitle}>
                  {allGranted
                    ? 'All critical permissions granted'
                    : 'Some permissions are required for blocking'}
                </Text>
              </View>
            </View>
          </GlassCard>
        )}

        {/* Permission Cards */}
        <View style={styles.permissionsList}>
          {getPermissionCards().map((perm) => (
            <GlassCard key={perm.key} style={styles.permissionCard}>
              <View style={styles.permissionHeader}>
                <View style={styles.permissionLeft}>
                  <View
                    style={[
                      styles.permissionIcon,
                      perm.granted ? styles.permissionIconGranted : styles.permissionIconDenied,
                    ]}
                  >
                    {perm.granted ? <Check size={20} color="#10b981" /> : <X size={20} color="#ef4444" />}
                  </View>
                  <View style={styles.permissionInfo}>
                    <View style={styles.permissionTitleRow}>
                      <Text style={styles.permissionName}>{perm.name}</Text>
                      {perm.critical && <View style={styles.criticalBadge}>
                        <Text style={styles.criticalText}>Required</Text>
                      </View>}
                    </View>
                    <Text style={styles.permissionDescription}>{perm.description}</Text>
                  </View>
                </View>
              </View>

              {!perm.granted && (
                <TouchableOpacity style={styles.grantButton} onPress={handleRequestAll}>
                  <Text style={styles.grantButtonText}>Grant Permission</Text>
                  <ExternalLink size={16} color="#8B5CF6" />
                </TouchableOpacity>
              )}
            </GlassCard>
          ))}
        </View>

        {/* Help Text */}
        {!allGranted && (
          <View style={styles.helpSection}>
            <AlertCircle size={20} color="rgba(255,255,255,0.6)" />
            <Text style={styles.helpText}>
              {Platform.OS === 'ios'
                ? 'Family Controls permission is required to block apps. You can grant it in Settings.'
                : 'These permissions are required for blocking to work. Tap any card to grant access.'}
            </Text>
          </View>
        )}

        {/* Manufacturer Tips (Android only) */}
        {Platform.OS === 'android' && (
          <GlassCard style={styles.tipsCard}>
            <Text style={styles.tipsTitle}>Manufacturer Tips</Text>
            <Text style={styles.tipsText}>
              On some devices (Xiaomi, Huawei, Samsung, etc.), you may need to:{'\n\n'}
              • Enable "Autostart" in system settings{'\n'}
              • Disable battery optimization for this app{'\n'}
              • Lock app in recent apps to prevent killing{'\n'}
            </Text>
            <TouchableOpacity style={styles.tipsButton}>
              <Text style={styles.tipsButtonText}>View Detailed Guide</Text>
              <ExternalLink size={16} color="#8B5CF6" />
            </TouchableOpacity>
          </GlassCard>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Action Button */}
      {!allGranted && (
        <View style={styles.actionBar}>
          <TouchableOpacity style={styles.actionButton} onPress={handleRequestAll}>
            <Text style={styles.actionButtonText}>Grant All Permissions</Text>
          </TouchableOpacity>
        </View>
      )}

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
  statusCard: {
    padding: 20,
    marginBottom: 24,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  statusIconSuccess: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  statusIconWarning: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
  },
  statusText: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  statusSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
  },
  permissionsList: {
    gap: 16,
  },
  permissionCard: {
    padding: 20,
  },
  permissionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  permissionLeft: {
    flexDirection: 'row',
    flex: 1,
  },
  permissionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  permissionIconGranted: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  permissionIconDenied: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  permissionInfo: {
    flex: 1,
  },
  permissionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 8,
  },
  permissionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  criticalBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderRadius: 4,
  },
  criticalText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#ef4444',
    textTransform: 'uppercase',
  },
  permissionDescription: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    lineHeight: 20,
  },
  grantButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
    gap: 8,
  },
  grantButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8B5CF6',
  },
  helpSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    marginTop: 24,
    gap: 12,
  },
  helpText: {
    flex: 1,
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    lineHeight: 20,
  },
  tipsCard: {
    padding: 20,
    marginTop: 24,
  },
  tipsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 12,
  },
  tipsText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    lineHeight: 22,
    marginBottom: 16,
  },
  tipsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tipsButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8B5CF6',
  },
  bottomSpacer: {
    height: 100,
  },
  actionBar: {
    position: 'absolute',
    bottom: 80,
    left: 0,
    right: 0,
    padding: 20,
  },
  actionButton: {
    backgroundColor: '#8B5CF6',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
});
