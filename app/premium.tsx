import React, { useState, useEffect } from 'react';
import { StyleSheet, TouchableOpacity, ScrollView, StatusBar, Alert, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { router } from 'expo-router';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring,
  withSequence
} from 'react-native-reanimated';
import HapticFeedback from 'react-native-haptic-feedback';

import { Text, View } from '@/components/Themed';
import Colors, { gradients } from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { ShiftingRainbow } from '@/components/animations/AnimatedGradient';
import SpringButton from '@/components/animations/SpringButton';
import { PureSuccessAnimation } from '@/components/animations/LottieSuccess';
import { purchaseService, Product } from '@/services/purchaseService';
import { analyticsService } from '@/services/analyticsService';
import { userService } from '@/services/userService';

const { width, height } = Dimensions.get('window');

export default function PremiumScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<string>('premium_yearly');
  const [isLoading, setIsLoading] = useState(true);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  const [isPremium, setIsPremium] = useState(false);

  const cardScale = useSharedValue(1);
  const crownRotation = useSharedValue(0);

  useEffect(() => {
    initializePremium();
    
    // Track premium screen view
    analyticsService.trackScreenView('premium', {
      entrySource: 'navigation',
    });
    
    // Animate crown
    crownRotation.value = withSequence(
      withSpring(10, { duration: 500 }),
      withSpring(-10, { duration: 500 }),
      withSpring(0, { duration: 500 })
    );
  }, []);

  const initializePremium = async () => {
    try {
      await purchaseService.initialize();
      const allProducts = await purchaseService.getProducts();
      const premiumProducts = allProducts.filter(p => p.type === 'premium');
      setProducts(premiumProducts);
      
      const premium = await purchaseService.isPremiumUser();
      setIsPremium(premium);
      
      if (premium) {
        // If user is already premium, show different content
        analyticsService.track('premium_screen_view_existing_user');
      }
    } catch (error) {
      console.error('Failed to initialize premium:', error);
      Alert.alert('Error', 'Failed to load premium options. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlanSelection = (productId: string) => {
    setSelectedPlan(productId);
    HapticFeedback.trigger('impactLight');
    
    cardScale.value = withSequence(
      withSpring(0.98, { duration: 100 }),
      withSpring(1.02, { duration: 100 }),
      withSpring(1, { duration: 100 })
    );

    analyticsService.track('premium_plan_selected', {
      selectedPlan: productId,
      previousPlan: selectedPlan,
    });
  };

  const handlePurchase = async () => {
    if (!selectedPlan) return;

    try {
      setIsPurchasing(true);
      
      const success = await purchaseService.purchaseProduct(selectedPlan);
      
      if (success) {
        setShowSuccessAnimation(true);
        setIsPremium(true);
        HapticFeedback.trigger('notificationSuccess');
        
        // Show success message after animation
        setTimeout(() => {
          setShowSuccessAnimation(false);
          Alert.alert(
            'Welcome to Premium! 🎉',
            'You now have access to all premium features. Enjoy your manifestation journey!',
            [
              {
                text: 'Start Exploring',
                onPress: () => router.back(),
              },
            ]
          );
        }, 2500);
      }
    } catch (error) {
      Alert.alert('Purchase Failed', 'Something went wrong. Please try again.');
    } finally {
      setIsPurchasing(false);
    }
  };

  const handleRestore = async () => {
    try {
      setIsLoading(true);
      await purchaseService.restorePurchases();
      
      // Refresh premium status
      const premium = await purchaseService.isPremiumUser();
      setIsPremium(premium);
    } catch (error) {
      // Error is handled in purchaseService
    } finally {
      setIsLoading(false);
    }
  };

  const crownAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${crownRotation.value}deg` }],
  }));

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cardScale.value }],
  }));

  const renderFeature = (icon: string, title: string, description: string) => (
    <View style={styles.featureItem}>
      <View style={styles.featureIcon}>
        <FontAwesome name={icon as any} size={24} color="#FFD700" />
      </View>
      <View style={styles.featureText}>
        <Text style={styles.featureTitle}>{title}</Text>
        <Text style={styles.featureDescription}>{description}</Text>
      </View>
      <FontAwesome name="check" size={16} color="#4CAF50" />
    </View>
  );

  const renderPlanCard = (product: Product) => {
    const isSelected = selectedPlan === product.productId;
    const isYearly = product.productId === 'premium_yearly';
    
    return (
      <TouchableOpacity
        key={product.productId}
        style={[styles.planCard, isSelected && styles.selectedPlanCard]}
        onPress={() => handlePlanSelection(product.productId)}
        activeOpacity={0.9}
      >
        <LinearGradient
          colors={isSelected ? gradients.golden : ['rgba(255, 255, 255, 0.95)', 'rgba(255, 255, 255, 0.85)']}
          style={styles.planCardGradient}
        >
          {isYearly && (
            <View style={styles.popularBadge}>
              <Text style={styles.popularText}>Most Popular</Text>
            </View>
          )}
          
          <View style={styles.planHeader}>
            <Text style={[
              styles.planTitle, 
              { color: isSelected ? 'white' : '#2D3436' }
            ]}>
              {product.title}
            </Text>
            {isYearly && (
              <Text style={[
                styles.savingsText,
                { color: isSelected ? 'rgba(255, 255, 255, 0.9)' : '#4CAF50' }
              ]}>
                Save {purchaseService.getYearlySavings()}!
              </Text>
            )}
          </View>

          <View style={styles.planPricing}>
            <Text style={[
              styles.planPrice,
              { color: isSelected ? 'white' : '#2D3436' }
            ]}>
              {product.localizedPrice}
            </Text>
            <Text style={[
              styles.planPeriod,
              { color: isSelected ? 'rgba(255, 255, 255, 0.8)' : '#6C7B7F' }
            ]}>
              {isYearly ? '/year' : '/month'}
            </Text>
          </View>

          <Text style={[
            styles.planDescription,
            { color: isSelected ? 'rgba(255, 255, 255, 0.9)' : '#6C7B7F' }
          ]}>
            {product.description}
          </Text>

          {isSelected && (
            <View style={styles.selectedIndicator}>
              <FontAwesome name="check-circle" size={20} color="white" />
            </View>
          )}
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />
        <ShiftingRainbow style={StyleSheet.absoluteFill} />
        <View style={styles.loadingContainer}>
          <FontAwesome name="crown" size={48} color="#FFD700" />
          <Text style={styles.loadingText}>Loading Premium Features...</Text>
        </View>
      </View>
    );
  }

  if (isPremium) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />
        <ShiftingRainbow style={StyleSheet.absoluteFill} />
        
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <FontAwesome name="arrow-left" size={24} color="white" />
          </TouchableOpacity>
          
          <Animated.View style={crownAnimatedStyle}>
            <FontAwesome name="crown" size={32} color="#FFD700" />
          </Animated.View>
          
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.premiumStatusContainer}>
          <Text style={styles.premiumStatusTitle}>You're Premium! 👑</Text>
          <Text style={styles.premiumStatusDescription}>
            Enjoy unlimited access to all features and content.
          </Text>

          <View style={styles.premiumFeatures}>
            {renderFeature('star', 'Premium Member', 'Full access to all features')}
            {renderFeature('infinity', 'Unlimited Goals', 'Create as many goals as you want')}
            {renderFeature('chart-line', 'Advanced Analytics', 'Deep insights into your progress')}
            {renderFeature('heart', 'Custom Affirmations', 'Create personalized affirmations')}
            {renderFeature('music', 'Premium Sounds', 'Access to exclusive soundscapes')}
            {renderFeature('shield', 'Priority Support', '24/7 premium customer support')}
          </View>

          <SpringButton
            title="Continue Your Journey"
            subtitle="Go back to manifesting"
            icon={<FontAwesome name="arrow-right" size={20} color="white" />}
            onPress={() => router.back()}
            gradient={gradients.primary}
            style={styles.continueButton}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ShiftingRainbow style={StyleSheet.absoluteFill} />

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <FontAwesome name="arrow-left" size={24} color="white" />
        </TouchableOpacity>
        
        <Animated.View style={crownAnimatedStyle}>
          <FontAwesome name="crown" size={32} color="#FFD700" />
        </Animated.View>
        
        <TouchableOpacity
          style={styles.restoreButton}
          onPress={handleRestore}
        >
          <Text style={styles.restoreText}>Restore</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.heroSection}>
          <Text style={styles.heroTitle}>Unlock Your Full Potential</Text>
          <Text style={styles.heroSubtitle}>
            Transform your manifestation practice with premium features designed to accelerate your success
          </Text>
        </View>

        <Animated.View style={cardAnimatedStyle}>
          <View style={styles.plansContainer}>
            {products.map(renderPlanCard)}
          </View>
        </Animated.View>

        <View style={styles.featuresSection}>
          <Text style={styles.featuresTitle}>Premium Features</Text>
          <View style={styles.featuresGrid}>
            {renderFeature('infinity', 'Unlimited Goals', 'Create unlimited manifestation goals with advanced categorization')}
            {renderFeature('chart-line', 'Advanced Analytics', 'Deep insights into your patterns, progress, and success rates')}
            {renderFeature('heart', 'Custom Affirmations', 'Create and save personalized affirmations with voice recording')}
            {renderFeature('music', 'Premium Sounds', '50+ exclusive meditation and visualization soundscapes')}
            {renderFeature('cloud', 'Cloud Sync', 'Automatic backup and sync across all your devices')}
            {renderFeature('shield', 'Priority Support', '24/7 premium customer support and guidance')}
          </View>
        </View>

        <View style={styles.trustSection}>
          <View style={styles.trustBadges}>
            <View style={styles.trustBadge}>
              <FontAwesome name="lock" size={16} color="#4CAF50" />
              <Text style={styles.trustText}>Secure Payment</Text>
            </View>
            <View style={styles.trustBadge}>
              <FontAwesome name="refresh" size={16} color="#4CAF50" />
              <Text style={styles.trustText}>Cancel Anytime</Text>
            </View>
            <View style={styles.trustBadge}>
              <FontAwesome name="money" size={16} color="#4CAF50" />
              <Text style={styles.trustText}>30-Day Guarantee</Text>
            </View>
          </View>
          
          <Text style={styles.disclaimerText}>
            Subscriptions auto-renew unless canceled 24 hours before the period ends.
            Manage subscriptions in your account settings.
          </Text>
        </View>
      </ScrollView>

      <View style={styles.purchaseContainer}>
        <SpringButton
          title={isPurchasing ? "Processing..." : `Start Premium - ${products.find(p => p.productId === selectedPlan)?.localizedPrice}`}
          subtitle={selectedPlan === 'premium_yearly' ? 'Billed annually' : 'Billed monthly'}
          onPress={handlePurchase}
          loading={isPurchasing}
          disabled={isPurchasing}
          gradient={gradients.golden}
          size="large"
          style={styles.purchaseButton}
          icon={<FontAwesome name="crown" size={20} color="white" />}
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  restoreButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  restoreText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  headerSpacer: {
    width: 44,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  heroSection: {
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 40,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 12,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  heroSubtitle: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 26,
    paddingHorizontal: 10,
  },
  plansContainer: {
    paddingHorizontal: 20,
    gap: 16,
    marginBottom: 40,
  },
  planCard: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  selectedPlanCard: {
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  planCardGradient: {
    borderRadius: 20,
    padding: 24,
    position: 'relative',
  },
  popularBadge: {
    position: 'absolute',
    top: -1,
    right: 20,
    backgroundColor: '#FF6B35',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 1,
  },
  popularText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  planHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  planTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  savingsText: {
    fontSize: 16,
    fontWeight: '600',
  },
  planPricing: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    marginBottom: 12,
  },
  planPrice: {
    fontSize: 36,
    fontWeight: 'bold',
  },
  planPeriod: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 4,
  },
  planDescription: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
  selectedIndicator: {
    position: 'absolute',
    top: 20,
    left: 20,
  },
  featuresSection: {
    paddingHorizontal: 20,
    marginBottom: 40,
  },
  featuresTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 24,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  featuresGrid: {
    gap: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D3436',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: '#6C7B7F',
    lineHeight: 20,
  },
  trustSection: {
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  trustBadges: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 20,
  },
  trustBadge: {
    alignItems: 'center',
    gap: 8,
  },
  trustText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  disclaimerText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 20,
  },
  purchaseContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  purchaseButton: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  // Premium status styles
  premiumStatusContainer: {
    flex: 1,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  premiumStatusTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 12,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  premiumStatusDescription: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 26,
  },
  premiumFeatures: {
    width: '100%',
    gap: 16,
    marginBottom: 40,
  },
  continueButton: {
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
});