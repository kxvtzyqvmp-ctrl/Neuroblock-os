import { View, Text, StyleSheet } from 'react-native';
import { ShieldBan } from 'lucide-react-native';

interface BlockedAppsCardProps {
  apps: string[];
}

export default function BlockedAppsCard({ apps }: BlockedAppsCardProps) {
  const displayApps = apps.slice(0, 3);

  return (
    <View style={styles.card}>
      <View style={styles.iconContainer}>
        <ShieldBan color="#7C9DD9" size={28} strokeWidth={1.5} />
      </View>

      <Text style={styles.title}>Apps Blocked</Text>

      <View style={styles.appsContainer}>
        {displayApps.map((app, index) => (
          <View key={index} style={styles.appTag}>
            <Text style={styles.appText}>{app}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.subtitle}>{apps.length} total</Text>
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
    marginBottom: 12,
    textAlign: 'center',
  },
  appsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    justifyContent: 'center',
    marginBottom: 8,
  },
  appTag: {
    backgroundColor: '#0A0E14',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2A3441',
  },
  appText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#7C9DD9',
  },
  subtitle: {
    fontSize: 12,
    color: '#6B7A8F',
    textAlign: 'center',
  },
});
