import '../polyfills'; // Import polyfills first
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/components/useColorScheme';
import { authService } from '@/src/services/auth';
import { analyticsService } from '@/src/services/analytics';
import ErrorBoundary from '@/components/ErrorBoundary';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: '(tabs)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });
  
  const [isAuthInitialized, setIsAuthInitialized] = useState(false);

  // Initialize Firebase and Authentication
  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      console.log('🚀 Initializing Firebase and Authentication...');
      
      // Initialize authentication (sign in anonymously if needed)
      await authService.initialize();
      
      // Initialize analytics
      await analyticsService.initialize();
      
      // Track app session start
      analyticsService.trackSessionStart();
      
      setIsAuthInitialized(true);
      console.log('✅ App initialization complete');
    } catch (error) {
      console.error('❌ App initialization failed:', error);
      // Still allow app to continue even if Firebase fails
      setIsAuthInitialized(true);
    }
  };

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded && isAuthInitialized) {
      SplashScreen.hideAsync();
    }
  }, [loaded, isAuthInitialized]);

  if (!loaded || !isAuthInitialized) {
    return null;
  }

  return (
    <ErrorBoundary>
      <RootLayoutNav />
    </ErrorBoundary>
  );
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
        <Stack.Screen name="premium" options={{ headerShown: false, presentation: 'modal' }} />
      </Stack>
    </ThemeProvider>
  );
}
