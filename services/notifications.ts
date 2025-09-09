import React from 'react';
import { EnvironmentDetector } from './environmentDetection';
import { Platform } from 'react-native';

// Unified type definitions
export interface NotificationContent {
  title: string;
  body: string;
  subtitle?: string;
  data?: Record<string, any>;
  badge?: number;
  sound?: boolean | string;
  priority?: 'min' | 'low' | 'default' | 'high' | 'max';
  color?: string;
  categoryIdentifier?: string;
}

export interface NotificationTrigger {
  type: 'timeInterval' | 'date' | 'daily' | 'weekly';
  seconds?: number;
  date?: Date;
  hour?: number;
  minute?: number;
  weekday?: number;
  repeats?: boolean;
}

export interface ScheduledNotification {
  identifier: string;
  content: NotificationContent;
  trigger: NotificationTrigger;
}

export interface NotificationPermissionStatus {
  status: 'granted' | 'denied' | 'undetermined';
  canAskAgain?: boolean;
  expires?: 'never' | number;
}

/**
 * Unified notification service that works across Expo Go and native builds
 */
class NotificationService {
  private expoNotifications: any = null;
  private nativeNotifications: any = null;
  private isInitialized = false;

  private async initialize() {
    if (this.isInitialized) return;

    try {
      // Expo Notifications work in both Expo Go and native builds
      this.expoNotifications = await import('expo-notifications');
      
      // Set up notification handler
      this.expoNotifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: false,
          shouldSetBadge: false,
        }),
      });

      if (EnvironmentDetector.isNativeBuild()) {
        // Try to load native notifications for enhanced features
        try {
          // Note: This would be for libraries like react-native-push-notification
          // For now, we'll stick with Expo Notifications as they work everywhere
          console.log('📱 Notifications: Using Expo Notifications (works in native builds too)');
        } catch (error) {
          console.log('📱 Notifications: Native notification library not available, using Expo');
        }
      } else {
        console.log('📱 Notifications: Using Expo Notifications for Expo Go');
      }
    } catch (error) {
      console.error('❌ Failed to initialize notifications:', error);
    }

    this.isInitialized = true;
  }

  /**
   * Request notification permissions
   */
  async requestPermissions(): Promise<NotificationPermissionStatus> {
    await this.initialize();

    try {
      if (this.expoNotifications) {
        const { status, canAskAgain, expires } = await this.expoNotifications.requestPermissionsAsync();
        
        return {
          status: status === 'granted' ? 'granted' : status === 'denied' ? 'denied' : 'undetermined',
          canAskAgain,
          expires,
        };
      } else {
        throw new Error('No notification service available');
      }
    } catch (error) {
      console.error('❌ Failed to request notification permissions:', error);
      return { status: 'denied' };
    }
  }

  /**
   * Get current permission status
   */
  async getPermissions(): Promise<NotificationPermissionStatus> {
    await this.initialize();

    try {
      if (this.expoNotifications) {
        const { status, canAskAgain, expires } = await this.expoNotifications.getPermissionsAsync();
        
        return {
          status: status === 'granted' ? 'granted' : status === 'denied' ? 'denied' : 'undetermined',
          canAskAgain,
          expires,
        };
      } else {
        return { status: 'undetermined' };
      }
    } catch (error) {
      console.error('❌ Failed to get notification permissions:', error);
      return { status: 'denied' };
    }
  }

  /**
   * Schedule a local notification
   */
  async scheduleNotification(notification: ScheduledNotification): Promise<string> {
    await this.initialize();

    try {
      if (!this.expoNotifications) {
        throw new Error('No notification service available');
      }

      // Convert our unified trigger to Expo format
      const trigger = this.convertTrigger(notification.trigger);
      
      const identifier = await this.expoNotifications.scheduleNotificationAsync({
        identifier: notification.identifier,
        content: {
          title: notification.content.title,
          body: notification.content.body,
          subtitle: notification.content.subtitle,
          data: notification.content.data || {},
          badge: notification.content.badge,
          sound: notification.content.sound === true ? 'default' : 
                 notification.content.sound === false ? null : 
                 notification.content.sound,
          priority: this.convertPriority(notification.content.priority),
          color: notification.content.color,
          categoryIdentifier: notification.content.categoryIdentifier,
        },
        trigger,
      });

      return identifier;
    } catch (error) {
      console.error('❌ Failed to schedule notification:', error);
      throw error;
    }
  }

  /**
   * Cancel a scheduled notification
   */
  async cancelNotification(identifier: string): Promise<void> {
    await this.initialize();

    try {
      if (this.expoNotifications) {
        await this.expoNotifications.cancelScheduledNotificationAsync(identifier);
      }
    } catch (error) {
      console.error(`❌ Failed to cancel notification ${identifier}:`, error);
      throw error;
    }
  }

  /**
   * Cancel all scheduled notifications
   */
  async cancelAllNotifications(): Promise<void> {
    await this.initialize();

    try {
      if (this.expoNotifications) {
        await this.expoNotifications.cancelAllScheduledNotificationsAsync();
      }
    } catch (error) {
      console.error('❌ Failed to cancel all notifications:', error);
      throw error;
    }
  }

  /**
   * Get all scheduled notifications
   */
  async getScheduledNotifications(): Promise<any[]> {
    await this.initialize();

    try {
      if (this.expoNotifications) {
        return await this.expoNotifications.getAllScheduledNotificationsAsync();
      }
      return [];
    } catch (error) {
      console.error('❌ Failed to get scheduled notifications:', error);
      return [];
    }
  }

  /**
   * Present a notification immediately
   */
  async presentNotification(content: NotificationContent): Promise<string> {
    await this.initialize();

    try {
      if (!this.expoNotifications) {
        throw new Error('No notification service available');
      }

      const identifier = await this.expoNotifications.scheduleNotificationAsync({
        content: {
          title: content.title,
          body: content.body,
          subtitle: content.subtitle,
          data: content.data || {},
          badge: content.badge,
          sound: content.sound === true ? 'default' : 
                 content.sound === false ? null : 
                 content.sound,
          priority: this.convertPriority(content.priority),
          color: content.color,
          categoryIdentifier: content.categoryIdentifier,
        },
        trigger: null, // Present immediately
      });

      return identifier;
    } catch (error) {
      console.error('❌ Failed to present notification:', error);
      throw error;
    }
  }

  /**
   * Set app badge number
   */
  async setBadgeCount(count: number): Promise<void> {
    await this.initialize();

    try {
      if (this.expoNotifications) {
        await this.expoNotifications.setBadgeCountAsync(count);
      }
    } catch (error) {
      console.error('❌ Failed to set badge count:', error);
    }
  }

  /**
   * Get app badge number
   */
  async getBadgeCount(): Promise<number> {
    await this.initialize();

    try {
      if (this.expoNotifications) {
        return await this.expoNotifications.getBadgeCountAsync();
      }
      return 0;
    } catch (error) {
      console.error('❌ Failed to get badge count:', error);
      return 0;
    }
  }

  /**
   * Add notification received listener
   */
  addNotificationReceivedListener(listener: (notification: any) => void): () => void {
    if (!this.expoNotifications) {
      return () => {}; // Return empty cleanup function
    }

    const subscription = this.expoNotifications.addNotificationReceivedListener(listener);
    return () => subscription.remove();
  }

  /**
   * Add notification response listener (when user taps notification)
   */
  addNotificationResponseListener(listener: (response: any) => void): () => void {
    if (!this.expoNotifications) {
      return () => {}; // Return empty cleanup function
    }

    const subscription = this.expoNotifications.addNotificationResponseReceivedListener(listener);
    return () => subscription.remove();
  }

  /**
   * Convert unified trigger to Expo format
   */
  private convertTrigger(trigger: NotificationTrigger): any {
    switch (trigger.type) {
      case 'timeInterval':
        return trigger.seconds ? {
          seconds: trigger.seconds,
          repeats: trigger.repeats || false,
        } : null;
      
      case 'date':
        return trigger.date ? {
          date: trigger.date,
          repeats: trigger.repeats || false,
        } : null;
      
      case 'daily':
        return {
          hour: trigger.hour || 9,
          minute: trigger.minute || 0,
          repeats: true,
        };
      
      case 'weekly':
        return {
          weekday: trigger.weekday || 1, // 1 = Sunday in Expo
          hour: trigger.hour || 9,
          minute: trigger.minute || 0,
          repeats: true,
        };
      
      default:
        return null;
    }
  }

  /**
   * Convert unified priority to Expo format
   */
  private convertPriority(priority?: string): string {
    switch (priority) {
      case 'min': return 'min';
      case 'low': return 'low';
      case 'high': return 'high';
      case 'max': return 'max';
      default: return 'default';
    }
  }

  /**
   * Get notification service information
   */
  async getImplementationInfo() {
    await this.initialize();
    return {
      environment: EnvironmentDetector.getEnvironment(),
      implementation: 'expo-notifications',
      isAvailable: !!this.expoNotifications,
      platform: Platform.OS,
    };
  }

  /**
   * Check if notifications are supported
   */
  async isAvailable(): Promise<boolean> {
    await this.initialize();
    return !!this.expoNotifications;
  }
}

// Create singleton instance
const notificationService = new NotificationService();

// Export convenience functions
export const requestNotificationPermissions = () => notificationService.requestPermissions();
export const getNotificationPermissions = () => notificationService.getPermissions();
export const scheduleNotification = (notification: ScheduledNotification) => 
  notificationService.scheduleNotification(notification);
export const cancelNotification = (identifier: string) => 
  notificationService.cancelNotification(identifier);
export const cancelAllNotifications = () => notificationService.cancelAllNotifications();
export const getScheduledNotifications = () => notificationService.getScheduledNotifications();
export const presentNotification = (content: NotificationContent) => 
  notificationService.presentNotification(content);
export const setBadgeCount = (count: number) => notificationService.setBadgeCount(count);
export const getBadgeCount = () => notificationService.getBadgeCount();
export const addNotificationReceivedListener = (listener: (notification: any) => void) => 
  notificationService.addNotificationReceivedListener(listener);
export const addNotificationResponseListener = (listener: (response: any) => void) => 
  notificationService.addNotificationResponseListener(listener);

// Hook for easier usage in components
export const useNotifications = () => {
  const [permissions, setPermissions] = React.useState<NotificationPermissionStatus>({ status: 'undetermined' });
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    let isMounted = true;

    const loadPermissions = async () => {
      try {
        const perms = await notificationService.getPermissions();
        if (isMounted) {
          setPermissions(perms);
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Failed to load notification permissions:', error);
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadPermissions();

    return () => {
      isMounted = false;
    };
  }, []);

  const requestPermissions = async () => {
    setIsLoading(true);
    try {
      const newPermissions = await notificationService.requestPermissions();
      setPermissions(newPermissions);
      return newPermissions;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    permissions,
    isLoading,
    requestPermissions,
    scheduleNotification: (notification: ScheduledNotification) => 
      notificationService.scheduleNotification(notification),
    cancelNotification: (identifier: string) => 
      notificationService.cancelNotification(identifier),
    presentNotification: (content: NotificationContent) => 
      notificationService.presentNotification(content),
  };
};

// Export the service instance for advanced usage
export { notificationService };