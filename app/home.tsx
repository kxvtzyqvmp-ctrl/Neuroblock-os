/**
 * Home Screen - Perfect Centering & Zero-Friction
 * 
 * Perfectly centered focus button with:
 * - Vertical and horizontal centering on all devices
 * - Instant tap interaction
 * - Inline app selection
 * - Premium animations
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Platform,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import AuroraBackground from '@/components/shared/AuroraBackground';
import BottomTabNav from '@/components/BottomTabNav';
import FocusButton from '@/components/FocusButton';
import FocusDurationSelector from '@/components/FocusDurationSelector';
import ManageAppsModal from '@/components/ManageAppsModal';
import { useTheme } from '@/contexts/ThemeContext';
import { useFocusSession } from '@/hooks/useFocusSession';

export default function HomeScreen() {
  const router = useRouter();
  const { colors, themeMode } = useTheme();
  const { isActive } = useFocusSession();
  const [showManageAppsModal, setShowManageAppsModal] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={themeMode === 'light' ? 'dark' : 'light'} />
      <AuroraBackground />

      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* Perfectly centered focus button */}
          <View style={styles.centerContainer}>
            <FocusButton
              onManageApps={() => setShowManageAppsModal(true)}
            />
            
            {/* Focus Duration Selector - Below Focus Button */}
            <FocusDurationSelector disabled={isActive} />
          </View>
        </ScrollView>
      </Animated.View>

      <BottomTabNav />

      {/* Inline Manage Apps Modal */}
      <ManageAppsModal
        visible={showManageAppsModal}
        onClose={() => setShowManageAppsModal(false)}
        onAppsUpdated={() => {
          // Reload if needed
        }}
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
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 100,
    minHeight: '100%',
  },
  centerContainer: {
    flex: 1,
    width: '100%',

    justifyContent: 'center',
    alignItems: 'center',
  },
});

