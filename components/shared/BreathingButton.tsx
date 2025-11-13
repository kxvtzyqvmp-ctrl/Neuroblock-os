import { useEffect, useRef } from 'react';
import { TouchableOpacity, Text, StyleSheet, Animated, ViewStyle, TextStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface BreathingButtonProps {
  onPress: () => void;
  text: string;
  variant?: 'primary' | 'secondary';
  style?: ViewStyle;
  disabled?: boolean;
}

export default function BreathingButton({
  onPress,
  text,
  variant = 'primary',
  style,
  disabled = false,
}: BreathingButtonProps) {
  const breatheAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (disabled) return;

    Animated.loop(
      Animated.sequence([
        Animated.timing(breatheAnim, {
          toValue: 1.05,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(breatheAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [disabled]);

  if (variant === 'secondary') {
    return (
      <Animated.View style={{ transform: [{ scale: breatheAnim }] }}>
        <TouchableOpacity
          style={[styles.secondaryButton, style, disabled && styles.disabled]}
          onPress={onPress}
          activeOpacity={0.7}
          disabled={disabled}
        >
          <Text style={styles.secondaryButtonText}>{text}</Text>
        </TouchableOpacity>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={{ transform: [{ scale: breatheAnim }] }}>
      <TouchableOpacity
        style={[styles.primaryButton, style, disabled && styles.disabled]}
        onPress={onPress}
        activeOpacity={0.85}
        disabled={disabled}
      >
        <LinearGradient
          colors={['rgba(142, 137, 251, 0.9)', 'rgba(124, 157, 217, 0.9)']}
          style={styles.buttonGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={styles.primaryButtonText}>{text}</Text>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  primaryButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#8E89FB',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  buttonGradient: {
    paddingVertical: 18,
    paddingHorizontal: 48,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  secondaryButton: {
    backgroundColor: 'rgba(42, 52, 65, 0.3)',
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(163, 161, 255, 0.2)',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#A3A1FF',
    letterSpacing: 0.3,
  },
  disabled: {
    opacity: 0.5,
  },
});
