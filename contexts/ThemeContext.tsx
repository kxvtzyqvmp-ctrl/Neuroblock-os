import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appearance } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

export type ThemeMode = 'light' | 'dark' | 'amoled' | 'system';
export type AccentColor = 'violet' | 'teal' | 'blue' | 'amber' | 'rose';
export type AnimationSpeed = 0.6 | 1 | 1.5 | 0;

export interface ThemeColors {
  background: string;
  surface: string;
  card: string;
  text: string;
  textSecondary: string;
  border: string;
  accent: string;
  accentLight: string;
  accentDark: string;
  error: string;
  success: string;
  warning: string;
}

interface ThemeContextType {
  themeMode: ThemeMode;
  accentColor: AccentColor;
  animationSpeed: AnimationSpeed;
  colors: ThemeColors;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
  setAccentColor: (color: AccentColor) => Promise<void>;
  setAnimationSpeed: (speed: AnimationSpeed) => Promise<void>;
  isLoading: boolean;
}

const THEME_STORAGE_KEY = '@dopamine_detox_theme';
const ACCENT_STORAGE_KEY = '@dopamine_detox_accent';
const ANIMATION_STORAGE_KEY = '@dopamine_detox_animation_speed';

const accentColorMap: Record<AccentColor, { primary: string; light: string; dark: string }> = {
  violet: { primary: '#8E89FB', light: '#A3A1FF', dark: '#7C76E8' },
  teal: { primary: '#4ED4C7', light: '#6FE0D5', dark: '#3BC0B3' },
  blue: { primary: '#5A6FFF', light: '#7C8FFF', dark: '#4659E8' },
  amber: { primary: '#FFC46B', light: '#FFD08F', dark: '#E5B05E' },
  rose: { primary: '#F6768E', light: '#FF91A4', dark: '#E0637A' },
};

const getThemeColors = (mode: ThemeMode, accent: AccentColor, systemScheme: 'light' | 'dark'): ThemeColors => {
  const effectiveMode = mode === 'system' ? systemScheme : mode;
  const accentColors = accentColorMap[accent];

  if (effectiveMode === 'light') {
    return {
      background: '#FFFFFF',
      surface: '#F8F9FA',
      card: '#FFFFFF',
      text: '#1A1A1A',
      textSecondary: '#6B7280',
      border: '#E5E7EB',
      accent: accentColors.primary,
      accentLight: accentColors.light,
      accentDark: accentColors.dark,
      error: '#EF4444',
      success: '#10B981',
      warning: '#F59E0B',
    };
  }

  if (effectiveMode === 'amoled') {
    return {
      background: '#000000',
      surface: '#0A0A0A',
      card: '#121212',
      text: '#FFFFFF',
      textSecondary: '#9BA8BA',
      border: '#1F1F1F',
      accent: accentColors.primary,
      accentLight: accentColors.light,
      accentDark: accentColors.dark,
      error: '#F87171',
      success: '#34D399',
      warning: '#FBBF24',
    };
  }

  return {
    background: '#0B0B0B',
    surface: '#1A1B2E',
    card: '#16213E',
    text: '#FFFFFF',
    textSecondary: '#9BA8BA',
    border: '#2A3441',
    accent: accentColors.primary,
    accentLight: accentColors.light,
    accentDark: accentColors.dark,
    error: '#F87171',
    success: '#34D399',
    warning: '#FBBF24',
  };
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [themeMode, setThemeModeState] = useState<ThemeMode>('dark');
  const [accentColor, setAccentColorState] = useState<AccentColor>('violet');
  const [animationSpeed, setAnimationSpeedState] = useState<AnimationSpeed>(1);
  const [isLoading, setIsLoading] = useState(true);
  const [systemScheme, setSystemScheme] = useState<'light' | 'dark'>(
    Appearance.getColorScheme() || 'dark'
  );

  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemScheme(colorScheme || 'dark');
    });

    return () => subscription.remove();
  }, []);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const [storedTheme, storedAccent, storedSpeed] = await Promise.all([
        AsyncStorage.getItem(THEME_STORAGE_KEY),
        AsyncStorage.getItem(ACCENT_STORAGE_KEY),
        AsyncStorage.getItem(ANIMATION_STORAGE_KEY),
      ]);

      if (storedTheme) setThemeModeState(storedTheme as ThemeMode);
      if (storedAccent) setAccentColorState(storedAccent as AccentColor);
      if (storedSpeed) setAnimationSpeedState(parseFloat(storedSpeed) as AnimationSpeed);
    } catch (error) {
      console.error('Failed to load theme preferences:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const setThemeMode = async (mode: ThemeMode) => {
    try {
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      setThemeModeState(mode);
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch (error) {
      console.error('Failed to save theme mode:', error);
    }
  };

  const setAccentColor = async (color: AccentColor) => {
    try {
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      setAccentColorState(color);
      await AsyncStorage.setItem(ACCENT_STORAGE_KEY, color);
    } catch (error) {
      console.error('Failed to save accent color:', error);
    }
  };

  const setAnimationSpeed = async (speed: AnimationSpeed) => {
    try {
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      setAnimationSpeedState(speed);
      await AsyncStorage.setItem(ANIMATION_STORAGE_KEY, speed.toString());
    } catch (error) {
      console.error('Failed to save animation speed:', error);
    }
  };

  const colors = getThemeColors(themeMode, accentColor, systemScheme);

  return (
    <ThemeContext.Provider
      value={{
        themeMode,
        accentColor,
        animationSpeed,
        colors,
        setThemeMode,
        setAccentColor,
        setAnimationSpeed,
        isLoading,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
