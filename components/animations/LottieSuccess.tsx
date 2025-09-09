import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Dimensions, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withDelay,
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');

interface LottieSuccessProps {
  isVisible: boolean;
  onAnimationComplete?: () => void;
  size?: number;
  type?: 'stars' | 'confetti' | 'sparkle' | 'hearts' | 'completion';
}

// AnimatedLottieView is now conditionally created above

export default function LottieSuccess({
  isVisible,
  onAnimationComplete,
  size = 200,
  type = 'stars'
}: LottieSuccessProps) {
  // Always use PureSuccessAnimation for web compatibility
  // This avoids lottie-react-native web dependency issues
  return (
    <PureSuccessAnimation
      isVisible={isVisible}
      onAnimationComplete={onAnimationComplete}
      size={size}
      type={type}
    />
  );
}

// Alternative: Pure React Native success animation for when Lottie files aren't available
export function PureSuccessAnimation({
  isVisible,
  onAnimationComplete,
  size = 200,
}: LottieSuccessProps) {
  const scale = useSharedValue(0);
  const rotate = useSharedValue(0);
  const sparkleScale = useSharedValue(0);

  useEffect(() => {
    if (isVisible) {
      // Main circle animation
      scale.value = withSequence(
        withSpring(1.2, { duration: 600 }),
        withSpring(1, { duration: 300 })
      );
      
      // Rotation animation
      rotate.value = withSequence(
        withSpring(360, { duration: 800 })
      );
      
      // Sparkle effects
      sparkleScale.value = withDelay(
        400,
        withSequence(
          withSpring(1, { duration: 300 }),
          withDelay(800, withSpring(0, { duration: 300 }))
        )
      );

      // Complete callback
      setTimeout(() => {
        onAnimationComplete?.();
      }, 1500);
    } else {
      scale.value = withSpring(0, { duration: 300 });
      rotate.value = 0;
      sparkleScale.value = 0;
    }
  }, [isVisible]);

  const circleStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { rotate: `${rotate.value}deg` }
    ],
  }));

  const sparkleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: sparkleScale.value }],
  }));

  if (!isVisible) return null;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* Main success circle */}
      <Animated.View style={[styles.successCircle, circleStyle, { width: size * 0.8, height: size * 0.8 }]}>
        <View style={styles.checkmark}>
          <View style={[styles.checkmarkStem, { width: size * 0.15, height: size * 0.08 }]} />
          <View style={[styles.checkmarkKick, { width: size * 0.08, height: size * 0.15 }]} />
        </View>
      </Animated.View>

      {/* Sparkle effects */}
      <Animated.View style={[styles.sparkle, styles.sparkle1, sparkleStyle]} />
      <Animated.View style={[styles.sparkle, styles.sparkle2, sparkleStyle]} />
      <Animated.View style={[styles.sparkle, styles.sparkle3, sparkleStyle]} />
      <Animated.View style={[styles.sparkle, styles.sparkle4, sparkleStyle]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  lottie: {
    // Lottie styles will be applied dynamically
  },
  successCircle: {
    borderRadius: 1000,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  checkmark: {
    position: 'relative',
  },
  checkmarkStem: {
    position: 'absolute',
    backgroundColor: 'white',
    borderRadius: 10,
    transform: [{ rotate: '45deg' }],
    bottom: 0,
    left: 0,
  },
  checkmarkKick: {
    position: 'absolute',
    backgroundColor: 'white',
    borderRadius: 10,
    transform: [{ rotate: '-45deg' }],
    bottom: 0,
    right: 0,
  },
  sparkle: {
    position: 'absolute',
    width: 12,
    height: 12,
    backgroundColor: '#FFD93D',
    borderRadius: 6,
    shadowColor: '#FFD93D',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 5,
  },
  sparkle1: {
    top: '15%',
    left: '20%',
  },
  sparkle2: {
    top: '20%',
    right: '15%',
  },
  sparkle3: {
    bottom: '20%',
    left: '15%',
  },
  sparkle4: {
    bottom: '15%',
    right: '20%',
  },
});