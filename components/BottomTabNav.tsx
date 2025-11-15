/**
 * Bottom Tab Navigation
 * 
 * Simplified 3-tab navigation: Home, Schedules (premium), Settings
 * Replaces the old 5-tab FloatingNav system.
 * 
 * Uses global theme for consistent styling across all screens.
 */

import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { Home, Calendar, Settings } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useProStatus } from '@/hooks/useProStatus';
import { useTheme } from '@/contexts/ThemeContext';

type Tab = 'home' | 'schedules' | 'settings';

export default function BottomTabNav() {
  const router = useRouter();
  const pathname = usePathname();
  const { hasPro } = useProStatus();
  const { colors } = useTheme();

  const getActiveTab = (): Tab => {
    if (pathname === '/home' || pathname === '/dashboard' || pathname === '/') {
      return 'home';
    }
    if (pathname === '/schedules') {
      return 'schedules';
    }
    if (pathname === '/settings') {
      return 'settings';
    }
    return 'home';
  };

  const activeTab = getActiveTab();

  const handleTabPress = (tab: Tab, route: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    // For schedules, check if premium
    if (tab === 'schedules' && !hasPro) {
      router.push('/paywall');
      return;
    }
    
    router.push(route as any);
  };

  const getTabColor = (tab: Tab) => {
    return activeTab === tab ? colors.accent : colors.textSecondary;
  };

  // Calculate opacity for iOS (rgba equivalent)
  const getTabBarBackground = () => {
    if (Platform.OS === 'ios') {
      // Convert hex to rgba with opacity
      const hex = colors.surface.replace('#', '');
      const r = parseInt(hex.substr(0, 2), 16);
      const g = parseInt(hex.substr(2, 2), 16);
      const b = parseInt(hex.substr(4, 2), 16);
      return `rgba(${r}, ${g}, ${b}, 0.95)`;
    }
    return colors.surface;
  };

  return (
    <View style={[styles.container, { 
      backgroundColor: getTabBarBackground(),
      borderTopColor: colors.border,
    }]}>
      <TouchableOpacity
        style={styles.tab}
        onPress={() => handleTabPress('home', '/home')}
        activeOpacity={0.7}
      >
        <Home color={getTabColor('home')} size={24} strokeWidth={2} />
        <Text style={[
          styles.tabLabel,
          { color: getTabColor('home') },
          activeTab === 'home' && { color: colors.accent }
        ]}>
          Home
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.tab}
        onPress={() => handleTabPress('schedules', '/schedules')}
        activeOpacity={0.7}
      >
        <Calendar color={getTabColor('schedules')} size={24} strokeWidth={2} />
        <Text style={[
          styles.tabLabel,
          { color: getTabColor('schedules') },
          activeTab === 'schedules' && { color: colors.accent }
        ]}>
          Schedules
        </Text>
        {!hasPro && (
          <View style={styles.premiumBadge}>
            <Text style={styles.premiumBadgeText}>Pro</Text>
          </View>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.tab}
        onPress={() => handleTabPress('settings', '/settings')}
        activeOpacity={0.7}
      >
        <Settings color={getTabColor('settings')} size={24} strokeWidth={2} />
        <Text style={[
          styles.tabLabel,
          { color: getTabColor('settings') },
          activeTab === 'settings' && { color: colors.accent }
        ]}>
          Settings
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    paddingBottom: Platform.OS === 'ios' ? 32 : 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
    position: 'relative',
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  premiumBadge: {
    position: 'absolute',
    top: -4,
    right: 8,
    backgroundColor: '#FECF5E',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  premiumBadgeText: {
    fontSize: 8,
    fontWeight: '700',
    color: '#000000',
  },
});

