import { EnvironmentDetector } from './environmentDetection';

// Type definitions for haptic feedback
export type HapticType = 
  | 'impactLight' 
  | 'impactMedium' 
  | 'impactHeavy' 
  | 'notificationSuccess' 
  | 'notificationWarning' 
  | 'notificationError' 
  | 'selection';

export interface HapticOptions {
  enableVibrateFallback?: boolean;
  ignoreAndroidSystemSettings?: boolean;
}

/**
 * Unified haptic feedback service that works across Expo Go and native builds
 */
class HapticsService {
  private expoHaptics: any = null;
  private nativeHaptics: any = null;
  private isInitialized = false;

  private async initialize() {
    if (this.isInitialized) return;

    try {
      // Always try Expo Haptics first (works in both Expo Go and development builds)
      this.expoHaptics = await import('expo-haptics');
      console.log('🔥 Haptics: Using Expo Haptics (universal compatibility)');

      // Only try native haptics in production builds
      if (EnvironmentDetector.isNativeBuild()) {
        try {
          const nativeModule = await import('react-native-haptic-feedback');
          this.nativeHaptics = nativeModule;
          console.log('🔥 Haptics: Also loaded React Native Haptic Feedback for enhanced features');
        } catch (error) {
          console.log('📱 Haptics: Native haptic feedback not available, using Expo Haptics only');
        }
      }
    } catch (error) {
      console.warn('⚠️ Failed to load haptics modules:', error);
      // Provide a no-op fallback
      this.expoHaptics = {
        impactAsync: () => Promise.resolve(),
        notificationAsync: () => Promise.resolve(),
        selectionAsync: () => Promise.resolve(),
      };
    }

    this.isInitialized = true;
  }

  /**
   * Trigger haptic feedback
   */
  async trigger(type: HapticType, options?: HapticOptions): Promise<void> {
    await this.initialize();

    try {
      if (this.nativeHaptics) {
        // Use react-native-haptic-feedback
        const hapticOptions = {
          enableVibrateFallback: options?.enableVibrateFallback ?? true,
          ignoreAndroidSystemSettings: options?.ignoreAndroidSystemSettings ?? false,
        };

        this.nativeHaptics.default.trigger(type, hapticOptions);
      } else if (this.expoHaptics) {
        // Use expo-haptics
        this.mapToExpoHaptics(type);
      } else {
        console.warn('⚠️ No haptic feedback available');
      }
    } catch (error) {
      console.warn('⚠️ Haptic feedback failed:', error);
    }
  }

  /**
   * Map our unified haptic types to Expo Haptics
   */
  private mapToExpoHaptics(type: HapticType) {
    if (!this.expoHaptics) return;

    const { ImpactFeedbackStyle, NotificationFeedbackType } = this.expoHaptics;

    switch (type) {
      case 'impactLight':
        this.expoHaptics.impactAsync(ImpactFeedbackStyle.Light);
        break;
      case 'impactMedium':
        this.expoHaptics.impactAsync(ImpactFeedbackStyle.Medium);
        break;
      case 'impactHeavy':
        this.expoHaptics.impactAsync(ImpactFeedbackStyle.Heavy);
        break;
      case 'notificationSuccess':
        this.expoHaptics.notificationAsync(NotificationFeedbackType.Success);
        break;
      case 'notificationWarning':
        this.expoHaptics.notificationAsync(NotificationFeedbackType.Warning);
        break;
      case 'notificationError':
        this.expoHaptics.notificationAsync(NotificationFeedbackType.Error);
        break;
      case 'selection':
        this.expoHaptics.selectionAsync();
        break;
      default:
        this.expoHaptics.impactAsync(ImpactFeedbackStyle.Light);
    }
  }

  /**
   * Check if haptic feedback is available
   */
  async isAvailable(): Promise<boolean> {
    await this.initialize();
    return !!(this.nativeHaptics || this.expoHaptics);
  }

  /**
   * Get information about the haptic implementation being used
   */
  async getImplementationInfo() {
    await this.initialize();
    return {
      environment: EnvironmentDetector.getEnvironment(),
      implementation: this.nativeHaptics ? 'react-native-haptic-feedback' : 'expo-haptics',
      isAvailable: await this.isAvailable(),
    };
  }
}

// Create singleton instance
const hapticsService = new HapticsService();

// Export convenience functions that match the original react-native-haptic-feedback API
export const HapticFeedback = {
  trigger: (type: HapticType, options?: HapticOptions) => hapticsService.trigger(type, options),
};

// Export individual functions for cleaner imports
export const triggerHaptic = (type: HapticType, options?: HapticOptions) => 
  hapticsService.trigger(type, options);

export const isHapticAvailable = () => hapticsService.isAvailable();
export const getHapticInfo = () => hapticsService.getImplementationInfo();

// Export the service instance for advanced usage
export { hapticsService };