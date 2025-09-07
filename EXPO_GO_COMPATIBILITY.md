# Expo Go Compatibility Guide

This document outlines the changes made to ensure the app runs properly in Expo Go.

## Changes Made for Expo Go Compatibility

### 1. Haptic Feedback
- **Replaced**: `react-native-haptic-feedback` 
- **With**: `expo-haptics`
- **Reason**: The original package requires native code compilation

#### Implementation
- Created utility file: `utils/haptics.ts`
- Maps common haptic feedback types to Expo Haptics API
- Updated all files that used haptic feedback

### 2. Date/Time Picker
- **Replaced**: `@react-native-community/datetimepicker`
- **With**: Custom time selection UI
- **Reason**: The community package requires native code

#### Implementation  
- Created custom time picker with hour selection buttons
- Simplified to hourly intervals (6AM - 9PM)
- Better touch-friendly interface for mobile

## Dependencies Compatible with Expo Go

✅ **Working Dependencies:**
- `expo-haptics` - Haptic feedback
- `expo-image-picker` - Camera/gallery access
- `expo-file-system` - File operations
- `expo-secure-store` - Secure storage
- `expo-linear-gradient` - Gradients
- `@react-native-async-storage/async-storage` - Local storage
- `firebase` - Firebase services
- `react-native-reanimated` - Animations
- All other Expo SDK packages

## Features That Work in Expo Go

✅ **Full Functionality:**
- User profile with avatar upload
- Manifestation goals onboarding
- Settings with theme/notification preferences
- Firebase data backup and sync
- Analytics tracking
- In-app purchase UI (mock implementation)
- Data export and privacy controls
- All animations and UI components

## Limitations in Expo Go

⚠️ **Limited Functionality:**
- **In-App Purchases**: Mock implementation only (real IAP requires native build)
- **Push Notifications**: Limited to Expo push notifications
- **Deep Linking**: Basic support only
- **Background Tasks**: Limited background processing

## Testing Recommendations

### In Expo Go (Development)
1. Test all UI flows and animations
2. Test data persistence and sync
3. Test settings and preferences
4. Test onboarding flows
5. Test analytics tracking (check console logs)

### For Production Features
1. **In-App Purchases**: Requires production build and App Store/Play Store configuration
2. **Push Notifications**: Requires FCM/APNS setup and production build
3. **Full Firebase**: Requires proper Firebase project configuration

## Production Build Requirements

When building for production (`expo build` or EAS Build), you can:

1. **Re-enable Native Packages** (if needed):
   ```bash
   npm install react-native-haptic-feedback
   npm install @react-native-community/datetimepicker
   ```

2. **Configure Real In-App Purchases**:
   - Set up App Store Connect / Google Play Console
   - Configure product IDs
   - Replace mock purchase service with real implementation

3. **Set up Push Notifications**:
   - Configure FCM for Android
   - Configure APNS for iOS
   - Update notification service

## Environment Setup for Production

### Firebase Configuration
1. Replace demo Firebase config with production values
2. Set up proper security rules
3. Configure authentication methods
4. Set up proper indexing for Firestore

### App Store Configuration
1. Configure in-app purchase products
2. Set up proper app metadata
3. Configure proper permissions and capabilities

## Development vs Production

| Feature | Expo Go | Production Build |
|---------|---------|------------------|
| UI/UX | ✅ Full | ✅ Full |
| Analytics | ✅ Full | ✅ Full |
| Firebase | ✅ Full* | ✅ Full |
| Haptics | ✅ Full | ✅ Full |
| IAP | ⚠️ Mock | ✅ Real |
| Push Notifications | ⚠️ Expo only | ✅ Native |
| Time Picker | ⚠️ Custom | ✅ Native option |

*Firebase works fully but uses demo configuration

## Getting Started

1. **Clone and Install**:
   ```bash
   git clone <repository>
   cd visualize-app
   npm install
   ```

2. **Start Development**:
   ```bash
   npm start
   ```

3. **Test in Expo Go**:
   - Scan QR code with Expo Go app
   - Test all features and flows
   - Check console for any errors

4. **Production Build** (when ready):
   ```bash
   expo build:ios
   expo build:android
   # or use EAS Build
   eas build --platform all
   ```

This setup ensures maximum compatibility with Expo Go while maintaining all core functionality for development and testing.