/**
 * FocusDurationSelector Component
 * 
 * Allows users to select focus session duration:
 * - Quick-select buttons (15m, 30m, 1h, 2h)
 * - Custom time picker modal
 * - Disabled when session is active
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
  ScrollView,
  Platform,
} from 'react-native';
import { Clock, X } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useFocusDuration, PRESET_DURATIONS } from '@/hooks/useFocusDuration';

interface FocusDurationSelectorProps {
  disabled?: boolean;
}

export default function FocusDurationSelector({ disabled = false }: FocusDurationSelectorProps) {
  const { colors } = useTheme();
  const { duration, setDuration, isLoading } = useFocusDuration();
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customHours, setCustomHours] = useState(1);
  const [customMinutes, setCustomMinutes] = useState(0);

  const handlePresetSelect = async (minutes: number) => {
    if (disabled || isLoading) return;
    // Option A: Don't change duration during active session
    // The disabled prop should prevent this, but we check anyway
    console.log('[FocusDurationSelector] Button pressed:', minutes, 'minutes');
    // CRITICAL: This updates the single source of truth for duration
    // The timer hook reads from this state, so updating here ensures the next Start uses this value
    await setDuration(minutes);
    console.log('[FocusDurationSelector] Duration updated to:', minutes, 'minutes (will apply to next session)');
  };

  // Update custom hours/minutes when duration changes
  useEffect(() => {
    if (duration) {
      setCustomHours(Math.floor(duration / 60));
      setCustomMinutes(duration % 60);
    }
  }, [duration]);

  const handleCustomSelect = () => {
    if (disabled || isLoading) return;
    setCustomHours(Math.floor(duration / 60));
    setCustomMinutes(duration % 60);
    setShowCustomModal(true);
  };

  const handleCustomConfirm = async () => {
    if (disabled || isLoading) return;
    const totalMinutes = customHours * 60 + customMinutes;
    
    // Validate duration: minimum 5 minutes, maximum 8 hours (480 minutes)
    if (totalMinutes < 5) {
      // Show error - duration too short
      return;
    }
    if (totalMinutes > 480) {
      // Show error - duration too long (max 8 hours)
      return;
    }
    
    if (totalMinutes > 0) {
      // CRITICAL: Update the single source of truth for duration
      // This ensures the timer uses the custom duration on next Start
      await setDuration(totalMinutes);
      setShowCustomModal(false);
    }
  };

  const formatDuration = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (mins === 0) {
      return `${hours}h`;
    }
    return `${hours}h ${mins}m`;
  };

  const isPresetSelected = (presetMinutes: number): boolean => {
    return duration === presetMinutes;
  };

  if (isLoading) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.textSecondary }]}>
        Set Focus Duration
      </Text>

      <View style={styles.presetContainer}>
        {PRESET_DURATIONS.map((preset) => {
          const isSelected = isPresetSelected(preset.minutes);
          return (
            <TouchableOpacity
              key={preset.minutes}
              style={[
                styles.presetButton,
                {
                  backgroundColor: isSelected
                    ? colors.accent
                    : colors.surface,
                  borderColor: isSelected
                    ? colors.accent
                    : colors.border,
                },
                disabled && styles.presetButtonDisabled,
              ]}
              onPress={() => handlePresetSelect(preset.minutes)}
              disabled={disabled}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.presetText,
                  {
                    color: isSelected
                      ? colors.background
                      : disabled
                      ? colors.textSecondary
                      : colors.text,
                  },
                ]}
              >
                {preset.displayName}
              </Text>
            </TouchableOpacity>
          );
        })}

        <TouchableOpacity
          style={[
            styles.customButton,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
            disabled && styles.customButtonDisabled,
          ]}
          onPress={handleCustomSelect}
          disabled={disabled}
          activeOpacity={0.7}
        >
          <Clock
            size={16}
            color={disabled ? colors.textSecondary : colors.accent}
            strokeWidth={2}
          />
          <Text
            style={[
              styles.customText,
              {
                color: disabled
                  ? colors.textSecondary
                  : colors.accent,
              },
            ]}
          >
            Custom
          </Text>
        </TouchableOpacity>
      </View>

      {/* Selected Duration Display */}
      <Text style={[styles.selectedText, { color: colors.textSecondary }]}>
        Duration: <Text style={{ color: colors.accent, fontWeight: '600' }}>{formatDuration(duration)}</Text>
      </Text>

      {/* Custom Time Picker Modal */}
      <Modal
        visible={showCustomModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowCustomModal(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => !disabled && setShowCustomModal(false)}
        >
          <Pressable
            style={[styles.modalContent, { backgroundColor: colors.surface }]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Custom Duration
              </Text>
              <TouchableOpacity
                onPress={() => setShowCustomModal(false)}
                disabled={disabled}
              >
                <X size={24} color={colors.textSecondary} strokeWidth={2} />
              </TouchableOpacity>
            </View>

            <View style={styles.timePickerContainer}>
              {/* Hours Picker */}
              <View style={styles.pickerColumn}>
                <Text style={[styles.pickerLabel, { color: colors.textSecondary }]}>
                  Hours
                </Text>
                <ScrollView
                  style={styles.pickerScroll}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.pickerContent}
                >
                  {Array.from({ length: 9 }, (_, i) => i).map((hour) => {
                    // Disable hours that would exceed 8 hours with current minutes
                    const maxHour = customMinutes > 0 ? 7 : 8;
                    const isDisabled = hour > maxHour || (hour === 8 && customMinutes > 0);
                    return (
                    <TouchableOpacity
                      key={hour}
                      style={[
                        styles.pickerOption,
                        customHours === hour && {
                          backgroundColor: colors.accent + '20',
                        },
                        isDisabled && {
                          opacity: 0.3,
                        },
                      ]}
                      onPress={() => !isDisabled && setCustomHours(hour)}
                      disabled={isDisabled}
                    >
                      <Text
                        style={[
                          styles.pickerOptionText,
                          {
                            color:
                              customHours === hour
                                ? colors.accent
                                : isDisabled
                                ? colors.textSecondary
                                : colors.text,
                            fontWeight: customHours === hour ? '700' : '400',
                          },
                        ]}
                      >
                        {hour}
                      </Text>
                    </TouchableOpacity>
                  );
                  })}
                </ScrollView>
              </View>

              {/* Minutes Picker */}
              <View style={styles.pickerColumn}>
                <Text style={[styles.pickerLabel, { color: colors.textSecondary }]}>
                  Minutes
                </Text>
                <ScrollView
                  style={styles.pickerScroll}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.pickerContent}
                >
                  {Array.from({ length: 12 }, (_, i) => i * 5).map((minute) => (
                    <TouchableOpacity
                      key={minute}
                      style={[
                        styles.pickerOption,
                        customMinutes === minute && {
                          backgroundColor: colors.accent + '20',
                        },
                      ]}
                      onPress={() => setCustomMinutes(minute)}
                    >
                      <Text
                        style={[
                          styles.pickerOptionText,
                          {
                            color:
                              customMinutes === minute
                                ? colors.accent
                                : colors.text,
                            fontWeight: customMinutes === minute ? '700' : '400',
                          },
                        ]}
                      >
                        {minute}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.cancelButton, { borderColor: colors.border }]}
                onPress={() => setShowCustomModal(false)}
                disabled={disabled}
              >
                <Text style={[styles.cancelText, { color: colors.textSecondary }]}>
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.confirmButton,
                  {
                    backgroundColor: colors.accent,
                  },
                  disabled && styles.confirmButtonDisabled,
                ]}
                onPress={handleCustomConfirm}
                disabled={disabled || (customHours === 0 && customMinutes === 0) || (customHours * 60 + customMinutes < 5) || (customHours * 60 + customMinutes > 480)}
              >
                <Text
                  style={[
                    styles.confirmText,
                    {
                      color:
                        disabled || (customHours === 0 && customMinutes === 0)
                          ? colors.textSecondary
                          : colors.background,
                    },
                  ]}
                >
                  Set Duration
                </Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    width: '100%',
    marginTop: 32,
    paddingHorizontal: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 16,
  },
  presetContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    width: '100%',
    marginBottom: 12,
  },
  presetButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 2,
    minWidth: 70,
    alignItems: 'center',
    justifyContent: 'center',
  },
  presetButtonDisabled: {
    opacity: 0.5,
  },
  presetText: {
    fontSize: 16,
    fontWeight: '600',
  },
  customButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 2,
    minWidth: 100,
  },
  customButtonDisabled: {
    opacity: 0.5,
  },
  customText: {
    fontSize: 16,
    fontWeight: '600',
  },
  selectedText: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
  },
  timePickerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 24,
    gap: 24,
  },
  pickerColumn: {
    flex: 1,
    alignItems: 'center',
  },
  pickerLabel: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  pickerScroll: {
    maxHeight: 200,
    width: '100%',
  },
  pickerContent: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  pickerOption: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginVertical: 4,
    minWidth: 80,
    alignItems: 'center',
  },
  pickerOptionText: {
    fontSize: 18,
    fontWeight: '400',
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmButtonDisabled: {
    opacity: 0.5,
  },
  confirmText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

