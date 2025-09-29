import React, { useState, useEffect } from 'react';
import { StyleSheet, TouchableOpacity, Dimensions, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { router } from 'expo-router';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withSequence,
  useAnimatedScrollHandler,
  runOnJS
} from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { HapticFeedback } from '../../services/haptics';

import { Text, View } from '@/components/Themed';
import Colors, { gradients } from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import ParallaxScrollView, { FloatingElement } from '@/components/animations/ParallaxScrollView';
import { ShiftingRainbow } from '@/components/animations/AnimatedGradient';
import SpringButton from '@/components/animations/SpringButton';
import { PureSuccessAnimation } from '@/components/animations/LottieSuccess';
import { RitualSparkles } from '@/components/animations/ParticleEffect';
import { analyticsService } from '@/services/analyticsService';

const { width, height } = Dimensions.get('window');

const nevilleGoddardQuotes = [
  "Assume the feeling of your wish fulfilled and observe the route that your attention follows.",
  "You are already that which you want to be, and your refusal to believe this is the only reason you do not see it.",
  "The world is yourself pushed out. Ask yourself what you are thinking and feeling right now.",
  "Imagination is the only redemptive power in the universe.",
  "Live in the end. Dwell in the feeling of your wish fulfilled.",
  "Your assumption, though false, if persisted in, will harden into fact.",
  "Change your conception of yourself and you will automatically change the world in which you live.",
  "Feeling is the secret. Feel yourself into your desire.",
  "All that you behold, though it appears without, it is within, in your imagination.",
  "The art of believing is the art of assuming the feeling of being and having that which you seek.",
];

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [greeting, setGreeting] = useState('');
  const [currentQuote, setCurrentQuote] = useState('');
  const [streakCount, setStreakCount] = useState(0);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  const [showParticles, setShowParticles] = useState(false);

  const scrollY = useSharedValue(0);
  const cardScale1 = useSharedValue(1);
  const cardScale2 = useSharedValue(1);
  const cardScale3 = useSharedValue(1);
  const cardScale4 = useSharedValue(1);
  const ritualButtonScale = useSharedValue(1);

  const getTimeBasedGreeting = () => {
    const hour = new Date().getHours();
    
    if (hour < 12) return 'Good Morning, Beautiful';
    if (hour < 17) return 'Good Afternoon, Gorgeous';
    return 'Good Evening, Radiant Soul';
  };

  const getRandomQuote = () => {
    const randomIndex = Math.floor(Math.random() * nevilleGoddardQuotes.length);
    return nevilleGoddardQuotes[randomIndex];
  };

  const loadStreakData = async () => {
    try {
      const streakData = await AsyncStorage.getItem('ritual_streak');
      if (streakData) {
        const { count } = JSON.parse(streakData);
        setStreakCount(count);
      }
    } catch (error) {
      console.error('Failed to load streak data:', error);
    }
  };

  useEffect(() => {
    setGreeting(getTimeBasedGreeting());
    setCurrentQuote(getRandomQuote());
    loadStreakData();
    
    // Initialize analytics and track screen view
    analyticsService.initialize();
    analyticsService.trackScreenView('home', {
      greeting: getTimeBasedGreeting(),
      quoteShown: true,
    });
  }, []);

  const createCardPressAnimation = (scaleValue: Animated.SharedValue<number>, onPress?: () => void) => {
    return () => {
      scaleValue.value = withSequence(
        withSpring(0.95, { duration: 100 }),
        withSpring(1, { duration: 100 })
      );
      if (onPress) {
        setTimeout(onPress, 150);
      }
    };
  };

  const navigateToTab = (tabName: string) => {
    HapticFeedback.trigger('impactLight');
    
    // Track navigation
    analyticsService.trackUserAction('navigate_to_feature', 'home_screen', {
      destination: tabName,
      navigationSource: 'feature_card',
    });
    
    // Show success animation for completing an action
    if (Math.random() > 0.7) {
      setShowSuccessAnimation(true);
      setTimeout(() => setShowSuccessAnimation(false), 2000);
    }
    
    router.push(`/(tabs)/${tabName}` as any);
  };

  const handleRitualPress = () => {
    HapticFeedback.trigger('impactMedium');
    setShowParticles(true);
    setTimeout(() => setShowParticles(false), 3000);
    
    // Track ritual start
    analyticsService.trackUserAction('start_daily_ritual', 'home_screen', {
      streakCount,
      timeOfDay: new Date().getHours(),
    });
    
    router.push('/(tabs)/ritual');
  };

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const createAnimatedStyle = (scaleValue: Animated.SharedValue<number>) => {
    return useAnimatedStyle(() => ({
      transform: [{ scale: scaleValue.value }],
    }));
  };

  const featureCards = [
    {
      id: 1,
      title: 'Journal',
      subtitle: 'Script your reality',
      icon: 'book',
      gradient: gradients.ocean,
      scaleValue: cardScale1,
      route: 'journal',
    },
    {
      id: 2,
      title: 'Vision Board',
      subtitle: 'Visualize your dreams',
      icon: 'picture-o',
      gradient: gradients.sunset,
      scaleValue: cardScale2,
      route: 'visionboard',
    },
    {
      id: 3,
      title: '68-Second Timer',
      subtitle: 'Guided visualization',
      icon: 'eye',
      gradient: gradients.success,
      scaleValue: cardScale3,
      route: 'visualization',
    },
    {
      id: 4,
      title: 'Affirmations',
      subtitle: 'Positive declarations',
      icon: 'heart',
      gradient: gradients.primary,
      scaleValue: cardScale4,
      route: 'affirmations',
    },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <ParallaxScrollView
        parallaxHeaderHeight={height * 0.6}
        renderBackground={() => (
          <>
            <ShiftingRainbow style={StyleSheet.absoluteFill} />
            <FloatingElement
              scrollY={scrollY}
              initialPosition={{ x: width * 0.2, y: height * 0.15 }}
              amplitude={15}
            >
              <Text style={styles.floatingEmoji}>✨</Text>
            </FloatingElement>
            <FloatingElement
              scrollY={scrollY}
              initialPosition={{ x: width * 0.8, y: height * 0.25 }}
              amplitude={20}
              frequency={0.008}
            >
              <Text style={styles.floatingEmoji}>🌟</Text>
            </FloatingElement>
            <FloatingElement
              scrollY={scrollY}
              initialPosition={{ x: width * 0.1, y: height * 0.4 }}
              amplitude={12}
              frequency={0.012}
            >
              <Text style={styles.floatingEmoji}>💫</Text>
            </FloatingElement>
          </>
        )}
      >
        <View style={styles.header}>
          <Text style={styles.greetingText}>{greeting} ✨</Text>
          <Text style={styles.subGreetingText}>Ready to manifest magic today?</Text>
        </View>

        <View style={styles.content}>
          <View style={styles.streakCard}>
            <FontAwesome name="fire" size={28} color="#FF6B35" />
            <View style={styles.streakInfo}>
              <Text style={styles.streakNumber}>{streakCount}</Text>
              <Text style={styles.streakLabel}>day streak</Text>
            </View>
          </View>

          <SpringButton
            title="Daily Ritual"
            subtitle="Start your manifestation practice"
            gradient={['#D63384', '#6A4C93']}
            size="large"
            icon={<FontAwesome name="play" size={24} color="white" />}
            onPress={handleRitualPress}
            style={styles.dailyRitualButton}
            hapticType="medium"
          />

          <View style={styles.featuresGrid}>
            {featureCards.map((card, index) => (
              <SpringButton
                key={card.id}
                title={card.title}
                subtitle={card.subtitle}
                gradient={card.gradient as any}
                onPress={() => navigateToTab(card.route)}
                style={styles.featureCard}
                contentStyle={styles.featureCardContent}
                hapticType="light"
              >
                <View style={styles.featureCardInner}>
                  <FontAwesome name={card.icon as React.ComponentProps<typeof FontAwesome>['name']} size={28} color="white" />
                  <Text style={styles.featureCardTitle}>{card.title}</Text>
                  <Text style={styles.featureCardSubtitle}>{card.subtitle}</Text>
                </View>
              </SpringButton>
            ))}
          </View>

          <View style={styles.quoteSection}>
            <LinearGradient
              colors={['rgba(255, 255, 255, 0.9)', 'rgba(255, 255, 255, 0.7)']}
              style={styles.quoteCard}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <FontAwesome name="quote-left" size={20} color={colors.primary} style={styles.quoteIcon} />
              <Text style={styles.quoteText}>{currentQuote}</Text>
              <Text style={styles.quoteAuthor}>— Neville Goddard</Text>
              <SpringButton
                title="New Quote"
                size="small"
                variant="filled"
                gradient={[colors.primary, colors.primary]}
                icon={<FontAwesome name="refresh" size={14} color="white" />}
                onPress={() => setCurrentQuote(getRandomQuote())}
                style={styles.newQuoteButton}
              />
            </LinearGradient>
          </View>
        </View>
      </ParallaxScrollView>

      {/* Success Animation Overlay */}
      <PureSuccessAnimation
        isVisible={showSuccessAnimation}
        onAnimationComplete={() => setShowSuccessAnimation(false)}
        size={120}
      />

      {/* Particle Effects */}
      <RitualSparkles
        isActive={showParticles}
        center={{ x: width / 2, y: height * 0.7 }}
        onComplete={() => setShowParticles(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundGradient: {
    flex: 1,
    width: width,
    height: height,
  },
  scrollContainer: {
    flex: 1,
  },
  header: {
    paddingTop: 80,
    paddingHorizontal: 24,
    paddingBottom: 40,
    alignItems: 'center',
  },
  greetingText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subGreetingText: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    fontStyle: 'italic',
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  streakCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 20,
    borderRadius: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  streakInfo: {
    marginLeft: 16,
  },
  streakNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2D3436',
  },
  streakLabel: {
    fontSize: 14,
    color: '#6C7B7F',
    fontWeight: '600',
  },
  dailyRitualButton: {
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  ritualButtonGradient: {
    borderRadius: 24,
    padding: 24,
  },
  ritualButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  playIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 20,
  },
  ritualButtonText: {
    flex: 1,
  },
  ritualButtonTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  ritualButtonSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  featureCard: {
    width: '48%',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  featureCardGradient: {
    borderRadius: 20,
    padding: 20,
    minHeight: 120,
  },
  featureCardContent: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  featureCardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 12,
    marginBottom: 4,
  },
  featureCardSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  quoteSection: {
    marginBottom: 20,
  },
  quoteCard: {
    padding: 24,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  quoteIcon: {
    alignSelf: 'center',
    marginBottom: 16,
  },
  quoteText: {
    fontSize: 16,
    lineHeight: 26,
    textAlign: 'center',
    color: '#2D3436',
    fontStyle: 'italic',
    marginBottom: 12,
  },
  quoteAuthor: {
    fontSize: 14,
    textAlign: 'center',
    color: '#6C7B7F',
    fontWeight: '600',
    marginBottom: 20,
  },
  newQuoteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 20,
    alignSelf: 'center',
  },
  newQuoteText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  floatingEmoji: {
    fontSize: 32,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  featureCardInner: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    backgroundColor: 'transparent',
  },
});
