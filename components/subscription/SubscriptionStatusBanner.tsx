/**
 * SubscriptionStatusBanner Component
 * 
 * Shows a small banner when RevenueCat is temporarily unreachable.
 * Keeps the last known Pro status but alerts the user to the issue.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { AlertCircle, X } from 'lucide-react-native';
import { useSubscription } from '@/contexts/SubscriptionContext';

interface SubscriptionStatusBannerProps {
  onDismiss?: () => void;
}

export default function SubscriptionStatusBanner({ onDismiss }: SubscriptionStatusBannerProps) {
  const { lastRefreshError, refreshCustomerInfo } = useSubscription();

  if (!lastRefreshError) {
    return null;
  }

  const handleRetry = async () => {
    await refreshCustomerInfo();
  };

  return (
    <View style={styles.banner}>
      <AlertCircle color="#FECF5E" size={16} strokeWidth={2} />
      <Text style={styles.bannerText}>Unable to refresh subscription status</Text>
      <TouchableOpacity onPress={handleRetry} style={styles.retryButton}>
        <Text style={styles.retryText}>Retry</Text>
      </TouchableOpacity>
      {onDismiss && (
        <TouchableOpacity onPress={onDismiss} style={styles.dismissButton}>
          <X color="#9BA8BA" size={16} strokeWidth={2} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(254, 207, 94, 0.1)',
    borderLeftWidth: 3,
    borderLeftColor: '#FECF5E',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 8,
  },
  bannerText: {
    flex: 1,
    fontSize: 13,
    color: '#FECF5E',
    fontWeight: '500',
  },
  retryButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  retryText: {
    fontSize: 12,
    color: '#FECF5E',
    fontWeight: '600',
  },
  dismissButton: {
    padding: 4,
  },
});

