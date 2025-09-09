import * as FileSystem from 'expo-file-system';
import { AsyncStorageCompat, setSecureItem, getSecureItem, removeSecureItem } from './storage';
import { launchImageLibrary, requestMediaLibraryPermissions } from './imagePicker';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc, collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getAuth, signInAnonymously, User } from 'firebase/auth';

// Firebase configuration
// In a real production app, these would be stored in environment variables
// For this demo, using placeholder values that would need to be replaced
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "demo-api-key",
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "visualize-app-demo.firebaseapp.com",
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "visualize-app-demo",
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || "visualize-app-demo.appspot.com",
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || "1:123456789:web:abcdef123456"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const firestore = getFirestore(app);
const storage = getStorage(app);
const auth = getAuth(app);

export interface UserProfile {
  id: string;
  name: string;
  email?: string;
  avatar?: string;
  manifestationGoals: ManifestationGoal[];
  joinedAt: string;
  isPremium: boolean;
  preferences: UserPreferences;
  stats: UserStats;
}

export interface ManifestationGoal {
  id: string;
  category: 'abundance' | 'love' | 'career' | 'health' | 'personal';
  title: string;
  description: string;
  targetDate?: string;
  isAchieved: boolean;
  createdAt: string;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  notifications: {
    dailyReminders: boolean;
    affirmationNotifications: boolean;
    journalReminders: boolean;
    visualizationReminders: boolean;
    time: string; // HH:mm format
  };
  privacy: {
    shareProgress: boolean;
    analyticsEnabled: boolean;
    crashReporting: boolean;
  };
  display: {
    fontSize: 'small' | 'medium' | 'large';
    hapticFeedback: boolean;
    soundEffects: boolean;
  };
}

export interface UserStats {
  totalSessions: number;
  streakDays: number;
  affirmationsRead: number;
  journalEntries: number;
  visualizationMinutes: number;
  manifestationsCompleted: number;
  joinedDaysAgo: number;
}

export interface PurchaseProduct {
  productId: string;
  title: string;
  description: string;
  price: string;
  localizedPrice: string;
  type: 'premium' | 'feature' | 'content';
  features: string[];
}

class UserService {
  private currentUser: UserProfile | null = null;
  private firebaseUser: User | null = null;

  async initializeUser(): Promise<UserProfile> {
    try {
      // Try to get existing user from local storage
      const existingUser = await this.getLocalUser();
      
      if (existingUser) {
        this.currentUser = existingUser;
        // Sync with Firebase in background
        this.syncUserData();
        return existingUser;
      }

      // Create new user
      const newUser = await this.createNewUser();
      await this.saveLocalUser(newUser);
      this.currentUser = newUser;
      
      return newUser;
    } catch (error) {
      console.error('Failed to initialize user:', error);
      throw error;
    }
  }

  private async createNewUser(): Promise<UserProfile> {
    const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const newUser: UserProfile = {
      id: userId,
      name: 'Beautiful Soul',
      manifestationGoals: [],
      joinedAt: new Date().toISOString(),
      isPremium: false,
      preferences: {
        theme: 'auto',
        notifications: {
          dailyReminders: true,
          affirmationNotifications: true,
          journalReminders: true,
          visualizationReminders: true,
          time: '08:00',
        },
        privacy: {
          shareProgress: false,
          analyticsEnabled: true,
          crashReporting: true,
        },
        display: {
          fontSize: 'medium',
          hapticFeedback: true,
          soundEffects: true,
        },
      },
      stats: {
        totalSessions: 0,
        streakDays: 0,
        affirmationsRead: 0,
        journalEntries: 0,
        visualizationMinutes: 0,
        manifestationsCompleted: 0,
        joinedDaysAgo: 0,
      },
    };

    return newUser;
  }

  async updateUserProfile(updates: Partial<UserProfile>): Promise<void> {
    if (!this.currentUser) throw new Error('No user initialized');

    this.currentUser = { ...this.currentUser, ...updates };
    await this.saveLocalUser(this.currentUser);
    
    // Sync to Firebase
    await this.syncUserData();
  }

  async uploadAvatar(): Promise<string | null> {
    try {
      const permissionResult = await requestMediaLibraryPermissions();
      if (!permissionResult.granted) {
        throw new Error('Permission denied');
      }

      const result = await launchImageLibrary({
        mediaTypes: 'images',
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (result.canceled) return null;

      const imageUri = result.assets![0].uri;
      
      // Save locally first
      const localPath = `${FileSystem.documentDirectory}avatar.jpg`;
      await FileSystem.copyAsync({
        from: imageUri,
        to: localPath,
      });

      // Upload to Firebase Storage
      try {
        const uploadedUrl = await this.uploadImageToFirebase(imageUri, 'avatars');
        
        // Update user profile
        await this.updateUserProfile({ avatar: uploadedUrl });
        
        return uploadedUrl;
      } catch (error) {
        console.error('Firebase upload failed, using local image:', error);
        // Fallback to local image
        await this.updateUserProfile({ avatar: localPath });
        return localPath;
      }
    } catch (error) {
      console.error('Avatar upload failed:', error);
      return null;
    }
  }

  private async uploadImageToFirebase(imageUri: string, folder: string): Promise<string> {
    if (!this.firebaseUser) {
      await this.authenticateWithFirebase();
    }

    const response = await fetch(imageUri);
    const blob = await response.blob();
    
    const imageRef = ref(storage, `${folder}/${this.currentUser?.id}_${Date.now()}.jpg`);
    await uploadBytes(imageRef, blob);
    
    return await getDownloadURL(imageRef);
  }

  async addManifestationGoal(goal: Omit<ManifestationGoal, 'id' | 'createdAt'>): Promise<void> {
    if (!this.currentUser) throw new Error('No user initialized');

    const newGoal: ManifestationGoal = {
      ...goal,
      id: `goal_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      createdAt: new Date().toISOString(),
    };

    this.currentUser.manifestationGoals.push(newGoal);
    await this.saveLocalUser(this.currentUser);
    await this.syncUserData();
  }

  async updateManifestationGoal(goalId: string, updates: Partial<ManifestationGoal>): Promise<void> {
    if (!this.currentUser) throw new Error('No user initialized');

    const goalIndex = this.currentUser.manifestationGoals.findIndex(g => g.id === goalId);
    if (goalIndex === -1) throw new Error('Goal not found');

    this.currentUser.manifestationGoals[goalIndex] = {
      ...this.currentUser.manifestationGoals[goalIndex],
      ...updates,
    };

    await this.saveLocalUser(this.currentUser);
    await this.syncUserData();
  }

  async updateUserStats(statUpdates: Partial<UserStats>): Promise<void> {
    if (!this.currentUser) throw new Error('No user initialized');

    this.currentUser.stats = { ...this.currentUser.stats, ...statUpdates };
    await this.saveLocalUser(this.currentUser);
    
    // Sync stats to Firebase less frequently
    if (Math.random() > 0.7) {
      await this.syncUserData();
    }
  }

  async trackFeatureUsage(feature: string, metadata?: any): Promise<void> {
    if (!this.currentUser?.preferences.privacy.analyticsEnabled) return;

    const event = {
      userId: this.currentUser.id,
      feature,
      timestamp: new Date().toISOString(),
      metadata,
    };

    // Store locally for batching
    try {
      const existingEvents = await AsyncStorageCompat.getItem('analytics_events');
      const events = existingEvents ? JSON.parse(existingEvents) : [];
      events.push(event);
      
      // Keep only last 100 events locally
      if (events.length > 100) {
        events.splice(0, events.length - 100);
      }
      
      await AsyncStorageCompat.setItem('analytics_events', JSON.stringify(events));
      
      // Batch upload to Firebase occasionally
      if (events.length % 10 === 0) {
        await this.uploadAnalyticsToFirebase(events);
      }
    } catch (error) {
      console.error('Failed to track feature usage:', error);
    }
  }

  private async uploadAnalyticsToFirebase(events: any[]): Promise<void> {
    try {
      if (!this.firebaseUser) {
        await this.authenticateWithFirebase();
      }

      // Upload in batches
      const batch = events.slice(-50); // Last 50 events
      
      for (const event of batch) {
        await setDoc(doc(collection(firestore, 'analytics')), event);
      }
    } catch (error) {
      console.error('Failed to upload analytics:', error);
    }
  }

  async exportUserData(): Promise<string> {
    if (!this.currentUser) throw new Error('No user initialized');

    // Gather all user data
    const exportData = {
      profile: this.currentUser,
      affirmations: await AsyncStorageCompat.getItem('affirmations'),
      journalEntries: [], // Would get from database
      visionBoard: await AsyncStorageCompat.getItem('vision_board_items'),
      ritualHistory: await AsyncStorageCompat.getItem('ritual_streak'),
      exportedAt: new Date().toISOString(),
    };

    // Create file
    const dataString = JSON.stringify(exportData, null, 2);
    const fileName = `manifestation_data_${new Date().toISOString().split('T')[0]}.json`;
    const filePath = `${FileSystem.documentDirectory}${fileName}`;
    
    await FileSystem.writeAsStringAsync(filePath, dataString);
    
    return filePath;
  }

  async deleteUserData(): Promise<void> {
    // Clear local storage
    await AsyncStorageCompat.multiRemove([
      'user_profile',
      'affirmations',
      'vision_board_items',
      'ritual_streak',
      'listening_history',
      'favorite_tracks',
      'analytics_events',
    ]);

    // Clear secure storage
    try {
      await removeSecureItem('firebase_user_token');
    } catch (error) {
      console.error('Failed to clear secure storage:', error);
    }

    // Delete from Firebase
    if (this.firebaseUser && this.currentUser) {
      try {
        await setDoc(doc(firestore, 'users', this.currentUser.id), { deleted: true });
      } catch (error) {
        console.error('Failed to mark user as deleted in Firebase:', error);
      }
    }

    this.currentUser = null;
    this.firebaseUser = null;
  }

  private async authenticateWithFirebase(): Promise<void> {
    try {
      const result = await signInAnonymously(auth);
      this.firebaseUser = result.user;
      
      // Store token securely
      await setSecureItem('firebase_user_token', result.user.uid);
    } catch (error) {
      console.error('Firebase authentication failed:', error);
      throw error;
    }
  }

  private async syncUserData(): Promise<void> {
    if (!this.currentUser) return;

    try {
      if (!this.firebaseUser) {
        await this.authenticateWithFirebase();
      }

      await setDoc(doc(firestore, 'users', this.currentUser.id), {
        ...this.currentUser,
        lastSyncAt: new Date().toISOString(),
      });

      // Mark as successfully synced
      await AsyncStorageCompat.setItem('last_sync_timestamp', new Date().toISOString());
    } catch (error) {
      console.error('Failed to sync user data:', error);
      // Queue for retry later
      await this.queueFailedSync();
    }
  }

  private async queueFailedSync(): Promise<void> {
    try {
      const failedSyncs = await AsyncStorageCompat.getItem('failed_syncs') || '[]';
      const syncs = JSON.parse(failedSyncs);
      syncs.push({
        userId: this.currentUser?.id,
        timestamp: new Date().toISOString(),
        data: this.currentUser,
      });

      // Keep only last 10 failed syncs
      if (syncs.length > 10) {
        syncs.splice(0, syncs.length - 10);
      }

      await AsyncStorageCompat.setItem('failed_syncs', JSON.stringify(syncs));
    } catch (error) {
      console.error('Failed to queue sync for retry:', error);
    }
  }

  async retryFailedSyncs(): Promise<void> {
    try {
      const failedSyncs = await AsyncStorageCompat.getItem('failed_syncs');
      if (!failedSyncs) return;

      const syncs = JSON.parse(failedSyncs);
      const successfulSyncs: string[] = [];

      for (const sync of syncs) {
        try {
          if (!this.firebaseUser) {
            await this.authenticateWithFirebase();
          }

          await setDoc(doc(firestore, 'users', sync.userId), {
            ...sync.data,
            lastSyncAt: new Date().toISOString(),
          });

          successfulSyncs.push(sync.timestamp);
        } catch (error) {
          console.error('Failed to retry sync:', error);
        }
      }

      // Remove successful syncs from failed queue
      const remainingSyncs = syncs.filter((sync: any) => 
        !successfulSyncs.includes(sync.timestamp)
      );
      
      await AsyncStorageCompat.setItem('failed_syncs', JSON.stringify(remainingSyncs));
    } catch (error) {
      console.error('Failed to retry syncs:', error);
    }
  }

  private async getLocalUser(): Promise<UserProfile | null> {
    try {
      const userData = await AsyncStorageCompat.getItem('user_profile');
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Failed to get local user:', error);
      return null;
    }
  }

  private async saveLocalUser(user: UserProfile): Promise<void> {
    try {
      await AsyncStorageCompat.setItem('user_profile', JSON.stringify(user));
    } catch (error) {
      console.error('Failed to save local user:', error);
      throw error;
    }
  }

  // Getters
  getCurrentUser(): UserProfile | null {
    return this.currentUser;
  }

  isUserPremium(): boolean {
    return this.currentUser?.isPremium || false;
  }

  getUserStats(): UserStats | null {
    return this.currentUser?.stats || null;
  }

  getUserPreferences(): UserPreferences | null {
    return this.currentUser?.preferences || null;
  }
}

export const userService = new UserService();