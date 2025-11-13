import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Sparkles } from 'lucide-react-native';
import BreathingButton from '@/components/shared/BreathingButton';

interface Step1WelcomeProps {
  onNext: () => void;
}

export default function Step1Welcome({ onNext }: Step1WelcomeProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const letterAnims = useRef([...Array(30)].map(() => new Animated.Value(0))).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1200,
      useNativeDriver: true,
    }).start();

    const text = "Begin your journey to clarity";
    text.split('').forEach((_, index) => {
      Animated.timing(letterAnims[index], {
        toValue: 1,
        duration: 600,
        delay: 800 + index * 40,
        useNativeDriver: true,
      }).start();
    });
  }, []);

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <View style={styles.iconGlow}>
            <Sparkles color="#A3A1FF" size={64} strokeWidth={1.2} />
          </View>
        </View>

        <View style={styles.titleContainer}>
          {("Begin your journey to clarity").split('').map((letter, index) => (
            <Animated.Text
              key={index}
              style={[
                styles.titleLetter,
                {
                  opacity: letterAnims[index],
                  transform: [
                    {
                      translateY: letterAnims[index]?.interpolate({
                        inputRange: [0, 1],
                        outputRange: [15, 0],
                      }) || 0,
                    },
                  ],
                },
              ]}
            >
              {letter === ' ' ? '\u00A0' : letter}
            </Animated.Text>
          ))}
        </View>

        <Animated.Text
          style={[
            styles.description,
            {
              opacity: fadeAnim,
              transform: [
                {
                  translateY: fadeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0],
                  }),
                },
              ],
            },
          ]}
        >
          In six mindful steps, we will craft your personal sanctuary from digital noise.
        </Animated.Text>

        <Animated.View
          style={[
            styles.featuresList,
            {
              opacity: fadeAnim,
              transform: [
                {
                  translateY: fadeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [30, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={styles.featureItem}>
            <View style={styles.featureDot} />
            <Text style={styles.featureText}>Choose which apps to dissolve from your attention</Text>
          </View>
          <View style={styles.featureItem}>
            <View style={styles.featureDot} />
            <Text style={styles.featureText}>Set boundaries that honor your focus rhythm</Text>
          </View>
          <View style={styles.featureItem}>
            <View style={styles.featureDot} />
            <Text style={styles.featureText}>Create space for what truly matters</Text>
          </View>
        </Animated.View>

        <View style={styles.buttonContainer}>
          <BreathingButton onPress={onNext} text="Begin Setup" />
        </View>

        <Text style={styles.timeEstimate}>~ 2 minutes of intentional choice</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 40,
  },
  iconGlow: {
    shadowColor: '#A3A1FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 24,
    elevation: 10,
  },
  titleContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 24,
    paddingHorizontal: 10,
  },
  titleLetter: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.3,
    textShadowColor: 'rgba(163, 161, 255, 0.3)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 16,
  },
  description: {
    fontSize: 16,
    color: '#C5D0E0',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
    paddingHorizontal: 20,
    fontWeight: '400',
  },
  featuresList: {
    width: '100%',
    gap: 20,
    marginBottom: 48,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 10,
  },
  featureDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#8E89FB',
    shadowColor: '#8E89FB',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
  },
  featureText: {
    flex: 1,
    fontSize: 15,
    color: '#9BA8BA',
    lineHeight: 22,
    fontWeight: '400',
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 24,
  },
  timeEstimate: {
    fontSize: 12,
    color: 'rgba(155, 168, 186, 0.5)',
    letterSpacing: 1,
    fontWeight: '400',
  },
});
