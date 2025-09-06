import React, { ReactNode } from 'react';
import { StyleSheet, Dimensions, ScrollViewProps } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedScrollHandler,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

interface ParallaxScrollViewProps extends ScrollViewProps {
  children: ReactNode;
  backgroundChildren?: ReactNode;
  parallaxHeaderHeight?: number;
  renderBackground?: () => ReactNode;
  gradientColors?: string[];
}

export default function ParallaxScrollView({
  children,
  backgroundChildren,
  parallaxHeaderHeight = height * 0.5,
  renderBackground,
  gradientColors = ['#F8BBD9', '#E4C1F9', '#FFD93D'],
  ...scrollViewProps
}: ParallaxScrollViewProps) {
  const scrollY = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
  });

  const backgroundStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateY: interpolate(
            scrollY.value,
            [0, parallaxHeaderHeight],
            [0, -parallaxHeaderHeight * 0.5],
            Extrapolate.CLAMP
          ),
        },
        {
          scale: interpolate(
            scrollY.value,
            [-100, 0],
            [1.2, 1],
            Extrapolate.CLAMP
          ),
        },
      ],
      opacity: interpolate(
        scrollY.value,
        [0, parallaxHeaderHeight * 0.8, parallaxHeaderHeight],
        [1, 0.8, 0.3],
        Extrapolate.CLAMP
      ),
    };
  });

  const overlayStyle = useAnimatedStyle(() => {
    return {
      opacity: interpolate(
        scrollY.value,
        [0, parallaxHeaderHeight * 0.5],
        [0, 0.7],
        Extrapolate.CLAMP
      ),
    };
  });

  const contentStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateY: interpolate(
            scrollY.value,
            [0, parallaxHeaderHeight],
            [0, -parallaxHeaderHeight * 0.2],
            Extrapolate.CLAMP
          ),
        },
      ],
    };
  });

  return (
    <Animated.View style={styles.container}>
      {/* Parallax Background */}
      <Animated.View style={[styles.background, backgroundStyle]}>
        {renderBackground ? (
          renderBackground()
        ) : (
          <LinearGradient
            colors={gradientColors}
            style={styles.defaultBackground}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            locations={[0, 0.6, 1]}
          />
        )}
        {backgroundChildren}
      </Animated.View>

      {/* Scroll Overlay */}
      <Animated.View style={[styles.overlay, overlayStyle]} />

      {/* Scrollable Content */}
      <Animated.ScrollView
        {...scrollViewProps}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: parallaxHeaderHeight },
          scrollViewProps.contentContainerStyle,
        ]}
      >
        <Animated.View style={contentStyle}>
          {children}
        </Animated.View>
      </Animated.ScrollView>
    </Animated.View>
  );
}

// Parallax element component for individual items
interface ParallaxElementProps {
  children: ReactNode;
  scrollY: Animated.SharedValue<number>;
  speed?: number;
  style?: any;
}

export function ParallaxElement({
  children,
  scrollY,
  speed = 0.5,
  style,
}: ParallaxElementProps) {
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateY: interpolate(
            scrollY.value,
            [0, height],
            [0, -height * speed],
            Extrapolate.EXTEND
          ),
        },
      ],
    };
  });

  return (
    <Animated.View style={[animatedStyle, style]}>
      {children}
    </Animated.View>
  );
}

// Floating element that moves with parallax
interface FloatingElementProps {
  children: ReactNode;
  scrollY: Animated.SharedValue<number>;
  amplitude?: number;
  frequency?: number;
  initialPosition?: { x: number; y: number };
}

export function FloatingElement({
  children,
  scrollY,
  amplitude = 20,
  frequency = 0.01,
  initialPosition = { x: 0, y: 0 },
}: FloatingElementProps) {
  const animatedStyle = useAnimatedStyle(() => {
    const translateY = Math.sin(scrollY.value * frequency) * amplitude;
    const translateX = Math.cos(scrollY.value * frequency * 0.8) * amplitude * 0.5;

    return {
      transform: [
        { translateX: initialPosition.x + translateX },
        { translateY: initialPosition.y + translateY },
      ],
    };
  });

  return (
    <Animated.View style={[styles.floatingElement, animatedStyle]}>
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: height,
    zIndex: -1,
  },
  defaultBackground: {
    flex: 1,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: height,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    zIndex: 0,
  },
  scrollView: {
    flex: 1,
    zIndex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  floatingElement: {
    position: 'absolute',
  },
});