import AsyncStorage from '@react-native-async-storage/async-storage';
import { userService } from './userService';

export interface AnalyticsEvent {
  userId?: string;
  eventName: string;
  timestamp: string;
  properties?: Record<string, any>;
  sessionId: string;
  platform: 'ios' | 'android' | 'web';
  appVersion: string;
}

export interface SessionData {
  sessionId: string;
  startTime: string;
  endTime?: string;
  screenViews: string[];
  events: string[];
  duration?: number;
}

class AnalyticsService {
  private currentSessionId: string = '';
  private sessionStartTime: Date = new Date();
  private eventQueue: AnalyticsEvent[] = [];
  private maxQueueSize = 100;
  private batchUploadSize = 20;
  
  async initialize(): Promise<void> {
    try {
      // Start new session
      this.currentSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      this.sessionStartTime = new Date();
      
      // Load any pending events
      await this.loadPendingEvents();
      
      // Track app open
      this.track('app_opened', {
        sessionId: this.currentSessionId,
        openTime: this.sessionStartTime.toISOString(),
      });
      
      // Set up periodic uploads
      this.schedulePeriodicUploads();
      
    } catch (error) {
      console.error('Failed to initialize analytics:', error);
    }
  }

  private async loadPendingEvents(): Promise<void> {
    try {
      const pending = await AsyncStorage.getItem('analytics_pending_events');
      if (pending) {
        this.eventQueue = JSON.parse(pending);
      }
    } catch (error) {
      console.error('Failed to load pending analytics events:', error);
    }
  }

  private async savePendingEvents(): Promise<void> {
    try {
      await AsyncStorage.setItem('analytics_pending_events', JSON.stringify(this.eventQueue));
    } catch (error) {
      console.error('Failed to save pending analytics events:', error);
    }
  }

  async track(eventName: string, properties?: Record<string, any>): Promise<void> {
    // Check if user has opted out of analytics
    const userPrefs = userService.getUserPreferences();
    if (!userPrefs?.privacy.analyticsEnabled) {
      return;
    }

    try {
      const user = userService.getCurrentUser();
      
      const event: AnalyticsEvent = {
        userId: user?.id,
        eventName,
        timestamp: new Date().toISOString(),
        properties: {
          ...properties,
          // Add automatic context
          userPremium: user?.isPremium || false,
          userJoinedDaysAgo: user?.stats?.joinedDaysAgo || 0,
          userStreakDays: user?.stats?.streakDays || 0,
        },
        sessionId: this.currentSessionId,
        platform: this.getPlatform(),
        appVersion: await this.getAppVersion(),
      };

      // Add to queue
      this.eventQueue.push(event);
      
      // Maintain queue size
      if (this.eventQueue.length > this.maxQueueSize) {
        this.eventQueue.splice(0, this.eventQueue.length - this.maxQueueSize);
      }

      // Save locally
      await this.savePendingEvents();

      // Upload if queue is getting full or for important events
      if (this.eventQueue.length >= this.batchUploadSize || this.isImportantEvent(eventName)) {
        this.uploadEvents();
      }

    } catch (error) {
      console.error('Failed to track analytics event:', error);
    }
  }

  private isImportantEvent(eventName: string): boolean {
    const importantEvents = [
      'app_opened',
      'app_closed',
      'user_registered',
      'goal_completed',
      'premium_purchase',
      'feature_unlocked',
      'critical_error',
    ];
    return importantEvents.includes(eventName);
  }

  private async uploadEvents(): Promise<void> {
    if (this.eventQueue.length === 0) return;

    try {
      // Use the existing userService method for Firebase upload
      await userService.trackFeatureUsage('batch_analytics', {
        events: this.eventQueue.slice(),
        batchSize: this.eventQueue.length,
        uploadTime: new Date().toISOString(),
      });

      // Clear uploaded events
      this.eventQueue = [];
      await this.savePendingEvents();

    } catch (error) {
      console.error('Failed to upload analytics events:', error);
      // Keep events in queue for retry
    }
  }

  private schedulePeriodicUploads(): void {
    // Upload pending events every 5 minutes
    setInterval(() => {
      if (this.eventQueue.length > 0) {
        this.uploadEvents();
      }
    }, 5 * 60 * 1000);
  }

  private getPlatform(): 'ios' | 'android' | 'web' {
    // In a real app, detect platform properly
    if (typeof navigator !== 'undefined') return 'web';
    return 'ios'; // Default for this demo
  }

  private async getAppVersion(): Promise<string> {
    try {
      // In a real app, get from app.json or package.json
      return '1.0.0';
    } catch {
      return 'unknown';
    }
  }

  // Screen tracking
  async trackScreenView(screenName: string, properties?: Record<string, any>): Promise<void> {
    await this.track('screen_view', {
      screenName,
      viewTime: new Date().toISOString(),
      ...properties,
    });
  }

  // User action tracking
  async trackUserAction(action: string, context?: string, properties?: Record<string, any>): Promise<void> {
    await this.track('user_action', {
      action,
      context,
      ...properties,
    });
  }

  // Feature usage tracking
  async trackFeatureUsage(featureName: string, duration?: number, properties?: Record<string, any>): Promise<void> {
    await this.track('feature_usage', {
      feature: featureName,
      duration,
      usageTime: new Date().toISOString(),
      ...properties,
    });
  }

  // Error tracking
  async trackError(error: Error, context?: string, properties?: Record<string, any>): Promise<void> {
    await this.track('error', {
      errorMessage: error.message,
      errorStack: error.stack,
      context,
      errorTime: new Date().toISOString(),
      ...properties,
    });
  }

  // Goal/Achievement tracking
  async trackGoalEvent(goalId: string, action: 'created' | 'updated' | 'completed' | 'deleted', properties?: Record<string, any>): Promise<void> {
    await this.track('goal_event', {
      goalId,
      action,
      actionTime: new Date().toISOString(),
      ...properties,
    });
  }

  // Purchase tracking
  async trackPurchase(productId: string, price?: number, currency?: string, properties?: Record<string, any>): Promise<void> {
    await this.track('purchase', {
      productId,
      price,
      currency,
      purchaseTime: new Date().toISOString(),
      ...properties,
    });
  }

  // Content interaction tracking
  async trackContentInteraction(contentType: string, contentId: string, interaction: string, properties?: Record<string, any>): Promise<void> {
    await this.track('content_interaction', {
      contentType,
      contentId,
      interaction,
      interactionTime: new Date().toISOString(),
      ...properties,
    });
  }

  // Session management
  async endSession(): Promise<void> {
    const sessionDuration = Date.now() - this.sessionStartTime.getTime();
    
    await this.track('session_end', {
      sessionId: this.currentSessionId,
      sessionDuration: Math.floor(sessionDuration / 1000), // in seconds
      endTime: new Date().toISOString(),
    });

    // Force upload remaining events
    await this.uploadEvents();
  }

  // Performance tracking
  async trackPerformance(metric: string, value: number, unit: string, properties?: Record<string, any>): Promise<void> {
    await this.track('performance', {
      metric,
      value,
      unit,
      measureTime: new Date().toISOString(),
      ...properties,
    });
  }

  // A/B Test tracking
  async trackExperiment(experimentName: string, variant: string, properties?: Record<string, any>): Promise<void> {
    await this.track('experiment', {
      experimentName,
      variant,
      exposureTime: new Date().toISOString(),
      ...properties,
    });
  }

  // Funnel tracking
  async trackFunnelStep(funnelName: string, stepName: string, stepIndex: number, properties?: Record<string, any>): Promise<void> {
    await this.track('funnel_step', {
      funnelName,
      stepName,
      stepIndex,
      stepTime: new Date().toISOString(),
      ...properties,
    });
  }

  // Custom event builder for complex tracking
  createEventBuilder(eventName: string) {
    return {
      properties: {} as Record<string, any>,
      
      addProperty(key: string, value: any) {
        this.properties[key] = value;
        return this;
      },
      
      addUserContext() {
        const user = userService.getCurrentUser();
        if (user) {
          this.properties.userId = user.id;
          this.properties.userPremium = user.isPremium;
          this.properties.userGoalsCount = user.manifestationGoals.length;
          this.properties.userStreakDays = user.stats.streakDays;
        }
        return this;
      },
      
      addTimeContext() {
        const now = new Date();
        this.properties.timestamp = now.toISOString();
        this.properties.localTime = now.toLocaleTimeString();
        this.properties.dayOfWeek = now.getDay();
        this.properties.hourOfDay = now.getHours();
        return this;
      },
      
      async send() {
        await analyticsService.track(eventName, this.properties);
      }
    };
  }

  // Get analytics summary for user (privacy-compliant)
  async getAnalyticsSummary(): Promise<{
    totalEvents: number;
    sessionsThisWeek: number;
    mostUsedFeatures: Array<{ feature: string; count: number }>;
    lastActiveDate: string;
  } | null> {
    try {
      const events = await AsyncStorage.getItem('analytics_events');
      if (!events) return null;

      const eventList = JSON.parse(events);
      const lastWeek = new Date();
      lastWeek.setDate(lastWeek.getDate() - 7);

      const recentEvents = eventList.filter((event: AnalyticsEvent) => 
        new Date(event.timestamp) > lastWeek
      );

      const sessions = new Set(recentEvents.map((event: AnalyticsEvent) => event.sessionId));
      
      const featureUsage = recentEvents
        .filter((event: AnalyticsEvent) => event.eventName === 'feature_usage')
        .reduce((acc: Record<string, number>, event: AnalyticsEvent) => {
          const feature = event.properties?.feature || 'unknown';
          acc[feature] = (acc[feature] || 0) + 1;
          return acc;
        }, {});

      const mostUsedFeatures = Object.entries(featureUsage)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([feature, count]) => ({ feature, count }));

      const lastEvent = eventList[eventList.length - 1];

      return {
        totalEvents: eventList.length,
        sessionsThisWeek: sessions.size,
        mostUsedFeatures,
        lastActiveDate: lastEvent?.timestamp || new Date().toISOString(),
      };

    } catch (error) {
      console.error('Failed to get analytics summary:', error);
      return null;
    }
  }
}

export const analyticsService = new AnalyticsService();