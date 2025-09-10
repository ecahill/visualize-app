import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getAnalytics, isSupported } from 'firebase/analytics';

// Firebase configuration
// In production, these should be stored in environment variables
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "your-api-key",
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "your-project.firebaseapp.com",
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "your-project-id",
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || "your-project.appspot.com",
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || "1:123456789:web:abcdef123456",
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-XXXXXXXXXX"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication
export const auth = getAuth(app);

// Initialize Firebase Analytics (only if supported - not available in Expo Go)
let analytics = null;
isSupported().then(supported => {
  if (supported) {
    analytics = getAnalytics(app);
    console.log('📊 Firebase Analytics initialized');
  } else {
    console.log('📊 Firebase Analytics not supported in this environment');
  }
});

export { analytics };

// Development mode: connect to emulators if running locally
if (__DEV__ && process.env.EXPO_PUBLIC_USE_FIREBASE_EMULATOR) {
  // Uncomment these lines if you want to use Firebase emulators in development
  // connectAuthEmulator(auth, 'http://localhost:9099');
  console.log('🔥 Firebase initialized in development mode');
}

/**
 * Firebase service for handling authentication and analytics initialization
 */
class FirebaseService {
  constructor() {
    this.app = app;
    this.auth = auth;
    this.analytics = analytics;
  }

  /**
   * Get the Firebase app instance
   */
  getApp() {
    return this.app;
  }

  /**
   * Get the Firebase Auth instance
   */
  getAuth() {
    return this.auth;
  }

  /**
   * Get the Firebase Analytics instance
   */
  getAnalytics() {
    return this.analytics;
  }

  /**
   * Check if Firebase is properly initialized
   */
  isInitialized() {
    return !!this.app && !!this.auth;
  }

  /**
   * Check if Analytics is available
   */
  isAnalyticsAvailable() {
    return !!this.analytics;
  }

  /**
   * Get Firebase configuration info (without sensitive data)
   */
  getConfig() {
    return {
      projectId: firebaseConfig.projectId,
      authDomain: firebaseConfig.authDomain,
      hasAnalytics: !!this.analytics,
      environment: __DEV__ ? 'development' : 'production'
    };
  }
}

// Export singleton instance
export const firebaseService = new FirebaseService();
export default firebaseService;

// Export the app instance for other Firebase services
export { app };

console.log('🔥 Firebase service initialized:', firebaseService.getConfig());