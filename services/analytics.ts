// Simple analytics service fallback for development
interface AnalyticsEvent {
  name: string;
  properties?: Record<string, any>;
}

class AnalyticsService {
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    try {
      console.log('📊 Analytics: Initializing analytics service...');
      this.isInitialized = true;
      console.log('✅ Analytics: Initialized (development mode)');
    } catch (error) {
      console.error('❌ Analytics: Failed to initialize:', error);
      this.isInitialized = true;
    }
  }

  track(eventName: string, properties?: Record<string, any>): void {
    if (__DEV__) {
      console.log('📊 Analytics:', eventName, properties || '');
    }
  }

  trackSessionStart(): void {
    this.track('session_start', {
      timestamp: new Date().toISOString(),
      platform: 'ios',
    });
  }

  trackSessionEnd(): void {
    this.track('session_end', {
      timestamp: new Date().toISOString(),
    });
  }

  trackScreenView(screenName: string): void {
    this.track('screen_view', {
      screen_name: screenName,
      timestamp: new Date().toISOString(),
    });
  }

  trackError(error: Error, context?: string): void {
    this.track('error', {
      error_message: error.message,
      error_stack: error.stack,
      context: context || 'unknown',
      timestamp: new Date().toISOString(),
    });
  }

  trackPurchase(productId: string, price: number, currency: string, additionalProperties?: Record<string, any>): void {
    this.track('purchase', {
      product_id: productId,
      price,
      currency,
      timestamp: new Date().toISOString(),
      ...additionalProperties,
    });
  }

  setUserProperty(property: string, value: any): void {
    if (__DEV__) {
      console.log('📊 Analytics: User property:', property, value);
    }
  }

  setUserId(userId: string): void {
    if (__DEV__) {
      console.log('📊 Analytics: User ID:', userId);
    }
  }
}

export const analyticsService = new AnalyticsService();