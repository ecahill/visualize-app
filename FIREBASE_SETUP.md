# Firebase Setup Guide

This app uses Firebase for cloud backup, data synchronization, and analytics. Follow these steps to set up Firebase for your project.

## 1. Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Enter project name (e.g., "visualize-app")
4. Enable Google Analytics (recommended)
5. Choose or create a Google Analytics account
6. Click "Create project"

## 2. Add Web App to Firebase Project

1. In your Firebase project console, click the web icon (`</>`)
2. Register app with a nickname (e.g., "Visualize App")
3. Don't check "Set up Firebase Hosting" for now
4. Click "Register app"
5. Copy the Firebase configuration object

## 3. Configure Environment Variables

Create a `.env` file in your project root and add your Firebase configuration:

```env
EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key_here
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
```

## 4. Enable Required Services

### Authentication
1. Go to "Authentication" in Firebase Console
2. Click "Get started"
3. Go to "Sign-in method" tab
4. Enable "Anonymous" authentication

### Firestore Database
1. Go to "Firestore Database"
2. Click "Create database"
3. Choose "Start in test mode" (for development)
4. Select a location close to your users
5. Click "Done"

### Storage
1. Go to "Storage"
2. Click "Get started"
3. Choose "Start in test mode" (for development)
4. Select the same location as Firestore
5. Click "Done"

## 5. Configure Security Rules

### Firestore Rules (Development)
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own data
    match /users/{userId} {
      allow read, write: if true; // Allow all for development
    }
    
    // Analytics can be written by anyone (anonymous users)
    match /analytics/{document} {
      allow read, write: if true;
    }
  }
}
```

### Storage Rules (Development)
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Allow users to upload avatars
    match /avatars/{allPaths=**} {
      allow read, write: if true; // Allow all for development
    }
  }
}
```

## 6. Production Security Rules

For production, implement proper security rules:

### Firestore Rules (Production)
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Analytics can be written by authenticated users
    match /analytics/{document} {
      allow write: if request.auth != null;
      allow read: if false; // Analytics should not be readable by clients
    }
  }
}
```

### Storage Rules (Production)
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Users can only upload/access their own avatars
    match /avatars/{userId}_{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## 7. Analytics Setup (Optional)

If you want to use Firebase Analytics:

1. In Firebase Console, go to "Analytics"
2. Follow the setup wizard
3. Analytics will automatically be enabled for your web app

## 8. Testing the Setup

1. Run your app: `npm start`
2. Create a new user profile
3. Check Firebase Console:
   - Authentication: Should show anonymous users
   - Firestore: Should show user documents in `/users/` collection
   - Storage: Should show avatar uploads in `/avatars/` folder (if user uploads avatar)

## 9. Monitoring and Performance

### Set up Performance Monitoring
1. Go to "Performance" in Firebase Console
2. Follow the setup guide for web apps
3. Add the Performance SDK if needed

### Set up Crashlytics (Optional)
For crash reporting, you can set up Crashlytics:
1. Go to "Crashlytics" in Firebase Console
2. Follow the setup guide

## Environment-Specific Configurations

### Development
- Use test mode rules
- Enable debug logging
- Use Firebase Local Emulator Suite for offline development

### Production
- Use restrictive security rules
- Enable backup and recovery
- Set up monitoring and alerts
- Configure proper indexing for Firestore queries

## Troubleshooting

### Common Issues

1. **Permission Denied**: Check your Firestore/Storage security rules
2. **API Key Issues**: Ensure environment variables are correctly set
3. **Authentication Errors**: Verify anonymous auth is enabled
4. **Storage Upload Fails**: Check storage rules and file size limits

### Debug Mode
Add this to your app to enable Firebase debug logging:
```javascript
// In development only
if (__DEV__) {
  // Enable Firestore debug logging
  import { connectFirestoreEmulator } from 'firebase/firestore';
  // connectFirestoreEmulator(firestore, 'localhost', 8080);
}
```

## Cost Considerations

Firebase offers generous free tiers, but monitor usage:
- **Firestore**: 1GB storage, 50k reads/day, 20k writes/day free
- **Storage**: 5GB transfer/month free
- **Authentication**: Unlimited anonymous auth free
- **Analytics**: Free

For production apps with many users, consider:
- Implementing data cleanup policies
- Using batch writes for efficiency
- Optimizing query patterns
- Setting up billing alerts

## Next Steps

1. Set up proper backup strategies
2. Implement offline support with local caching
3. Add error tracking and monitoring
4. Set up CI/CD with Firebase deployment
5. Consider using Firebase Functions for server-side logic