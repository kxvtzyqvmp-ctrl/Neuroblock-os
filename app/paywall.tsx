/**
 * Paywall Screen
 * 
 * Displayed when the free trial expires. Users must subscribe
 * to continue using the app.
 * 
 * Flow: Paywall → (Subscription) → Dashboard
 */

import { useState, useEffect } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Crown, Check, Sparkles, Shield, Zap } from 'lucide-react-native';
import { useAppState } from '@/contexts/AppStateContext';
import { useProStatus } from '@/hooks/useProStatus';
import { useRevenueCat } from '@/hooks/useRevenueCat';
import RevenueCatPackageCard from '@/components/subscription/RevenueCatPackageCard';
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
  const { hasPro, isLoading: proLoading, refresh: refreshProStatus } = useProStatus();
  const { packages, isLoading: packagesLoading, error: packagesError, purchasePackage, restorePurchases } = useRevenueCat();
  const [selectedPackage, setSelectedPackage] = useState<any>(null);
  const [isSubscribing, setIsSubscribing] = useState(false);

  // If user already has subscription, redirect to home
  useEffect(() => {
    if (hasPro) {
      setHasSubscription(true);
      router.replace('/home');
    }
  }, [hasPro, setHasSubscription, router]);

  const handleSubscribe = async (pkg?: any) => {
    if (!pkg && packages.length > 0) {
      // Default to first package if none selected
      pkg = packages[0];
    }

    if (!pkg) {
      Alert.alert('Error', 'No subscription package available. Please try again later.');
      return;
    }

    setIsSubscribing(true);
    
    try {
      const success = await purchasePackage(pkg);
      
      if (success) {
        await refreshProStatus();
        await setHasSubscription(true);
        router.replace('/home');
      } else {
        setIsSubscribing(false);
      }
    } catch (error) {
      console.error('[Paywall] Error subscribing:', error);
      Alert.alert('Error', 'Failed to process subscription. Please try again.');
      setIsSubscribing(false);
    }
  };

  const handleRestore = async () => {
    setIsSubscribing(true);
    
    try {
      const success = await restorePurchases();
      
      if (success) {
        await refreshProStatus();
        await setHasSubscription(true);
        router.replace('/home');
      }
    } catch (error) {
      console.error('[Paywall] Error restoring:', error);
      Alert.alert('Error', 'Failed to restore purchases. Please try again.');
    } finally {
      setIsSubscribing(false);
    }
  };

  const loading = proLoading || packagesLoading;

  if (loading) {
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

        {/* Pricing - RevenueCat Packages */}
        {packagesError && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>
              Failed to load subscription options. {packagesError}
            </Text>
          </View>
        )}

        {packages.length === 0 && !packagesLoading && !packagesError && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>
              No subscription packages available. Please check your RevenueCat configuration.
            </Text>
          </View>
        )}

        {packages.length > 0 && (
          <View style={styles.packagesContainer}>
            {packages.map((pkg) => {
              const isPopular = pkg.product.identifier.toLowerCase().includes('annual') ||
                               pkg.product.identifier.toLowerCase().includes('yearly');
              
              return (
                <RevenueCatPackageCard
                  key={pkg.identifier}
                  package={pkg}
                  isPopular={isPopular}
                  isCurrentPlan={false}
                  onSelect={() => handleSubscribe(pkg)}
                />
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Bottom actions */}
      <View style={styles.bottomContainer}>
        {packages.length > 0 && (
          <TouchableOpacity
            style={styles.subscribeButton}
            onPress={() => handleSubscribe()}
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
        )}

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
  packagesContainer: {
    gap: 20,
    marginBottom: 40,
  },
  errorContainer: {
    backgroundColor: '#2A1F1F',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#4A2F2F',
  },
  errorText: {
    fontSize: 14,
    color: '#FF6B6B',
    textAlign: 'center',
    lineHeight: 20,
  },
});

