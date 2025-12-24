/**
 * useRevenueCat Hook
 * 
 * Fetches and manages RevenueCat offerings, packages, and purchases.
 * Dynamically loads all available subscription packages from RevenueCat.
 */

import { useState, useEffect, useCallback } from 'react';
import { Platform, Alert } from 'react-native';
import { getRevenueCatInstance, isRevenueCatInitialized } from '@/lib/revenuecatInit';

export interface RevenueCatPackage {
  identifier: string;
  packageType: string;
  product: {
    identifier: string;
    description: string;
    title: string;
    price: number;
    priceString: string;
    currencyCode: string;
    introPrice?: {
      price: number;
      priceString: string;
      period: string;
      cycles: number;
    };
  };
}

export interface RevenueCatOfferings {
  current: {
    identifier: string;
    serverDescription: string;
    availablePackages: RevenueCatPackage[];
  } | null;
  all: Record<string, any>;
}

interface UseRevenueCatReturn {
  offerings: RevenueCatOfferings | null;
  packages: RevenueCatPackage[];
  isLoading: boolean;
  error: string | null;
  refreshOfferings: () => Promise<void>;
  purchasePackage: (pkg: RevenueCatPackage) => Promise<boolean>;
  restorePurchases: () => Promise<boolean>;
}

export function useRevenueCat(): UseRevenueCatReturn {
  const [offerings, setOfferings] = useState<RevenueCatOfferings | null>(null);
  const [packages, setPackages] = useState<RevenueCatPackage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOfferings = useCallback(async () => {
    // Skip in web or if not initialized
    if (Platform.OS === 'web' || !isRevenueCatInitialized()) {
      setIsLoading(false);
      return;
    }

    const Purchases = getRevenueCatInstance();
    if (!Purchases) {
      setError('RevenueCat not available');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const offeringsData = await Purchases.getOfferings();

      setOfferings(offeringsData);

      // Extract available packages from current offering
      if (offeringsData.current && offeringsData.current.availablePackages.length > 0) {
        const availablePackages = offeringsData.current.availablePackages.map((pkg: any) => ({
          identifier: pkg.identifier,
          packageType: pkg.packageType,
          product: {
            identifier: pkg.product.identifier,
            description: pkg.product.description || '',
            title: pkg.product.title || pkg.product.identifier,
            price: pkg.product.price,
            priceString: pkg.product.priceString,
            currencyCode: pkg.product.currencyCode || 'USD',
            introPrice: pkg.product.introPrice ? {
              price: pkg.product.introPrice.price,
              priceString: pkg.product.introPrice.priceString,
              period: pkg.product.introPrice.period,
              cycles: pkg.product.introPrice.cycles,
            } : undefined,
          },
        }));

        setPackages(availablePackages);
      } else {
        setPackages([]);
      }
    } catch (err: any) {
      console.error('[useRevenueCat] Error fetching offerings:', err);
      setError(err.message || 'Failed to fetch offerings');
      setPackages([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const purchasePackage = useCallback(async (pkg: RevenueCatPackage): Promise<boolean> => {
    if (Platform.OS === 'web' || !isRevenueCatInitialized()) {
      Alert.alert('Not Available', 'Purchases are only available on iOS and Android.');
      return false;
    }

    const Purchases = getRevenueCatInstance();
    if (!Purchases) {
      Alert.alert('Error', 'Purchase system is not ready. Please try again.');
      return false;
    }

    try {
      // Create package object from the identifier
      // We need to get the actual package object from offerings
      let packageToPurchase: any = null;
      
      if (offerings?.current) {
        packageToPurchase = offerings.current.availablePackages.find(
          (availablePkg: any) => availablePkg.identifier === pkg.identifier
        );
      }

      if (!packageToPurchase) {
        // Fallback: try to find by product identifier
        if (offerings?.current) {
          packageToPurchase = offerings.current.availablePackages.find(
            (availablePkg: any) => availablePkg.product.identifier === pkg.product.identifier
          );
        }
      }

      if (!packageToPurchase) {
        console.error('[useRevenueCat] Package not found:', pkg.identifier);
        Alert.alert('Error', 'Selected package not found. Please try again.');
        return false;
      }

      const purchaseInfo = await Purchases.purchasePackage(packageToPurchase);
      const { customerInfo } = purchaseInfo;

      // Check for pro_access entitlement (user requested this name)
      const isPro = customerInfo.entitlements.active['pro_access'] !== undefined;
      
      if (isPro) {
        Alert.alert('Success!', 'You\'ve unlocked NeuroBlock Pro.');
        
        // Refresh offerings after purchase
        await fetchOfferings();
        
        return true;
      } else {
        Alert.alert('Warning', 'Purchase completed but access not granted. Please contact support.');
        return false;
      }
    } catch (err: any) {
      console.error('[useRevenueCat] Purchase error:', err);
      
      if (err.userCancelled) {
        return false;
      }

      Alert.alert(
        'Purchase Failed',
        err.message || 'Unable to complete purchase. Please try again.'
      );
      return false;
    }
  }, [offerings, fetchOfferings]);

  const restorePurchases = useCallback(async (): Promise<boolean> => {
    if (Platform.OS === 'web' || !isRevenueCatInitialized()) {
      Alert.alert('Not Available', 'Restore purchases is only available on iOS and Android.');
      return false;
    }

    const Purchases = getRevenueCatInstance();
    if (!Purchases) {
      Alert.alert('Error', 'Purchase system is not ready. Please try again.');
      return false;
    }

    try {
      const customerInfo = await Purchases.restorePurchases();
      
      const isPro = customerInfo.entitlements.active['pro_access'] !== undefined;

      // Refresh offerings after restore
      await fetchOfferings();

      if (isPro) {
        Alert.alert(
          'Success',
          'Your premium subscription has been restored!'
        );
        return true;
      } else {
        Alert.alert(
          'No Purchases Found',
          'We could not find any purchases to restore.'
        );
        return false;
      }
    } catch (err: any) {
      console.error('[useRevenueCat] Restore error:', err);
      Alert.alert(
        'Restore Failed',
        'Unable to restore purchases. Please try again later.'
      );
      return false;
    }
  }, [fetchOfferings]);

  useEffect(() => {
    fetchOfferings();
  }, [fetchOfferings]);

  return {
    offerings,
    packages,
    isLoading,
    error,
    refreshOfferings: fetchOfferings,
    purchasePackage,
    restorePurchases,
  };
}
