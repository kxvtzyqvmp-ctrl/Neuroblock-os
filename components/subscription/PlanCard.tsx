import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Check, Sparkles } from 'lucide-react-native';

interface PlanCardProps {
  name: string;
  price: number;
  billingCycle: string | null;
  features: string[];
  badge?: string;
  isPopular?: boolean;
  isCurrentPlan?: boolean;
  onSelect: () => void;
}

export default function PlanCard({
  name,
  price,
  billingCycle,
  features,
  badge,
  isPopular = false,
  isCurrentPlan = false,
  onSelect,
}: PlanCardProps) {
  return (
    <View style={[styles.card, isPopular && styles.cardPopular]}>
      {badge && (
        <View style={styles.badge}>
          <Sparkles color="#0A0E14" size={14} strokeWidth={2} />
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      )}

      <View style={styles.header}>
        <Text style={styles.planName}>{name}</Text>
        <View style={styles.priceContainer}>
          <Text style={styles.price}>
            {price === 0 ? 'Free' : `$${price.toFixed(2)}`}
          </Text>
          {billingCycle && billingCycle !== 'lifetime' && (
            <Text style={styles.billingCycle}>/{billingCycle === 'monthly' ? 'mo' : 'yr'}</Text>
          )}
          {billingCycle === 'lifetime' && (
            <Text style={styles.billingCycle}> once</Text>
          )}
        </View>
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
        disabled={isCurrentPlan}
      >
        <Text
          style={[
            styles.buttonText,
            isPopular && styles.buttonTextPopular,
            isCurrentPlan && styles.buttonTextCurrent,
          ]}
        >
          {isCurrentPlan ? 'Current Plan' : price === 0 ? 'Current Plan' : 'Choose Plan'}
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
  },
  price: {
    fontSize: 36,
    fontWeight: '700',
    color: '#E8EDF4',
  },
  billingCycle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#9BA8BA',
    marginLeft: 4,
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
