/**
 * WeeklyCalendarStrip Component
 * 
 * Displays a horizontal weekly calendar strip showing:
 * - Current week (Sun-Sat) with real dates
 * - Today auto-selected on load
 * - Selected day highlighted with pill background and dot indicator
 * - Tap to select different days
 * - Session indicators (dots) for days with completed sessions
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/contexts/ThemeContext';
import { getAllFocusSessions, FocusSession } from '@/lib/localStorage';

interface WeeklyCalendarStripProps {
  onDaySelect?: (date: Date) => void;
  initialDate?: Date;
}

export default function WeeklyCalendarStrip({ onDaySelect, initialDate }: WeeklyCalendarStripProps) {
  const { colors } = useTheme();
  const [selectedDate, setSelectedDate] = useState<Date>(initialDate || new Date());
  const [sessionsByDate, setSessionsByDate] = useState<Set<string>>(new Set());

  // Calculate current week (Sunday to Saturday)
  const currentWeek = useMemo(() => {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sunday, 6 = Saturday
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - dayOfWeek);
    weekStart.setHours(0, 0, 0, 0);

    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + i);
      days.push(date);
    }
    return days;
  }, []);

  // Load sessions to show indicators
  useEffect(() => {
    const loadSessions = async () => {
      try {
        const allSessions = await getAllFocusSessions();
        const sessions = Object.values(allSessions) as FocusSession[];
        
        // Create a set of dates that have completed sessions
        const datesWithSessions = new Set<string>();
        sessions.forEach((session) => {
          if (session.end_time) {
            // Extract date from start_time
            const date = new Date(session.start_time);
            const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
            datesWithSessions.add(dateStr);
          }
        });
        
        setSessionsByDate(datesWithSessions);
      } catch (error) {
        console.error('[WeeklyCalendar] Error loading sessions:', error);
      }
    };

    loadSessions();
  }, []);

  const isToday = useCallback((date: Date): boolean => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  }, []);

  const isSelected = useCallback((date: Date): boolean => {
    return (
      date.getDate() === selectedDate.getDate() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getFullYear() === selectedDate.getFullYear()
    );
  }, [selectedDate]);

  const hasSession = useCallback((date: Date): boolean => {
    const dateStr = date.toISOString().split('T')[0];
    return sessionsByDate.has(dateStr);
  }, [sessionsByDate]);

  const handleDayPress = useCallback((date: Date) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSelectedDate(date);
    if (onDaySelect) {
      onDaySelect(date);
    }
  }, [onDaySelect]);

  const getDayName = (date: Date): string => {
    const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    return days[date.getDay()];
  };

  const getDayNumber = (date: Date): string => {
    return date.getDate().toString();
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      {currentWeek.map((date, index) => {
        const today = isToday(date);
        const selected = isSelected(date);
        const hasSessionIndicator = hasSession(date);

        return (
          <TouchableOpacity
            key={index}
            style={[
              styles.dayContainer,
              selected && [styles.dayContainerSelected, { backgroundColor: colors.accent }],
            ]}
            onPress={() => handleDayPress(date)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.dayName,
                {
                  color: selected ? '#FFFFFF' : today ? colors.accent : colors.textSecondary,
                  fontWeight: selected || today ? '700' : '500',
                },
              ]}
            >
              {getDayName(date)}
            </Text>
            <Text
              style={[
                styles.dayNumber,
                {
                  color: selected ? '#FFFFFF' : today ? colors.accent : colors.text,
                  fontWeight: selected || today ? '700' : '600',
                },
              ]}
            >
              {getDayNumber(date)}
            </Text>
            {/* Dot indicator - shows for selected day OR days with sessions */}
            {(selected || hasSessionIndicator) && (
              <View
                style={[
                  styles.dotIndicator,
                  {
                    backgroundColor: selected ? '#FFFFFF' : colors.accent,
                  },
                ]}
              />
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginHorizontal: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(142, 137, 251, 0.15)',
  },
  dayContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 14,
    minWidth: 42,
    gap: 4,
  },
  dayContainerSelected: {
    shadowColor: '#8E89FB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  dayName: {
    fontSize: 10,
    letterSpacing: 0.5,
  },
  dayNumber: {
    fontSize: 18,
  },
  dotIndicator: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginTop: 2,
  },
});
