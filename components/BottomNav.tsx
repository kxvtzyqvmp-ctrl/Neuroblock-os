import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LayoutDashboard, Sparkles, Settings } from 'lucide-react-native';

interface BottomNavProps {
  currentScreen: 'dashboard' | 'coach' | 'settings';
  onNavigate: (screen: 'dashboard' | 'coach' | 'settings') => void;
}

export default function BottomNav({ currentScreen, onNavigate }: BottomNavProps) {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.navItem}
        onPress={() => onNavigate('dashboard')}
      >
        <LayoutDashboard
          color={currentScreen === 'dashboard' ? '#7C9DD9' : '#6B7A8F'}
          size={24}
          strokeWidth={2}
        />
        <Text
          style={[
            styles.navLabel,
            currentScreen === 'dashboard' && styles.navLabelActive,
          ]}
        >
          Dashboard
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.navItem}
        onPress={() => onNavigate('coach')}
      >
        <Sparkles
          color={currentScreen === 'coach' ? '#7C9DD9' : '#6B7A8F'}
          size={24}
          strokeWidth={2}
        />
        <Text
          style={[
            styles.navLabel,
            currentScreen === 'coach' && styles.navLabelActive,
          ]}
        >
          AI Coach
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.navItem}
        onPress={() => onNavigate('settings')}
      >
        <Settings
          color={currentScreen === 'settings' ? '#7C9DD9' : '#6B7A8F'}
          size={24}
          strokeWidth={2}
        />
        <Text
          style={[
            styles.navLabel,
            currentScreen === 'settings' && styles.navLabelActive,
          ]}
        >
          Settings
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#161C26',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: '#2A3441',
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  navLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7A8F',
  },
  navLabelActive: {
    color: '#7C9DD9',
  },
});
