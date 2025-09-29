const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Remove web-specific aliases that were causing web components to be used in native builds
// Only keep essential aliases if needed for specific compatibility issues
config.resolver.alias = {
  ...(config.resolver.alias || {}),
  // Remove all react-native-web aliases to ensure native components are used
};

// Configure platform resolution to prioritize native files over web files
// This ensures .ios.js, .native.js, and .js files are used before .web.js files
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

// Ensure proper file extension resolution priority
// Native extensions should come before web extensions
config.resolver.sourceExts = [
  'ios.js', 'ios.jsx', 'ios.ts', 'ios.tsx',
  'native.js', 'native.jsx', 'native.ts', 'native.tsx',
  'js', 'jsx', 'ts', 'tsx',
  'web.js', 'web.jsx', 'web.ts', 'web.tsx'
];

console.log('📱 Metro: Configured for native React Native (iOS/Android) with web fallback');

module.exports = config;