/**
 * Settings Screen
 * 
 * Consolidated settings screen with all non-core items:
 * - Appearance
 * - Notifications
 * - Help & Support
 * - Account / Reset App
 * - About / What's New
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Alert,
  Linking,
  Share,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Settings as SettingsIcon,
  Palette,
  Bell,
  HelpCircle,
  RefreshCw,
  Info,
  Share2,
  Star,
  Shield,
  Crown,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import AuroraBackground from '@/components/shared/AuroraBackground';
import BottomTabNav from '@/components/BottomTabNav';
import { useAppState } from '@/contexts/AppStateContext';
import { useProStatus } from '@/hooks/useProStatus';

export default function SettingsScreen() {
  const router = useRouter();
  const { resetApp } = useAppState();
  const { hasPro } = useProStatus();

  const handleResetApp = () => {
    Alert.alert(
      'Reset App',
      'Are you sure you want to reset the app? This will clear all settings and data. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            await resetApp();
            router.replace('/onboarding');
          },
        },
      ]
    );
  };

  const handleShareApp = async () => {
    try {
      await Share.share({
        message: 'Check out NeuroBlock OS - Take back control of your digital life! 🧠✨',
        url: 'https://neuroblockos.app',
        title: 'NeuroBlock OS',
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleLeaveReview = () => {
    const reviewUrl = Platform.select({
      ios: 'https://apps.apple.com/app/id123456789',
      android: 'https://play.google.com/store/apps/details?id=com.harmonicminds.neuroblockos',
      default: 'https://neuroblockos.app/reviews',
    });
    Linking.openURL(reviewUrl);
  };

  const settingsSections = [
    {
      title: 'Appearance',
      items: [
        {
          icon: Palette,
          label: 'Theme & Appearance',
          color: '#8E89FB',
          route: '/appearance',
        },
      ],
    },
    {
      title: 'Notifications',
      items: [
        {
          icon: Bell,
          label: 'Notification Settings',
          color: '#4ED4C7',
          route: '/notifications',
        },
      ],
    },
    {
      title: 'Help & Support',
      items: [
        {
          icon: HelpCircle,
          label: 'Help Center',
          color: '#7C9DD9',
          action: () => Linking.openURL('https://neuroblockos.app/help'),
        },
        {
          icon: Share2,
          label: 'Share NeuroBlock OS',
          color: '#5AE38C',
          action: handleShareApp,
        },
        {
          icon: Star,
          label: 'Leave a Review',
          color: '#FECF5E',
          action: handleLeaveReview,
        },
      ],
    },
    {
      title: 'Account',
      items: [
        {
          icon: Crown,
          label: hasPro ? 'Premium Active' : 'Upgrade to Premium',
          color: hasPro ? '#FECF5E' : '#FECF5E',
          route: hasPro ? undefined : '/paywall',
          action: hasPro ? undefined : () => router.push('/paywall'),
        },
        {
          icon: RefreshCw,
          label: 'Reset App',
          color: '#F87171',
          action: handleResetApp,
        },
      ],
    },
    {
      title: 'About',
      items: [
        {
          icon: Info,
          label: 'About NeuroBlock OS',
          color: '#A3A1FF',
          action: () => Alert.alert('About', 'NeuroBlock OS v1.0.0\n\nTake control. Stay in focus.'),
        },
        {
          icon: Shield,
          label: 'Privacy Policy',
          color: '#8E89FB',
          action: () => Linking.openURL('https://neuroblockos.app/privacy'),
        },
      ],
    },
  ];

  return (
    <View style={styles.container}>
      <AuroraBackground />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <SettingsIcon color="#8E89FB" size={32} strokeWidth={1.5} />
          <Text style={styles.headerTitle}>Settings</Text>
        </View>

        {settingsSections.map((section, sectionIndex) => (
          <View key={sectionIndex} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.itemsContainer}>
              {section.items.map((item, itemIndex) => {
                const Icon = item.icon;
                return (
                  <TouchableOpacity
                    key={itemIndex}
                    style={styles.item}
                    onPress={() => {
                      if (Platform.OS !== 'web') {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }
                      if ('action' in item && item.action) {
                        item.action();
                      } else if ('route' in item && item.route) {
                        router.push(item.route as any);
                      }
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.itemIconContainer, { backgroundColor: `${item.color}20` }]}>
                      <Icon color={item.color} size={20} strokeWidth={2} />
                    </View>
                    <Text style={styles.itemLabel}>{item.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ))}

        <View style={styles.footer}>
          <Text style={styles.footerText}>NeuroBlock OS v1.0.0</Text>
          <Text style={styles.footerSubtext}>© 2025 NeuroBlock OS</Text>
        </View>
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 32,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7A8F',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  itemsContainer: {
    gap: 8,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(142, 137, 251, 0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(142, 137, 251, 0.1)',
    gap: 16,
  },
  itemIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  footer: {
    alignItems: 'center',
    paddingTop: 32,
    paddingBottom: 32,
    gap: 8,
  },
  footerText: {
    fontSize: 14,
    color: '#6B7A8F',
    fontWeight: '500',
  },
  footerSubtext: {
    fontSize: 12,
    color: '#6B7A8F',
  },
});

