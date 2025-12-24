/**
 * Settings Screen
 * 
 * Consolidated settings screen with all non-core items:
 * - Appearance
 * - Notifications
 * - Help & Support
 * - Subscription / Account
 * - About / What's New
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
  Linking,
  Share,
  ActivityIndicator,
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
  ExternalLink,
  RotateCcw,
  Check,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import AuroraBackground from '@/components/shared/AuroraBackground';
import BottomTabNav from '@/components/BottomTabNav';
import { useAppState } from '@/contexts/AppStateContext';
import { useSubscription } from '@/contexts/SubscriptionContext';

export default function SettingsScreen() {
  const router = useRouter();
  const { resetApp } = useAppState();
  const { isPro, handleRestore, refreshCustomerInfo } = useSubscription();
  const [isRestoring, setIsRestoring] = useState(false);

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
      android: 'https://play.google.com/store/apps/details?id=com.harmonicminds.dopaminedetox',
      default: 'https://neuroblockos.app/reviews',
    });
    Linking.openURL(reviewUrl);
  };

  const handleRestorePurchases = async () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    
    setIsRestoring(true);
    
    try {
      const result = await handleRestore();
      
      if (result.success && result.restored) {
        Alert.alert(
          'Success!',
          'Your premium subscription has been restored.',
        );
      } else if (result.success && !result.restored) {
        Alert.alert(
          'No Purchases Found',
          'We could not find any active purchases to restore.'
        );
      } else if (result.error) {
        Alert.alert('Restore Failed', result.error);
      }
    } catch (error) {
      console.error('[Settings] Restore error:', error);
      Alert.alert('Error', 'Failed to restore purchases. Please try again.');
    } finally {
      setIsRestoring(false);
    }
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
      title: 'Subscription',
      items: isPro ? [
        {
          icon: Crown,
          label: 'Premium Active',
          color: '#5AE38C',
          badge: 'Active',
          badgeColor: '#5AE38C',
          action: () => {
            Alert.alert(
              'Premium Active',
              'You have full access to all NeuroBlock OS features. Thank you for your support!'
            );
          },
        },
        {
          icon: RotateCcw,
          label: 'Restore Purchases',
          color: '#7C9DD9',
          action: handleRestorePurchases,
          isLoading: isRestoring,
        },
      ] : [
        {
          icon: Crown,
          label: 'Upgrade to Premium',
          color: '#FECF5E',
          action: () => router.push('/paywall'),
        },
        {
          icon: RotateCcw,
          label: 'Restore Purchases',
          color: '#7C9DD9',
          action: handleRestorePurchases,
          isLoading: isRestoring,
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
          route: '/help',
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
          action: () => Linking.openURL('https://www.neuroblockos.live/privacy-policy'),
          hasExternalIcon: true,
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
                const hasExternalIcon = 'hasExternalIcon' in item && item.hasExternalIcon;
                const hasBadge = 'badge' in item && item.badge;
                const isLoading = 'isLoading' in item && item.isLoading;
                
                return (
                  <TouchableOpacity
                    key={itemIndex}
                    style={styles.item}
                    onPress={() => {
                      if (isLoading) return;
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
                    disabled={isLoading}
                  >
                    <View style={[styles.itemIconContainer, { backgroundColor: `${item.color}20` }]}>
                      {isLoading ? (
                        <ActivityIndicator size="small" color={item.color} />
                      ) : (
                        <Icon color={item.color} size={20} strokeWidth={2} />
                      )}
                    </View>
                    <Text style={styles.itemLabel}>{item.label}</Text>
                    {hasBadge && (
                      <View style={[styles.badge, { backgroundColor: `${(item as any).badgeColor}20` }]}>
                        <Check color={(item as any).badgeColor} size={12} strokeWidth={3} />
                        <Text style={[styles.badgeText, { color: (item as any).badgeColor }]}>
                          {(item as any).badge}
                        </Text>
                      </View>
                    )}
                    {hasExternalIcon && (
                      <ExternalLink
                        color="#6B7A8F"
                        size={16}
                        strokeWidth={2}
                      />
                    )}
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
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
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
