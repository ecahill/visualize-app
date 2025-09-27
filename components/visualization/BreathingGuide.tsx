import React, { useEffect } from 'react';
import { StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

import { Text, View } from '@/components/Themed';

const { width } = Dimensions.get('window');

interface BreathingGuideProps {
  isActive: boolean;
  size?: number;
}

export default function BreathingGuide({ isActive, size = 200 }: BreathingGuideProps) {
  const breathScale = useSharedValue(1);
  const breathOpacity = useSharedValue(0.6);
  const textOpacity = useSharedValue(1);
  const breathPhase = useSharedValue(0); // 0: inhale, 1: hold, 2: exhale, 3: hold

  useEffect(() => {
    if (isActive) {
      // Start breathing animation
      breathScale.value = withRepeat(
        withSequence(
          withTiming(1.3, { duration: 4000, easing: Easing.bezier(0.4, 0, 0.6, 1) }), // Inhale
          withTiming(1.3, { duration: 1000 }), // Hold
          withTiming(1, { duration: 4000, easing: Easing.bezier(0.4, 0, 0.6, 1) }), // Exhale
          withTiming(1, { duration: 1000 }) // Hold
        ),
        -1, // Infinite repeat
        false
      );

      breathOpacity.value = withRepeat(
        withSequence(
          withTiming(0.9, { duration: 4000 }),
          withTiming(0.9, { duration: 1000 }),
          withTiming(0.6, { duration: 4000 }),
          withTiming(0.6, { duration: 1000 })
        ),
        -1,
        false
      );

      // Breathing phase indicators
      breathPhase.value = withRepeat(
        withSequence(
          withTiming(0, { duration: 4000 }), // Inhale
          withTiming(1, { duration: 1000 }), // Hold
          withTiming(2, { duration: 4000 }), // Exhale
          withTiming(3, { duration: 1000 })  // Hold
        ),
        -1,
        false
      );
    } else {
      // Reset to initial state
      breathScale.value = withTiming(1, { duration: 500 });
      breathOpacity.value = withTiming(0.6, { duration: 500 });
      breathPhase.value = 0;
    }
  }, [isActive]);

  const breathingStyle = useAnimatedStyle(() => ({
    transform: [{ scale: breathScale.value }],
    opacity: breathOpacity.value,
  }));

  const getBreathingText = () => {
    // Don't use worklet here as this is called from the main thread
    const phase = Math.floor(breathPhase.value);
    switch (phase) {
      case 0: return 'Inhale slowly...';
      case 1: return 'Hold gently...';
      case 2: return 'Exhale completely...';
      case 3: return 'Rest peacefully...';
      default: return 'Breathe naturally...';
    }
  };

  const breathingTextStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
  }));

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Animated.View style={[styles.breathingCircle, breathingStyle]}>
        <LinearGradient
          colors={['#FF6B9D', '#E4C1F9', '#FFD93D']}
          style={[styles.gradient, { width: size * 0.8, height: size * 0.8, borderRadius: size * 0.4 }]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.innerCircle}>
            <LinearGradient
              colors={['rgba(255, 255, 255, 0.9)', 'rgba(255, 255, 255, 0.7)']}
              style={styles.innerGradient}
            >
              <Animated.Text style={[styles.breathingText, breathingTextStyle]}>
                {isActive ? 'Breathe' : 'Ready'}
              </Animated.Text>
            </LinearGradient>
          </View>
        </LinearGradient>
      </Animated.View>

      {isActive && (
        <Animated.Text style={[styles.instructionText, breathingTextStyle]}>
          Follow the circle's rhythm
        </Animated.Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  breathingCircle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradient: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  innerCircle: {
    width: '70%',
    height: '70%',
    borderRadius: 1000,
    overflow: 'hidden',
  },
  innerGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  breathingText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2D3436',
    textAlign: 'center',
  },
  instructionText: {
    fontSize: 14,
    color: 'white',
    textAlign: 'center',
    marginTop: 20,
    fontStyle: 'italic',
  },
});