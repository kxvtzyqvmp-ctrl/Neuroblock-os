/**
 * Paywall Screen
 * 
 * Displayed when the free trial expires. Users must subscribe
 * to continue using the app.
 * 
 * Flow: Paywall → (Subscription) → Dashboard
 */

import { useState, useEffect } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Crown, Check, Sparkles, Shield, Zap } from 'lucide-react-native';
import { useAppState } from '@/contexts/AppStateContext';
import { useProStatus } from '@/hooks/useProStatus';
import AuroraBackground from '@/components/shared/AuroraBackground';
import { LinearGradient } from 'expo-linear-gradient';

const FEATURES = [
  {
    icon: Shield,
    title: 'Unlimited Blocking',
    description: 'Block unlimited apps and websites',
  },
  {
    icon: Zap,
    title: 'Recurring Schedules',
    description: 'Create custom schedules for automatic blocking',
  },
  {
    icon: Sparkles,
    title: 'AI Insights',
    description: 'Get personalized insights and recommendations',
  },
];

export default function PaywallScreen() {
  const router = useRouter();
  const { setHasSubscription } = useAppState();
  const { hasPro, isLoading: proLoading } = useProStatus();
  const [isSubscribing, setIsSubscribing] = useState(false);

  // If user already has subscription, redirect to home
  useEffect(() => {
    if (hasPro) {
      setHasSubscription(true);
      router.replace('/home');
    }
  }, [hasPro]);

  const handleSubscribe = async () => {
    setIsSubscribing(true);
    
    try {
      // TODO: Integrate RevenueCat subscription flow
      // For now, this is a placeholder that bypasses for testing
      
      // Simulate subscription process
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // In production, check RevenueCat subscription status here
      // For testing: Set subscription status
      await setHasSubscription(true);
      
      // Navigate to home
      router.replace('/home');
    } catch (error) {
      console.error('[Paywall] Error subscribing:', error);
      setIsSubscribing(false);
    }
  };

  const handleRestore = async () => {
    setIsSubscribing(true);
    
    try {
      // TODO: Restore purchases via RevenueCat
      // For now, just check current status
      if (hasPro) {
        await setHasSubscription(true);
        router.replace('/home');
      } else {
        alert('No active subscription found.');
      }
    } catch (error) {
      console.error('[Paywall] Error restoring:', error);
    } finally {
      setIsSubscribing(false);
    }
  };

  if (proLoading) {
    return (
      <View style={styles.container}>
        <AuroraBackground />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#7C9DD9" />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AuroraBackground />
      
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Crown size={64} color="#F4A261" strokeWidth={1.5} />
          <Text style={styles.title}>Unlock Premium</Text>
          <Text style={styles.subtitle}>
            Unlock unlimited blocking, recurring schedules, and AI insights.
          </Text>
        </View>

        {/* Features */}
        <View style={styles.featuresContainer}>
          {FEATURES.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <View key={index} style={styles.featureItem}>
                <View style={styles.featureIcon}>
                  <Icon size={24} color="#7C9DD9" strokeWidth={1.5} />
                </View>
                <View style={styles.featureText}>
                  <Text style={styles.featureTitle}>{feature.title}</Text>
                  <Text style={styles.featureDescription}>{feature.description}</Text>
                </View>
                <Check size={20} color="#7C9DD9" />
              </View>
            );
          })}
        </View>

        {/* Pricing */}
        <View style={styles.pricingContainer}>
          <View style={styles.priceRow}>
            <Text style={styles.priceAmount}>$4.99</Text>
            <Text style={styles.pricePeriod}>/month</Text>
          </View>
          <Text style={styles.priceNote}>Cancel anytime</Text>
        </View>
      </ScrollView>

      {/* Bottom actions */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={styles.subscribeButton}
          onPress={handleSubscribe}
          disabled={isSubscribing}
        >
          <LinearGradient
            colors={['#7C9DD9', '#9B8AFB']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.gradientButton}
          >
            {isSubscribing ? (
              <ActivityIndicator color="#E8EDF4" />
            ) : (
              <Text style={styles.subscribeText}>Subscribe Now</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.restoreButton}
          onPress={handleRestore}
          disabled={isSubscribing}
        >
          <Text style={styles.restoreText}>Restore Purchases</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0B0B',
  },
  content: {
    flexGrow: 1,
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 200,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    gap: 16,
    marginBottom: 48,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#E8EDF4',
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: '#9BA8BA',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  featuresContainer: {
    gap: 20,
    marginBottom: 40,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 20,
    backgroundColor: '#151515',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#7C9DD920',
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureText: {
    flex: 1,
    gap: 4,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E8EDF4',
  },
  featureDescription: {
    fontSize: 14,
    color: '#9BA8BA',
  },
  pricingContainer: {
    alignItems: 'center',
    gap: 8,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  priceAmount: {
    fontSize: 48,
    fontWeight: '700',
    color: '#E8EDF4',
  },
  pricePeriod: {
    fontSize: 20,
    color: '#9BA8BA',
  },
  priceNote: {
    fontSize: 14,
    color: '#6B7A8F',
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 24,
    paddingBottom: 40,
    gap: 12,
  },
  subscribeButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  gradientButton: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subscribeText: {
    color: '#E8EDF4',
    fontSize: 18,
    fontWeight: '600',
  },
  restoreButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  restoreText: {
    color: '#9BA8BA',
    fontSize: 16,
    fontWeight: '500',
  },
});

