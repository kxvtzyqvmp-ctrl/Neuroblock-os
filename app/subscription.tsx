import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Modal, Pressable, TouchableOpacity, ActivityIndicator, Platform, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Lock, X, CheckCircle, RefreshCw } from 'lucide-react-native';
import { SUBSCRIPTION_PLANS } from '@/types/subscription';
import PlanCard from '@/components/subscription/PlanCard';
import RevenueCatPackageCard from '@/components/subscription/RevenueCatPackageCard';
import { useProStatus } from '@/hooks/useProStatus';
import { useRevenueCat } from '@/hooks/useRevenueCat';

export default function SubscriptionScreen() {
  const router = useRouter();
  const { hasPro, isLoading: proLoading, refresh: refreshProStatus } = useProStatus();
  const { packages, isLoading: packagesLoading, error: packagesError, purchasePackage, restorePurchases } = useRevenueCat();
  const [selectedPackage, setSelectedPackage] = useState<any>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [restoring, setRestoring] = useState(false);

  const loading = packagesLoading || proLoading;

  const handleSelectPackage = (pkg: any) => {
    setSelectedPackage(pkg);
    setShowConfirmModal(true);
  };

  const handleConfirmPurchase = async () => {
    if (!selectedPackage) return;

    setProcessing(true);
    try {
      const success = await purchasePackage(selectedPackage);
      
      if (success) {
        // Refresh pro status after purchase
        await refreshProStatus();
        setProcessing(false);
        setShowConfirmModal(false);
        setShowSuccessModal(true);
      } else {
        setProcessing(false);
        // Error alert is handled in purchasePackage
      }
    } catch (error) {
      console.error('[SubscriptionScreen] Error processing purchase:', error);
      Alert.alert('Error', 'Failed to process purchase. Please try again.');
      setProcessing(false);
    }
  };

  const handleRestorePurchases = async () => {
    setRestoring(true);
    try {
      const success = await restorePurchases();
      
      if (success) {
        // Refresh pro status after restore
        await refreshProStatus();
      }
      // Alert is handled in restorePurchases
    } catch (error) {
      console.error('[SubscriptionScreen] Error restoring purchases:', error);
      Alert.alert('Error', 'Failed to restore purchases. Please try again.');
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

  const isPremium = hasPro;

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

        {/* Free Plan Card */}
        <View style={styles.plansContainer}>
          <PlanCard
            name={SUBSCRIPTION_PLANS.FREE.name}
            price={SUBSCRIPTION_PLANS.FREE.price}
            billingCycle={SUBSCRIPTION_PLANS.FREE.billingCycle}
            features={SUBSCRIPTION_PLANS.FREE.features}
            isCurrentPlan={!isPremium}
            onSelect={() => {}}
          />

          {/* RevenueCat Packages - Dynamically Loaded */}
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

          {packages.map((pkg, index) => {
            // Determine if this package should be marked as popular (usually annual/yearly)
            const isPopular = pkg.product.identifier.toLowerCase().includes('annual') ||
                             pkg.product.identifier.toLowerCase().includes('yearly') ||
                             pkg.identifier.toLowerCase().includes('annual') ||
                             pkg.identifier.toLowerCase().includes('yearly');

            return (
              <RevenueCatPackageCard
                key={pkg.identifier}
                package={pkg}
                isPopular={isPopular}
                isCurrentPlan={isPremium}
                onSelect={() => handleSelectPackage(pkg)}
              />
            );
          })}
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

            {selectedPackage && (
              <View style={styles.confirmDetails}>
                <Text style={styles.confirmPlan}>
                  {selectedPackage.product.title}
                </Text>
                <Text style={styles.confirmPrice}>
                  {selectedPackage.product.priceString}
                </Text>
                {selectedPackage.product.description && (
                  <Text style={styles.confirmDescription}>
                    {selectedPackage.product.description}
                  </Text>
                )}
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
  confirmDescription: {
    fontSize: 14,
    color: '#9BA8BA',
    marginTop: 8,
    textAlign: 'center',
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
