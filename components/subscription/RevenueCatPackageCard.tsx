/**
 * RevenueCatPackageCard Component
 * 
 * Displays a RevenueCat package with dynamic pricing and details.
 */

import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Check, Sparkles } from 'lucide-react-native';
import { RevenueCatPackage } from '@/hooks/useRevenueCat';
import { SUBSCRIPTION_PLANS } from '@/types/subscription';

interface RevenueCatPackageCardProps {
  package: RevenueCatPackage;
  isPopular?: boolean;
  isCurrentPlan?: boolean;
  onSelect: () => void;
  disabled?: boolean;
}

export default function RevenueCatPackageCard({
  package: pkg,
  isPopular = false,
  isCurrentPlan = false,
  onSelect,
  disabled = false,
}: RevenueCatPackageCardProps) {
  // Map package identifier to features
  const getFeatures = (identifier: string) => {
    // Try to match by product identifier
    const productId = pkg.product.identifier.toLowerCase();
    
    if (productId.includes('monthly') || pkg.identifier.toLowerCase().includes('monthly')) {
      return SUBSCRIPTION_PLANS.MONTHLY.features;
    } else if (productId.includes('annual') || productId.includes('yearly') || 
               pkg.identifier.toLowerCase().includes('annual') || 
               pkg.identifier.toLowerCase().includes('yearly')) {
      return SUBSCRIPTION_PLANS.YEARLY.features;
    } else if (productId.includes('lifetime') || pkg.identifier.toLowerCase().includes('lifetime')) {
      return SUBSCRIPTION_PLANS.LIFETIME.features;
    }
    
    // Default to premium features
    return SUBSCRIPTION_PLANS.MONTHLY.features;
  };

  // Determine badge based on package type
  const getBadge = (identifier: string) => {
    const productId = pkg.product.identifier.toLowerCase();
    if (productId.includes('annual') || productId.includes('yearly')) {
      return SUBSCRIPTION_PLANS.YEARLY.badge;
    } else if (productId.includes('lifetime')) {
      return SUBSCRIPTION_PLANS.LIFETIME.badge;
    }
    return undefined;
  };

  const features = getFeatures(pkg.identifier);
  const badge = getBadge(pkg.identifier);
  const hasIntroPrice = pkg.product.introPrice !== undefined;

  return (
    <View style={[styles.card, isPopular && styles.cardPopular]}>
      {badge && (
        <View style={styles.badge}>
          <Sparkles color="#0A0E14" size={14} strokeWidth={2} />
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      )}

      <View style={styles.header}>
        <Text style={styles.planName}>{pkg.product.title}</Text>
        <View style={styles.priceContainer}>
          {hasIntroPrice && (
            <View style={styles.introPriceContainer}>
              <Text style={styles.originalPrice}>{pkg.product.priceString}</Text>
              <Text style={styles.introPriceLabel}>Intro: {pkg.product.introPrice?.priceString}</Text>
            </View>
          )}
          {!hasIntroPrice && (
            <Text style={styles.price}>{pkg.product.priceString}</Text>
          )}
        </View>
        {pkg.product.description && (
          <Text style={styles.description}>{pkg.product.description}</Text>
        )}
      </View>

      <View style={styles.features}>
        {features.map((feature, index) => (
          <View key={index} style={styles.featureItem}>
            <Check color="#7C9DD9" size={18} strokeWidth={2} />
            <Text style={styles.featureText}>{feature}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity
        style={[
          styles.button,
          isPopular && styles.buttonPopular,
          isCurrentPlan && styles.buttonCurrent,
        ]}
        onPress={onSelect}
        disabled={isCurrentPlan || disabled}
      >
        <Text
          style={[
            styles.buttonText,
            isPopular && styles.buttonTextPopular,
            isCurrentPlan && styles.buttonTextCurrent,
          ]}
        >
          {isCurrentPlan ? 'Current Plan' : 'Choose Plan'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#161C26',
    borderRadius: 16,
    padding: 24,
    borderWidth: 2,
    borderColor: '#2A3441',
    position: 'relative',
  },
  cardPopular: {
    borderColor: '#7C9DD9',
    backgroundColor: '#1A2332',
  },
  badge: {
    position: 'absolute',
    top: -12,
    right: 24,
    backgroundColor: '#7C9DD9',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0A0E14',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  header: {
    marginBottom: 20,
  },
  planName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#E8EDF4',
    marginBottom: 8,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    flexWrap: 'wrap',
    gap: 4,
  },
  price: {
    fontSize: 32,
    fontWeight: '700',
    color: '#E8EDF4',
  },
  introPriceContainer: {
    flexDirection: 'column',
    gap: 4,
  },
  originalPrice: {
    fontSize: 18,
    fontWeight: '500',
    color: '#6B7A8F',
    textDecorationLine: 'line-through',
  },
  introPriceLabel: {
    fontSize: 24,
    fontWeight: '700',
    color: '#7C9DD9',
  },
  description: {
    fontSize: 14,
    color: '#9BA8BA',
    marginTop: 8,
    lineHeight: 20,
  },
  features: {
    gap: 12,
    marginBottom: 24,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  featureText: {
    flex: 1,
    fontSize: 14,
    color: '#9BA8BA',
    lineHeight: 20,
  },
  button: {
    backgroundColor: '#2A3441',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#3E4A5C',
  },
  buttonPopular: {
    backgroundColor: '#7C9DD9',
    borderColor: '#7C9DD9',
  },
  buttonCurrent: {
    backgroundColor: '#1E2630',
    borderColor: '#2A3441',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E8EDF4',
  },
  buttonTextPopular: {
    color: '#0A0E14',
  },
  buttonTextCurrent: {
    color: '#6B7A8F',
  },
});
