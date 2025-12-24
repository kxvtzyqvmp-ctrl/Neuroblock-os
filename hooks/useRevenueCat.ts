/**
 * useRevenueCat Hook
 * 
 * Fetches and manages RevenueCat offerings, packages, and purchases.
 * Dynamically loads all available subscription packages from RevenueCat.
 * 
 * Note: Purchase/restore logic is now centralized in SubscriptionContext.
 * This hook is primarily for fetching offerings and package data.
 */

import { useState, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';
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
  rawPackages: any[]; // Original package objects for purchase
  isLoading: boolean;
  error: string | null;
  refreshOfferings: () => Promise<void>;
  getPackageForPurchase: (identifier: string) => any | null;
}

export function useRevenueCat(): UseRevenueCatReturn {
  const [offerings, setOfferings] = useState<RevenueCatOfferings | null>(null);
  const [packages, setPackages] = useState<RevenueCatPackage[]>([]);
  const [rawPackages, setRawPackages] = useState<any[]>([]);
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
        // Store raw packages for purchase operations
        setRawPackages(offeringsData.current.availablePackages);

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
        setRawPackages([]);
      }
    } catch (err: any) {
      console.error('[useRevenueCat] Error fetching offerings:', err);
      setError(err.message || 'Failed to fetch offerings');
      setPackages([]);
      setRawPackages([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Get the raw package object for purchase by identifier
  const getPackageForPurchase = useCallback((identifier: string): any | null => {
    return rawPackages.find(pkg => pkg.identifier === identifier) || null;
  }, [rawPackages]);

  useEffect(() => {
    fetchOfferings();
  }, [fetchOfferings]);

  return {
    offerings,
    packages,
    rawPackages,
    isLoading,
    error,
    refreshOfferings: fetchOfferings,
    getPackageForPurchase,
  };
}
