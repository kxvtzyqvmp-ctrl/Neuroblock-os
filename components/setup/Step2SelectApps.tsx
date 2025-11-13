import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated } from 'react-native';
import { Check } from 'lucide-react-native';
import { POPULAR_APPS } from '@/types/setup';
import BreathingButton from '@/components/shared/BreathingButton';
import GlassCard from '@/components/shared/GlassCard';

interface Step2SelectAppsProps {
  selectedApps: string[];
  onSelectApp: (app: string) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function Step2SelectApps({
  selectedApps,
  onSelectApp,
  onNext,
  onBack,
}: Step2SelectAppsProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const isAppSelected = (app: string) => selectedApps.includes(app);
  const canProceed = selectedApps.length > 0 && selectedApps.length <= 3;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <Text style={styles.heading}>Dissolve your distractions</Text>

        <Text style={styles.subtext}>
          Choose up to 3 apps to release from your awareness.
        </Text>

        <View style={styles.appsGrid}>
          {POPULAR_APPS.map((app) => {
            const selected = isAppSelected(app);
            const disabled = !selected && selectedApps.length >= 3;

            return (
              <TouchableOpacity
                key={app}
                style={[
                  styles.appCard,
                  selected && styles.appCardSelected,
                  disabled && styles.appCardDisabled,
                ]}
                onPress={() => onSelectApp(app)}
                disabled={disabled}
                activeOpacity={0.7}
              >
                <Text style={[styles.appText, selected && styles.appTextSelected]}>
                  {app}
                </Text>
                {selected && (
                  <View style={styles.checkmark}>
                    <Check color="#0A0E14" size={16} strokeWidth={3} />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {selectedApps.length > 0 && (
          <Text style={styles.counter}>
            {selectedApps.length} of 3 selected
          </Text>
        )}
      </ScrollView>

      <View style={styles.buttonContainer}>
        <BreathingButton
          onPress={onBack}
          text="Back"
          variant="secondary"
        />
        <BreathingButton
          onPress={onNext}
          text="Continue"
          disabled={!canProceed}
        />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
  },
  scrollView: {
    flex: 1,
  },
  heading: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 12,
    marginTop: 24,
    lineHeight: 32,
  },
  subtext: {
    fontSize: 16,
    color: '#C5D0E0',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
  },
  appsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  appCard: {
    backgroundColor: 'rgba(22, 28, 38, 0.6)',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(163, 161, 255, 0.2)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  appCardSelected: {
    backgroundColor: 'rgba(142, 137, 251, 0.3)',
    borderColor: '#8E89FB',
    shadowColor: '#8E89FB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  appCardDisabled: {
    opacity: 0.4,
  },
  appText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#C5D0E0',
  },
  appTextSelected: {
    color: '#FFFFFF',
  },
  checkmark: {
    marginLeft: 4,
  },
  counter: {
    fontSize: 13,
    color: '#A3A1FF',
    textAlign: 'center',
    marginTop: 16,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 24,
  },
  nextButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#0A0E14',
  },
  nextButtonTextDisabled: {
    color: '#6B7A8F',
  },
});
