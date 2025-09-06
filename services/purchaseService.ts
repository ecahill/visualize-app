import * as InAppPurchases from 'react-native-iap';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import { userService, PurchaseProduct } from './userService';
import { analyticsService } from './analyticsService';

export interface Product {
  productId: string;
  price: string;
  currency: string;
  localizedPrice: string;
  title: string;
  description: string;
  type: 'premium' | 'feature' | 'content';
  features: string[];
}

export interface Purchase {
  productId: string;
  transactionId: string;
  purchaseDate: string;
  receiptData?: string;
  platform: 'ios' | 'android';
}

class PurchaseService {
  private products: Product[] = [];
  private isInitialized = false;

  // Product IDs - these would match your app store configurations
  private readonly productIds = [
    'premium_monthly',
    'premium_yearly',
    'unlimited_goals',
    'advanced_analytics',
    'custom_affirmations',
    'premium_sounds',
  ];

  // Mock product data for demonstration
  private readonly mockProducts: Product[] = [
    {
      productId: 'premium_monthly',
      price: '4.99',
      currency: 'USD',
      localizedPrice: '$4.99',
      title: 'Premium Monthly',
      description: 'Unlock all premium features for one month',
      type: 'premium',
      features: [
        'Unlimited manifestation goals',
        'Advanced analytics and insights',
        'Custom affirmations library',
        'Premium meditation sounds',
        'Priority customer support',
        'Ad-free experience',
      ],
    },
    {
      productId: 'premium_yearly',
      price: '49.99',
      currency: 'USD',
      localizedPrice: '$49.99',
      title: 'Premium Yearly',
      description: 'Unlock all premium features for one year (Save 17%!)',
      type: 'premium',
      features: [
        'All monthly premium features',
        'Exclusive yearly content',
        'Advanced goal tracking',
        'Personal manifestation coach',
        'Unlimited cloud storage',
        'Early access to new features',
      ],
    },
    {
      productId: 'unlimited_goals',
      price: '2.99',
      currency: 'USD',
      localizedPrice: '$2.99',
      title: 'Unlimited Goals',
      description: 'Create unlimited manifestation goals',
      type: 'feature',
      features: [
        'Unlimited goal creation',
        'Advanced goal categories',
        'Goal progress tracking',
        'Custom goal templates',
      ],
    },
    {
      productId: 'advanced_analytics',
      price: '1.99',
      currency: 'USD',
      localizedPrice: '$1.99',
      title: 'Advanced Analytics',
      description: 'Deep insights into your manifestation journey',
      type: 'feature',
      features: [
        'Detailed progress reports',
        'Mood and energy tracking',
        'Success pattern analysis',
        'Personalized recommendations',
      ],
    },
    {
      productId: 'custom_affirmations',
      price: '1.99',
      currency: 'USD',
      localizedPrice: '$1.99',
      title: 'Custom Affirmations',
      description: 'Create and save your own affirmations',
      type: 'content',
      features: [
        'Unlimited custom affirmations',
        'Affirmation categories',
        'Voice recording',
        'Sharing capabilities',
      ],
    },
    {
      productId: 'premium_sounds',
      price: '2.99',
      currency: 'USD',
      localizedPrice: '$2.99',
      title: 'Premium Sounds',
      description: 'Access to premium meditation and visualization sounds',
      type: 'content',
      features: [
        '20+ premium soundscapes',
        'Binaural beats',
        'Nature sounds',
        'Guided meditation tracks',
      ],
    },
  ];

  async initialize(): Promise<void> {
    try {
      // Initialize the connection to the store
      await InAppPurchases.initConnection();
      
      // For demo purposes, we'll use mock data
      // In production, this would fetch from the actual app store
      this.products = this.mockProducts;
      
      // Load purchase history
      await this.loadPurchaseHistory();
      
      this.isInitialized = true;
      
      // Track initialization
      await analyticsService.track('iap_service_initialized', {
        productsCount: this.products.length,
        initTime: new Date().toISOString(),
      });

    } catch (error) {
      console.error('Failed to initialize purchase service:', error);
      await analyticsService.trackError(error as Error, 'iap_initialization');
    }
  }

  async getProducts(): Promise<Product[]> {
    if (!this.isInitialized) {
      await this.initialize();
    }
    return this.products;
  }

  async getProduct(productId: string): Promise<Product | null> {
    const products = await this.getProducts();
    return products.find(p => p.productId === productId) || null;
  }

  async getPremiumProducts(): Promise<Product[]> {
    const products = await this.getProducts();
    return products.filter(p => p.type === 'premium');
  }

  async purchaseProduct(productId: string): Promise<boolean> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      const product = await this.getProduct(productId);
      if (!product) {
        throw new Error('Product not found');
      }

      // Track purchase attempt
      await analyticsService.track('purchase_attempt', {
        productId,
        productType: product.type,
        price: product.price,
        currency: product.currency,
      });

      // In a real app, this would call InAppPurchases.requestPurchase()
      // For demo purposes, we'll simulate a successful purchase
      const mockPurchase: Purchase = {
        productId,
        transactionId: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        purchaseDate: new Date().toISOString(),
        platform: 'ios', // or 'android'
      };

      // Save the purchase
      await this.savePurchase(mockPurchase);
      
      // Update user premium status if applicable
      if (product.type === 'premium') {
        await userService.updateUserProfile({ isPremium: true });
      }

      // Track successful purchase
      await analyticsService.trackPurchase(
        productId, 
        parseFloat(product.price), 
        product.currency,
        {
          transactionId: mockPurchase.transactionId,
          productType: product.type,
          features: product.features,
        }
      );

      return true;

    } catch (error) {
      console.error('Purchase failed:', error);
      
      // Track failed purchase
      await analyticsService.track('purchase_failed', {
        productId,
        errorMessage: (error as Error).message,
        failureTime: new Date().toISOString(),
      });

      Alert.alert(
        'Purchase Failed',
        'We couldn\'t complete your purchase. Please try again.',
        [{ text: 'OK' }]
      );
      
      return false;
    }
  }

  async restorePurchases(): Promise<boolean> {
    try {
      // Track restore attempt
      await analyticsService.track('restore_purchases_attempt');

      // In a real app, this would call InAppPurchases.getAvailablePurchases()
      // For demo purposes, we'll load from AsyncStorage
      const purchaseHistory = await this.getPurchaseHistory();
      
      if (purchaseHistory.length === 0) {
        Alert.alert(
          'No Purchases Found',
          'We couldn\'t find any previous purchases to restore.',
          [{ text: 'OK' }]
        );
        return false;
      }

      // Check if user has premium purchases
      const hasPremiumPurchase = purchaseHistory.some(p => {
        const product = this.products.find(prod => prod.productId === p.productId);
        return product?.type === 'premium';
      });

      if (hasPremiumPurchase) {
        await userService.updateUserProfile({ isPremium: true });
      }

      // Track successful restore
      await analyticsService.track('restore_purchases_success', {
        restoredCount: purchaseHistory.length,
        hasPremiumPurchase,
      });

      Alert.alert(
        'Purchases Restored',
        `Successfully restored ${purchaseHistory.length} purchase(s).`,
        [{ text: 'OK' }]
      );

      return true;

    } catch (error) {
      console.error('Restore purchases failed:', error);
      
      // Track failed restore
      await analyticsService.trackError(error as Error, 'restore_purchases');
      
      Alert.alert(
        'Restore Failed',
        'We couldn\'t restore your purchases. Please try again.',
        [{ text: 'OK' }]
      );
      
      return false;
    }
  }

  private async savePurchase(purchase: Purchase): Promise<void> {
    try {
      const existingPurchases = await this.getPurchaseHistory();
      const updatedPurchases = [...existingPurchases, purchase];
      
      await AsyncStorage.setItem('purchase_history', JSON.stringify(updatedPurchases));
    } catch (error) {
      console.error('Failed to save purchase:', error);
    }
  }

  private async loadPurchaseHistory(): Promise<void> {
    try {
      const history = await AsyncStorage.getItem('purchase_history');
      // Just load them, don't need to store in memory for this implementation
    } catch (error) {
      console.error('Failed to load purchase history:', error);
    }
  }

  async getPurchaseHistory(): Promise<Purchase[]> {
    try {
      const history = await AsyncStorage.getItem('purchase_history');
      return history ? JSON.parse(history) : [];
    } catch (error) {
      console.error('Failed to get purchase history:', error);
      return [];
    }
  }

  async hasPurchased(productId: string): Promise<boolean> {
    try {
      const history = await this.getPurchaseHistory();
      return history.some(p => p.productId === productId);
    } catch (error) {
      return false;
    }
  }

  async isPremiumUser(): Promise<boolean> {
    try {
      const user = userService.getCurrentUser();
      if (user?.isPremium) return true;

      // Check for active premium purchases
      const premiumProducts = await this.getPremiumProducts();
      const history = await this.getPurchaseHistory();
      
      return history.some(purchase => 
        premiumProducts.some(product => product.productId === purchase.productId)
      );
    } catch (error) {
      return false;
    }
  }

  async hasFeatureAccess(feature: string): Promise<boolean> {
    try {
      // Check if user is premium (has access to all features)
      if (await this.isPremiumUser()) return true;

      // Check for specific feature purchases
      const history = await this.getPurchaseHistory();
      const featureProducts = this.products.filter(p => 
        p.features.some(f => f.toLowerCase().includes(feature.toLowerCase()))
      );

      return history.some(purchase => 
        featureProducts.some(product => product.productId === purchase.productId)
      );
    } catch (error) {
      return false;
    }
  }

  // Helper method to show premium upsell
  async showPremiumUpsell(feature: string, context: string): Promise<void> {
    await analyticsService.track('premium_upsell_shown', {
      feature,
      context,
      showTime: new Date().toISOString(),
    });

    Alert.alert(
      'Premium Feature',
      `${feature} is a premium feature. Upgrade to unlock this and many other amazing features!`,
      [
        {
          text: 'Maybe Later',
          style: 'cancel',
          onPress: () => analyticsService.track('premium_upsell_dismissed', { feature, context }),
        },
        {
          text: 'Upgrade Now',
          onPress: () => {
            analyticsService.track('premium_upsell_accepted', { feature, context });
            // Navigate to premium screen
            // router.push('/premium');
          },
        },
      ]
    );
  }

  // Pricing utilities
  getMonthlyPrice(): string {
    const monthly = this.products.find(p => p.productId === 'premium_monthly');
    return monthly?.localizedPrice || '$4.99';
  }

  getYearlyPrice(): string {
    const yearly = this.products.find(p => p.productId === 'premium_yearly');
    return yearly?.localizedPrice || '$49.99';
  }

  getYearlySavings(): string {
    const monthly = this.products.find(p => p.productId === 'premium_monthly');
    const yearly = this.products.find(p => p.productId === 'premium_yearly');
    
    if (!monthly || !yearly) return '17%';
    
    const monthlyPrice = parseFloat(monthly.price);
    const yearlyPrice = parseFloat(yearly.price);
    const savings = Math.round(((monthlyPrice * 12 - yearlyPrice) / (monthlyPrice * 12)) * 100);
    
    return `${savings}%`;
  }

  async cleanup(): Promise<void> {
    try {
      if (this.isInitialized) {
        await InAppPurchases.endConnection();
        this.isInitialized = false;
        
        await analyticsService.track('iap_service_cleanup');
      }
    } catch (error) {
      console.error('Failed to cleanup purchase service:', error);
    }
  }

  // Demo helper methods
  async simulatePremiumPurchase(): Promise<void> {
    await this.purchaseProduct('premium_monthly');
  }

  async resetPurchases(): Promise<void> {
    try {
      await AsyncStorage.removeItem('purchase_history');
      await userService.updateUserProfile({ isPremium: false });
      
      await analyticsService.track('purchases_reset', {
        resetTime: new Date().toISOString(),
      });
      
      Alert.alert('Purchases Reset', 'All purchases have been reset for demo purposes.');
    } catch (error) {
      console.error('Failed to reset purchases:', error);
    }
  }
}

export const purchaseService = new PurchaseService();