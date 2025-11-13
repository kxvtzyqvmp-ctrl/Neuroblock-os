import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Check, Sun, Moon, Smartphone, Zap, Wind, Gauge } from 'lucide-react-native';
import { useTheme, ThemeMode, AccentColor, AnimationSpeed } from '../contexts/ThemeContext';
import FloatingNav from '../components/FloatingNav';

export default function AppearanceScreen() {
  const { themeMode, accentColor, animationSpeed, colors, setThemeMode, setAccentColor, setAnimationSpeed } = useTheme();
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const feedbackAnim = useRef(new Animated.Value(0)).current;

  const showFeedback = (message: string) => {
    setFeedbackMessage(message);
    Animated.sequence([
      Animated.timing(feedbackAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.delay(2000),
      Animated.timing(feedbackAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => setFeedbackMessage(''));
  };

  const handleThemeChange = async (mode: ThemeMode) => {
    await setThemeMode(mode);
    const messages: Record<ThemeMode, string> = {
      light: 'Theme: Bright & Clean',
      dark: 'Theme: Calm & Focused',
      amoled: 'Theme: Pure Black Silence',
      system: 'Theme: Follow My Device',
    };
    showFeedback(messages[mode]);
  };

  const handleAccentChange = async (color: AccentColor) => {
    await setAccentColor(color);
    const colorNames: Record<AccentColor, string> = {
      violet: 'Violet',
      teal: 'Teal',
      blue: 'Blue',
      amber: 'Amber',
      rose: 'Rose',
    };
    showFeedback(`Accent: ${colorNames[color]}`);
  };

  const handleAnimationSpeedChange = async (speed: AnimationSpeed) => {
    await setAnimationSpeed(speed);
    const speedNames: Record<AnimationSpeed, string> = {
      0.6: 'Relaxed',
      1: 'Normal',
      1.5: 'Snappy',
      0: 'Zen Mode',
    };
    showFeedback(`Speed: ${speedNames[speed]}`);
  };

  const themes: { mode: ThemeMode; label: string; sublabel: string; icon: any }[] = [
    { mode: 'light', label: 'Light', sublabel: 'Bright & Clean', icon: Sun },
    { mode: 'dark', label: 'Dark', sublabel: 'Calm & Focused', icon: Moon },
    { mode: 'amoled', label: 'AMOLED', sublabel: 'Pure Black', icon: Zap },
    { mode: 'system', label: 'System', sublabel: 'Auto', icon: Smartphone },
  ];

  const accents: { color: AccentColor; hex: string; label: string }[] = [
    { color: 'violet', hex: '#8E89FB', label: 'Violet' },
    { color: 'teal', hex: '#4ED4C7', label: 'Teal' },
    { color: 'blue', hex: '#5A6FFF', label: 'Blue' },
    { color: 'amber', hex: '#FFC46B', label: 'Amber' },
    { color: 'rose', hex: '#F6768E', label: 'Rose' },
  ];

  const speeds: { speed: AnimationSpeed; label: string; icon: any }[] = [
    { speed: 0.6, label: 'Slow', icon: Wind },
    { speed: 1, label: 'Normal', icon: Gauge },
    { speed: 1.5, label: 'Fast', icon: Zap },
    { speed: 0, label: 'Zen', icon: Moon },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={themeMode === 'light' ? 'dark' : 'light'} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Appearance</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Customize your experience
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Theme</Text>
          <View style={styles.themeGrid}>
            {themes.map((theme) => {
              const Icon = theme.icon;
              const isSelected = themeMode === theme.mode;
              return (
                <TouchableOpacity
                  key={theme.mode}
                  style={[
                    styles.optionCard,
                    { backgroundColor: colors.card, borderColor: colors.border },
                    isSelected && { borderColor: colors.accent, borderWidth: 2 },
                  ]}
                  onPress={() => handleThemeChange(theme.mode)}
                  activeOpacity={0.7}
                >
                  <Icon
                    size={24}
                    color={isSelected ? colors.accent : colors.textSecondary}
                    strokeWidth={2}
                  />
                  <Text style={[styles.optionLabel, { color: colors.text }]}>{theme.label}</Text>
                  <Text style={[styles.optionSublabel, { color: colors.textSecondary }]}>
                    {theme.sublabel}
                  </Text>
                  {isSelected && (
                    <View style={[styles.checkBadge, { backgroundColor: colors.accent }]}>
                      <Check size={14} color="#FFFFFF" strokeWidth={3} />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Accent Color</Text>
          <View style={styles.colorGrid}>
            {accents.map((accent) => {
              const isSelected = accentColor === accent.color;
              return (
                <TouchableOpacity
                  key={accent.color}
                  style={[
                    styles.colorCard,
                    { backgroundColor: colors.card, borderColor: colors.border },
                    isSelected && { borderColor: accent.hex, borderWidth: 2 },
                  ]}
                  onPress={() => handleAccentChange(accent.color)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.colorPreview, { backgroundColor: accent.hex }]}>
                    {isSelected && (
                      <View style={styles.colorCheck}>
                        <Check size={16} color="#FFFFFF" strokeWidth={3} />
                      </View>
                    )}
                  </View>
                  <Text style={[styles.colorLabel, { color: colors.text }]}>{accent.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Animation Speed</Text>
          <View style={styles.speedGrid}>
            {speeds.map((speed) => {
              const Icon = speed.icon;
              const isSelected = animationSpeed === speed.speed;
              return (
                <TouchableOpacity
                  key={speed.speed}
                  style={[
                    styles.speedCard,
                    { backgroundColor: colors.card, borderColor: colors.border },
                    isSelected && { borderColor: colors.accent, borderWidth: 2 },
                  ]}
                  onPress={() => handleAnimationSpeedChange(speed.speed)}
                  activeOpacity={0.7}
                >
                  <Icon
                    size={24}
                    color={isSelected ? colors.accent : colors.textSecondary}
                    strokeWidth={2}
                  />
                  <Text style={[styles.speedLabel, { color: colors.text }]}>{speed.label}</Text>
                  {isSelected && (
                    <View style={[styles.checkBadge, { backgroundColor: colors.accent }]}>
                      <Check size={12} color="#FFFFFF" strokeWidth={3} />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {feedbackMessage !== '' && (
        <Animated.View
          style={[
            styles.feedbackBanner,
            {
              backgroundColor: colors.accent,
              opacity: feedbackAnim,
              transform: [
                {
                  translateY: feedbackAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-50, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <Text style={styles.feedbackText}>{feedbackMessage}</Text>
        </Animated.View>
      )}

      <FloatingNav activeTab="more" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    letterSpacing: 0.2,
  },
  section: {
    marginBottom: 40,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    letterSpacing: -0.3,
  },
  themeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  optionCard: {
    width: '48%',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    gap: 8,
    position: 'relative',
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  optionSublabel: {
    fontSize: 13,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  colorCard: {
    width: '30%',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    gap: 8,
  },
  colorPreview: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorCheck: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  speedGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  speedCard: {
    width: '48%',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    gap: 8,
    position: 'relative',
  },
  speedLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  checkBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  feedbackBanner: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 30,
    left: 20,
    right: 20,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  feedbackText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
