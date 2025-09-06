import React, { useEffect, useState } from 'react';
import { StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import HapticFeedback from 'react-native-haptic-feedback';

import { Text, View } from '@/components/Themed';

const { width } = Dimensions.get('window');

interface FlipCardProps {
  frontContent: {
    text: string;
    category: string;
    gradient: string[];
  };
  backContent?: {
    meaning?: string;
    affirmation?: string;
    action?: string;
  };
  onFlip?: (isFlipped: boolean) => void;
  onFavorite?: () => void;
  isFavorite?: boolean;
  autoFlip?: boolean;
  autoFlipDelay?: number;
  style?: any;
}

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

export default function FlipCard({
  frontContent,
  backContent,
  onFlip,
  onFavorite,
  isFavorite = false,
  autoFlip = false,
  autoFlipDelay = 3000,
  style,
}: FlipCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const flipAnimation = useSharedValue(0);
  const scaleAnimation = useSharedValue(1);

  useEffect(() => {
    if (autoFlip) {
      const timer = setTimeout(() => {
        handleFlip();
      }, autoFlipDelay);

      return () => clearTimeout(timer);
    }
  }, [autoFlip, autoFlipDelay]);

  const handleFlip = () => {
    HapticFeedback.trigger('impactLight');
    
    const newIsFlipped = !isFlipped;
    
    flipAnimation.value = withTiming(newIsFlipped ? 1 : 0, {
      duration: 600,
    }, () => {
      runOnJS(setIsFlipped)(newIsFlipped);
      runOnJS(onFlip || (() => {}))(newIsFlipped);
    });

    // Add a subtle scale animation
    scaleAnimation.value = withTiming(0.95, { duration: 100 }, () => {
      scaleAnimation.value = withTiming(1, { duration: 200 });
    });
  };

  const handleFavorite = (event: any) => {
    event.stopPropagation();
    HapticFeedback.trigger('impactMedium');
    onFavorite?.();
  };

  const frontAnimatedStyle = useAnimatedStyle(() => {
    const rotateY = interpolate(flipAnimation.value, [0, 1], [0, 180]);
    const opacity = interpolate(flipAnimation.value, [0, 0.5, 1], [1, 0, 0]);
    
    return {
      transform: [
        { perspective: 1000 },
        { rotateY: `${rotateY}deg` },
        { scale: scaleAnimation.value }
      ],
      opacity,
      backfaceVisibility: 'hidden',
    };
  });

  const backAnimatedStyle = useAnimatedStyle(() => {
    const rotateY = interpolate(flipAnimation.value, [0, 1], [180, 360]);
    const opacity = interpolate(flipAnimation.value, [0, 0.5, 1], [0, 0, 1]);
    
    return {
      transform: [
        { perspective: 1000 },
        { rotateY: `${rotateY}deg` },
        { scale: scaleAnimation.value }
      ],
      opacity,
      backfaceVisibility: 'hidden',
    };
  });

  return (
    <View style={[styles.container, style]}>
      {/* Front Side */}
      <AnimatedTouchableOpacity
        style={[styles.card, frontAnimatedStyle]}
        onPress={handleFlip}
        activeOpacity={0.9}
      >
        <LinearGradient
          colors={frontContent.gradient as any}
          style={styles.cardGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.cardHeader}>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{frontContent.category}</Text>
            </View>
            <TouchableOpacity
              style={styles.favoriteButton}
              onPress={handleFavorite}
            >
              <FontAwesome
                name={isFavorite ? 'heart' : 'heart-o'}
                size={20}
                color={isFavorite ? '#FF4757' : 'rgba(255, 255, 255, 0.8)'}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.cardContent}>
            <FontAwesome name="quote-left" size={24} color="rgba(255, 255, 255, 0.6)" />
            <Text style={styles.affirmationText}>{frontContent.text}</Text>
            <FontAwesome name="quote-right" size={24} color="rgba(255, 255, 255, 0.6)" />
          </View>

          <View style={styles.cardFooter}>
            <FontAwesome name="refresh" size={16} color="rgba(255, 255, 255, 0.8)" />
            <Text style={styles.flipHint}>Tap to flip</Text>
          </View>
        </LinearGradient>
      </AnimatedTouchableOpacity>

      {/* Back Side */}
      <AnimatedTouchableOpacity
        style={[styles.card, styles.backCard, backAnimatedStyle]}
        onPress={handleFlip}
        activeOpacity={0.9}
      >
        <LinearGradient
          colors={['rgba(255, 255, 255, 0.95)', 'rgba(255, 255, 255, 0.9)']}
          style={styles.cardGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.backHeader}>
            <FontAwesome name="lightbulb-o" size={24} color="#6A4C93" />
            <Text style={styles.backTitle}>Deeper Meaning</Text>
          </View>

          <View style={styles.backContent}>
            {backContent?.meaning && (
              <View style={styles.backSection}>
                <Text style={styles.backSectionTitle}>💫 Meaning</Text>
                <Text style={styles.backSectionText}>{backContent.meaning}</Text>
              </View>
            )}

            {backContent?.affirmation && (
              <View style={styles.backSection}>
                <Text style={styles.backSectionTitle}>✨ Personal Affirmation</Text>
                <Text style={styles.backSectionText}>{backContent.affirmation}</Text>
              </View>
            )}

            {backContent?.action && (
              <View style={styles.backSection}>
                <Text style={styles.backSectionTitle}>🎯 Take Action</Text>
                <Text style={styles.backSectionText}>{backContent.action}</Text>
              </View>
            )}
          </View>

          <View style={styles.backFooter}>
            <FontAwesome name="undo" size={16} color="#6A4C93" />
            <Text style={styles.backFlipHint}>Tap to flip back</Text>
          </View>
        </LinearGradient>
      </AnimatedTouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    aspectRatio: 1.6,
    marginBottom: 16,
  },
  card: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  backCard: {
    zIndex: -1,
  },
  cardGradient: {
    flex: 1,
    borderRadius: 20,
    padding: 20,
    justifyContent: 'space-between',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  categoryBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  categoryText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  favoriteButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    backgroundColor: 'transparent',
  },
  affirmationText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 26,
    marginVertical: 16,
    paddingHorizontal: 20,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  flipHint: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    marginLeft: 8,
    fontStyle: 'italic',
  },
  backHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    backgroundColor: 'transparent',
  },
  backTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#6A4C93',
    marginLeft: 8,
  },
  backContent: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  backSection: {
    marginBottom: 16,
    backgroundColor: 'transparent',
  },
  backSectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#6A4C93',
    marginBottom: 6,
  },
  backSectionText: {
    fontSize: 13,
    lineHeight: 18,
    color: '#4A4A4A',
  },
  backFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  backFlipHint: {
    color: '#6A4C93',
    fontSize: 12,
    marginLeft: 8,
    fontStyle: 'italic',
  },
});