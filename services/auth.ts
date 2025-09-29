// Simple auth service fallback for development
interface User {
  id: string;
  email?: string;
  isAnonymous: boolean;
}

class AuthService {
  private user: User | null = null;
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    try {
      console.log('🔐 Auth: Initializing auth service...');
      
      // Create a mock anonymous user for development
      this.user = {
        id: 'dev-user-' + Math.random().toString(36).substr(2, 9),
        isAnonymous: true,
      };
      
      this.isInitialized = true;
      console.log('✅ Auth: Initialized with anonymous user');
    } catch (error) {
      console.error('❌ Auth: Failed to initialize:', error);
      // Still mark as initialized to prevent app from hanging
      this.isInitialized = true;
    }
  }

  getCurrentUser(): User | null {
    return this.user;
  }

  isAuthenticated(): boolean {
    return !!this.user;
  }

  async signInAnonymously(): Promise<User> {
    if (!this.user) {
      this.user = {
        id: 'dev-user-' + Math.random().toString(36).substr(2, 9),
        isAnonymous: true,
      };
    }
    return this.user;
  }

  async signOut(): Promise<void> {
    this.user = null;
    console.log('🔐 Auth: User signed out');
  }

  // Mock methods for development
  onAuthStateChanged(callback: (user: User | null) => void): () => void {
    // Call immediately with current user
    callback(this.user);
    
    // Return unsubscribe function
    return () => {};
  }
}

export const authService = new AuthService();