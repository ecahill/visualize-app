import React, { useState, useRef, useEffect } from 'react';
import { 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Dimensions, 
  TextInput,
  StatusBar,
  Alert
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  useAnimatedGestureHandler,
  withSpring,
  runOnJS,
  interpolate,
  Extrapolation
} from 'react-native-reanimated';
import { HapticFeedback } from '../../services/haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ConfettiCannon from 'react-native-confetti-cannon';

import { Text, View } from '@/components/Themed';
import Colors, { gradients } from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

const { width, height } = Dimensions.get('window');

const hapticOptions = {
  enableVibrateFallback: true,
  ignoreAndroidSystemSettings: false,
};

const stepGradients = [
  ['#FF9A9E', '#FECFEF'], // Pink - Scripting
  ['#A8E6CF', '#C7CEEA'], // Blue-Green - Vision Board  
  ['#FCB69F', '#FFD93D'], // Orange-Yellow - Visualization
  ['#F8BBD9', '#E4C1F9'], // Rose-Purple - Affirmations
];

const affirmationsList = [
  "I am worthy of all my desires",
  "Everything I need is flowing to me now",
  "I trust the process of life",
  "I am aligned with my highest good",
  "My dreams are becoming reality",
  "I attract abundance effortlessly",
  "I am grateful for all that I am receiving",
  "The universe conspires in my favor",
];

interface RitualStep {
  id: number;
  title: string;
  subtitle: string;
  icon: React.ComponentProps<typeof FontAwesome>['name'];
  gradient: string[];
}

export default function RitualScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  const [currentStep, setCurrentStep] = useState(0);
  const [isRitualActive, setIsRitualActive] = useState(false);
  const [scriptingText, setScriptingText] = useState('');
  const [selectedVisions, setSelectedVisions] = useState<string[]>([]);
  const [visualizationTimer, setVisualizationTimer] = useState(68);
  const [selectedAffirmations, setSelectedAffirmations] = useState<string[]>([]);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  
  const translateX = useSharedValue(0);
  const confettiRef = useRef<ConfettiCannon>(null);
  
  const steps: RitualStep[] = [
    { id: 0, title: 'Scripting Journal', subtitle: 'Write your reality', icon: 'edit', gradient: stepGradients[0] },
    { id: 1, title: 'Vision Board', subtitle: 'See your dreams', icon: 'picture-o', gradient: stepGradients[1] },
    { id: 2, title: '68-Second Visualization', subtitle: 'Feel it real', icon: 'eye', gradient: stepGradients[2] },
    { id: 3, title: 'Affirmations', subtitle: 'Speak your truth', icon: 'heart', gradient: stepGradients[3] },
  ];

  const visionBoardOptions = [
    'Dream Home', 'Soulmate Love', 'Financial Freedom', 'Career Success',
    'Perfect Health', 'Adventure Travel', 'Creative Projects', 'Inner Peace'
  ];

  const saveRitualCompletion = async () => {
    try {
      const today = new Date().toDateString();
      const completionData = {
        date: today,
        scriptingText,
        selectedVisions,
        selectedAffirmations,
        completedAt: new Date().toISOString(),
      };
      
      await AsyncStorage.setItem(`ritual_${today}`, JSON.stringify(completionData));
      
      const streakData = await AsyncStorage.getItem('ritual_streak');
      const currentStreak = streakData ? JSON.parse(streakData) : { count: 0, lastDate: null };
      
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayString = yesterday.toDateString();
      
      if (currentStreak.lastDate === yesterdayString || currentStreak.count === 0) {
        currentStreak.count += 1;
      } else {
        currentStreak.count = 1;
      }
      
      currentStreak.lastDate = today;
      await AsyncStorage.setItem('ritual_streak', JSON.stringify(currentStreak));
      
      HapticFeedback.trigger('notificationSuccess', hapticOptions);
    } catch (error) {
      console.error('Failed to save ritual completion:', error);
    }
  };

  const startRitual = () => {
    setIsRitualActive(true);
    setCurrentStep(0);
    HapticFeedback.trigger('impactMedium', hapticOptions);
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
      translateX.value = withSpring(-(currentStep + 1) * width);
      HapticFeedback.trigger('impactLight', hapticOptions);
    } else {
      completeRitual();
    }
  };

  const previousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      translateX.value = withSpring(-(currentStep - 1) * width);
      HapticFeedback.trigger('impactLight', hapticOptions);
    }
  };

  const completeRitual = async () => {
    await saveRitualCompletion();
    setShowCelebration(true);
    confettiRef.current?.start();
    
    setTimeout(() => {
      setShowCelebration(false);
      setIsRitualActive(false);
      setCurrentStep(0);
      translateX.value = withSpring(0);
      setScriptingText('');
      setSelectedVisions([]);
      setSelectedAffirmations([]);
      setVisualizationTimer(68);
    }, 3000);
  };

  const gestureHandler = useAnimatedGestureHandler({
    onStart: () => {
      runOnJS(HapticFeedback.trigger)('impactLight', hapticOptions);
    },
    onActive: (event) => {
      translateX.value = event.translationX - (currentStep * width);
    },
    onEnd: (event) => {
      const shouldGoNext = event.translationX < -width * 0.3;
      const shouldGoPrev = event.translationX > width * 0.3;
      
      if (shouldGoNext && currentStep < steps.length - 1) {
        runOnJS(nextStep)();
      } else if (shouldGoPrev && currentStep > 0) {
        runOnJS(previousStep)();
      } else {
        translateX.value = withSpring(-currentStep * width);
      }
    },
  });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const startVisualizationTimer = () => {
    setIsTimerActive(true);
    HapticFeedback.trigger('impactMedium', hapticOptions);
    
    const interval = setInterval(() => {
      setVisualizationTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setIsTimerActive(false);
          HapticFeedback.trigger('notificationSuccess', hapticOptions);
          return 68;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const toggleVision = (vision: string) => {
    HapticFeedback.trigger('selection', hapticOptions);
    setSelectedVisions(prev => 
      prev.includes(vision) 
        ? prev.filter(v => v !== vision)
        : [...prev, vision]
    );
  };

  const toggleAffirmation = (affirmation: string) => {
    HapticFeedback.trigger('selection', hapticOptions);
    setSelectedAffirmations(prev => 
      prev.includes(affirmation) 
        ? prev.filter(a => a !== affirmation)
        : [...prev, affirmation]
    );
  };

  if (!isRitualActive) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <LinearGradient
          colors={gradients.primary}
          style={styles.welcomeHeader}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={styles.welcomeTitle}>Daily Ritual</Text>
          <Text style={styles.welcomeSubtitle}>
            Transform your reality in 4 powerful steps
          </Text>
        </LinearGradient>

        <ScrollView style={styles.stepsPreview}>
          {steps.map((step, index) => (
            <View key={step.id} style={[styles.stepPreviewCard, { backgroundColor: colors.card }]}>
              <LinearGradient
                colors={step.gradient as [string, string, ...string[]]}
                style={styles.stepPreviewIcon}
              >
                <FontAwesome name={step.icon} size={24} color="white" />
              </LinearGradient>
              <View style={styles.stepPreviewContent}>
                <Text style={[styles.stepPreviewTitle, { color: colors.text }]}>
                  {index + 1}. {step.title}
                </Text>
                <Text style={[styles.stepPreviewSubtitle, { color: colors.text }]}>
                  {step.subtitle}
                </Text>
              </View>
            </View>
          ))}
        </ScrollView>

        <View style={styles.startButtonContainer}>
          <TouchableOpacity
            style={[styles.startButton, { backgroundColor: colors.primary }]}
            onPress={startRitual}
          >
            <FontAwesome name="play" size={20} color="white" />
            <Text style={styles.startButtonText}>Begin Ritual</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" />
      
      <LinearGradient
        colors={steps[currentStep].gradient as [string, string, ...string[]]}
        style={styles.ritualHeader}
      >
        <View style={styles.progressContainer}>
          {steps.map((_, index) => (
            <View
              key={index}
              style={[
                styles.progressDot,
                {
                  backgroundColor: index <= currentStep ? 'white' : 'rgba(255, 255, 255, 0.3)',
                  width: index <= currentStep ? 32 : 8,
                }
              ]}
            />
          ))}
        </View>
        <Text style={styles.stepTitle}>{steps[currentStep].title}</Text>
        <Text style={styles.stepSubtitle}>{steps[currentStep].subtitle}</Text>
        <FontAwesome name={steps[currentStep].icon} size={32} color="white" style={styles.stepIcon} />
      </LinearGradient>

      <PanGestureHandler onGestureEvent={gestureHandler}>
        <Animated.View style={[styles.stepsContainer, animatedStyle]}>
          {/* Step 1: Scripting Journal */}
          <View style={[styles.step, { width }]}>
            <ScrollView style={styles.stepContent}>
              <Text style={[styles.stepInstructions, { color: colors.text }]}>
                Write about your life as if your dreams have already come true. Use present tense and feel the emotions.
              </Text>
              <TextInput
                style={[styles.scriptingInput, { backgroundColor: colors.card, color: colors.text }]}
                placeholder="I am so grateful that I am living in my beautiful dream home..."
                placeholderTextColor={colors.placeholder}
                value={scriptingText}
                onChangeText={setScriptingText}
                multiline
                numberOfLines={10}
                textAlignVertical="top"
              />
            </ScrollView>
          </View>

          {/* Step 2: Vision Board */}
          <View style={[styles.step, { width }]}>
            <ScrollView style={styles.stepContent}>
              <Text style={[styles.stepInstructions, { color: colors.text }]}>
                Select the visions that resonate with you today. Focus on them deeply.
              </Text>
              <View style={styles.visionsGrid}>
                {visionBoardOptions.map((vision) => (
                  <TouchableOpacity
                    key={vision}
                    style={[
                      styles.visionOption,
                      {
                        backgroundColor: selectedVisions.includes(vision) ? colors.primary : colors.card,
                      }
                    ]}
                    onPress={() => toggleVision(vision)}
                  >
                    <Text style={[
                      styles.visionText,
                      { color: selectedVisions.includes(vision) ? 'white' : colors.text }
                    ]}>
                      {vision}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>

          {/* Step 3: 68-Second Visualization */}
          <View style={[styles.step, { width }]}>
            <View style={styles.stepContent}>
              <Text style={[styles.stepInstructions, { color: colors.text }]}>
                Close your eyes and visualize your desires for exactly 68 seconds. Feel it as real.
              </Text>
              <View style={[styles.timerContainer, { backgroundColor: colors.card }]}>
                <Text style={[styles.timerText, { color: colors.text }]}>{visualizationTimer}</Text>
                <Text style={[styles.timerLabel, { color: colors.text }]}>seconds</Text>
                {!isTimerActive ? (
                  <TouchableOpacity
                    style={[styles.timerButton, { backgroundColor: colors.primary }]}
                    onPress={startVisualizationTimer}
                  >
                    <FontAwesome name="play" size={20} color="white" />
                    <Text style={styles.timerButtonText}>Start</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.timerActive}>
                    <FontAwesome name="clock-o" size={20} color={colors.primary} />
                    <Text style={[styles.timerActiveText, { color: colors.primary }]}>Visualizing...</Text>
                  </View>
                )}
              </View>
            </View>
          </View>

          {/* Step 4: Affirmations */}
          <View style={[styles.step, { width }]}>
            <ScrollView style={styles.stepContent}>
              <Text style={[styles.stepInstructions, { color: colors.text }]}>
                Choose affirmations that make you feel powerful and aligned.
              </Text>
              <View style={styles.affirmationsContainer}>
                {affirmationsList.map((affirmation, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.affirmationCard,
                      {
                        backgroundColor: selectedAffirmations.includes(affirmation) 
                          ? colors.primary 
                          : colors.card,
                      }
                    ]}
                    onPress={() => toggleAffirmation(affirmation)}
                  >
                    <Text style={[
                      styles.affirmationText,
                      { 
                        color: selectedAffirmations.includes(affirmation) 
                          ? 'white' 
                          : colors.text 
                      }
                    ]}>
                      {affirmation}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        </Animated.View>
      </PanGestureHandler>

      <View style={styles.navigationContainer}>
        {currentStep > 0 && (
          <TouchableOpacity
            style={[styles.navButton, { backgroundColor: colors.surface }]}
            onPress={previousStep}
          >
            <FontAwesome name="chevron-left" size={16} color={colors.text} />
            <Text style={[styles.navButtonText, { color: colors.text }]}>Previous</Text>
          </TouchableOpacity>
        )}
        
        <View style={styles.navSpacer} />
        
        <TouchableOpacity
          style={[styles.navButton, { backgroundColor: colors.primary }]}
          onPress={currentStep === steps.length - 1 ? completeRitual : nextStep}
        >
          <Text style={styles.navButtonTextPrimary}>
            {currentStep === steps.length - 1 ? 'Complete' : 'Next'}
          </Text>
          <FontAwesome name="chevron-right" size={16} color="white" />
        </TouchableOpacity>
      </View>

      {showCelebration && (
        <View style={styles.celebrationOverlay}>
          <ConfettiCannon
            ref={confettiRef}
            count={200}
            origin={{x: width / 2, y: 0}}
            fadeOut
          />
          <LinearGradient
            colors={gradients.primary}
            style={styles.celebrationCard}
          >
            <FontAwesome name="star" size={48} color="white" style={styles.celebrationIcon} />
            <Text style={styles.celebrationTitle}>Ritual Complete! ✨</Text>
            <Text style={styles.celebrationText}>
              You've aligned your energy with your desires. Watch magic unfold!
            </Text>
          </LinearGradient>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  welcomeHeader: {
    padding: 32,
    paddingTop: 80,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  welcomeTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  stepsPreview: {
    flex: 1,
    padding: 20,
  },
  stepPreviewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  stepPreviewIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  stepPreviewContent: {
    flex: 1,
  },
  stepPreviewTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  stepPreviewSubtitle: {
    fontSize: 14,
    opacity: 0.7,
  },
  startButtonContainer: {
    padding: 20,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  startButtonText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 12,
  },
  ritualHeader: {
    padding: 32,
    paddingTop: 80,
    alignItems: 'center',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  progressDot: {
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: 16,
  },
  stepIcon: {
    opacity: 0.8,
  },
  stepsContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  step: {
    flex: 1,
    padding: 20,
  },
  stepContent: {
    flex: 1,
  },
  stepInstructions: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 24,
    opacity: 0.8,
  },
  scriptingInput: {
    borderRadius: 16,
    padding: 20,
    fontSize: 16,
    lineHeight: 24,
    minHeight: 200,
    textAlignVertical: 'top',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  visionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  visionOption: {
    width: '48%',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  visionText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  timerContainer: {
    alignItems: 'center',
    padding: 40,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  timerText: {
    fontSize: 72,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  timerLabel: {
    fontSize: 18,
    opacity: 0.7,
    marginBottom: 24,
  },
  timerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 24,
  },
  timerButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  timerActive: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timerActiveText: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  affirmationsContainer: {
    paddingHorizontal: 4,
  },
  affirmationCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  affirmationText: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    fontWeight: '500',
  },
  navigationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 32,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 24,
  },
  navButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  navButtonTextPrimary: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginRight: 8,
  },
  navSpacer: {
    flex: 1,
  },
  celebrationOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  celebrationCard: {
    padding: 40,
    borderRadius: 24,
    alignItems: 'center',
    marginHorizontal: 40,
  },
  celebrationIcon: {
    marginBottom: 16,
  },
  celebrationTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 12,
  },
  celebrationText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 24,
  },
});