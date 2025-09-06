import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

interface ShimmerEffectProps {
  width: number | string;
  height: number;
  borderRadius?: number;
  style?: any;
  shimmerColors?: string[];
  duration?: number;
}

export default function ShimmerEffect({
  width,
  height,
  borderRadius = 8,
  style,
  shimmerColors = ['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.3)', 'rgba(255, 255, 255, 0.1)'],
  duration = 1500,
}: ShimmerEffectProps) {
  const shimmerTranslate = useSharedValue(-1);

  useEffect(() => {
    shimmerTranslate.value = withRepeat(
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
      shimmerTranslate.value,
      [-1, 1],
      [-typeof width === 'number' ? width : 300, typeof width === 'number' ? width * 2 : 600]
    );

    return {
      transform: [{ translateX }],
    };
  });

  return (
    <View
      style={[
        styles.container,
        {
          width,
          height,
          borderRadius,
        },
        style,
      ]}
    >
      <Animated.View style={[styles.shimmer, shimmerStyle]}>
        <LinearGradient
          colors={shimmerColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[
            styles.gradient,
            {
              width: typeof width === 'number' ? width : 300,
              height,
            },
          ]}
        />
      </Animated.View>
    </View>
  );
}

// Pre-made shimmer components for common use cases
export function ShimmerCard({ style }: { style?: any }) {
  return (
    <View style={[styles.cardContainer, style]}>
      <ShimmerEffect width="100%" height={200} borderRadius={16} />
      <View style={styles.cardContent}>
        <ShimmerEffect width="70%" height={20} borderRadius={4} style={{ marginBottom: 8 }} />
        <ShimmerEffect width="90%" height={16} borderRadius={4} style={{ marginBottom: 4 }} />
        <ShimmerEffect width="60%" height={16} borderRadius={4} />
      </View>
    </View>
  );
}

export function ShimmerList({ itemCount = 3 }: { itemCount?: number }) {
  return (
    <View>
      {Array.from({ length: itemCount }).map((_, index) => (
        <View key={index} style={styles.listItem}>
          <ShimmerEffect width={60} height={60} borderRadius={30} />
          <View style={styles.listContent}>
            <ShimmerEffect width="80%" height={18} borderRadius={4} style={{ marginBottom: 6 }} />
            <ShimmerEffect width="100%" height={14} borderRadius={4} style={{ marginBottom: 4 }} />
            <ShimmerEffect width="70%" height={14} borderRadius={4} />
          </View>
        </View>
      ))}
    </View>
  );
}

export function ShimmerText({
  lines = 3,
  lineHeight = 16,
  gap = 8,
  lastLineWidth = '60%',
}: {
  lines?: number;
  lineHeight?: number;
  gap?: number;
  lastLineWidth?: string;
}) {
  return (
    <View>
      {Array.from({ length: lines }).map((_, index) => (
        <ShimmerEffect
          key={index}
          width={index === lines - 1 ? lastLineWidth : '100%'}
          height={lineHeight}
          borderRadius={4}
          style={{ marginBottom: index < lines - 1 ? gap : 0 }}
        />
      ))}
    </View>
  );
}

// Skeleton for home screen cards
export function ShimmerFeatureCard() {
  return (
    <View style={styles.featureCard}>
      <ShimmerEffect width="100%" height={120} borderRadius={16} />
      <View style={styles.featureCardContent}>
        <ShimmerEffect width={40} height={40} borderRadius={20} style={{ marginBottom: 12 }} />
        <ShimmerEffect width="80%" height={18} borderRadius={4} style={{ marginBottom: 6 }} />
        <ShimmerEffect width="60%" height={14} borderRadius={4} />
      </View>
    </View>
  );
}

// Skeleton for journal entries
export function ShimmerJournalEntry() {
  return (
    <View style={styles.journalEntry}>
      <View style={styles.journalHeader}>
        <View style={styles.journalTitleArea}>
          <ShimmerEffect width="70%" height={20} borderRadius={4} style={{ marginBottom: 6 }} />
          <ShimmerEffect width="40%" height={14} borderRadius={4} />
        </View>
        <ShimmerEffect width={32} height={32} borderRadius={16} />
      </View>
      <ShimmerText lines={2} lineHeight={14} gap={4} />
      <View style={styles.journalFooter}>
        <ShimmerEffect width={60} height={24} borderRadius={12} />
        <ShimmerEffect width={80} height={24} borderRadius={12} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  gradient: {
    flex: 1,
  },
  cardContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
  },
  cardContent: {
    padding: 16,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  listContent: {
    flex: 1,
    marginLeft: 16,
  },
  featureCard: {
    width: '48%',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
  },
  featureCardContent: {
    padding: 16,
    alignItems: 'center',
  },
  journalEntry: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  journalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  journalTitleArea: {
    flex: 1,
    marginRight: 16,
  },
  journalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
  },
});