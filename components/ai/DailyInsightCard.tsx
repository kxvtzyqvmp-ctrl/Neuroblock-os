import { View, Text, StyleSheet } from 'react-native';
import { Sparkles, TrendingUp, Target } from 'lucide-react-native';
import { InsightCategory } from '@/lib/aiEngine';

interface DailyInsightCardProps {
  message: string;
  category: InsightCategory;
}

export default function DailyInsightCard({ message, category }: DailyInsightCardProps) {
  const getIcon = () => {
    switch (category) {
      case 'motivation':
        return TrendingUp;
      case 'pattern':
        return Target;
      case 'suggestion':
        return Sparkles;
      case 'milestone':
        return TrendingUp;
      default:
        return Sparkles;
    }
  };

  const getAccentColor = () => {
    switch (category) {
      case 'motivation':
        return '#5AE38C';
      case 'pattern':
        return '#FECF5E';
      case 'suggestion':
        return '#8E89FB';
      case 'milestone':
        return '#7C9DD9';
      default:
        return '#7C9DD9';
    }
  };

  const Icon = getIcon();
  const accentColor = getAccentColor();

  return (
    <View style={[styles.card, { borderLeftColor: accentColor }]}>
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: `${accentColor}15` }]}>
          <Icon color={accentColor} size={20} strokeWidth={2} />
        </View>
        <Text style={styles.label}>AI Insight</Text>
      </View>
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#161C26',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#2A3441',
    borderLeftWidth: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9BA8BA',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  message: {
    fontSize: 16,
    color: '#E8EDF4',
    lineHeight: 24,
  },
});
