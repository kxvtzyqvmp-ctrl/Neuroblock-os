import { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';
import { AppStateProvider } from '@/contexts/AppStateContext';
import { initializeRevenueCat } from '@/lib/revenuecatInit';

function RootNavigator() {
  const { themeMode } = useTheme();

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="paywall" />
        <Stack.Screen name="home" />
        <Stack.Screen name="schedules" />
        <Stack.Screen name="settings" />
        <Stack.Screen name="appearance" />
        <Stack.Screen name="notifications" />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style={themeMode === 'light' ? 'dark' : 'light'} />
    </>
  );
}

function AppInitializer({ children }: { children: React.ReactNode }) {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initialize = async () => {
      await initializeRevenueCat();
      setIsInitialized(true);
    };

    initialize();
  }, []);

  if (!isInitialized) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#7C9DD9" />
      </View>
    );
  }

  return <>{children}</>;
}

export default function RootLayout() {
  useFrameworkReady();

  return (
    <AppInitializer>
      <ThemeProvider>
        <AppStateProvider>
          <RootNavigator />
        </AppStateProvider>
      </ThemeProvider>
    </AppInitializer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0B0B0B',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
