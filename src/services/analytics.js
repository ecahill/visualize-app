import { logEvent, setUserId, setUserProperties } from 'firebase/analytics';
import { analytics } from './firebase';
import { authService } from './auth';

/**
 * Analytics service for tracking user behavior and conversion events
 */
class AnalyticsService {
  constructor() {
    this.isEnabled = true;
    this.eventQueue = [];
    this.isInitialized = false;
    
    console.log('📊 Analytics service initialized');
  }

  /**
   * Initialize analytics with user ID
   */
  async initialize() {
    if (this.isInitialized) return;

    try {
      const userId = authService.getUserId();
      if (userId && analytics) {
        setUserId(analytics, userId);
        
        // Set user properties
        const userInfo = authService.getUserInfo();
        setUserProperties(analytics, {
          account_type: userInfo.isAnonymous ? 'anonymous' : 'authenticated',
          is_premium: userInfo.isPremium,
          auth_provider: userInfo.provider || 'anonymous'
        });

        console.log('📊 Analytics initialized with user ID:', userId);
      }

      // Process any queued events
      this.processEventQueue();
      this.isInitialized = true;
    } catch (error) {
      console.error('❌ Failed to initialize analytics:', error);
    }
  }

  /**
   * Check if analytics is available and enabled
   */
  isAvailable() {
    return !!analytics && this.isEnabled;
  }

  /**
   * Enable or disable analytics tracking
   */
  setEnabled(enabled) {
    this.isEnabled = enabled;
    console.log(`📊 Analytics ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Log an event to analytics
   */
  logEvent(eventName, parameters = {}) {
    if (!this.isEnabled) return;

    try {
      // Add standard parameters
      const eventData = {
        ...parameters,
        user_id: authService.getUserId(),
        is_anonymous: authService.isAnonymous(),
        is_premium: authService.isPremium(),
        timestamp: new Date().toISOString()
      };

      if (this.isAvailable()) {
        logEvent(analytics, eventName, eventData);
        console.log('📊 Event logged:', eventName, eventData);
      } else {
        // Queue event for later if analytics isn't ready
        this.eventQueue.push({ eventName, eventData });
        console.log('📊 Event queued:', eventName);
      }
    } catch (error) {
      console.error('❌ Failed to log analytics event:', error);
    }
  }

  /**
   * Process queued events when analytics becomes available
   */
  processEventQueue() {
    if (!this.isAvailable()) return;

    while (this.eventQueue.length > 0) {
      const { eventName, eventData } = this.eventQueue.shift();
      try {
        logEvent(analytics, eventName, eventData);
        console.log('📊 Queued event processed:', eventName);
      } catch (error) {
        console.error('❌ Failed to process queued event:', error);
      }
    }
  }

  /**
   * Update user properties when auth state changes
   */
  updateUserProperties() {
    if (!this.isAvailable()) return;

    try {
      const userInfo = authService.getUserInfo();
      setUserProperties(analytics, {
        account_type: userInfo.isAnonymous ? 'anonymous' : 'authenticated',
        is_premium: userInfo.isPremium,
        auth_provider: userInfo.provider || 'anonymous',
        last_updated: new Date().toISOString()
      });
    } catch (error) {
      console.error('❌ Failed to update user properties:', error);
    }
  }

  // === SCREEN TRACKING ===

  /**
   * Track screen views
   */
  trackScreenView(screenName, screenClass = null) {
    this.logEvent('screen_view', {
      screen_name: screenName,
      screen_class: screenClass || screenName
    });
  }

  // === FEATURE USAGE TRACKING ===

  /**
   * Track when journal is opened
   */
  trackJournalOpened() {
    this.logEvent('journal_opened');
  }

  /**
   * Track journal entry creation
   */
  trackJournalEntryCreated(entryType = 'general', wordCount = 0) {
    this.logEvent('journal_entry_created', {
      entry_type: entryType,
      word_count: wordCount
    });
  }

  /**
   * Track vision board creation/editing
   */
  trackVisionBoardCreated() {
    this.logEvent('vision_board_created');
  }

  /**
   * Track vision board image added
   */
  trackVisionBoardImageAdded(imageSource = 'unknown') {
    this.logEvent('vision_board_image_added', {
      image_source: imageSource // 'camera', 'gallery', 'url'
    });
  }

  /**
   * Track affirmation interaction
   */
  trackAffirmationRead(affirmationCategory = 'general') {
    this.logEvent('affirmation_read', {
      category: affirmationCategory
    });
  }

  /**
   * Track custom affirmation creation
   */
  trackCustomAffirmationCreated() {
    this.logEvent('custom_affirmation_created');
  }

  /**
   * Track affirmation favorited
   */
  trackAffirmationFavorited(affirmationCategory = 'general') {
    this.logEvent('affirmation_favorited', {
      category: affirmationCategory
    });
  }

  /**
   * Track meditation/visualization session
   */
  trackMeditationStarted(sessionType = 'general', duration = 0) {
    this.logEvent('meditation_started', {
      session_type: sessionType,
      planned_duration: duration
    });
  }

  /**
   * Track meditation completion
   */
  trackMeditationCompleted(sessionType = 'general', actualDuration = 0) {
    this.logEvent('meditation_completed', {
      session_type: sessionType,
      actual_duration: actualDuration
    });
  }

  // === COMPLETION EVENTS ===

  /**
   * Track daily ritual completion
   */
  trackDailyRitualCompleted(ritualType = 'morning') {
    this.logEvent('daily_ritual_completed', {
      ritual_type: ritualType // 'morning', 'evening', 'custom'
    });
  }

  /**
   * Track streak milestone
   */
  trackStreakMilestone(streakDays = 0, streakType = 'general') {
    this.logEvent('streak_milestone', {
      streak_days: streakDays,
      streak_type: streakType
    });
  }

  /**
   * Track goal achievement
   */
  trackGoalAchieved(goalCategory = 'general', goalType = 'custom') {
    this.logEvent('goal_achieved', {
      goal_category: goalCategory,
      goal_type: goalType
    });
  }

  // === USER PREFERENCES ===

  /**
   * Track favorite features
   */
  trackFeaturePreference(featureName, isLiked = true) {
    this.logEvent('feature_preference', {
      feature_name: featureName,
      is_liked: isLiked
    });
  }

  /**
   * Track theme preference
   */
  trackThemeChanged(newTheme = 'auto') {
    this.logEvent('theme_changed', {
      theme: newTheme // 'light', 'dark', 'auto'
    });
  }

  /**
   * Track notification preferences
   */
  trackNotificationPreference(notificationType, enabled = true) {
    this.logEvent('notification_preference', {
      notification_type: notificationType,
      enabled: enabled
    });
  }

  // === CONVERSION EVENTS ===

  /**
   * Track conversion from anonymous to authenticated
   */
  trackAccountUpgrade(method = 'email') {
    this.logEvent('account_upgraded', {
      upgrade_method: method, // 'email', 'apple', 'google'
      value: 1
    });
  }

  /**
   * Track premium upgrade attempt
   */
  trackPremiumUpgradeAttempted(method = 'unknown') {
    this.logEvent('premium_upgrade_attempted', {
      upgrade_method: method
    });
  }

  /**
   * Track premium upgrade completion
   */
  trackPremiumUpgradeCompleted(method = 'unknown', subscriptionType = 'unknown') {
    this.logEvent('purchase', {
      currency: 'USD',
      value: 9.99, // This would come from the actual purchase
      upgrade_method: method,
      subscription_type: subscriptionType
    });
  }

  /**
   * Track subscription cancellation
   */
  trackSubscriptionCancelled(reason = 'unknown') {
    this.logEvent('subscription_cancelled', {
      cancellation_reason: reason
    });
  }

  // === ENGAGEMENT EVENTS ===

  /**
   * Track app session start
   */
  trackSessionStart() {
    this.logEvent('session_start');
  }

  /**
   * Track app session end
   */
  trackSessionEnd(sessionDuration = 0) {
    this.logEvent('session_end', {
      session_duration: sessionDuration
    });
  }

  /**
   * Track sharing events
   */
  trackContentShared(contentType = 'unknown', platform = 'unknown') {
    this.logEvent('share', {
      content_type: contentType, // 'affirmation', 'vision_board', 'journal_entry'
      method: platform // 'instagram', 'facebook', 'twitter', 'copy_link'
    });
  }

  /**
   * Track onboarding completion
   */
  trackOnboardingCompleted(stepsCompleted = 0) {
    this.logEvent('onboarding_completed', {
      steps_completed: stepsCompleted
    });
  }

  /**
   * Track tutorial completion
   */
  trackTutorialCompleted(tutorialName = 'unknown') {
    this.logEvent('tutorial_completed', {
      tutorial_name: tutorialName
    });
  }

  // === ERROR TRACKING ===

  /**
   * Track errors
   */
  trackError(errorName, errorMessage = '', errorStack = '') {
    this.logEvent('app_error', {
      error_name: errorName,
      error_message: errorMessage,
      error_stack: errorStack
    });
  }

  /**
   * Track feature usage frequency
   */
  trackFeatureUsage(featureName, usageCount = 1) {
    this.logEvent('feature_usage', {
      feature_name: featureName,
      usage_count: usageCount
    });
  }
}

// Export singleton instance
export const analyticsService = new AnalyticsService();
export default analyticsService;