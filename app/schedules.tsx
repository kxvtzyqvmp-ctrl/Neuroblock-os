/**
 * Schedules Screen (Premium Only)
 * 
 * Allows premium users to create and manage recurring focus schedules
 * like "9am–5pm weekdays" for automatic blocking.
 * 
 * Features:
 * - Create/edit/delete schedules
 * - Set time ranges and days
 * - Toggle schedules on/off
 * - View active schedule status
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Alert,
  Modal,
  TextInput,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Calendar,
  Plus,
  Clock,
  ChevronRight,
  Crown,
  Lock,
  X,
  Trash2,
  Play,
  Pause,
  Check,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import DateTimePicker from '@react-native-community/datetimepicker';
import AuroraBackground from '@/components/shared/AuroraBackground';
import BottomTabNav from '@/components/BottomTabNav';
import { useProStatus } from '@/hooks/useProStatus';
import {
  getAllSchedules,
  createSchedule,
  updateSchedule,
  deleteSchedule,
  toggleScheduleActive,
  formatScheduleTime,
  formatScheduleDays,
  isWithinSchedule,
  Schedule,
  ScheduleFormData,
} from '@/lib/scheduleStorage';

const DAYS_OF_WEEK = [
  { id: 0, short: 'S', name: 'Sunday' },
  { id: 1, short: 'M', name: 'Monday' },
  { id: 2, short: 'T', name: 'Tuesday' },
  { id: 3, short: 'W', name: 'Wednesday' },
  { id: 4, short: 'T', name: 'Thursday' },
  { id: 5, short: 'F', name: 'Friday' },
  { id: 6, short: 'S', name: 'Saturday' },
];

// Schedule Form Modal
function ScheduleFormModal({
  visible,
  schedule,
  onClose,
  onSave,
}: {
  visible: boolean;
  schedule: Schedule | null;
  onClose: () => void;
  onSave: (data: ScheduleFormData) => void;
}) {
  const [name, setName] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 2, 3, 4, 5]); // Weekdays
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  useEffect(() => {
    if (schedule) {
      setName(schedule.name);
      setStartTime(schedule.startTime);
      setEndTime(schedule.endTime);
      setSelectedDays(schedule.daysOfWeek);
    } else {
      setName('');
      setStartTime('09:00');
      setEndTime('17:00');
      setSelectedDays([1, 2, 3, 4, 5]);
    }
  }, [schedule, visible]);

  const toggleDay = (dayId: number) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSelectedDays(prev => {
      if (prev.includes(dayId)) {
        return prev.filter(d => d !== dayId);
      }
      return [...prev, dayId];
    });
  };

  const formatTimeForDisplay = (time: string): string => {
    const [hour, minute] = time.split(':').map(Number);
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`;
  };

  const handleTimeChange = (type: 'start' | 'end', event: any, date?: Date) => {
    if (Platform.OS === 'android') {
      setShowStartPicker(false);
      setShowEndPicker(false);
    }

    if (date) {
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      const timeString = `${hours}:${minutes}`;

      if (type === 'start') {
        setStartTime(timeString);
      } else {
        setEndTime(timeString);
      }
    }
  };

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a schedule name');
      return;
    }

    if (selectedDays.length === 0) {
      Alert.alert('Error', 'Please select at least one day');
      return;
    }

    onSave({
      name: name.trim(),
      blockedApps: schedule?.blockedApps || [],
      startTime,
      endTime,
      daysOfWeek: selectedDays,
    });
  };

  const parseTime = (time: string): Date => {
    const [hours, minutes] = time.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose} style={styles.modalCloseButton}>
            <X color="#9BA8BA" size={24} strokeWidth={2} />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>
            {schedule ? 'Edit Schedule' : 'New Schedule'}
          </Text>
          <TouchableOpacity onPress={handleSave} style={styles.modalSaveButton}>
            <Check color="#5AE38C" size={24} strokeWidth={2} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
          {/* Name Input */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Schedule Name</Text>
            <TextInput
              style={styles.textInput}
              value={name}
              onChangeText={setName}
              placeholder="e.g., Work Hours, Evening Focus"
              placeholderTextColor="#6B7A8F"
              autoCapitalize="words"
            />
          </View>

          {/* Time Selection */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Time Range</Text>
            <View style={styles.timeRow}>
              <TouchableOpacity
                style={styles.timeButton}
                onPress={() => setShowStartPicker(true)}
              >
                <Clock color="#7C9DD9" size={18} strokeWidth={2} />
                <Text style={styles.timeButtonText}>
                  {formatTimeForDisplay(startTime)}
                </Text>
              </TouchableOpacity>
              <Text style={styles.timeToText}>to</Text>
              <TouchableOpacity
                style={styles.timeButton}
                onPress={() => setShowEndPicker(true)}
              >
                <Clock color="#7C9DD9" size={18} strokeWidth={2} />
                <Text style={styles.timeButtonText}>
                  {formatTimeForDisplay(endTime)}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Day Selection */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Repeat On</Text>
            <View style={styles.daysRow}>
              {DAYS_OF_WEEK.map(day => {
                const isSelected = selectedDays.includes(day.id);
                return (
                  <TouchableOpacity
                    key={day.id}
                    style={[styles.dayButton, isSelected && styles.dayButtonSelected]}
                    onPress={() => toggleDay(day.id)}
                  >
                    <Text style={[styles.dayButtonText, isSelected && styles.dayButtonTextSelected]}>
                      {day.short}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <View style={styles.quickDays}>
              <TouchableOpacity
                style={styles.quickDayButton}
                onPress={() => setSelectedDays([1, 2, 3, 4, 5])}
              >
                <Text style={styles.quickDayText}>Weekdays</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.quickDayButton}
                onPress={() => setSelectedDays([0, 6])}
              >
                <Text style={styles.quickDayText}>Weekends</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.quickDayButton}
                onPress={() => setSelectedDays([0, 1, 2, 3, 4, 5, 6])}
              >
                <Text style={styles.quickDayText}>Every Day</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Info */}
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              When this schedule is active, your selected apps will be blocked during the specified time.
            </Text>
          </View>
        </ScrollView>

        {/* Time Pickers */}
        {showStartPicker && (
          <DateTimePicker
            value={parseTime(startTime)}
            mode="time"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(e, d) => handleTimeChange('start', e, d)}
            themeVariant="dark"
          />
        )}
        {showEndPicker && (
          <DateTimePicker
            value={parseTime(endTime)}
            mode="time"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(e, d) => handleTimeChange('end', e, d)}
            themeVariant="dark"
          />
        )}
      </View>
    </Modal>
  );
}

export default function SchedulesScreen() {
  const router = useRouter();
  const { hasPro, isLoading: proLoading } = useProStatus();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);

  const loadSchedules = useCallback(async () => {
    try {
      const data = await getAllSchedules();
      setSchedules(data);
    } catch (error) {
      console.error('[Schedules] Error loading schedules:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSchedules();
  }, [loadSchedules]);

  const handleCreateSchedule = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setEditingSchedule(null);
    setShowModal(true);
  };

  const handleEditSchedule = (schedule: Schedule) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setEditingSchedule(schedule);
    setShowModal(true);
  };

  const handleSaveSchedule = async (data: ScheduleFormData) => {
    try {
      if (editingSchedule) {
        await updateSchedule(editingSchedule.id, data);
      } else {
        await createSchedule(data);
      }
      
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      
      setShowModal(false);
      loadSchedules();
    } catch (error) {
      console.error('[Schedules] Error saving schedule:', error);
      Alert.alert('Error', 'Failed to save schedule. Please try again.');
    }
  };

  const handleDeleteSchedule = (schedule: Schedule) => {
    Alert.alert(
      'Delete Schedule',
      `Are you sure you want to delete "${schedule.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteSchedule(schedule.id);
            if (Platform.OS !== 'web') {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
            loadSchedules();
          },
        },
      ]
    );
  };

  const handleToggleSchedule = async (schedule: Schedule) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    
    await toggleScheduleActive(schedule.id);
    loadSchedules();
  };

  if (proLoading || isLoading) {
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

  // Premium lock screen
  if (!hasPro) {
    return (
      <View style={styles.container}>
        <AuroraBackground />

        <View style={styles.lockedContainer}>
          <Lock color="#FECF5E" size={64} strokeWidth={1.5} />
          <Text style={styles.lockedTitle}>Premium Feature</Text>
          <Text style={styles.lockedDescription}>
            Recurring schedules let you automatically block apps at specific times.
            Perfect for work hours, study sessions, or evening wind-down.
          </Text>
          <TouchableOpacity
            style={styles.upgradeButton}
            onPress={() => router.push('/paywall')}
          >
            <Crown color="#000000" size={20} strokeWidth={2} />
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
              Create your first recurring schedule to automatically block apps at specific times
            </Text>
            <TouchableOpacity
              style={styles.createButton}
              onPress={handleCreateSchedule}
            >
              <Plus color="#FFFFFF" size={20} strokeWidth={2.5} />
              <Text style={styles.createButtonText}>Create Schedule</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.schedulesList}>
              {schedules.map(schedule => {
                const isCurrentlyActive = schedule.isActive && isWithinSchedule(schedule);
                
                return (
                  <TouchableOpacity
                    key={schedule.id}
                    style={[
                      styles.scheduleCard,
                      schedule.isActive && styles.scheduleCardActive,
                    ]}
                    onPress={() => handleEditSchedule(schedule)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.scheduleMain}>
                      <View style={[
                        styles.scheduleIcon,
                        schedule.isActive && styles.scheduleIconActive,
                      ]}>
                        {isCurrentlyActive ? (
                          <Play color="#5AE38C" size={20} strokeWidth={2} fill="#5AE38C" />
                        ) : (
                          <Clock color={schedule.isActive ? '#5AE38C' : '#8E89FB'} size={20} strokeWidth={2} />
                        )}
                      </View>
                      <View style={styles.scheduleContent}>
                        <Text style={styles.scheduleName}>{schedule.name}</Text>
                        <Text style={styles.scheduleTime}>
                          {formatScheduleTime(schedule)}
                        </Text>
                        <Text style={styles.scheduleDays}>
                          {formatScheduleDays(schedule.daysOfWeek)}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.scheduleActions}>
                      <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={() => handleDeleteSchedule(schedule)}
                      >
                        <Trash2 color="#F87171" size={18} strokeWidth={2} />
                      </TouchableOpacity>
                      <Switch
                        value={schedule.isActive}
                        onValueChange={() => handleToggleSchedule(schedule)}
                        trackColor={{ false: '#3A3A3C', true: '#5AE38C40' }}
                        thumbColor={schedule.isActive ? '#5AE38C' : '#6B7A8F'}
                      />
                    </View>

                    {isCurrentlyActive && (
                      <View style={styles.activeBadge}>
                        <Text style={styles.activeBadgeText}>Active Now</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              style={styles.addButton}
              onPress={handleCreateSchedule}
            >
              <Plus color="#8E89FB" size={24} strokeWidth={2} />
              <Text style={styles.addButtonText}>Add Schedule</Text>
            </TouchableOpacity>
          </>
        )}

        {/* Bottom padding */}
        <View style={{ height: 100 }} />
      </ScrollView>

      <BottomTabNav />

      <ScheduleFormModal
        visible={showModal}
        schedule={editingSchedule}
        onClose={() => setShowModal(false)}
        onSave={handleSaveSchedule}
      />
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
    marginBottom: 32,
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
    backgroundColor: 'rgba(142, 137, 251, 0.08)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(142, 137, 251, 0.15)',
    position: 'relative',
  },
  scheduleCardActive: {
    backgroundColor: 'rgba(90, 227, 140, 0.08)',
    borderColor: 'rgba(90, 227, 140, 0.2)',
  },
  scheduleMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 12,
  },
  scheduleIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(142, 137, 251, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scheduleIconActive: {
    backgroundColor: 'rgba(90, 227, 140, 0.2)',
  },
  scheduleContent: {
    flex: 1,
    gap: 4,
  },
  scheduleName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  scheduleTime: {
    fontSize: 14,
    color: '#9BA8BA',
  },
  scheduleDays: {
    fontSize: 13,
    color: '#6B7A8F',
  },
  scheduleActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 16,
  },
  deleteButton: {
    padding: 8,
  },
  activeBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(90, 227, 140, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  activeBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#5AE38C',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: 'rgba(142, 137, 251, 0.1)',
    borderRadius: 16,
    paddingVertical: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: 'rgba(142, 137, 251, 0.2)',
    borderStyle: 'dashed',
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8E89FB',
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#0B0B0B',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(142, 137, 251, 0.1)',
  },
  modalCloseButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  modalSaveButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  formGroup: {
    marginBottom: 24,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9BA8BA',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  textInput: {
    backgroundColor: 'rgba(142, 137, 251, 0.08)',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(142, 137, 251, 0.15)',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  timeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: 'rgba(142, 137, 251, 0.08)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(142, 137, 251, 0.15)',
  },
  timeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  timeToText: {
    fontSize: 14,
    color: '#6B7A8F',
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  dayButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(142, 137, 251, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(142, 137, 251, 0.15)',
  },
  dayButtonSelected: {
    backgroundColor: '#8E89FB',
    borderColor: '#8E89FB',
  },
  dayButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9BA8BA',
  },
  dayButtonTextSelected: {
    color: '#FFFFFF',
  },
  quickDays: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginTop: 16,
  },
  quickDayButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(142, 137, 251, 0.08)',
  },
  quickDayText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#8E89FB',
  },
  infoBox: {
    backgroundColor: 'rgba(124, 157, 217, 0.1)',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 3,
    borderLeftColor: '#7C9DD9',
  },
  infoText: {
    fontSize: 13,
    color: '#9BA8BA',
    lineHeight: 18,
  },
});
