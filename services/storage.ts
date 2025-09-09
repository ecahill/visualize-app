import { EnvironmentDetector } from './environmentDetection';

// Unified type definitions for storage
export interface SecureStorageOptions {
  keychainService?: string;
  sharedPreferencesName?: string;
  encrypt?: boolean;
}

export interface StorageItem {
  key: string;
  value: string;
}

/**
 * Unified storage service that works across Expo Go and native builds
 * Handles both regular storage and secure storage
 */
class StorageService {
  private asyncStorage: any = null;
  private expoSecureStore: any = null;
  private nativeSecureStorage: any = null;
  private isInitialized = false;

  private async initialize() {
    if (this.isInitialized) return;

    try {
      // AsyncStorage is the same for both environments
      this.asyncStorage = await import('@react-native-async-storage/async-storage');

      if (EnvironmentDetector.isExpoGo()) {
        // Use Expo SecureStore for Expo Go
        this.expoSecureStore = await import('expo-secure-store');
        console.log('🔒 Storage: Using Expo SecureStore for secure storage in Expo Go');
      } else {
        // Try to use native secure storage for development/production builds
        try {
          this.nativeSecureStorage = await import('react-native-keychain');
          console.log('🔒 Storage: Using React Native Keychain for secure storage in native build');
        } catch (error) {
          console.warn('⚠️ Native secure storage not available, falling back to Expo SecureStore');
          this.expoSecureStore = await import('expo-secure-store');
        }
      }

      console.log('💾 Storage: AsyncStorage initialized for regular storage');
    } catch (error) {
      console.error('❌ Failed to initialize storage:', error);
    }

    this.isInitialized = true;
  }

  // === REGULAR STORAGE (AsyncStorage) ===

  /**
   * Store a string value
   */
  async setItem(key: string, value: string): Promise<void> {
    await this.initialize();
    try {
      await this.asyncStorage.default.setItem(key, value);
    } catch (error) {
      console.error(`❌ Failed to store item ${key}:`, error);
      throw error;
    }
  }

  /**
   * Get a string value
   */
  async getItem(key: string): Promise<string | null> {
    await this.initialize();
    try {
      return await this.asyncStorage.default.getItem(key);
    } catch (error) {
      console.error(`❌ Failed to get item ${key}:`, error);
      return null;
    }
  }

  /**
   * Remove an item
   */
  async removeItem(key: string): Promise<void> {
    await this.initialize();
    try {
      await this.asyncStorage.default.removeItem(key);
    } catch (error) {
      console.error(`❌ Failed to remove item ${key}:`, error);
      throw error;
    }
  }

  /**
   * Store an object as JSON
   */
  async setObject(key: string, value: any): Promise<void> {
    try {
      const jsonValue = JSON.stringify(value);
      await this.setItem(key, jsonValue);
    } catch (error) {
      console.error(`❌ Failed to store object ${key}:`, error);
      throw error;
    }
  }

  /**
   * Get an object from JSON
   */
  async getObject<T = any>(key: string): Promise<T | null> {
    try {
      const jsonValue = await this.getItem(key);
      return jsonValue ? JSON.parse(jsonValue) : null;
    } catch (error) {
      console.error(`❌ Failed to get object ${key}:`, error);
      return null;
    }
  }

  /**
   * Get multiple items at once
   */
  async multiGet(keys: string[]): Promise<[string, string | null][]> {
    await this.initialize();
    try {
      return await this.asyncStorage.default.multiGet(keys);
    } catch (error) {
      console.error('❌ Failed to get multiple items:', error);
      return keys.map(key => [key, null]);
    }
  }

  /**
   * Remove multiple items at once
   */
  async multiRemove(keys: string[]): Promise<void> {
    await this.initialize();
    try {
      await this.asyncStorage.default.multiRemove(keys);
    } catch (error) {
      console.error('❌ Failed to remove multiple items:', error);
      throw error;
    }
  }

  /**
   * Get all keys
   */
  async getAllKeys(): Promise<string[]> {
    await this.initialize();
    try {
      return await this.asyncStorage.default.getAllKeys();
    } catch (error) {
      console.error('❌ Failed to get all keys:', error);
      return [];
    }
  }

  /**
   * Clear all storage
   */
  async clear(): Promise<void> {
    await this.initialize();
    try {
      await this.asyncStorage.default.clear();
    } catch (error) {
      console.error('❌ Failed to clear storage:', error);
      throw error;
    }
  }

  // === SECURE STORAGE ===

  /**
   * Store a value securely
   */
  async setSecureItem(key: string, value: string, options?: SecureStorageOptions): Promise<void> {
    await this.initialize();

    try {
      if (this.nativeSecureStorage) {
        // Use react-native-keychain
        await this.nativeSecureStorage.setInternetCredentials(
          options?.keychainService || 'default',
          key,
          value
        );
      } else if (this.expoSecureStore) {
        // Use expo-secure-store
        await this.expoSecureStore.setItemAsync(key, value, {
          keychainService: options?.keychainService,
        });
      } else {
        throw new Error('No secure storage available');
      }
    } catch (error) {
      console.error(`❌ Failed to store secure item ${key}:`, error);
      throw error;
    }
  }

  /**
   * Get a secure value
   */
  async getSecureItem(key: string, options?: SecureStorageOptions): Promise<string | null> {
    await this.initialize();

    try {
      if (this.nativeSecureStorage) {
        // Use react-native-keychain
        const credentials = await this.nativeSecureStorage.getInternetCredentials(
          options?.keychainService || 'default'
        );
        return credentials ? credentials.password : null;
      } else if (this.expoSecureStore) {
        // Use expo-secure-store
        return await this.expoSecureStore.getItemAsync(key, {
          keychainService: options?.keychainService,
        });
      } else {
        throw new Error('No secure storage available');
      }
    } catch (error) {
      console.error(`❌ Failed to get secure item ${key}:`, error);
      return null;
    }
  }

  /**
   * Remove a secure item
   */
  async removeSecureItem(key: string, options?: SecureStorageOptions): Promise<void> {
    await this.initialize();

    try {
      if (this.nativeSecureStorage) {
        // Use react-native-keychain
        await this.nativeSecureStorage.resetInternetCredentials(
          options?.keychainService || 'default'
        );
      } else if (this.expoSecureStore) {
        // Use expo-secure-store
        await this.expoSecureStore.deleteItemAsync(key, {
          keychainService: options?.keychainService,
        });
      } else {
        throw new Error('No secure storage available');
      }
    } catch (error) {
      console.error(`❌ Failed to remove secure item ${key}:`, error);
      throw error;
    }
  }

  /**
   * Store an object securely as JSON
   */
  async setSecureObject(key: string, value: any, options?: SecureStorageOptions): Promise<void> {
    try {
      const jsonValue = JSON.stringify(value);
      await this.setSecureItem(key, jsonValue, options);
    } catch (error) {
      console.error(`❌ Failed to store secure object ${key}:`, error);
      throw error;
    }
  }

  /**
   * Get a secure object from JSON
   */
  async getSecureObject<T = any>(key: string, options?: SecureStorageOptions): Promise<T | null> {
    try {
      const jsonValue = await this.getSecureItem(key, options);
      return jsonValue ? JSON.parse(jsonValue) : null;
    } catch (error) {
      console.error(`❌ Failed to get secure object ${key}:`, error);
      return null;
    }
  }

  // === UTILITY METHODS ===

  /**
   * Check if storage is available
   */
  async isAvailable(): Promise<boolean> {
    await this.initialize();
    return !!this.asyncStorage;
  }

  /**
   * Check if secure storage is available
   */
  async isSecureStorageAvailable(): Promise<boolean> {
    await this.initialize();
    return !!(this.nativeSecureStorage || this.expoSecureStore);
  }

  /**
   * Get storage information
   */
  async getStorageInfo() {
    await this.initialize();
    return {
      environment: EnvironmentDetector.getEnvironment(),
      regularStorage: 'AsyncStorage',
      secureStorage: this.nativeSecureStorage ? 'react-native-keychain' : 'expo-secure-store',
      isAvailable: await this.isAvailable(),
      isSecureAvailable: await this.isSecureStorageAvailable(),
    };
  }

  /**
   * Get storage usage statistics
   */
  async getStorageStats() {
    try {
      const keys = await this.getAllKeys();
      const items = await this.multiGet(keys);
      
      let totalSize = 0;
      const itemSizes: Record<string, number> = {};
      
      items.forEach(([key, value]) => {
        const size = value ? Buffer.byteLength(value, 'utf8') : 0;
        itemSizes[key] = size;
        totalSize += size;
      });

      return {
        totalItems: keys.length,
        totalSize,
        averageSize: totalSize / keys.length || 0,
        itemSizes,
        keys,
      };
    } catch (error) {
      console.error('❌ Failed to get storage stats:', error);
      return {
        totalItems: 0,
        totalSize: 0,
        averageSize: 0,
        itemSizes: {},
        keys: [],
      };
    }
  }
}

// Create singleton instance
const storageService = new StorageService();

// Export AsyncStorage-compatible interface
export const AsyncStorageCompat = {
  setItem: (key: string, value: string) => storageService.setItem(key, value),
  getItem: (key: string) => storageService.getItem(key),
  removeItem: (key: string) => storageService.removeItem(key),
  multiGet: (keys: string[]) => storageService.multiGet(keys),
  multiRemove: (keys: string[]) => storageService.multiRemove(keys),
  getAllKeys: () => storageService.getAllKeys(),
  clear: () => storageService.clear(),
};

// Export convenience functions
export const setItem = (key: string, value: string) => storageService.setItem(key, value);
export const getItem = (key: string) => storageService.getItem(key);
export const removeItem = (key: string) => storageService.removeItem(key);
export const setObject = (key: string, value: any) => storageService.setObject(key, value);
export const getObject = <T = any>(key: string) => storageService.getObject<T>(key);

// Secure storage functions
export const setSecureItem = (key: string, value: string, options?: SecureStorageOptions) => 
  storageService.setSecureItem(key, value, options);
export const getSecureItem = (key: string, options?: SecureStorageOptions) => 
  storageService.getSecureItem(key, options);
export const removeSecureItem = (key: string, options?: SecureStorageOptions) => 
  storageService.removeSecureItem(key, options);
export const setSecureObject = (key: string, value: any, options?: SecureStorageOptions) => 
  storageService.setSecureObject(key, value, options);
export const getSecureObject = <T = any>(key: string, options?: SecureStorageOptions) => 
  storageService.getSecureObject<T>(key, options);

// Utility functions
export const isStorageAvailable = () => storageService.isAvailable();
export const isSecureStorageAvailable = () => storageService.isSecureStorageAvailable();
export const getStorageInfo = () => storageService.getStorageInfo();
export const getStorageStats = () => storageService.getStorageStats();

// Export the service instance for advanced usage
export { storageService };