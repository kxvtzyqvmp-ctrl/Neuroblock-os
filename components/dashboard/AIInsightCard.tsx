import { View, Text, StyleSheet } from 'react-native';
import { Lightbulb, TrendingUp, Flame } from 'lucide-react-native';

interface AIInsightCardProps {
  text: string;
  type: 'progress' | 'streak' | 'suggestion';
}

export default function AIInsightCard({ text, type }: AIInsightCardProps) {
  const getIcon = () => {
    switch (type) {
      case 'progress':
        return TrendingUp;
      case 'streak':
        return Flame;
      case 'suggestion':
        return Lightbulb;
    }
  };

  const Icon = getIcon();

  return (
    <View style={styles.card}>
      <View style={styles.iconContainer}>
        <Icon color="#7C9DD9" size={20} strokeWidth={2} />
      </View>
      <Text style={styles.text}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#161C26',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    borderWidth: 1,
    borderColor: '#2A3441',
    borderLeftWidth: 3,
    borderLeftColor: '#7C9DD9',
  },
  iconContainer: {
    marginTop: 2,
  },
  text: {
    flex: 1,
    fontSize: 14,
    color: '#E8EDF4',
    lineHeight: 20,
  },
});
