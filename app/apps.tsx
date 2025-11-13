import { View, StyleSheet } from 'react-native';
import BlockedAppsManager from '@/components/blocked-apps/BlockedAppsManager';
import AuroraBackground from '@/components/shared/AuroraBackground';
import FloatingNav from '@/components/FloatingNav';

export default function AppsScreen() {
  return (
    <View style={styles.container}>
      <AuroraBackground />
      <BlockedAppsManager />
      <FloatingNav activeTab="blocks" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0B0B',
  },
});
