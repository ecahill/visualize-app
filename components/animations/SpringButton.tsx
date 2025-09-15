import React from 'react';
import { StyleSheet, TouchableOpacityProps } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  runOnJS,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import HapticFeedback from 'react-native-haptic-feedback';

import { Text, View } from '@/components/Themed';

interface SpringButtonProps extends Omit<TouchableOpacityProps, 'style'> {
  children?: React.ReactNode;
  title?: string;
  subtitle?: string;
  gradient?: string[];
  icon?: React.ReactNode;
  size?: 'small' | 'medium' | 'large';
  variant?: 'filled' | 'outline' | 'ghost';
  springConfig?: {
    damping?: number;
    stiffness?: number;
    mass?: number;
  };
  hapticType?: 'light' | 'medium' | 'heavy' | 'success';
  style?: any;
  contentStyle?: any;
  textStyle?: any;
  onPress?: () => void;
}

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(
  require('react-native').TouchableOpacity
);

export default function SpringButton({
  children,
  title,
  subtitle,
  gradient = ['#FF6B9D', '#E4C1F9'],
  icon,
  size = 'medium',
  variant = 'filled',
  springConfig = { damping: 15, stiffness: 150, mass: 1 },
  hapticType = 'light',
  style,
  contentStyle,
  textStyle,
  onPress,
  ...props
}: SpringButtonProps) {
  const scale = useSharedValue(1);
  const rotate = useSharedValue(0);

  const handlePress = () => {
    // Haptic feedback
    const hapticMap = {
      light: 'impactLight',
      medium: 'impactMedium',
      heavy: 'impactHeavy',
      success: 'notificationSuccess',
    } as const;

    HapticFeedback.trigger(hapticMap[hapticType]);

    // Spring animation
    scale.value = withSequence(
      withSpring(0.95, springConfig),
      withSpring(1, springConfig)
    );

    // Subtle rotation for extra delight
    rotate.value = withSequence(
      withSpring(size === 'large' ? 2 : 1, { duration: 200 }),
      withSpring(0, { duration: 200 })
    );

    // Call onPress after animation starts
    if (onPress) {
      runOnJS(onPress)();
    }
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { rotate: `${rotate.value}deg` },
    ],
  }));

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          padding: 12,
          minHeight: 44,
          borderRadius: 12,
        };
      case 'large':
        return {
          padding: 20,
          minHeight: 64,
          borderRadius: 20,
        };
      default:
        return {
          padding: 16,
          minHeight: 52,
          borderRadius: 16,
        };
    }
  };

  const getTextSize = () => {
    switch (size) {
      case 'small':
        return { fontSize: 14, lineHeight: 18 };
      case 'large':
        return { fontSize: 18, lineHeight: 24 };
      default:
        return { fontSize: 16, lineHeight: 22 };
    }
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'outline':
        return {
          backgroundColor: 'transparent',
          borderWidth: 2,
          borderColor: gradient[0],
        };
      case 'ghost':
        return {
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
        };
      default:
        return {};
    }
  };

  const getTextColor = () => {
    switch (variant) {
      case 'outline':
        return gradient[0];
      case 'ghost':
        return 'white';
      default:
        return 'white';
    }
  };

  const renderContent = () => {
    if (children) {
      return children;
    }

    return (
      <View style={[styles.content, contentStyle]}>
        {icon && <View style={styles.iconContainer}>{icon}</View>}
        <View style={styles.textContainer}>
          {title && (
            <Text 
              style={[
                styles.title, 
                getTextSize(), 
                { color: getTextColor() },
                textStyle
              ]}
            >
              {title}
            </Text>
          )}
          {subtitle && (
            <Text 
              style={[
                styles.subtitle, 
                { 
                  color: variant === 'filled' ? 'rgba(255, 255, 255, 0.8)' : getTextColor(),
                  opacity: 0.8,
                }
              ]}
            >
              {subtitle}
            </Text>
          )}
        </View>
      </View>
    );
  };

  return (
    <AnimatedTouchableOpacity
      {...props}
      onPress={handlePress}
      style={[animatedStyle, styles.button, getSizeStyles(), style]}
      activeOpacity={0.9}
    >
      {variant === 'filled' ? (
        <LinearGradient
          colors={gradient as any}
          style={[styles.gradient, getSizeStyles(), getVariantStyles()]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {renderContent()}
        </LinearGradient>
      ) : (
        <View style={[styles.nonGradientContainer, getVariantStyles()]}>
          {renderContent()}
        </View>
      )}
    </AnimatedTouchableOpacity>
  );
}

// Pre-configured button variants
export function PrimaryButton(props: SpringButtonProps) {
  return (
    <SpringButton
      gradient={['#FF6B9D', '#E4C1F9']}
      hapticType="medium"
      {...props}
    />
  );
}

export function SecondaryButton(props: SpringButtonProps) {
  return (
    <SpringButton
      variant="outline"
      gradient={['#6A4C93', '#9D4EDD']}
      hapticType="light"
      {...props}
    />
  );
}

export function SuccessButton(props: SpringButtonProps) {
  return (
    <SpringButton
      gradient={['#4CAF50', '#81C784']}
      hapticType="success"
      {...props}
    />
  );
}

export function GhostButton(props: SpringButtonProps) {
  return (
    <SpringButton
      variant="ghost"
      hapticType="light"
      {...props}
    />
  );
}

// Floating Action Button with spring animation
export function SpringFAB({
  onPress,
  icon,
  gradient = ['#FF6B9D', '#E4C1F9'],
  style,
  ...props
}: {
  onPress?: () => void;
  icon: React.ReactNode;
  gradient?: string[];
  style?: any;
} & SpringButtonProps) {
  const scale = useSharedValue(1);
  const rotate = useSharedValue(0);

  const handlePress = () => {
    HapticFeedback.trigger('impactMedium');

    scale.value = withSequence(
      withSpring(0.9, { damping: 20, stiffness: 300 }),
      withSpring(1.1, { damping: 20, stiffness: 300 }),
      withSpring(1, { damping: 20, stiffness: 300 })
    );

    rotate.value = withSequence(
      withSpring(15, { duration: 150 }),
      withSpring(0, { duration: 150 })
    );

    if (onPress) {
      runOnJS(onPress)();
    }
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { rotate: `${rotate.value}deg` },
    ],
  }));

  return (
    <AnimatedTouchableOpacity
      style={[styles.fab, animatedStyle, style]}
      onPress={handlePress}
      activeOpacity={0.9}
      {...props}
    >
      <LinearGradient
        colors={gradient as any}
        style={styles.fabGradient}
      >
        {icon}
      </LinearGradient>
    </AnimatedTouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  gradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nonGradientContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  iconContainer: {
    marginRight: 8,
    backgroundColor: 'transparent',
  },
  textContainer: {
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  title: {
    fontWeight: 'bold',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 2,
  },
  fab: {
    width: 64,
    height: 64,
    borderRadius: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  fabGradient: {
    flex: 1,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
});