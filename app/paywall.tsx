/**
 * Paywall Screen
 * 
 * Premium subscription screen. Users can subscribe to unlock:
 * - Unlimited app + website blocking
 * - Recurring schedules
 * - Full tracker access
 * 
 * Flow: Paywall → (Subscription) → Home (with full access)
 */

import { useState, useEffect } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Crown, Check, Sparkles, Shield, Zap, BarChart3 } from 'lucide-react-native';
import { useAppState } from '@/contexts/AppStateContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
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
    icon: BarChart3,
    title: 'Full Tracker',
    description: 'Track screen time, blocks, and progress',
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
  const { isPro, isLoading: subscriptionLoading, handlePurchase, handleRestore, refreshCustomerInfo } = useSubscription();
  const { packages, rawPackages, isLoading: packagesLoading, error: packagesError, getPackageForPurchase } = useRevenueCat();
  const [isProcessing, setIsProcessing] = useState(false);

  // If user already has subscription, redirect to home immediately
  useEffect(() => {
    if (isPro && !subscriptionLoading) {
      setHasSubscription(true);
      router.replace('/home');
    }
  }, [isPro, subscriptionLoading, setHasSubscription, router]);

  const handleSubscribe = async (pkg?: any) => {
    // Get the raw package for purchase
    let packageToPurchase = pkg;
    
    if (!packageToPurchase && rawPackages.length > 0) {
      // Default to first raw package if none selected
      packageToPurchase = rawPackages[0];
    } else if (pkg && typeof pkg.identifier === 'string') {
      // If we have a simplified package, get the raw one
      packageToPurchase = getPackageForPurchase(pkg.identifier);
    }

    if (!packageToPurchase) {
      Alert.alert('Error', 'No subscription package available. Please try again later.');
      return;
    }

    setIsProcessing(true);
    
    try {
      const result = await handlePurchase(packageToPurchase);
      
      if (result.success) {
        // Purchase successful - refresh Pro status to ensure it's up to date
        await refreshCustomerInfo();
        
        // Verify isPro is now true
        if (isPro) {
          // Pro status confirmed - redirect to home
          await setHasSubscription(true);
          router.replace('/home');
        } else {
          // This shouldn't happen, but handle gracefully
          Alert.alert(
            'Purchase Successful',
            'Your purchase was successful. Please wait a moment for your subscription to activate.',
            [
              {
                text: 'OK',
                onPress: async () => {
                  // Try refreshing again
                  await refreshCustomerInfo();
                  if (isPro) {
                    await setHasSubscription(true);
                    router.replace('/home');
                  }
                }
              }
            ]
          );
        }
      } else if (result.error) {
        // Only show error if there was an actual error (not user cancel)
        Alert.alert('Purchase Issue', result.error);
      }
      // If success is false but no error, user cancelled - do nothing
    } catch (error) {
      console.error('[Paywall] Unexpected error:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRestorePurchases = async () => {
    setIsProcessing(true);
    
    try {
      const result = await handleRestore();
      
      if (result.success && result.restored) {
        // Successfully restored - refresh Pro status to ensure it's up to date
        await refreshCustomerInfo();
        
        // Verify isPro is now true
        if (isPro) {
          Alert.alert(
            'Success!',
            'Your premium subscription has been restored.',
            [{
              text: 'Continue',
              onPress: async () => {
                await setHasSubscription(true);
                router.replace('/home');
              }
            }]
          );
        } else {
          // This shouldn't happen, but handle gracefully
          Alert.alert(
            'Restore Successful',
            'Your purchases were restored. Please wait a moment for your subscription to activate.',
            [
              {
                text: 'OK',
                onPress: async () => {
                  // Try refreshing again
                  await refreshCustomerInfo();
                  if (isPro) {
                    await setHasSubscription(true);
                    router.replace('/home');
                  }
                }
              }
            ]
          );
        }
      } else if (result.success && !result.restored) {
        // Restore completed but no active purchases found
        Alert.alert(
          'No Purchases Found',
          'We could not find any active purchases to restore. If you believe this is an error, please contact support.'
        );
      } else if (result.error) {
        Alert.alert('Restore Failed', result.error);
      }
    } catch (error) {
      console.error('[Paywall] Restore error:', error);
      Alert.alert('Error', 'Failed to restore purchases. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const loading = subscriptionLoading || packagesLoading;

  if (loading) {
    return (
      <View style={styles.container}>
        <AuroraBackground />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#7C9DD9" />
          <Text style={styles.loadingText}>Loading subscription options...</Text>
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
            Take full control of your digital habits with premium features.
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
                <Check size={20} color="#5AE38C" />
              </View>
            );
          })}
        </View>

        {/* Pricing - RevenueCat Packages */}
        {packagesError && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>
              Unable to load subscription options. Please check your connection and try again.
            </Text>
          </View>
        )}

        {packages.length === 0 && !packagesLoading && !packagesError && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>
              No subscription packages available at the moment. Please try again later.
            </Text>
          </View>
        )}

        {packages.length > 0 && (
          <View style={styles.packagesContainer}>
            {packages.map((pkg, index) => {
              const isPopular = pkg.product.identifier.toLowerCase().includes('annual') ||
                               pkg.product.identifier.toLowerCase().includes('yearly');
              
              return (
                <RevenueCatPackageCard
                  key={pkg.identifier}
                  package={pkg}
                  isPopular={isPopular}
                  isCurrentPlan={false}
                  onSelect={() => handleSubscribe(rawPackages[index])}
                  disabled={isProcessing}
                />
              );
            })}
          </View>
        )}

        {/* Spacer for bottom actions */}
        <View style={{ height: 180 }} />
      </ScrollView>

      {/* Bottom actions */}
      <View style={styles.bottomContainer}>
        {packages.length > 0 && (
          <TouchableOpacity
            style={[styles.subscribeButton, isProcessing && styles.buttonDisabled]}
            onPress={() => handleSubscribe()}
            disabled={isProcessing}
          >
            <LinearGradient
              colors={['#7C9DD9', '#9B8AFB']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.gradientButton}
            >
              {isProcessing ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.subscribeText}>Subscribe Now</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.restoreButton, isProcessing && styles.buttonDisabled]}
          onPress={handleRestorePurchases}
          disabled={isProcessing}
        >
          <Text style={styles.restoreText}>Restore Purchases</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.skipButton}
          onPress={() => router.back()}
          disabled={isProcessing}
        >
          <Text style={styles.skipText}>Maybe Later</Text>
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
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 15,
    color: '#9BA8BA',
  },
  header: {
    alignItems: 'center',
    gap: 16,
    marginBottom: 40,
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
    gap: 16,
    marginBottom: 32,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 16,
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
  packagesContainer: {
    gap: 16,
    marginBottom: 24,
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
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 24,
    paddingBottom: 40,
    gap: 12,
    backgroundColor: '#0B0B0B',
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
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  restoreButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  restoreText: {
    color: '#7C9DD9',
    fontSize: 16,
    fontWeight: '600',
  },
  skipButton: {
    paddingVertical: 8,
    alignItems: 'center',
  },
  skipText: {
    color: '#6B7A8F',
    fontSize: 14,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
