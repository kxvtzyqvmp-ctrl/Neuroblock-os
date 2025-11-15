/**
 * Schedules Screen (Premium Only)
 * 
 * Allows premium users to create recurring focus schedules
 * like "9am–5pm weekdays" for automatic blocking.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Calendar, Plus, Clock, ChevronRight, Crown, Lock } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import AuroraBackground from '@/components/shared/AuroraBackground';
import BottomTabNav from '@/components/BottomTabNav';
import { useProStatus } from '@/hooks/useProStatus';

export default function SchedulesScreen() {
  const router = useRouter();
  const { hasPro } = useProStatus();
  const [schedules, setSchedules] = useState<any[]>([]);

  if (!hasPro) {
    return (
      <View style={styles.container}>
        <AuroraBackground />

        <View style={styles.lockedContainer}>
          <Lock color="#FECF5E" size={64} strokeWidth={1.5} />
          <Text style={styles.lockedTitle}>Premium Feature</Text>
          <Text style={styles.lockedDescription}>
            Recurring schedules are available for Premium users only.
            Upgrade to unlock unlimited blocking and custom schedules.
          </Text>
          <TouchableOpacity
            style={styles.upgradeButton}
            onPress={() => router.push('/paywall')}
          >
            <Crown color="#FFFFFF" size={20} strokeWidth={2} />
            <Text style={styles.upgradeButtonText}>Upgrade to Premium</Text>
          </TouchableOpacity>
        </View>

        <BottomTabNav />
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
      >
        <View style={styles.header}>
          <Calendar color="#8E89FB" size={32} strokeWidth={1.5} />
          <Text style={styles.headerTitle}>Schedules</Text>
          <Text style={styles.headerSubtitle}>
            Create recurring focus sessions that run automatically
          </Text>
        </View>

        {schedules.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Clock color="#6B7A8F" size={48} strokeWidth={1.5} />
            <Text style={styles.emptyTitle}>No Schedules Yet</Text>
            <Text style={styles.emptyDescription}>
              Create your first recurring schedule to automatically block apps
            </Text>
            <TouchableOpacity
              style={styles.createButton}
              onPress={() => {
                if (Platform.OS !== 'web') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                }
                Alert.alert('Coming Soon', 'Schedule creation will be available in the next update.');
              }}
            >
              <Plus color="#FFFFFF" size={20} strokeWidth={2.5} />
              <Text style={styles.createButtonText}>Create Schedule</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.schedulesList}>
            {schedules.map((schedule, index) => (
              <TouchableOpacity
                key={index}
                style={styles.scheduleCard}
                onPress={() => {
                  if (Platform.OS !== 'web') {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }
                }}
              >
                <View style={styles.scheduleIcon}>
                  <Clock color="#8E89FB" size={24} strokeWidth={2} />
                </View>
                <View style={styles.scheduleContent}>
                  <Text style={styles.scheduleName}>{schedule.name}</Text>
                  <Text style={styles.scheduleTime}>{schedule.time}</Text>
                </View>
                <ChevronRight color="#6B7A8F" size={20} strokeWidth={2} />
              </TouchableOpacity>
            ))}
          </View>
        )}
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  header: {
    marginBottom: 32,
    gap: 8,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#9BA8BA',
    lineHeight: 20,
  },
  lockedContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    gap: 24,
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
    marginTop: 16,
  },
  upgradeButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 16,
  },
  emptyDescription: {
    fontSize: 14,
    color: '#9BA8BA',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#8E89FB',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 16,
    marginTop: 16,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  schedulesList: {
    gap: 12,
  },
  scheduleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'rgba(142, 137, 251, 0.1)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(142, 137, 251, 0.2)',
    gap: 16,
  },
  scheduleIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(142, 137, 251, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scheduleContent: {
    flex: 1,
    gap: 4,
  },
  scheduleName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  scheduleTime: {
    fontSize: 14,
    color: '#9BA8BA',
  },
});

