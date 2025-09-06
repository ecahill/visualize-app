import React, { useState, useEffect } from 'react';
import { StyleSheet, TouchableOpacity, ScrollView, StatusBar, Dimensions, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { router } from 'expo-router';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring,
  withSequence,
  runOnJS
} from 'react-native-reanimated';
import HapticFeedback from 'react-native-haptic-feedback';

import { Text, View } from '@/components/Themed';
import Colors, { gradients } from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { ShiftingRainbow } from '@/components/animations/AnimatedGradient';
import SpringButton from '@/components/animations/SpringButton';
import { PureSuccessAnimation } from '@/components/animations/LottieSuccess';
import { userService, ManifestationGoal } from '@/services/userService';

const { width, height } = Dimensions.get('window');

type GoalCategory = 'abundance' | 'love' | 'career' | 'health' | 'personal';

interface GoalTemplate {
  category: GoalCategory;
  title: string;
  description: string;
  icon: string;
  gradient: string[];
}

const goalTemplates: GoalTemplate[] = [
  {
    category: 'abundance',
    title: 'Financial Freedom',
    description: 'Manifest abundance and financial prosperity',
    icon: 'dollar',
    gradient: gradients.golden,
  },
  {
    category: 'love',
    title: 'Loving Relationship',
    description: 'Attract deep, meaningful connections',
    icon: 'heart',
    gradient: gradients.primary,
  },
  {
    category: 'career',
    title: 'Dream Career',
    description: 'Step into your ideal professional life',
    icon: 'briefcase',
    gradient: gradients.ocean,
  },
  {
    category: 'health',
    title: 'Vibrant Health',
    description: 'Embrace wellness and vitality',
    icon: 'leaf',
    gradient: gradients.success,
  },
  {
    category: 'personal',
    title: 'Personal Growth',
    description: 'Evolve into your highest self',
    icon: 'star',
    gradient: gradients.purple,
  },
];

export default function GoalsOnboardingScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedGoals, setSelectedGoals] = useState<Set<GoalCategory>>(new Set());
  const [customGoals, setCustomGoals] = useState<{ category: GoalCategory; title: string; description: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);

  const progressWidth = useSharedValue(0);
  const cardAnimations = goalTemplates.map(() => useSharedValue(1));

  useEffect(() => {
    // Animate progress bar
    progressWidth.value = withSpring((currentStep + 1) / 3 * 100, {
      damping: 15,
      stiffness: 100,
    });
  }, [currentStep]);

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value}%`,
  }));

  const handleGoalToggle = (category: GoalCategory, index: number) => {
    HapticFeedback.trigger('impactLight');
    
    const newSelected = new Set(selectedGoals);
    if (newSelected.has(category)) {
      newSelected.delete(category);
    } else {
      newSelected.add(category);
    }
    setSelectedGoals(newSelected);

    // Animate card
    const animation = cardAnimations[index];
    animation.value = withSequence(
      withSpring(0.95, { duration: 100 }),
      withSpring(1, { duration: 100 })
    );
  };

  const handleNext = () => {
    if (currentStep === 0 && selectedGoals.size === 0) {
      Alert.alert('Select Goals', 'Please choose at least one manifestation goal to continue.');
      return;
    }
    
    HapticFeedback.trigger('impactMedium');
    setCurrentStep(prev => Math.min(prev + 1, 2));
  };

  const handleBack = () => {
    HapticFeedback.trigger('impactLight');
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  const handleCustomGoalAdd = () => {
    if (selectedGoals.size === 0) {
      Alert.alert('No Categories Selected', 'Please select at least one goal category first.');
      return;
    }

    Alert.prompt(
      'Add Custom Goal',
      'Enter your custom manifestation goal:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Add',
          onPress: (goalTitle) => {
            if (goalTitle && goalTitle.trim()) {
              Alert.prompt(
                'Goal Description',
                'Add a description for your goal (optional):',
                [
                  { text: 'Skip', onPress: () => addCustomGoal(goalTitle.trim(), '') },
                  {
                    text: 'Add',
                    onPress: (description) => addCustomGoal(goalTitle.trim(), description || ''),
                  },
                ]
              );
            }
          },
        },
      ]
    );
  };

  const addCustomGoal = (title: string, description: string) => {
    const firstCategory = Array.from(selectedGoals)[0];
    const newGoal = {
      category: firstCategory,
      title,
      description: description || `Personal ${firstCategory} goal`,
    };
    
    setCustomGoals(prev => [...prev, newGoal]);
    HapticFeedback.trigger('notificationSuccess');
  };

  const handleFinish = async () => {
    setIsLoading(true);
    
    try {
      // Save selected template goals
      for (const category of selectedGoals) {
        const template = goalTemplates.find(t => t.category === category);
        if (template) {
          await userService.addManifestationGoal({
            category: template.category,
            title: template.title,
            description: template.description,
            isAchieved: false,
          });
        }
      }

      // Save custom goals
      for (const customGoal of customGoals) {
        await userService.addManifestationGoal({
          category: customGoal.category,
          title: customGoal.title,
          description: customGoal.description,
          isAchieved: false,
        });
      }

      // Track analytics
      await userService.trackFeatureUsage('onboarding_goals_completed', {
        selectedCategories: Array.from(selectedGoals),
        customGoalsCount: customGoals.length,
        totalGoals: selectedGoals.size + customGoals.length,
      });

      setShowSuccessAnimation(true);
      
      setTimeout(() => {
        setShowSuccessAnimation(false);
        router.replace('/(tabs)/');
      }, 2500);

    } catch (error) {
      console.error('Failed to save goals:', error);
      Alert.alert('Error', 'Failed to save your goals. Please try again.');
      setIsLoading(false);
    }
  };

  const renderStepIndicator = () => (
    <View style={styles.progressContainer}>
      <View style={styles.progressBar}>
        <Animated.View style={[styles.progressFill, progressStyle]} />
      </View>
      <Text style={styles.progressText}>Step {currentStep + 1} of 3</Text>
    </View>
  );

  const renderGoalSelection = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Choose Your Manifestation Goals</Text>
      <Text style={styles.stepSubtitle}>
        Select the areas of your life you'd like to transform ✨
      </Text>

      <ScrollView style={styles.goalsContainer} showsVerticalScrollIndicator={false}>
        {goalTemplates.map((goal, index) => {
          const isSelected = selectedGoals.has(goal.category);
          const animatedStyle = useAnimatedStyle(() => ({
            transform: [{ scale: cardAnimations[index].value }],
          }));

          return (
            <Animated.View key={goal.category} style={animatedStyle}>
              <TouchableOpacity
                style={[styles.goalCard, isSelected && styles.goalCardSelected]}
                onPress={() => handleGoalToggle(goal.category, index)}
                activeOpacity={0.9}
              >
                <LinearGradient
                  colors={isSelected ? goal.gradient : ['rgba(255, 255, 255, 0.9)', 'rgba(255, 255, 255, 0.7)']}
                  style={styles.goalCardGradient}
                >
                  <View style={styles.goalCardContent}>
                    <FontAwesome 
                      name={goal.icon as any} 
                      size={32} 
                      color={isSelected ? 'white' : colors.primary} 
                    />
                    <View style={styles.goalTextContainer}>
                      <Text style={[
                        styles.goalTitle, 
                        { color: isSelected ? 'white' : '#2D3436' }
                      ]}>
                        {goal.title}
                      </Text>
                      <Text style={[
                        styles.goalDescription, 
                        { color: isSelected ? 'rgba(255, 255, 255, 0.8)' : '#6C7B7F' }
                      ]}>
                        {goal.description}
                      </Text>
                    </View>
                    {isSelected && (
                      <FontAwesome name="check-circle" size={24} color="white" />
                    )}
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          );
        })}
      </ScrollView>
    </View>
  );

  const renderCustomization = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Customize Your Goals</Text>
      <Text style={styles.stepSubtitle}>
        Add personal touches to make your goals uniquely yours
      </Text>

      <View style={styles.selectedGoalsPreview}>
        <Text style={styles.previewTitle}>Selected Goals:</Text>
        {Array.from(selectedGoals).map(category => {
          const goal = goalTemplates.find(t => t.category === category);
          return goal ? (
            <View key={category} style={styles.previewGoal}>
              <LinearGradient colors={goal.gradient} style={styles.previewGoalGradient}>
                <FontAwesome name={goal.icon as any} size={16} color="white" />
                <Text style={styles.previewGoalText}>{goal.title}</Text>
              </LinearGradient>
            </View>
          ) : null;
        })}
      </View>

      {customGoals.length > 0 && (
        <View style={styles.customGoalsPreview}>
          <Text style={styles.previewTitle}>Your Custom Goals:</Text>
          {customGoals.map((goal, index) => (
            <View key={index} style={styles.customGoalItem}>
              <Text style={styles.customGoalTitle}>{goal.title}</Text>
              <Text style={styles.customGoalDescription}>{goal.description}</Text>
            </View>
          ))}
        </View>
      )}

      <SpringButton
        title="Add Custom Goal"
        icon={<FontAwesome name="plus" size={16} color="white" />}
        onPress={handleCustomGoalAdd}
        gradient={gradients.purple}
        style={styles.addCustomButton}
      />
    </View>
  );

  const renderReview = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Ready to Begin!</Text>
      <Text style={styles.stepSubtitle}>
        Your manifestation journey starts with these powerful intentions
      </Text>

      <View style={styles.reviewContainer}>
        <Text style={styles.reviewSummary}>
          You've selected {selectedGoals.size + customGoals.length} manifestation goals
        </Text>

        <View style={styles.allGoalsReview}>
          {Array.from(selectedGoals).map(category => {
            const goal = goalTemplates.find(t => t.category === category);
            return goal ? (
              <View key={category} style={styles.reviewGoalCard}>
                <LinearGradient colors={goal.gradient} style={styles.reviewGoalGradient}>
                  <FontAwesome name={goal.icon as any} size={20} color="white" />
                  <Text style={styles.reviewGoalTitle}>{goal.title}</Text>
                </LinearGradient>
              </View>
            ) : null;
          })}

          {customGoals.map((goal, index) => (
            <View key={`custom-${index}`} style={styles.reviewGoalCard}>
              <LinearGradient colors={gradients.purple} style={styles.reviewGoalGradient}>
                <FontAwesome name="star" size={20} color="white" />
                <Text style={styles.reviewGoalTitle}>{goal.title}</Text>
              </LinearGradient>
            </View>
          ))}
        </View>

        <Text style={styles.reviewInspiration}>
          Remember: What you can imagine and believe, you can achieve. 
          Your thoughts create your reality. ✨
        </Text>
      </View>
    </View>
  );

  const getStepContent = () => {
    switch (currentStep) {
      case 0: return renderGoalSelection();
      case 1: return renderCustomization();
      case 2: return renderReview();
      default: return null;
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ShiftingRainbow style={StyleSheet.absoluteFill} />

      {renderStepIndicator()}
      
      {getStepContent()}

      <View style={styles.navigationContainer}>
        {currentStep > 0 && (
          <SpringButton
            title="Back"
            onPress={handleBack}
            variant="outlined"
            style={styles.backButton}
          />
        )}

        <SpringButton
          title={currentStep === 2 ? "Start Manifesting" : "Continue"}
          onPress={currentStep === 2 ? handleFinish : handleNext}
          gradient={gradients.primary}
          style={styles.continueButton}
          loading={isLoading}
          disabled={currentStep === 0 && selectedGoals.size === 0}
        />
      </View>

      <PureSuccessAnimation
        isVisible={showSuccessAnimation}
        onAnimationComplete={() => setShowSuccessAnimation(false)}
        size={150}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
  },
  progressContainer: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    marginBottom: 8,
  },
  progressFill: {
    height: 4,
    backgroundColor: 'white',
    borderRadius: 2,
  },
  progressText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    textAlign: 'center',
  },
  stepContainer: {
    flex: 1,
    paddingHorizontal: 24,
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 12,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  stepSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  goalsContainer: {
    flex: 1,
    marginBottom: 20,
  },
  goalCard: {
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  goalCardSelected: {
    shadowOpacity: 0.25,
    shadowRadius: 12,
  },
  goalCardGradient: {
    borderRadius: 16,
    padding: 20,
  },
  goalCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  goalTextContainer: {
    flex: 1,
    marginLeft: 16,
  },
  goalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  goalDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  selectedGoalsPreview: {
    marginBottom: 24,
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    marginBottom: 12,
  },
  previewGoal: {
    marginBottom: 8,
  },
  previewGoalGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  previewGoalText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  customGoalsPreview: {
    marginBottom: 24,
  },
  customGoalItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  customGoalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3436',
    marginBottom: 4,
  },
  customGoalDescription: {
    fontSize: 14,
    color: '#6C7B7F',
  },
  addCustomButton: {
    alignSelf: 'center',
  },
  reviewContainer: {
    flex: 1,
    alignItems: 'center',
  },
  reviewSummary: {
    fontSize: 18,
    color: 'white',
    fontWeight: '600',
    marginBottom: 24,
    textAlign: 'center',
  },
  allGoalsReview: {
    width: '100%',
    marginBottom: 32,
  },
  reviewGoalCard: {
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  reviewGoalGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
  },
  reviewGoalTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12,
  },
  reviewInspiration: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  navigationContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingBottom: 40,
    gap: 12,
  },
  backButton: {
    flex: 1,
  },
  continueButton: {
    flex: 2,
  },
});