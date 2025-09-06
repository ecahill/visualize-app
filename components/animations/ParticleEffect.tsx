import React, { useEffect } from 'react';
import { StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  withSequence,
  interpolate,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

import { View } from '@/components/Themed';

const { width, height } = Dimensions.get('window');

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
  delay: number;
  duration: number;
  direction: 'up' | 'left' | 'right' | 'diagonal';
}

interface ParticleEffectProps {
  isActive: boolean;
  particleCount?: number;
  colors?: string[];
  onComplete?: () => void;
  type?: 'celebration' | 'manifestation' | 'sparkle' | 'hearts' | 'stars';
  center?: { x: number; y: number };
}

export default function ParticleEffect({
  isActive,
  particleCount = 30,
  colors = ['#FFD93D', '#FF6B9D', '#4ECDC4', '#45B7D1', '#96CEB4'],
  onComplete,
  type = 'celebration',
  center = { x: width / 2, y: height / 2 },
}: ParticleEffectProps) {
  const particles: Particle[] = [];

  // Generate particles
  for (let i = 0; i < particleCount; i++) {
    const angle = (2 * Math.PI * i) / particleCount;
    const radius = Math.random() * 100 + 50;
    
    particles.push({
      id: i,
      x: center.x + Math.cos(angle) * (Math.random() * 30),
      y: center.y + Math.sin(angle) * (Math.random() * 30),
      size: Math.random() * 8 + 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      delay: Math.random() * 500,
      duration: Math.random() * 2000 + 1500,
      direction: ['up', 'left', 'right', 'diagonal'][Math.floor(Math.random() * 4)] as Particle['direction'],
    });
  }

  useEffect(() => {
    if (isActive && onComplete) {
      const maxDuration = Math.max(...particles.map(p => p.duration + p.delay));
      const timer = setTimeout(() => {
        onComplete();
      }, maxDuration);

      return () => clearTimeout(timer);
    }
  }, [isActive, onComplete]);

  if (!isActive) return null;

  return (
    <View style={styles.container} pointerEvents="none">
      {particles.map((particle) => (
        <ParticleItem
          key={particle.id}
          particle={particle}
          isActive={isActive}
          type={type}
        />
      ))}
    </View>
  );
}

interface ParticleItemProps {
  particle: Particle;
  isActive: boolean;
  type: ParticleEffectProps['type'];
}

function ParticleItem({ particle, isActive, type }: ParticleItemProps) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const rotation = useSharedValue(0);

  useEffect(() => {
    if (isActive) {
      // Initial appearance
      scale.value = withDelay(
        particle.delay,
        withSpring(1, { duration: 300 })
      );
      
      opacity.value = withDelay(
        particle.delay,
        withSequence(
          withTiming(1, { duration: 300 }),
          withDelay(particle.duration * 0.7, withTiming(0, { duration: 600 }))
        )
      );

      // Movement based on direction
      const getMovement = () => {
        switch (particle.direction) {
          case 'up':
            return { x: (Math.random() - 0.5) * 100, y: -(Math.random() * 200 + 100) };
          case 'left':
            return { x: -(Math.random() * 150 + 50), y: (Math.random() - 0.5) * 100 };
          case 'right':
            return { x: Math.random() * 150 + 50, y: (Math.random() - 0.5) * 100 };
          case 'diagonal':
            return { 
              x: (Math.random() - 0.5) * 200, 
              y: -(Math.random() * 150 + 50)
            };
          default:
            return { x: 0, y: -100 };
        }
      };

      const movement = getMovement();
      
      translateX.value = withDelay(
        particle.delay,
        withTiming(movement.x, {
          duration: particle.duration,
          easing: Easing.out(Easing.quad),
        })
      );
      
      translateY.value = withDelay(
        particle.delay,
        withTiming(movement.y, {
          duration: particle.duration,
          easing: Easing.out(Easing.quad),
        })
      );

      // Rotation animation
      rotation.value = withDelay(
        particle.delay,
        withTiming(360 * (Math.random() > 0.5 ? 1 : -1), {
          duration: particle.duration,
          easing: Easing.linear,
        })
      );
    }
  }, [isActive]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
      { rotate: `${rotation.value}deg` },
    ],
    opacity: opacity.value,
  }));

  const getParticleShape = () => {
    switch (type) {
      case 'hearts':
        return '💖';
      case 'stars':
        return '⭐';
      case 'sparkle':
        return '✨';
      case 'manifestation':
        return '🌟';
      default:
        return null;
    }
  };

  const shape = getParticleShape();

  return (
    <Animated.View
      style={[
        styles.particle,
        {
          left: particle.x,
          top: particle.y,
          width: particle.size,
          height: particle.size,
        },
        animatedStyle,
      ]}
    >
      {shape ? (
        <Animated.Text style={[styles.emoji, { fontSize: particle.size }]}>
          {shape}
        </Animated.Text>
      ) : (
        <LinearGradient
          colors={[particle.color, `${particle.color}80`]}
          style={[
            styles.particleGradient,
            {
              width: particle.size,
              height: particle.size,
              borderRadius: particle.size / 2,
            },
          ]}
        />
      )}
    </Animated.View>
  );
}

// Floating hearts effect for love affirmations
export function FloatingHearts({
  isActive,
  duration = 3000,
  onComplete,
}: {
  isActive: boolean;
  duration?: number;
  onComplete?: () => void;
}) {
  const hearts = ['💕', '💖', '💗', '💝', '💘'];

  return (
    <ParticleEffect
      isActive={isActive}
      particleCount={15}
      colors={hearts}
      type="hearts"
      onComplete={onComplete}
    />
  );
}

// Sparkling stars for manifestation success
export function SparklingStars({
  isActive,
  onComplete,
}: {
  isActive: boolean;
  onComplete?: () => void;
}) {
  return (
    <ParticleEffect
      isActive={isActive}
      particleCount={25}
      colors={['#FFD93D', '#FFA500', '#FF6B9D']}
      type="stars"
      onComplete={onComplete}
    />
  );
}

// Money rain for abundance manifestation
export function AbundanceRain({
  isActive,
  onComplete,
}: {
  isActive: boolean;
  onComplete?: () => void;
}) {
  return (
    <ParticleEffect
      isActive={isActive}
      particleCount={20}
      colors={['#4CAF50', '#81C784', '#FFD93D']}
      type="celebration"
      onComplete={onComplete}
    />
  );
}

// Gentle sparkles for daily ritual completion
export function RitualSparkles({
  isActive,
  center,
  onComplete,
}: {
  isActive: boolean;
  center?: { x: number; y: number };
  onComplete?: () => void;
}) {
  return (
    <ParticleEffect
      isActive={isActive}
      particleCount={12}
      colors={['#E4C1F9', '#F8BBD9', '#FFD93D']}
      type="sparkle"
      center={center}
      onComplete={onComplete}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  particle: {
    position: 'absolute',
  },
  particleGradient: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  emoji: {
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});