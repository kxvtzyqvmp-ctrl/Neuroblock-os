import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  X,
  Lightbulb,
  Volume2,
  Watch,
  Sparkles,
  Zap,
  Heart,
  Moon,
  Activity,
} from 'lucide-react-native';
import {
  getEnvironmentSettings,
  updateEnvironmentSettings,
  testFocusEnvironment,
  getWearableConnections,
  disconnectWearable,
  analyzeHealthTrends,
  suggestDetoxTime,
  EnvironmentSettings,
  WearableConnection,
  LIGHT_BRANDS,
  SPEAKER_BRANDS,
  SOUNDSCAPE_TYPES,
} from '@/lib/environment';

export default function EnvironmentScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<EnvironmentSettings | null>(null);
  const [wearables, setWearables] = useState<WearableConnection[]>([]);
  const [healthInsights, setHealthInsights] = useState<string[]>([]);
  const [suggestedTime, setSuggestedTime] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [envSettings, connections, insights, detoxTime] = await Promise.all([
        getEnvironmentSettings(),
        getWearableConnections(),
        analyzeHealthTrends(),
        suggestDetoxTime(),
      ]);

      setSettings(envSettings);
      setWearables(connections);
      setHealthInsights(insights);
      setSuggestedTime(detoxTime);
    } catch (error) {
      console.error('Error loading environment data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (key: keyof EnvironmentSettings, value: boolean) => {
    if (!settings) return;

    const updated = { ...settings, [key]: value };
    setSettings(updated);

    await updateEnvironmentSettings({ [key]: value });
  };

  const handleTestEnvironment = async () => {
    setTesting(true);
    await testFocusEnvironment();

    setTimeout(() => {
      setTesting(false);
      Alert.alert(
        'Test Complete',
        'Did you feel the haptic feedback and see any connected lights change?',
        [{ text: 'OK' }]
      );
    }, 3000);
  };

  const handleDisconnectWearable = async (connectionId: string) => {
    Alert.alert(
      'Disconnect Device?',
      'This will stop syncing detox data to your wearable.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: async () => {
            await disconnectWearable(connectionId);
            await loadData();
          },
        },
      ]
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
          <Sparkles color="#8E89FB" size={48} strokeWidth={1.5} />
          <Text style={styles.title}>Environment</Text>
          <Text style={styles.subtitle}>Multi-sensory focus support</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ambient Controls</Text>

          <View style={styles.card}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Lightbulb color="#FECF5E" size={20} strokeWidth={2} />
                <View style={styles.settingText}>
                  <Text style={styles.settingName}>Smart Lights</Text>
                  <Text style={styles.settingDescription}>
                    Change color during focus mode
                  </Text>
                </View>
              </View>
              <Switch
                value={settings?.smart_light_enabled ?? false}
                onValueChange={(value) => handleToggle('smart_light_enabled', value)}
                trackColor={{ false: '#2A3441', true: '#FECF5E' }}
                thumbColor="#E8EDF4"
              />
            </View>

            {settings?.smart_light_enabled && (
              <View style={styles.subSettings}>
                <Text style={styles.subLabel}>Light Brand</Text>
                <View style={styles.optionsGrid}>
                  {LIGHT_BRANDS.map((brand) => (
                    <TouchableOpacity
                      key={brand.value}
                      style={[
                        styles.optionChip,
                        settings?.light_brand === brand.value && styles.optionChipActive,
                      ]}
                      onPress={async () => {
                        await updateEnvironmentSettings({ light_brand: brand.value });
                        setSettings({ ...settings, light_brand: brand.value });
                      }}
                    >
                      <Text
                        style={[
                          styles.optionText,
                          settings?.light_brand === brand.value && styles.optionTextActive,
                        ]}
                      >
                        {brand.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <View style={styles.colorRow}>
                  <View style={styles.colorItem}>
                    <Text style={styles.colorLabel}>Focus</Text>
                    <View
                      style={[
                        styles.colorCircle,
                        { backgroundColor: settings?.focus_light_color },
                      ]}
                    />
                  </View>
                  <View style={styles.colorItem}>
                    <Text style={styles.colorLabel}>Rest</Text>
                    <View
                      style={[styles.colorCircle, { backgroundColor: settings?.rest_light_color }]}
                    />
                  </View>
                </View>
              </View>
            )}

            <View style={styles.divider} />

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Volume2 color="#7C9DD9" size={20} strokeWidth={2} />
                <View style={styles.settingText}>
                  <Text style={styles.settingName}>Soundscapes</Text>
                  <Text style={styles.settingDescription}>
                    Ambient audio for focus
                  </Text>
                </View>
              </View>
              <Switch
                value={settings?.soundscapes_enabled ?? false}
                onValueChange={(value) => handleToggle('soundscapes_enabled', value)}
                trackColor={{ false: '#2A3441', true: '#7C9DD9' }}
                thumbColor="#E8EDF4"
              />
            </View>

            {settings?.soundscapes_enabled && (
              <View style={styles.subSettings}>
                <Text style={styles.subLabel}>Sound Type</Text>
                <View style={styles.soundGrid}>
                  {SOUNDSCAPE_TYPES.map((type) => (
                    <TouchableOpacity
                      key={type.value}
                      style={[
                        styles.soundChip,
                        settings?.soundscape_type === type.value && styles.soundChipActive,
                      ]}
                      onPress={async () => {
                        await updateEnvironmentSettings({ soundscape_type: type.value });
                        setSettings({ ...settings, soundscape_type: type.value });
                      }}
                    >
                      <Text style={styles.soundIcon}>{type.icon}</Text>
                      <Text
                        style={[
                          styles.soundText,
                          settings?.soundscape_type === type.value && styles.soundTextActive,
                        ]}
                      >
                        {type.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            <View style={styles.divider} />

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Zap color="#8E89FB" size={20} strokeWidth={2} />
                <View style={styles.settingText}>
                  <Text style={styles.settingName}>Haptic Feedback</Text>
                  <Text style={styles.settingDescription}>
                    Gentle vibration cues
                  </Text>
                </View>
              </View>
              <Switch
                value={settings?.haptic_feedback_enabled ?? true}
                onValueChange={(value) => handleToggle('haptic_feedback_enabled', value)}
                trackColor={{ false: '#2A3441', true: '#8E89FB' }}
                thumbColor="#E8EDF4"
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Wearable Integration</Text>

          <View style={styles.card}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Watch color="#5AE38C" size={20} strokeWidth={2} />
                <View style={styles.settingText}>
                  <Text style={styles.settingName}>Sync to Wearable</Text>
                  <Text style={styles.settingDescription}>
                    Apple Watch, Fitbit, etc.
                  </Text>
                </View>
              </View>
              <Switch
                value={settings?.wearable_integration_enabled ?? false}
                onValueChange={(value) => handleToggle('wearable_integration_enabled', value)}
                trackColor={{ false: '#2A3441', true: '#5AE38C' }}
                thumbColor="#E8EDF4"
              />
            </View>

            {wearables.length > 0 && (
              <View style={styles.devicesList}>
                {wearables.map((device) => (
                  <View key={device.id} style={styles.deviceItem}>
                    <View style={styles.deviceInfo}>
                      <View style={styles.deviceDot} />
                      <Text style={styles.deviceName}>
                        {device.device_type.replace('_', ' ')}
                      </Text>
                      <View style={styles.deviceStatus}>
                        <Text style={styles.deviceStatusText}>{device.sync_status}</Text>
                      </View>
                    </View>
                    <TouchableOpacity onPress={() => handleDisconnectWearable(device.id)}>
                      <Text style={styles.disconnectText}>Disconnect</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>

        {healthInsights.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Heart color="#FF6B6B" size={20} strokeWidth={2} />
              <Text style={styles.sectionTitle}>Health Insights</Text>
            </View>

            <View style={styles.insightsCard}>
              {healthInsights.map((insight, index) => (
                <View key={index} style={styles.insightItem}>
                  <Activity color="#7C9DD9" size={16} strokeWidth={2} />
                  <Text style={styles.insightText}>{insight}</Text>
                </View>
              ))}

              {suggestedTime && (
                <View style={[styles.insightItem, styles.suggestionItem]}>
                  <Moon color="#8E89FB" size={16} strokeWidth={2} />
                  <Text style={styles.insightText}>
                    Based on your sleep, try starting detox at {suggestedTime}
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        <View style={styles.section}>
          <TouchableOpacity
            style={[styles.testButton, testing && styles.testButtonActive]}
            onPress={handleTestEnvironment}
            disabled={testing}
          >
            <Sparkles
              color={testing ? '#0A0E14' : '#8E89FB'}
              size={20}
              strokeWidth={2}
            />
            <Text style={[styles.testButtonText, testing && styles.testButtonTextActive]}>
              {testing ? 'Testing Environment...' : 'Test Focus Environment'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.privacyNote}>
          <Text style={styles.privacyText}>
            All integrations are local and optional.
          </Text>
          <Text style={styles.privacyText}>
            NeuroBlock OS never uploads health data.
          </Text>
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
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#E8EDF4',
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#161C26',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#2A3441',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  settingText: {
    flex: 1,
  },
  settingName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#E8EDF4',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 12,
    color: '#9BA8BA',
  },
  divider: {
    height: 1,
    backgroundColor: '#2A3441',
    marginVertical: 12,
  },
  subSettings: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#2A3441',
  },
  subLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9BA8BA',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionChip: {
    backgroundColor: '#0A0E14',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2A3441',
  },
  optionChipActive: {
    backgroundColor: 'rgba(254, 207, 94, 0.1)',
    borderColor: '#FECF5E',
  },
  optionText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#9BA8BA',
  },
  optionTextActive: {
    color: '#FECF5E',
  },
  colorRow: {
    flexDirection: 'row',
    gap: 20,
    marginTop: 16,
  },
  colorItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  colorLabel: {
    fontSize: 13,
    color: '#9BA8BA',
  },
  colorCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#2A3441',
  },
  soundGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  soundChip: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#0A0E14',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2A3441',
    alignItems: 'center',
    gap: 6,
  },
  soundChipActive: {
    backgroundColor: 'rgba(124, 157, 217, 0.1)',
    borderColor: '#7C9DD9',
  },
  soundIcon: {
    fontSize: 24,
  },
  soundText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#9BA8BA',
  },
  soundTextActive: {
    color: '#7C9DD9',
  },
  devicesList: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#2A3441',
    gap: 12,
  },
  deviceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#0A0E14',
    padding: 12,
    borderRadius: 8,
  },
  deviceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  deviceDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#5AE38C',
  },
  deviceName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#E8EDF4',
    textTransform: 'capitalize',
  },
  deviceStatus: {
    backgroundColor: 'rgba(90, 227, 140, 0.1)',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  deviceStatusText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#5AE38C',
    textTransform: 'uppercase',
  },
  disconnectText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FF6B6B',
  },
  insightsCard: {
    backgroundColor: '#161C26',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#2A3441',
    gap: 16,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  suggestionItem: {
    backgroundColor: 'rgba(142, 137, 251, 0.05)',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#8E89FB',
  },
  insightText: {
    flex: 1,
    fontSize: 14,
    color: '#E8EDF4',
    lineHeight: 20,
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: 'rgba(142, 137, 251, 0.1)',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#8E89FB',
  },
  testButtonActive: {
    backgroundColor: '#8E89FB',
  },
  testButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8E89FB',
  },
  testButtonTextActive: {
    color: '#0A0E14',
  },
  privacyNote: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    gap: 4,
  },
  privacyText: {
    fontSize: 12,
    color: '#6B7A8F',
    textAlign: 'center',
    lineHeight: 18,
  },
});
