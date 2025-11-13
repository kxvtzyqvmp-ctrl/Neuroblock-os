import { View, Text, StyleSheet } from 'react-native';
import { LucideIcon } from 'lucide-react-native';

interface MetricCardProps {
  icon: LucideIcon;
  title: string;
  value: string;
  subtitle?: string;
}

export default function MetricCard({ icon: Icon, title, value, subtitle }: MetricCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.iconContainer}>
        <Icon color="#7C9DD9" size={28} strokeWidth={1.5} />
      </View>

      <Text style={styles.title}>{title}</Text>
      <Text style={styles.value}>{value}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
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
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 12,
  },
  title: {
    fontSize: 13,
    fontWeight: '500',
    color: '#9BA8BA',
    marginBottom: 8,
    textAlign: 'center',
  },
  value: {
    fontSize: 28,
    fontWeight: '700',
    color: '#E8EDF4',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    color: '#6B7A8F',
    textAlign: 'center',
  },
});
