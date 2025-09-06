import React, { useEffect } from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate,
  interpolateColor,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

interface AnimatedGradientProps {
  colors: string[];
  style?: ViewStyle;
  children?: React.ReactNode;
  duration?: number;
  direction?: 'horizontal' | 'vertical' | 'diagonal' | 'radial';
  animationType?: 'shift' | 'wave' | 'breathe' | 'pulse';
}

const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

export default function AnimatedGradient({
  colors,
  style,
  children,
  duration = 4000,
  direction = 'diagonal',
  animationType = 'shift',
}: AnimatedGradientProps) {
  const animation = useSharedValue(0);

  useEffect(() => {
    animation.value = withRepeat(
      withTiming(1, {
        duration,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      true
    );
  }, [duration]);

  const getGradientProps = () => {
    switch (direction) {
      case 'horizontal':
        return { start: { x: 0, y: 0 }, end: { x: 1, y: 0 } };
      case 'vertical':
        return { start: { x: 0, y: 0 }, end: { x: 0, y: 1 } };
      case 'radial':
        return { start: { x: 0.5, y: 0.5 }, end: { x: 1, y: 1 } };
      default:
        return { start: { x: 0, y: 0 }, end: { x: 1, y: 1 } };
    }
  };

  const animatedStyle = useAnimatedStyle(() => {
    switch (animationType) {
      case 'wave':
        return {
          transform: [
            {
              translateX: interpolate(
                animation.value,
                [0, 1],
                [-50, 50]
              ),
            },
          ],
        };
      
      case 'breathe':
        return {
          transform: [
            {
              scale: interpolate(
                animation.value,
                [0, 0.5, 1],
                [1, 1.02, 1]
              ),
            },
          ],
        };
      
      case 'pulse':
        return {
          opacity: interpolate(
            animation.value,
            [0, 0.5, 1],
            [0.8, 1, 0.8]
          ),
        };
      
      default: // shift
        return {};
    }
  });

  const getAnimatedColors = () => {
    if (animationType !== 'shift') return colors;
    
    // For shift animation, we'll cycle through colors
    const colorCount = colors.length;
    const animatedColors = [];
    
    for (let i = 0; i < colorCount; i++) {
      const nextIndex = (i + 1) % colorCount;
      const animatedColor = interpolateColor(
        animation.value,
        [0, 1],
        [colors[i], colors[nextIndex]]
      );
      animatedColors.push(animatedColor);
    }
    
    return animatedColors;
  };

  return (
    <AnimatedLinearGradient
      colors={getAnimatedColors() as any}
      style={[style, animatedStyle]}
      {...getGradientProps()}
    >
      {children}
    </AnimatedLinearGradient>
  );
}

// Pre-configured animated gradients
export function ShiftingRainbow({
  style,
  children,
  duration = 6000,
}: {
  style?: ViewStyle;
  children?: React.ReactNode;
  duration?: number;
}) {
  return (
    <AnimatedGradient
      colors={['#FF6B9D', '#E4C1F9', '#FFD93D', '#4ECDC4', '#45B7D1']}
      style={style}
      duration={duration}
      animationType="shift"
      direction="diagonal"
    >
      {children}
    </AnimatedGradient>
  );
}

export function BreathingGradient({
  style,
  children,
  colors = ['#F8BBD9', '#E4C1F9'],
}: {
  style?: ViewStyle;
  children?: React.ReactNode;
  colors?: string[];
}) {
  return (
    <AnimatedGradient
      colors={colors}
      style={style}
      duration={4000}
      animationType="breathe"
      direction="radial"
    >
      {children}
    </AnimatedGradient>
  );
}

export function PulsingGradient({
  style,
  children,
  colors = ['#6A4C93', '#9D4EDD'],
  duration = 2000,
}: {
  style?: ViewStyle;
  children?: React.ReactNode;
  colors?: string[];
  duration?: number;
}) {
  return (
    <AnimatedGradient
      colors={colors}
      style={style}
      duration={duration}
      animationType="pulse"
      direction="diagonal"
    >
      {children}
    </AnimatedGradient>
  );
}

export function WavingGradient({
  style,
  children,
  colors = ['#FF6B9D', '#FFB4D1'],
}: {
  style?: ViewStyle;
  children?: React.ReactNode;
  colors?: string[];
}) {
  return (
    <AnimatedGradient
      colors={colors}
      style={style}
      duration={3000}
      animationType="wave"
      direction="horizontal"
    >
      {children}
    </AnimatedGradient>
  );
}

// Advanced shimmer gradient effect
export function ShimmerGradient({
  style,
  children,
  shimmerColor = 'rgba(255, 255, 255, 0.3)',
  baseColor = 'rgba(255, 255, 255, 0.1)',
  duration = 1500,
}: {
  style?: ViewStyle;
  children?: React.ReactNode;
  shimmerColor?: string;
  baseColor?: string;
  duration?: number;
}) {
  const shimmerAnimation = useSharedValue(0);

  useEffect(() => {
    shimmerAnimation.value = withRepeat(
      withTiming(1, {
        duration,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      false
    );
  }, [duration]);

  const shimmerStyle = useAnimatedStyle(() => {
    const translateX = interpolate(
      shimmerAnimation.value,
      [0, 1],
      [-100, 100]
    );

    return {
      transform: [{ translateX: `${translateX}%` }],
    };
  });

  return (
    <Animated.View style={[styles.shimmerContainer, style]}>
      <LinearGradient
        colors={[baseColor, baseColor]}
        style={StyleSheet.absoluteFill}
      />
      <Animated.View style={[StyleSheet.absoluteFill, shimmerStyle]}>
        <LinearGradient
          colors={[baseColor, shimmerColor, baseColor]}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        />
      </Animated.View>
      {children}
    </Animated.View>
  );
}

// Gradient that responds to scroll position
export function ScrollResponsiveGradient({
  scrollY,
  colors,
  style,
  children,
  scrollRange = [0, 200],
}: {
  scrollY: Animated.SharedValue<number>;
  colors: string[][];
  style?: ViewStyle;
  children?: React.ReactNode;
  scrollRange?: [number, number];
}) {
  const animatedStyle = useAnimatedStyle(() => {
    const progress = interpolate(
      scrollY.value,
      scrollRange,
      [0, 1],
      'clamp'
    );

    const animatedColors = colors[0].map((color, index) => {
      return interpolateColor(
        progress,
        [0, 1],
        [colors[0][index], colors[1][index] || colors[1][0]]
      );
    });

    return {
      // We can't directly animate colors in style, so we'll use opacity tricks
      opacity: interpolate(progress, [0, 0.5, 1], [0.8, 1, 0.9]),
    };
  });

  return (
    <AnimatedLinearGradient
      colors={colors[0] as any}
      style={[style, animatedStyle]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      {children}
    </AnimatedLinearGradient>
  );
}

const styles = StyleSheet.create({
  shimmerContainer: {
    overflow: 'hidden',
  },
});