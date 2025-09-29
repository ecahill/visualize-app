import React, { useState, useEffect } from 'react';
import { StyleSheet, TouchableOpacity, Alert, ScrollView, StatusBar, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { router } from 'expo-router';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring,
  useAnimatedScrollHandler
} from 'react-native-reanimated';
import { trigger as triggerHaptic } from '@/services/haptics';
import * as FileSystem from 'expo-file-system';

import { Text, View } from '@/components/Themed';
import Colors, { gradients } from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { ShiftingRainbow } from '@/components/animations/AnimatedGradient';
import SpringButton from '@/components/animations/SpringButton';
import { userService, UserProfile, UserStats } from '@/services/userService';
import { analyticsService } from '@/services/analyticsService';

const { width, height } = Dimensions.get('window');

export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  
  const scrollY = useSharedValue(0);
  const avatarScale = useSharedValue(1);

  useEffect(() => {
    loadUserProfile();
    
    // Track profile screen view
    analyticsService.trackScreenView('profile', {
      viewTime: new Date().toISOString(),
    });
  }, []);

  const loadUserProfile = async () => {
    try {
      setIsLoading(true);
      const profile = await userService.initializeUser();
      setUserProfile(profile);
    } catch (error) {
      console.error('Failed to load user profile:', error);
      Alert.alert('Error', 'Failed to load profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAvatarPress = () => {
    triggerHaptic('impact-medium');
    avatarScale.value = withSpring(0.9, { duration: 100 }, () => {
      avatarScale.value = withSpring(1, { duration: 100 });
    });
    uploadAvatar();
  };

  const uploadAvatar = async () => {
    try {
      setIsUploadingAvatar(true);
      const avatarUrl = await userService.uploadAvatar();
      
      if (avatarUrl) {
        setUserProfile(prev => prev ? { ...prev, avatar: avatarUrl } : null);
        triggerHaptic('notification-success');
        
        // Track avatar upload
        analyticsService.trackUserAction('upload_avatar', 'profile_screen', {
          uploadSuccess: true,
          hasExistingAvatar: userProfile?.avatar ? true : false,
        });
      }
    } catch (error) {
      console.error('Avatar upload failed:', error);
      Alert.alert('Upload Failed', 'Could not upload avatar. Please try again.');
      
      // Track failed upload
      analyticsService.trackError(error as Error, 'avatar_upload', {
        screenName: 'profile',
      });
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleEditName = () => {
    Alert.prompt(
      'Edit Name',
      'Enter your name:',
      async (newName) => {
        if (newName && newName.trim()) {
          try {
            await userService.updateUserProfile({ name: newName.trim() });
            setUserProfile(prev => prev ? { ...prev, name: newName.trim() } : null);
            HapticFeedback.trigger('impactLight');
          } catch (error) {
            Alert.alert('Error', 'Failed to update name. Please try again.');
          }
        }
      },
      'plain-text',
      userProfile?.name
    );
  };

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const avatarAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: avatarScale.value }],
  }));

  const formatJoinedDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const calculateDaysSinceJoined = (joinedAt: string) => {
    const joinDate = new Date(joinedAt);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - joinDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const renderStatCard = (label: string, value: number, icon: string, gradient: string[]) => (
    <View style={styles.statCard}>
      <LinearGradient colors={gradient} style={styles.statGradient}>
        <FontAwesome name={icon as any} size={24} color="white" />
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
      </LinearGradient>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />
        <ShiftingRainbow style={StyleSheet.absoluteFill} />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </View>
    );
  }

  if (!userProfile) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />
        <ShiftingRainbow style={StyleSheet.absoluteFill} />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Failed to load profile</Text>
          <SpringButton
            title="Retry"
            onPress={loadUserProfile}
            gradient={[colors.primary, colors.primary]}
            style={styles.retryButton}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ShiftingRainbow style={StyleSheet.absoluteFill} />
      
      <Animated.ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
      >
        {/* Profile Header */}
        <View style={styles.header}>
          <Animated.View style={[styles.avatarContainer, avatarAnimatedStyle]}>
            <TouchableOpacity
              style={styles.avatarButton}
              onPress={handleAvatarPress}
              disabled={isUploadingAvatar}
            >
              {userProfile.avatar ? (
                <Animated.Image 
                  source={{ uri: userProfile.avatar }} 
                  style={styles.avatar}
                />
              ) : (
                <LinearGradient
                  colors={gradients.primary}
                  style={styles.defaultAvatar}
                >
                  <FontAwesome name="user" size={60} color="white" />
                </LinearGradient>
              )}
              <View style={styles.cameraOverlay}>
                <FontAwesome 
                  name={isUploadingAvatar ? "spinner" : "camera"} 
                  size={16} 
                  color="white" 
                />
              </View>
            </TouchableOpacity>
          </Animated.View>

          <TouchableOpacity onPress={handleEditName} style={styles.nameContainer}>
            <Text style={styles.profileName}>{userProfile.name}</Text>
            <FontAwesome name="edit" size={18} color="rgba(255, 255, 255, 0.8)" />
          </TouchableOpacity>

          {userProfile.email && (
            <Text style={styles.profileEmail}>{userProfile.email}</Text>
          )}

          <Text style={styles.joinDate}>
            Manifesting since {formatJoinedDate(userProfile.joinedAt)}
          </Text>

          {userProfile.isPremium && (
            <View style={styles.premiumBadge}>
              <LinearGradient colors={['#FFD700', '#FFA500']} style={styles.premiumGradient}>
                <FontAwesome name="crown" size={16} color="white" />
                <Text style={styles.premiumText}>Premium</Text>
              </LinearGradient>
            </View>
          )}
        </View>

        {/* Stats Grid */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Your Journey</Text>
          <View style={styles.statsGrid}>
            {renderStatCard('Day Streak', userProfile.stats.streakDays, 'fire', gradients.sunset)}
            {renderStatCard('Sessions', userProfile.stats.totalSessions, 'play', gradients.ocean)}
            {renderStatCard('Affirmations', userProfile.stats.affirmationsRead, 'heart', gradients.primary)}
            {renderStatCard('Journal Entries', userProfile.stats.journalEntries, 'book', gradients.success)}
            {renderStatCard('Visualizations', Math.floor(userProfile.stats.visualizationMinutes), 'eye', gradients.purple)}
            {renderStatCard('Manifestations', userProfile.stats.manifestationsCompleted, 'star', gradients.golden)}
          </View>
        </View>

        {/* Goals Section */}
        <View style={styles.goalsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Manifestation Goals</Text>
            <TouchableOpacity 
              onPress={() => router.push('/onboarding/goals' as any)}
              style={styles.addGoalButton}
            >
              <FontAwesome name="plus" size={16} color={colors.primary} />
            </TouchableOpacity>
          </View>

          {userProfile.manifestationGoals.length > 0 ? (
            <View style={styles.goalsList}>
              {userProfile.manifestationGoals.slice(0, 3).map((goal, index) => (
                <View key={goal.id} style={styles.goalItem}>
                  <LinearGradient 
                    colors={['rgba(255, 255, 255, 0.9)', 'rgba(255, 255, 255, 0.7)']} 
                    style={styles.goalCard}
                  >
                    <View style={styles.goalHeader}>
                      <Text style={styles.goalCategory}>{goal.category.toUpperCase()}</Text>
                      {goal.isAchieved && (
                        <FontAwesome name="check-circle" size={16} color={colors.success} />
                      )}
                    </View>
                    <Text style={styles.goalTitle}>{goal.title}</Text>
                    <Text style={styles.goalDescription} numberOfLines={2}>
                      {goal.description}
                    </Text>
                  </LinearGradient>
                </View>
              ))}
              
              {userProfile.manifestationGoals.length > 3 && (
                <TouchableOpacity 
                  style={styles.viewAllGoals}
                  onPress={() => router.push('/goals' as any)}
                >
                  <Text style={styles.viewAllText}>
                    View all {userProfile.manifestationGoals.length} goals
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <View style={styles.noGoalsContainer}>
              <Text style={styles.noGoalsText}>No manifestation goals yet</Text>
              <SpringButton
                title="Add Your First Goal"
                onPress={() => router.push('/onboarding/goals' as any)}
                gradient={gradients.primary}
                size="small"
                style={styles.addFirstGoalButton}
              />
            </View>
          )}
        </View>

        {/* Actions Section */}
        <View style={styles.actionsSection}>
          <SpringButton
            title="Settings & Preferences"
            subtitle="Customize your experience"
            icon={<FontAwesome name="cog" size={20} color="white" />}
            onPress={() => router.push('/settings' as any)}
            gradient={gradients.ocean}
            style={styles.actionButton}
          />

          <SpringButton
            title="Export My Data"
            subtitle="Download your manifestation data"
            icon={<FontAwesome name="download" size={20} color="white" />}
            onPress={async () => {
              try {
                const filePath = await userService.exportUserData();
                Alert.alert(
                  'Data Exported',
                  `Your data has been saved to: ${filePath}`,
                  [{ text: 'OK', onPress: () => HapticFeedback.trigger('notificationSuccess') }]
                );
              } catch (error) {
                Alert.alert('Export Failed', 'Could not export data. Please try again.');
              }
            }}
            gradient={gradients.success}
            style={styles.actionButton}
          />

          {!userProfile.isPremium && (
            <SpringButton
              title="Upgrade to Premium"
              subtitle="Unlock unlimited features"
              icon={<FontAwesome name="crown" size={20} color="white" />}
              onPress={() => router.push('/premium' as any)}
              gradient={gradients.golden}
              style={styles.actionButton}
            />
          )}
        </View>
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 20,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
  },
  header: {
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  avatarContainer: {
    marginBottom: 20,
  },
  avatarButton: {
    position: 'relative',
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  defaultAvatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  cameraOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  profileName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginRight: 12,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  profileEmail: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 8,
  },
  joinDate: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    fontStyle: 'italic',
    marginBottom: 16,
  },
  premiumBadge: {
    marginTop: 8,
  },
  premiumGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  premiumText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  statsSection: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 20,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    marginBottom: 16,
  },
  statGradient: {
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
    textAlign: 'center',
  },
  goalsSection: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  addGoalButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalsList: {
    gap: 12,
  },
  goalItem: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  goalCard: {
    padding: 16,
    borderRadius: 12,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  goalCategory: {
    fontSize: 10,
    fontWeight: '600',
    color: '#6C7B7F',
    letterSpacing: 1,
  },
  goalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3436',
    marginBottom: 6,
  },
  goalDescription: {
    fontSize: 14,
    color: '#6C7B7F',
    lineHeight: 20,
  },
  viewAllGoals: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  viewAllText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 16,
    fontWeight: '500',
  },
  noGoalsContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  noGoalsText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 16,
    marginBottom: 16,
  },
  addFirstGoalButton: {
    marginTop: 8,
  },
  actionsSection: {
    paddingHorizontal: 20,
    gap: 16,
  },
  actionButton: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
});