import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Alert, 
  Dimensions,
  StatusBar,
  TextInput
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { router } from 'expo-router';

import { Text, View } from '@/components/Themed';
import Colors, { gradients } from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { authService } from '../services/auth';
import { analyticsService } from '../services/analytics';

const { width } = Dimensions.get('window');

export default function PremiumScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  const [isLoading, setIsLoading] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showEmailForm, setShowEmailForm] = useState(false);

  useEffect(() => {
    loadUserInfo();
    
    // Track premium screen view
    analyticsService.trackScreenView('premium_screen');
  }, []);

  const loadUserInfo = () => {
    const info = authService.getUserInfo();
    setUserInfo(info);
  };

  const handleEmailUpgrade = async () => {
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    if (!email.includes('@')) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    
    try {
      await authService.upgradeToEmail(email, password);
      
      // Track successful upgrade
      analyticsService.trackAccountUpgrade('email');
      
      Alert.alert(
        'Success!', 
        'Your account has been upgraded! All your data has been preserved and is now backed up.',
        [
          {
            text: 'Continue',
            onPress: () => {
              router.back();
            }
          }
        ]
      );
      
      loadUserInfo();
    } catch (error) {
      console.error('Email upgrade error:', error);
      Alert.alert('Upgrade Failed', error.message);
      
      // Track failed upgrade
      analyticsService.trackError('email_upgrade_failed', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAppleUpgrade = async () => {
    setIsLoading(true);
    
    try {
      // Track upgrade attempt
      analyticsService.trackPremiumUpgradeAttempted('apple');
      
      await authService.upgradeWithApple();
      
      // Track successful upgrade
      analyticsService.trackAccountUpgrade('apple');
      
      Alert.alert(
        'Success!', 
        'Your account has been upgraded with Apple Sign-In! All your data has been preserved.',
        [
          {
            text: 'Continue',
            onPress: () => {
              router.back();
            }
          }
        ]
      );
      
      loadUserInfo();
    } catch (error) {
      console.error('Apple upgrade error:', error);
      Alert.alert('Apple Sign-In', error.message);
      
      // Track failed upgrade
      analyticsService.trackError('apple_upgrade_failed', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleUpgrade = async () => {
    setIsLoading(true);
    
    try {
      // Track upgrade attempt
      analyticsService.trackPremiumUpgradeAttempted('google');
      
      await authService.upgradeWithGoogle();
      
      // Track successful upgrade
      analyticsService.trackAccountUpgrade('google');
      
      loadUserInfo();
    } catch (error) {
      console.error('Google upgrade error:', error);
      Alert.alert('Google Sign-In', error.message);
      
      // Track failed upgrade
      analyticsService.trackError('google_upgrade_failed', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const premiumFeatures = [
    {
      icon: 'cloud',
      title: 'Cloud Backup & Sync',
      description: 'Never lose your journal entries, vision boards, or custom affirmations'
    },
    {
      icon: 'infinity',
      title: 'Unlimited Vision Boards',
      description: 'Create as many vision boards as you want to manifest all your dreams'
    },
    {
      icon: 'magic',
      title: 'Advanced Manifestation Tools',
      description: 'Access guided meditations, moon cycle tracking, and manifestation rituals'
    },
    {
      icon: 'star',
      title: 'Premium Affirmations',
      description: 'Unlock hundreds of expert-crafted affirmations across all categories'
    },
    {
      icon: 'bar-chart',
      title: 'Progress Analytics',
      description: 'Track your manifestation journey with detailed insights and streak tracking'
    },
    {
      icon: 'download',
      title: 'Export & Share',
      description: 'Export your journal and vision boards in multiple formats'
    }
  ];

  const renderFeatureItem = (feature, index) => (
    <View key={index} style={[styles.featureItem, { backgroundColor: colors.card }]}>
      <View style={[styles.featureIcon, { backgroundColor: colors.primary }]}>
        <FontAwesome name={feature.icon} size={20} color="white" />
      </View>
      <View style={styles.featureContent}>
        <Text style={[styles.featureTitle, { color: colors.text }]}>
          {feature.title}
        </Text>
        <Text style={[styles.featureDescription, { color: colors.text }]}>
          {feature.description}
        </Text>
      </View>
    </View>
  );

  const renderUpgradeButtons = () => (
    <View style={styles.upgradeSection}>
      <Text style={[styles.upgradeTitle, { color: colors.text }]}>
        Create Your Account
      </Text>
      <Text style={[styles.upgradeSubtitle, { color: colors.text }]}>
        All your data will be preserved when you upgrade
      </Text>

      {/* Email Signup Button */}
      <TouchableOpacity
        style={[styles.upgradeButton, { backgroundColor: colors.primary }]}
        onPress={() => setShowEmailForm(!showEmailForm)}
        disabled={isLoading}
      >
        <FontAwesome name="envelope" size={16} color="white" />
        <Text style={styles.upgradeButtonText}>Sign Up with Email</Text>
      </TouchableOpacity>

      {/* Apple Sign In Button */}
      <TouchableOpacity
        style={[styles.upgradeButton, styles.appleButton]}
        onPress={handleAppleUpgrade}
        disabled={isLoading}
      >
        <FontAwesome name="apple" size={16} color="white" />
        <Text style={[styles.upgradeButtonText, { color: 'white' }]}>
          Continue with Apple
        </Text>
      </TouchableOpacity>

      {/* Google Sign In Button */}
      <TouchableOpacity
        style={[styles.upgradeButton, styles.googleButton]}
        onPress={handleGoogleUpgrade}
        disabled={isLoading}
      >
        <FontAwesome name="google" size={16} color="white" />
        <Text style={[styles.upgradeButtonText, { color: 'white' }]}>
          Continue with Google
        </Text>
      </TouchableOpacity>

      <Text style={[styles.disclaimer, { color: colors.text }]}>
        ✨ Free forever. No credit card required.
        {'\n'}Premium features coming soon!
      </Text>
    </View>
  );

  const renderEmailForm = () => (
    <View style={[styles.emailForm, { backgroundColor: colors.card }]}>
      <Text style={[styles.formTitle, { color: colors.text }]}>Create Account</Text>
      
      <TextInput
        style={[styles.input, { backgroundColor: colors.background, color: colors.text }]}
        placeholder="Email address"
        placeholderTextColor={colors.text + '80'}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
      />
      
      <TextInput
        style={[styles.input, { backgroundColor: colors.background, color: colors.text }]}
        placeholder="Password (min 6 characters)"
        placeholderTextColor={colors.text + '80'}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoCapitalize="none"
      />
      
      <TextInput
        style={[styles.input, { backgroundColor: colors.background, color: colors.text }]}
        placeholder="Confirm password"
        placeholderTextColor={colors.text + '80'}
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
        autoCapitalize="none"
      />

      <TouchableOpacity
        style={[styles.createButton, { backgroundColor: colors.primary }]}
        onPress={handleEmailUpgrade}
        disabled={isLoading}
      >
        <Text style={styles.createButtonText}>
          {isLoading ? 'Creating Account...' : 'Create Account'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.cancelButton}
        onPress={() => setShowEmailForm(false)}
      >
        <Text style={[styles.cancelButtonText, { color: colors.text }]}>Cancel</Text>
      </TouchableOpacity>
    </View>
  );

  // If user is already premium, show success message
  if (userInfo && userInfo.isPremium) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar style="light" />
        
        <LinearGradient
          colors={gradients.success}
          style={styles.header}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <FontAwesome name="times" size={24} color="white" />
          </TouchableOpacity>
          
          <FontAwesome name="crown" size={64} color="white" style={styles.crownIcon} />
          <Text style={styles.premiumTitle}>You're All Set! ✨</Text>
          <Text style={styles.premiumSubtitle}>
            Welcome to your premium manifestation journey
          </Text>
        </LinearGradient>

        <View style={styles.successContent}>
          <Text style={[styles.successMessage, { color: colors.text }]}>
            Your account: {userInfo.email || 'Premium Account'}
          </Text>
          <Text style={[styles.successDescription, { color: colors.text }]}>
            All premium features will be unlocked in future updates.
            Your data is now safely backed up in the cloud! 🌟
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style="light" />
      
      <LinearGradient
        colors={gradients.sunset}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <FontAwesome name="times" size={24} color="white" />
        </TouchableOpacity>
        
        <FontAwesome name="crown" size={48} color="white" style={styles.crownIcon} />
        <Text style={styles.headerTitle}>Unlock Premium Features</Text>
        <Text style={styles.headerSubtitle}>
          Create your account to secure your manifestation journey
        </Text>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Premium Features */}
        <View style={styles.featuresSection}>
          <Text style={[styles.featuresTitle, { color: colors.text }]}>
            What You Get
          </Text>
          {premiumFeatures.map(renderFeatureItem)}
        </View>

        {/* Email Form or Upgrade Buttons */}
        {showEmailForm ? renderEmailForm() : renderUpgradeButtons()}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 32,
    paddingTop: 80,
    alignItems: 'center',
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    top: 60,
    left: 20,
    zIndex: 1,
  },
  crownIcon: {
    marginBottom: 16,
    opacity: 0.9,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 24,
  },
  content: {
    flex: 1,
  },
  featuresSection: {
    padding: 20,
  },
  featuresTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  featureItem: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.8,
  },
  upgradeSection: {
    padding: 20,
    paddingTop: 10,
  },
  upgradeTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  upgradeSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    opacity: 0.8,
  },
  upgradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  appleButton: {
    backgroundColor: '#000000',
  },
  googleButton: {
    backgroundColor: '#4285F4',
  },
  upgradeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12,
  },
  disclaimer: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 20,
    lineHeight: 18,
    opacity: 0.7,
  },
  emailForm: {
    margin: 20,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  input: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  createButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  createButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelButton: {
    padding: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  cancelButtonText: {
    fontSize: 14,
  },
  premiumTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 8,
  },
  premiumSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  successContent: {
    padding: 32,
    alignItems: 'center',
  },
  successMessage: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  successDescription: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    opacity: 0.8,
  },
});