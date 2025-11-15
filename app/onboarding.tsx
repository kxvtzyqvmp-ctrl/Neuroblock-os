/**
 * Onboarding Screen
 * 
 * First experience for new users. Introduces the app and guides
 * through initial setup. Replaces the old auth flow.
 * 
 * Flow: Onboarding → Setup → Dashboard (with trial)
 */

import { useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Shield, Brain, Zap, ArrowRight } from 'lucide-react-native';
import { useAppState } from '@/contexts/AppStateContext';
import AuroraBackground from '@/components/shared/AuroraBackground';
import { LinearGradient } from 'expo-linear-gradient';

const ONBOARDING_STEPS = [
  {
    id: 1,
    icon: Shield,
    title: 'Take Control',
    description: 'Block distracting apps and websites. Regain focus and mental clarity.',
    color: '#7C9DD9',
  },
  {
    id: 2,
    icon: Brain,
    title: 'Build Better Habits',
    description: 'Track your progress, build streaks, and celebrate your wins.',
    color: '#9B8AFB',
  },
  {
    id: 3,
    icon: Zap,
    title: 'Stay Focused',
    description: 'AI-powered insights help you understand your habits and stay on track.',
    color: '#F4A261',
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const { completeOnboarding } = useAppState();
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  const handleComplete = async () => {
    // Mark onboarding as complete and navigate to setup
    await completeOnboarding();
      router.replace('/home');
  };

  const step = ONBOARDING_STEPS[currentStep];
  const Icon = step.icon;
  const isLastStep = currentStep === ONBOARDING_STEPS.length - 1;

  return (
    <View style={styles.container}>
      <AuroraBackground />
      
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Skip button */}
        <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>

        {/* Step indicator */}
        <View style={styles.indicatorContainer}>
          {ONBOARDING_STEPS.map((_, index) => (
            <View
              key={index}
              style={[
                styles.indicator,
                index === currentStep && styles.indicatorActive,
              ]}
            />
          ))}
        </View>

        {/* Icon */}
        <View style={[styles.iconContainer, { backgroundColor: `${step.color}20` }]}>
          <Icon size={80} color={step.color} strokeWidth={1.5} />
        </View>

        {/* Content */}
        <View style={styles.textContainer}>
          <Text style={styles.title}>{step.title}</Text>
          <Text style={styles.description}>{step.description}</Text>
        </View>
      </ScrollView>

      {/* Bottom navigation */}
      <View style={styles.bottomContainer}>
        {currentStep > 0 && (
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setCurrentStep(currentStep - 1)}
          >
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.nextButton, isLastStep && styles.nextButtonPrimary]}
          onPress={handleNext}
        >
          {isLastStep ? (
            <LinearGradient
              colors={['#7C9DD9', '#9B8AFB']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.gradientButton}
            >
              <Text style={styles.nextTextPrimary}>Get Started</Text>
              <ArrowRight size={20} color="#E8EDF4" style={{ marginLeft: 8 }} />
            </LinearGradient>
          ) : (
            <>
              <Text style={styles.nextText}>Next</Text>
              <ArrowRight size={20} color="#7C9DD9" style={{ marginLeft: 8 }} />
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0B0B',
  },
  content: {
    flexGrow: 1,
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 120,
    alignItems: 'center',
  },
  skipButton: {
    alignSelf: 'flex-end',
    padding: 8,
  },
  skipText: {
    color: '#9BA8BA',
    fontSize: 16,
    fontWeight: '500',
  },
  indicatorContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 20,
    marginBottom: 60,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2A2A2A',
  },
  indicatorActive: {
    backgroundColor: '#7C9DD9',
    width: 24,
  },
  iconContainer: {
    width: 160,
    height: 160,
    borderRadius: 80,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 48,
  },
  textContainer: {
    alignItems: 'center',
    gap: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#E8EDF4',
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  description: {
    fontSize: 18,
    color: '#9BA8BA',
    textAlign: 'center',
    lineHeight: 26,
    paddingHorizontal: 20,
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 24,
    paddingBottom: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 16,
  },
  backButton: {
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  backText: {
    color: '#9BA8BA',
    fontSize: 16,
    fontWeight: '600',
  },
  nextButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#7C9DD9',
  },
  nextButtonPrimary: {
    borderWidth: 0,
    overflow: 'hidden',
  },
  gradientButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    width: '100%',
  },
  nextText: {
    color: '#7C9DD9',
    fontSize: 16,
    fontWeight: '600',
  },
  nextTextPrimary: {
    color: '#E8EDF4',
    fontSize: 16,
    fontWeight: '600',
  },
});

