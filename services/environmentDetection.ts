import Constants from 'expo-constants';

export type RuntimeEnvironment = 'expo-go' | 'development-build' | 'production';

/**
 * Detects the current runtime environment to determine which native libraries to use
 */
export class EnvironmentDetector {
  private static _environment: RuntimeEnvironment | null = null;

  /**
   * Get the current runtime environment
   */
  static getEnvironment(): RuntimeEnvironment {
    if (this._environment) {
      return this._environment;
    }

    // Method 1: Check Constants.executionEnvironment
    if (Constants.executionEnvironment === 'storeClient') {
      this._environment = 'expo-go';
      return this._environment;
    }

    // Method 2: Check if we're in a development build or production
    if (Constants.executionEnvironment === 'bare') {
      // In a development build or production build
      this._environment = __DEV__ ? 'development-build' : 'production';
      return this._environment;
    }

    // Method 3: Check for specific Expo Go indicators
    if (Constants.platform?.ios?.buildNumber === undefined && 
        Constants.platform?.android?.versionCode === undefined) {
      // Likely Expo Go
      this._environment = 'expo-go';
      return this._environment;
    }

    // Method 4: Check app config for custom indicator
    if (Constants.expoConfig?.extra?.isExpoGo) {
      this._environment = 'expo-go';
      return this._environment;
    }

    // Default to development build
    this._environment = __DEV__ ? 'development-build' : 'production';
    return this._environment;
  }

  /**
   * Check if running in Expo Go
   */
  static isExpoGo(): boolean {
    return this.getEnvironment() === 'expo-go';
  }

  /**
   * Check if running in development build
   */
  static isDevelopmentBuild(): boolean {
    return this.getEnvironment() === 'development-build';
  }

  /**
   * Check if running in production build
   */
  static isProductionBuild(): boolean {
    return this.getEnvironment() === 'production';
  }

  /**
   * Check if running in any kind of native build (development or production)
   */
  static isNativeBuild(): boolean {
    const env = this.getEnvironment();
    return env === 'development-build' || env === 'production';
  }

  /**
   * Check if a native module is available
   * Note: In Expo Go, native modules are generally not available
   */
  static isNativeModuleAvailable(moduleName: string): boolean {
    // In Expo Go, native modules are not available
    if (this.isExpoGo()) {
      return false;
    }
    
    // For development and production builds, assume native modules are available
    // Individual modules should handle their own availability checks
    return this.isNativeBuild();
  }

  /**
   * Get environment info for debugging
   */
  static getEnvironmentInfo() {
    return {
      environment: this.getEnvironment(),
      executionEnvironment: Constants.executionEnvironment,
      isExpoGo: this.isExpoGo(),
      isDev: __DEV__,
      platform: Constants.platform,
      appOwnership: Constants.appOwnership,
      expoVersion: Constants.expoVersion,
    };
  }

  /**
   * Log environment info (useful for debugging)
   */
  static logEnvironmentInfo() {
    console.log('🔍 Runtime Environment Detection:', this.getEnvironmentInfo());
  }
}

// Convenience exports
export const isExpoGo = () => EnvironmentDetector.isExpoGo();
export const isDevelopmentBuild = () => EnvironmentDetector.isDevelopmentBuild();
export const isProductionBuild = () => EnvironmentDetector.isProductionBuild();
export const isNativeBuild = () => EnvironmentDetector.isNativeBuild();
export const getEnvironment = () => EnvironmentDetector.getEnvironment();