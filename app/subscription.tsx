import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Modal, Pressable, TouchableOpacity, ActivityIndicator, Platform, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Lock, X, CheckCircle, RefreshCw } from 'lucide-react-native';
import { supabase, UserSubscription } from '@/lib/supabase';
import { SUBSCRIPTION_PLANS } from '@/types/subscription';
import PlanCard from '@/components/subscription/PlanCard';
import { useProStatus } from '@/hooks/useProStatus';
import { getRevenueCatInstance } from '@/lib/revenuecatInit';

export default function SubscriptionScreen() {
  const router = useRouter();
  const { hasPro, isLoading: proLoading, refresh: refreshProStatus } = useProStatus();
  const [loading, setLoading] = useState(true);
  const [currentSubscription, setCurrentSubscription] = useState<UserSubscription | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [restoring, setRestoring] = useState(false);

  useEffect(() => {
    loadSubscription();
  }, []);

  const loadSubscription = async () => {
    try {
      const { data } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .maybeSingle();

      setCurrentSubscription(data);
    } catch (error) {
      console.error('Error loading subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPlan = (planId: string) => {
    if (planId === 'free') return;
    setSelectedPlan(planId);
    setShowConfirmModal(true);
  };

  const handleConfirmPurchase = async () => {
    if (!selectedPlan) return;

    setProcessing(true);

    if (Platform.OS === 'web') {
      setTimeout(async () => {
        try {
          const plan = SUBSCRIPTION_PLANS[selectedPlan.toUpperCase() as keyof typeof SUBSCRIPTION_PLANS];

          if (currentSubscription) {
            await supabase
              .from('user_subscriptions')
              .update({ is_active: false })
              .eq('id', currentSubscription.id);
          }

          const { data: newSubscription } = await supabase
            .from('user_subscriptions')
            .insert([
              {
                plan: 'premium',
                billing_cycle: plan.billingCycle,
                price_paid: plan.price,
                is_active: true,
                start_date: new Date().toISOString(),
              },
            ])
            .select()
            .single();

          setCurrentSubscription(newSubscription);
          setProcessing(false);
          setShowConfirmModal(false);
          setShowSuccessModal(true);
        } catch (error) {
          console.error('Error updating subscription:', error);
          setProcessing(false);
        }
      }, 2000);
    } else {
      try {
        await refreshProStatus();
        setProcessing(false);
        setShowConfirmModal(false);
        setShowSuccessModal(true);
      } catch (error) {
        console.error('Error processing purchase:', error);
        Alert.alert('Error', 'Failed to process purchase. Please try again.');
        setProcessing(false);
      }
    }
  };

  const handleRestorePurchases = async () => {
    if (Platform.OS === 'web') {
      Alert.alert('Not Available', 'Restore purchases is only available on iOS and Android.');
      return;
    }

    const Purchases = getRevenueCatInstance();
    if (!Purchases) {
      Alert.alert('Error', 'Purchase system is not ready. Please try again.');
      return;
    }

    setRestoring(true);
    try {
      const customerInfo = await Purchases.restorePurchases();
      const isPro = customerInfo.entitlements.active['Pro'] !== undefined;

      await refreshProStatus();

      if (isPro) {
        Alert.alert(
          'Success',
          'Your premium subscription has been restored!',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'No Purchases Found',
          'We could not find any purchases to restore.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error restoring purchases:', error);
      Alert.alert(
        'Restore Failed',
        'Unable to restore purchases. Please try again later.',
        [{ text: 'OK' }]
      );
    } finally {
      setRestoring(false);
    }
  };

  const handleSuccessClose = () => {
    setShowSuccessModal(false);
    router.back();
  };

  if (loading || proLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#7C9DD9" />
      </View>
    );
  }

  const isPremium = hasPro || (currentSubscription?.plan === 'premium' && currentSubscription?.is_active);

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
          <X color="#9BA8BA" size={24} strokeWidth={2} />
        </TouchableOpacity>

        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Lock color="#7C9DD9" size={48} strokeWidth={1.5} />
          </View>

          <Text style={styles.title}>Unlock Full Focus</Text>

          <Text style={styles.subtitle}>
            Upgrade to NeuroBlock OS Premium for the full experience.
          </Text>
        </View>

        <View style={styles.plansContainer}>
          <PlanCard
            name={SUBSCRIPTION_PLANS.FREE.name}
            price={SUBSCRIPTION_PLANS.FREE.price}
            billingCycle={SUBSCRIPTION_PLANS.FREE.billingCycle}
            features={SUBSCRIPTION_PLANS.FREE.features}
            isCurrentPlan={!isPremium}
            onSelect={() => handleSelectPlan('free')}
          />

          <PlanCard
            name={SUBSCRIPTION_PLANS.MONTHLY.name}
            price={SUBSCRIPTION_PLANS.MONTHLY.price}
            billingCycle={SUBSCRIPTION_PLANS.MONTHLY.billingCycle}
            features={SUBSCRIPTION_PLANS.MONTHLY.features}
            isCurrentPlan={isPremium && currentSubscription?.billing_cycle === 'monthly'}
            onSelect={() => handleSelectPlan('monthly')}
          />

          <PlanCard
            name={SUBSCRIPTION_PLANS.YEARLY.name}
            price={SUBSCRIPTION_PLANS.YEARLY.price}
            billingCycle={SUBSCRIPTION_PLANS.YEARLY.billingCycle}
            features={SUBSCRIPTION_PLANS.YEARLY.features}
            badge={SUBSCRIPTION_PLANS.YEARLY.badge}
            isPopular={true}
            isCurrentPlan={isPremium && currentSubscription?.billing_cycle === 'yearly'}
            onSelect={() => handleSelectPlan('yearly')}
          />

          <PlanCard
            name={SUBSCRIPTION_PLANS.LIFETIME.name}
            price={SUBSCRIPTION_PLANS.LIFETIME.price}
            billingCycle={SUBSCRIPTION_PLANS.LIFETIME.billingCycle}
            features={SUBSCRIPTION_PLANS.LIFETIME.features}
            badge={SUBSCRIPTION_PLANS.LIFETIME.badge}
            isCurrentPlan={isPremium && currentSubscription?.billing_cycle === 'lifetime'}
            onSelect={() => handleSelectPlan('lifetime')}
          />
        </View>

        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.restoreButton}
            onPress={handleRestorePurchases}
            disabled={restoring}
          >
            {restoring ? (
              <ActivityIndicator size="small" color="#7C9DD9" />
            ) : (
              <>
                <RefreshCw color="#7C9DD9" size={18} strokeWidth={2} />
                <Text style={styles.restoreButtonText}>Restore Purchases</Text>
              </>
            )}
          </TouchableOpacity>

          <Text style={styles.footerText}>
            Cancel anytime. All plans include a mindful approach to digital wellness.
          </Text>
        </View>
      </ScrollView>

      <Modal
        visible={showConfirmModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => !processing && setShowConfirmModal(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => !processing && setShowConfirmModal(false)}
        >
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>Confirm your subscription?</Text>

            {selectedPlan && (
              <View style={styles.confirmDetails}>
                <Text style={styles.confirmPlan}>
                  {SUBSCRIPTION_PLANS[selectedPlan.toUpperCase() as keyof typeof SUBSCRIPTION_PLANS].name}
                </Text>
                <Text style={styles.confirmPrice}>
                  ${SUBSCRIPTION_PLANS[selectedPlan.toUpperCase() as keyof typeof SUBSCRIPTION_PLANS].price.toFixed(2)}
                  {SUBSCRIPTION_PLANS[selectedPlan.toUpperCase() as keyof typeof SUBSCRIPTION_PLANS].billingCycle !== 'lifetime' &&
                    `/${SUBSCRIPTION_PLANS[selectedPlan.toUpperCase() as keyof typeof SUBSCRIPTION_PLANS].billingCycle}`}
                </Text>
              </View>
            )}

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowConfirmModal(false)}
                disabled={processing}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.confirmButton, processing && styles.confirmButtonProcessing]}
                onPress={handleConfirmPurchase}
                disabled={processing}
              >
                {processing ? (
                  <ActivityIndicator size="small" color="#0A0E14" />
                ) : (
                  <Text style={styles.confirmButtonText}>Confirm Purchase</Text>
                )}
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        visible={showSuccessModal}
        transparent={true}
        animationType="fade"
        onRequestClose={handleSuccessClose}
      >
        <Pressable style={styles.modalOverlay} onPress={handleSuccessClose}>
          <Pressable style={styles.successModal} onPress={(e) => e.stopPropagation()}>
            <View style={styles.successIcon}>
              <CheckCircle color="#7C9DD9" size={64} strokeWidth={1.5} />
            </View>

            <Text style={styles.successTitle}>Premium Activated!</Text>

            <Text style={styles.successText}>
              You now have access to all premium features. Enjoy your enhanced focus journey.
            </Text>

            <TouchableOpacity style={styles.successButton} onPress={handleSuccessClose}>
              <Text style={styles.successButtonText}>Continue</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0E14',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0A0E14',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  closeButton: {
    position: 'absolute',
    top: 60,
    right: 24,
    zIndex: 10,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 80,
    paddingBottom: 32,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#E8EDF4',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#9BA8BA',
    textAlign: 'center',
    lineHeight: 24,
  },
  plansContainer: {
    paddingHorizontal: 24,
    gap: 24,
    marginBottom: 32,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  restoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginBottom: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(124, 157, 217, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(124, 157, 217, 0.3)',
  },
  restoreButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#7C9DD9',
  },
  footerText: {
    fontSize: 13,
    color: '#6B7A8F',
    textAlign: 'center',
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#161C26',
    borderRadius: 20,
    padding: 32,
    marginHorizontal: 24,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#E8EDF4',
    textAlign: 'center',
    marginBottom: 24,
  },
  confirmDetails: {
    backgroundColor: '#0A0E14',
    padding: 20,
    borderRadius: 12,
    marginBottom: 24,
    alignItems: 'center',
  },
  confirmPlan: {
    fontSize: 18,
    fontWeight: '600',
    color: '#E8EDF4',
    marginBottom: 8,
  },
  confirmPrice: {
    fontSize: 24,
    fontWeight: '700',
    color: '#7C9DD9',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: 'transparent',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2A3441',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#9BA8BA',
  },
  confirmButton: {
    flex: 1,
    backgroundColor: '#7C9DD9',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmButtonProcessing: {
    opacity: 0.7,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0A0E14',
  },
  successModal: {
    backgroundColor: '#161C26',
    borderRadius: 20,
    padding: 40,
    marginHorizontal: 24,
    width: '90%',
    maxWidth: 400,
    alignItems: 'center',
  },
  successIcon: {
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#E8EDF4',
    textAlign: 'center',
    marginBottom: 16,
  },
  successText: {
    fontSize: 15,
    color: '#9BA8BA',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  successButton: {
    width: '100%',
    backgroundColor: '#7C9DD9',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  successButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#0A0E14',
  },
});
