import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { Sun, X, Clock } from 'lucide-react-native';
import { SCHEDULE_PRESETS } from '@/types/setup';

interface Step4ActiveHoursProps {
  activeScheduleType: 'work_hours' | 'evenings' | 'custom';
  activeScheduleStart: string;
  activeScheduleEnd: string;
  onSelectSchedule: (type: 'work_hours' | 'evenings' | 'custom', start: string, end: string) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function Step4ActiveHours({
  activeScheduleType,
  activeScheduleStart,
  activeScheduleEnd,
  onSelectSchedule,
  onNext,
  onBack,
}: Step4ActiveHoursProps) {
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [tempStartHour, setTempStartHour] = useState(
    parseInt(activeScheduleStart.split(':')[0])
  );
  const [tempEndHour, setTempEndHour] = useState(
    parseInt(activeScheduleEnd.split(':')[0])
  );

  const hours = Array.from({ length: 24 }, (_, i) => i);

  const formatHour = (hour: number): string => {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour} ${period}`;
  };

  const formatTimeRange = (start: string, end: string): string => {
    const startHour = parseInt(start.split(':')[0]);
    const endHour = parseInt(end.split(':')[0]);
    return `${formatHour(startHour)} – ${formatHour(endHour)}`;
  };

  const handlePresetSelect = (preset: typeof SCHEDULE_PRESETS[0]) => {
    if (preset.type === 'custom') {
      setShowCustomModal(true);
    } else {
      onSelectSchedule(preset.type, preset.start, preset.end);
    }
  };

  const handleSaveCustomTime = () => {
    const startTime = `${String(tempStartHour).padStart(2, '0')}:00:00`;
    const endTime = `${String(tempEndHour).padStart(2, '0')}:00:00`;
    onSelectSchedule('custom', startTime, endTime);
    setShowCustomModal(false);
  };

  const isHourSelected = (hour: number, type: 'start' | 'end'): boolean => {
    if (type === 'start') return hour === tempStartHour;
    return hour === tempEndHour;
  };

  const isHourInRange = (hour: number): boolean => {
    if (tempStartHour <= tempEndHour) {
      return hour >= tempStartHour && hour < tempEndHour;
    } else {
      return hour >= tempStartHour || hour < tempEndHour;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Sun color="#7C9DD9" size={40} strokeWidth={1.5} />
        </View>

        <Text style={styles.heading}>When should Detox Mode be active?</Text>

        <Text style={styles.subtext}>
          Choose when app blocks and limits are enforced.
        </Text>

        <View style={styles.optionsContainer}>
          {SCHEDULE_PRESETS.map((preset) => {
            const isSelected = activeScheduleType === preset.type;
            const displayDescription =
              preset.type === 'custom' && isSelected
                ? formatTimeRange(activeScheduleStart, activeScheduleEnd)
                : preset.description;

            return (
              <TouchableOpacity
                key={preset.type}
                style={[styles.optionCard, isSelected && styles.optionCardSelected]}
                onPress={() => handlePresetSelect(preset)}
              >
                <View style={styles.optionContent}>
                  <Text style={[styles.optionLabel, isSelected && styles.optionLabelSelected]}>
                    {preset.label}
                  </Text>
                  <Text
                    style={[
                      styles.optionDescription,
                      isSelected && styles.optionDescriptionSelected,
                    ]}
                  >
                    {displayDescription}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.nextButton} onPress={onNext}>
          <Text style={styles.nextButtonText}>Next</Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={showCustomModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCustomModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity
                onPress={() => setShowCustomModal(false)}
                style={styles.closeButton}
              >
                <X color="#9BA8BA" size={24} strokeWidth={2} />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Select Active Hours</Text>
              <View style={{ width: 40 }} />
            </View>

            <Text style={styles.modalSubtitle}>
              Choose when Detox Mode should be active
            </Text>

            <View style={styles.timePickerContainer}>
              <View style={styles.timePickerSection}>
                <View style={styles.timePickerHeader}>
                  <Clock color="#7C9DD9" size={20} strokeWidth={2} />
                  <Text style={styles.timePickerLabel}>Start Time</Text>
                </View>
                <Text style={styles.selectedTimeText}>{formatHour(tempStartHour)}</Text>
              </View>

              <View style={styles.timeDivider}>
                <Text style={styles.timeDividerText}>to</Text>
              </View>

              <View style={styles.timePickerSection}>
                <View style={styles.timePickerHeader}>
                  <Clock color="#7C9DD9" size={20} strokeWidth={2} />
                  <Text style={styles.timePickerLabel}>End Time</Text>
                </View>
                <Text style={styles.selectedTimeText}>{formatHour(tempEndHour)}</Text>
              </View>
            </View>

            <ScrollView
              style={styles.hoursScroll}
              contentContainerStyle={styles.hoursScrollContent}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.hoursGrid}>
                {hours.map((hour) => {
                  const isStartSelected = isHourSelected(hour, 'start');
                  const isEndSelected = isHourSelected(hour, 'end');
                  const inRange = isHourInRange(hour);

                  return (
                    <TouchableOpacity
                      key={hour}
                      style={[
                        styles.hourButton,
                        inRange && styles.hourButtonInRange,
                        isStartSelected && styles.hourButtonStart,
                        isEndSelected && styles.hourButtonEnd,
                      ]}
                      onPress={() => {
                        if (!isStartSelected && !isEndSelected) {
                          if (Math.abs(hour - tempStartHour) < Math.abs(hour - tempEndHour)) {
                            setTempStartHour(hour);
                          } else {
                            setTempEndHour(hour);
                          }
                        } else if (isStartSelected) {
                          setTempStartHour(hour);
                        } else {
                          setTempEndHour(hour);
                        }
                      }}
                    >
                      <Text
                        style={[
                          styles.hourButtonText,
                          (inRange || isStartSelected || isEndSelected) &&
                            styles.hourButtonTextActive,
                        ]}
                      >
                        {formatHour(hour)}
                      </Text>
                      {isStartSelected && (
                        <View style={styles.hourBadge}>
                          <Text style={styles.hourBadgeText}>Start</Text>
                        </View>
                      )}
                      {isEndSelected && (
                        <View style={styles.hourBadge}>
                          <Text style={styles.hourBadgeText}>End</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <Text style={styles.rangePreview}>
                Detox Mode will be active from{' '}
                <Text style={styles.rangePreviewBold}>{formatHour(tempStartHour)}</Text> to{' '}
                <Text style={styles.rangePreviewBold}>{formatHour(tempEndHour)}</Text>
              </Text>
              <TouchableOpacity style={styles.saveButton} onPress={handleSaveCustomTime}>
                <Text style={styles.saveButtonText}>Save Custom Time</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 32,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 24,
  },
  heading: {
    fontSize: 24,
    fontWeight: '600',
    color: '#E8EDF4',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 32,
  },
  subtext: {
    fontSize: 15,
    color: '#9BA8BA',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 40,
  },
  optionsContainer: {
    width: '100%',
    gap: 12,
  },
  optionCard: {
    backgroundColor: '#161C26',
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#2A3441',
  },
  optionCardSelected: {
    backgroundColor: '#7C9DD9',
    borderColor: '#7C9DD9',
  },
  optionContent: {
    gap: 4,
  },
  optionLabel: {
    fontSize: 17,
    fontWeight: '600',
    color: '#E8EDF4',
  },
  optionLabelSelected: {
    color: '#0A0E14',
  },
  optionDescription: {
    fontSize: 14,
    color: '#9BA8BA',
  },
  optionDescriptionSelected: {
    color: '#0A0E14',
    opacity: 0.8,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 24,
  },
  backButton: {
    flex: 1,
    backgroundColor: 'transparent',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2A3441',
  },
  backButtonText: {
    fontSize: 17,
    fontWeight: '500',
    color: '#9BA8BA',
  },
  nextButton: {
    flex: 1,
    backgroundColor: '#7C9DD9',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  nextButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#0A0E14',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#0B0B0B',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 24,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    marginBottom: 12,
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#E8EDF4',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#9BA8BA',
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 24,
  },
  timePickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 24,
    gap: 16,
  },
  timePickerSection: {
    flex: 1,
    backgroundColor: '#161C26',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2A3441',
  },
  timePickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  timePickerLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9BA8BA',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  selectedTimeText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#7C9DD9',
  },
  timeDivider: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeDividerText: {
    fontSize: 14,
    color: '#6B7A8F',
    fontWeight: '600',
  },
  hoursScroll: {
    flex: 1,
  },
  hoursScrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  hoursGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  hourButton: {
    width: '30%',
    backgroundColor: '#161C26',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#2A3441',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  hourButtonInRange: {
    backgroundColor: 'rgba(124, 157, 217, 0.15)',
    borderColor: 'rgba(124, 157, 217, 0.3)',
  },
  hourButtonStart: {
    backgroundColor: '#7C9DD9',
    borderColor: '#7C9DD9',
  },
  hourButtonEnd: {
    backgroundColor: '#5A8FD9',
    borderColor: '#5A8FD9',
  },
  hourButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#9BA8BA',
  },
  hourButtonTextActive: {
    color: '#E8EDF4',
  },
  hourBadge: {
    position: 'absolute',
    top: -8,
    backgroundColor: '#0A0E14',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  hourBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#7C9DD9',
    textTransform: 'uppercase',
  },
  modalFooter: {
    paddingHorizontal: 24,
    paddingVertical: 24,
    borderTopWidth: 1,
    borderTopColor: '#2A3441',
  },
  rangePreview: {
    fontSize: 14,
    color: '#9BA8BA',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  rangePreviewBold: {
    fontWeight: '700',
    color: '#7C9DD9',
  },
  saveButton: {
    backgroundColor: '#7C9DD9',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#0A0E14',
  },
});
