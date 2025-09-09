const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Create mock modules for Expo Go compatibility
const createMockModule = (moduleName) => {
  return path.join(__dirname, 'services', 'mocks', `${moduleName}.js`);
};

// Add comprehensive alias resolution for React Native Web and Expo Go compatibility
config.resolver.alias = {
  ...(config.resolver.alias || {}),
  'react-native$': 'react-native-web',
  'react-native/Libraries/Utilities/Platform': 'react-native-web/dist/exports/Platform',
  'react-native/Libraries/StyleSheet/processColor': 'react-native-web/dist/exports/StyleSheet/processColor',
  'react-native/Libraries/Components/View/ViewNativeComponent': 'react-native-web/dist/exports/View',
};

// Conditionally add native module mocks for Expo Go
if (process.env.EXPO_PLATFORM === 'expo-go' || process.env.NODE_ENV === 'development') {
  console.log('📱 Metro: Configuring for Expo Go compatibility');
  
  // Only alias problematic native modules, let compatibility services handle the rest
  config.resolver.alias = {
    ...config.resolver.alias,
    // These modules are conditionally loaded by our compatibility services
    // so we don't need to mock them here
  };
}

// Ensure proper platform and extension resolution
config.resolver.platforms = ['web', 'ios', 'android', 'native'];
config.resolver.sourceExts = ['web.js', 'web.ts', 'web.tsx', ...config.resolver.sourceExts];

module.exports = config;