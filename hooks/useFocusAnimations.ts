/**
 * useFocusAnimations Hook
 * 
 * Manages premium motion design animations for the focus button:
 * - Pulse animation (idle)
 * - Fill animation (active)
 * - Scale breathing effect
 * - Glow intensity
 * 
 * Uses React Native Reanimated for smooth 60fps animations.
 */

import { useEffect, useRef } from 'react';
import { useSharedValue, useAnimatedStyle, withRepeat, withTiming, withSequence, Easing, interpolate, Extrapolate } from 'react-native-reanimated';

interface UseFocusAnimationsResult {
  pulseAnim: ReturnType<typeof useSharedValue<number>>;
  fillAnim: ReturnType<typeof useSharedValue<number>>;
  scaleAnim: ReturnType<typeof useSharedValue<number>>;
  glowAnim: ReturnType<typeof useSharedValue<number>>;
  pulseStyle: ReturnType<typeof useAnimatedStyle>;
  fillStyle: ReturnType<typeof useAnimatedStyle>;
  scaleStyle: ReturnType<typeof useAnimatedStyle>;
  glowStyle: ReturnType<typeof useAnimatedStyle>;
  startPulse: () => void;
  stopPulse: () => void;
  startFill: (progress: number) => void;
  resetFill: () => void;
  triggerPress: () => void;
  triggerRelease: () => void;
  triggerEnd: () => void;
}

const PULSE_DURATION = 2000; // 2 seconds
const BREATHE_DURATION = 3000; // 3 seconds

export function useFocusAnimations(): UseFocusAnimationsResult {
  // Animation values
  const pulseAnim = useSharedValue(1);
  const fillAnim = useSharedValue(0);
  const scaleAnim = useSharedValue(1);
  const glowAnim = useSharedValue(0.3);
  const pressAnim = useSharedValue(0);

  // Pulse animation (idle state)
  const startPulse = () => {
    // Scale breathing: 1 → 1.05 → 1
    scaleAnim.value = withRepeat(
      withSequence(
        withTiming(1.05, {
          duration: BREATHE_DURATION / 2,
          easing: Easing.out(Easing.quad),
        }),
        withTiming(1, {
          duration: BREATHE_DURATION / 2,
          easing: Easing.in(Easing.quad),
        })
      ),
      -1, // infinite
      false
    );

    // Glow pulse: 0.3 → 0.6 → 0.3
    glowAnim.value = withRepeat(
      withSequence(
        withTiming(0.6, {
          duration: PULSE_DURATION / 2,
          easing: Easing.out(Easing.ease),
        }),
        withTiming(0.3, {
          duration: PULSE_DURATION / 2,
          easing: Easing.in(Easing.ease),
        })
      ),
      -1, // infinite
      false
    );
  };

  const stopPulse = () => {
    scaleAnim.value = withTiming(1, {
      duration: 300,
      easing: Easing.out(Easing.quad),
    });
    glowAnim.value = withTiming(0.3, {
      duration: 300,
      easing: Easing.out(Easing.quad),
    });
  };

  // Fill animation (active state - countdown progress)
  const startFill = (progress: number) => {
    // progress: 0 (full time) → 1 (time up)
    fillAnim.value = withTiming(1 - progress, {
      duration: 200,
      easing: Easing.out(Easing.quad),
    });
  };

  const resetFill = () => {
    fillAnim.value = withTiming(0, {
      duration: 300,
      easing: Easing.inOut(Easing.ease),
    });
  };

  // Press interaction animations
  const triggerPress = () => {
    // Scale up slightly
    scaleAnim.value = withTiming(1.1, {
      duration: 150,
      easing: Easing.out(Easing.quad),
    });
    
    // Intensify glow
    glowAnim.value = withTiming(1, {
      duration: 150,
      easing: Easing.out(Easing.quad),
    });

    // Press animation
    pressAnim.value = withTiming(1, {
      duration: 150,
      easing: Easing.out(Easing.quad),
    });
  };

  const triggerRelease = () => {
    // Quick brightness flash
    pressAnim.value = withSequence(
      withTiming(1.2, {
        duration: 100,
        easing: Easing.out(Easing.quad),
      }),
      withTiming(0, {
        duration: 200,
        easing: Easing.in(Easing.quad),
      })
    );

    // Return to active state scale
    scaleAnim.value = withTiming(1.05, {
      duration: 200,
      easing: Easing.out(Easing.quad),
    });
  };

  const triggerEnd = () => {
    // Fade out glow
    glowAnim.value = withTiming(0, {
      duration: 500,
      easing: Easing.in(Easing.quad),
    });

    // Scale down
    scaleAnim.value = withSequence(
      withTiming(0.95, {
        duration: 300,
        easing: Easing.in(Easing.quad),
      }),
      withTiming(1, {
        duration: 300,
        easing: Easing.out(Easing.quad),
      })
    );

    // Reset fill
    resetFill();
  };

  // Animated styles
  const pulseStyle = useAnimatedStyle(() => {
    return {
      opacity: interpolate(
        glowAnim.value,
        [0, 1],
        [0.3, 1],
        Extrapolate.CLAMP
      ),
    };
  });

  const fillStyle = useAnimatedStyle(() => {
    return {
      position: 'absolute' as const,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      opacity: fillAnim.value,
    };
  });

  const scaleStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scaleAnim.value }],
    };
  });

  const glowStyle = useAnimatedStyle(() => {
    const brightness = interpolate(
      pressAnim.value,
      [0, 1],
      [1, 1.3],
      Extrapolate.CLAMP
    );

    return {
      opacity: glowAnim.value,
      transform: [{ scale: brightness }],
    };
  });

  return {
    pulseAnim,
    fillAnim,
    scaleAnim,
    glowAnim,
    pulseStyle,
    fillStyle,
    scaleStyle,
    glowStyle,
    startPulse,
    stopPulse,
    startFill,
    resetFill,
    triggerPress,
    triggerRelease,
    triggerEnd,
  };
}

