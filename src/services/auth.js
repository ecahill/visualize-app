import { 
  signInAnonymously, 
  linkWithCredential, 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  EmailAuthProvider,
  GoogleAuthProvider,
  OAuthProvider,
  onAuthStateChanged,
  signOut
} from 'firebase/auth';
import { auth } from './firebase';

/**
 * Authentication service for managing user accounts with anonymous-to-authenticated upgrade path
 */
class AuthService {
  constructor() {
    this.currentUser = null;
    this.authStateListeners = [];
    this.isInitialized = false;

    // Listen for auth state changes
    this.unsubscribe = onAuthStateChanged(auth, (user) => {
      this.currentUser = user;
      this.notifyAuthStateListeners(user);
    });

    console.log('🔐 Auth service initialized');
  }

  /**
   * Initialize authentication - sign in anonymously if no user exists
   */
  async initialize() {
    if (this.isInitialized) return this.currentUser;

    try {
      if (!this.currentUser) {
        console.log('🔐 No existing user, signing in anonymously...');
        await this.signInAnonymously();
      } else {
        console.log('🔐 Existing user found:', this.getUserInfo());
      }
      
      this.isInitialized = true;
      return this.currentUser;
    } catch (error) {
      console.error('❌ Failed to initialize auth:', error);
      throw error;
    }
  }

  /**
   * Sign in anonymously - called automatically on first app launch
   */
  async signInAnonymously() {
    try {
      const result = await signInAnonymously(auth);
      console.log('✅ Anonymous sign-in successful:', result.user.uid);
      return result.user;
    } catch (error) {
      console.error('❌ Anonymous sign-in failed:', error);
      throw error;
    }
  }

  /**
   * Upgrade anonymous account to email account
   */
  async upgradeToEmail(email, password) {
    try {
      if (!this.currentUser) {
        throw new Error('No current user to upgrade');
      }

      if (!this.isAnonymous()) {
        throw new Error('User is already authenticated with a permanent account');
      }

      // Create email credential
      const credential = EmailAuthProvider.credential(email, password);
      
      // Link the credential with the anonymous account
      const result = await linkWithCredential(this.currentUser, credential);
      
      console.log('✅ Account upgraded to email successfully:', result.user.email);
      return result.user;
    } catch (error) {
      console.error('❌ Email upgrade failed:', error);
      
      // Handle specific errors
      if (error.code === 'auth/email-already-in-use') {
        throw new Error('This email is already associated with another account');
      } else if (error.code === 'auth/weak-password') {
        throw new Error('Password should be at least 6 characters');
      } else if (error.code === 'auth/invalid-email') {
        throw new Error('Please enter a valid email address');
      }
      
      throw error;
    }
  }

  /**
   * Upgrade anonymous account to Apple account
   * Note: This requires expo-apple-authentication to be installed and configured
   */
  async upgradeWithApple() {
    try {
      if (!this.currentUser) {
        throw new Error('No current user to upgrade');
      }

      if (!this.isAnonymous()) {
        throw new Error('User is already authenticated with a permanent account');
      }

      // Check if Apple Auth is available (not in Expo Go)
      let AppleAuthentication;
      try {
        AppleAuthentication = await import('expo-apple-authentication');
      } catch (importError) {
        throw new Error('Apple Sign-In is not available in Expo Go. Please use a development build.');
      }

      // Check if Apple Auth is available on device
      const isAvailable = await AppleAuthentication.isAvailableAsync();
      if (!isAvailable) {
        throw new Error('Apple Sign-In is not available on this device');
      }

      // Request Apple authentication
      const appleCredential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      // Create Firebase credential
      const provider = new OAuthProvider('apple.com');
      const credential = provider.credential({
        idToken: appleCredential.identityToken,
        rawNonce: appleCredential.nonce,
      });

      // Link the credential with the anonymous account
      const result = await linkWithCredential(this.currentUser, credential);
      
      console.log('✅ Account upgraded to Apple successfully:', result.user.uid);
      return result.user;
    } catch (error) {
      console.error('❌ Apple upgrade failed:', error);
      
      if (error.code === 'auth/credential-already-in-use') {
        throw new Error('This Apple ID is already associated with another account');
      }
      
      throw error;
    }
  }

  /**
   * Upgrade anonymous account to Google account
   * Note: This requires expo-google-app-auth or similar to be installed and configured
   */
  async upgradeWithGoogle() {
    try {
      if (!this.currentUser) {
        throw new Error('No current user to upgrade');
      }

      if (!this.isAnonymous()) {
        throw new Error('User is already authenticated with a permanent account');
      }

      // For now, throw an error since we haven't set up Google Auth yet
      throw new Error('Google Sign-In will be implemented in a future update. Please use email signup for now.');

      // TODO: Implement Google Sign-In when ready
      // This would require setting up expo-google-app-auth or @react-native-google-signin/google-signin
      /*
      const googleCredential = await getGoogleCredential(); // To be implemented
      const credential = GoogleAuthProvider.credential(
        googleCredential.idToken,
        googleCredential.accessToken
      );
      
      const result = await linkWithCredential(this.currentUser, credential);
      console.log('✅ Account upgraded to Google successfully:', result.user.email);
      return result.user;
      */
    } catch (error) {
      console.error('❌ Google upgrade failed:', error);
      throw error;
    }
  }

  /**
   * Check if current user is anonymous
   */
  isAnonymous() {
    return this.currentUser ? this.currentUser.isAnonymous : true;
  }

  /**
   * Check if user has premium status
   * For now, premium = not anonymous (has email/Apple/Google account)
   */
  isPremium() {
    return !this.isAnonymous();
  }

  /**
   * Get current user ID for analytics and data linking
   */
  getUserId() {
    return this.currentUser ? this.currentUser.uid : null;
  }

  /**
   * Get current user email
   */
  getUserEmail() {
    return this.currentUser ? this.currentUser.email : null;
  }

  /**
   * Get user display name
   */
  getDisplayName() {
    if (!this.currentUser) return 'Beautiful Soul';
    
    if (this.currentUser.displayName) {
      return this.currentUser.displayName;
    }
    
    if (this.currentUser.email) {
      return this.currentUser.email.split('@')[0];
    }
    
    return this.isAnonymous() ? 'Beautiful Soul' : 'Manifestor';
  }

  /**
   * Get comprehensive user info
   */
  getUserInfo() {
    if (!this.currentUser) {
      return {
        uid: null,
        isAuthenticated: false,
        isAnonymous: true,
        isPremium: false,
        email: null,
        displayName: 'Beautiful Soul'
      };
    }

    return {
      uid: this.currentUser.uid,
      isAuthenticated: true,
      isAnonymous: this.currentUser.isAnonymous,
      isPremium: !this.currentUser.isAnonymous,
      email: this.currentUser.email,
      displayName: this.getDisplayName(),
      provider: this.getAuthProvider(),
      createdAt: this.currentUser.metadata.creationTime,
      lastSignIn: this.currentUser.metadata.lastSignInTime
    };
  }

  /**
   * Get the authentication provider
   */
  getAuthProvider() {
    if (!this.currentUser) return null;
    
    if (this.currentUser.isAnonymous) return 'anonymous';
    
    const providers = this.currentUser.providerData;
    if (providers.length > 0) {
      const providerId = providers[0].providerId;
      switch (providerId) {
        case 'password': return 'email';
        case 'apple.com': return 'apple';
        case 'google.com': return 'google';
        default: return providerId;
      }
    }
    
    return 'unknown';
  }

  /**
   * Sign out current user
   */
  async signOut() {
    try {
      await signOut(auth);
      console.log('✅ User signed out');
    } catch (error) {
      console.error('❌ Sign out failed:', error);
      throw error;
    }
  }

  /**
   * Add listener for auth state changes
   */
  addAuthStateListener(listener) {
    this.authStateListeners.push(listener);
    return () => {
      this.authStateListeners = this.authStateListeners.filter(l => l !== listener);
    };
  }

  /**
   * Notify all auth state listeners
   */
  notifyAuthStateListeners(user) {
    this.authStateListeners.forEach(listener => {
      try {
        listener(user);
      } catch (error) {
        console.error('❌ Auth state listener error:', error);
      }
    });
  }

  /**
   * Clean up
   */
  destroy() {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
    this.authStateListeners = [];
  }
}

// Export singleton instance
export const authService = new AuthService();
export default authService;