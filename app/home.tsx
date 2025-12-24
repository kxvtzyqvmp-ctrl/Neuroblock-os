/**
 * Home Screen - Focus Hub
 * 
 * Main home screen with:
 * - Weekly calendar strip at the top
 * - Perfectly centered focus button (between calendar and bottom content)
 * - Manage Blocked Apps button (above)
 * - Manage Sites button (below)
 * - Focus duration selector
 * - No scrolling - fixed layout
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Platform,
  Animated,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AuroraBackground from '@/components/shared/AuroraBackground';
import BottomTabNav from '@/components/BottomTabNav';
import WeeklyCalendarStrip from '@/components/WeeklyCalendarStrip';
import FocusButton from '@/components/FocusButton';
import FocusDurationSelector from '@/components/FocusDurationSelector';
import ManageAppsModal from '@/components/ManageAppsModal';
import ManageSitesModal from '@/components/ManageSitesModal';
import { useTheme } from '@/contexts/ThemeContext';
import { useFocusSession } from '@/hooks/useFocusSession';

export default function HomeScreen() {
  const { colors, themeMode } = useTheme();
  const { isActive } = useFocusSession();
  const [showManageAppsModal, setShowManageAppsModal] = useState(false);
  const [showManageSitesModal, setShowManageSitesModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  // Handler for calendar day selection
  const handleDaySelect = (date: Date) => {
    setSelectedDate(date);
    console.log('[Home] Selected date:', date.toISOString().split('T')[0]);
  };

  // Handler for Manage Blocked Apps
  const handleManageApps = () => {
    setShowManageAppsModal(true);
  };

  // Handler for Manage Sites
  const handleManageSites = () => {
    setShowManageSitesModal(true);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={themeMode === 'light' ? 'dark' : 'light'} />
      <AuroraBackground />

      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        {/* TOP SECTION: Calendar */}
        <View style={styles.topSection}>
          <WeeklyCalendarStrip onDaySelect={handleDaySelect} />
        </View>

        {/* MIDDLE SECTION: Focus Button - Centered between calendar and bottom */}
        <View style={styles.middleSection}>
          <FocusButton
            onManageApps={handleManageApps}
            onManageSites={handleManageSites}
          />
        </View>

        {/* BOTTOM SECTION: Duration Selector */}
        <View style={styles.bottomSection}>
          <FocusDurationSelector disabled={isActive} />
        </View>
      </Animated.View>

      <BottomTabNav />

      {/* Manage Apps Modal */}
      <ManageAppsModal
        visible={showManageAppsModal}
        onClose={() => setShowManageAppsModal(false)}
        onAppsUpdated={() => {}}
      />

      {/* Manage Sites Modal */}
      <ManageSitesModal
        visible={showManageSitesModal}
        onClose={() => setShowManageSitesModal(false)}
        onSitesUpdated={() => {}}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: Platform.OS === 'ios' ? 90 : 70, // Space for bottom tab nav
  },
  topSection: {
    // Calendar at top - no flex, just natural height
  },
  middleSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 48, // Minimum gap from calendar - circle must never overlap
    paddingBottom: 16, // Ensure some breathing room at bottom
  },
  bottomSection: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
});
