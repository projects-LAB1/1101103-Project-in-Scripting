# Firebase Setup Instructions

## Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click on "Add project"
3. Enter a project name (e.g., "Sleep Tracker App")
4. Follow the setup steps (enable Google Analytics if needed)
5. Click "Create project"

## Step 2: Register Your App with Firebase

1. From the project dashboard, click on the Web icon (</>) to add a web app
2. Register your app with a nickname (e.g., "Sleep Tracker Web")
3. Check the option "Also set up Firebase Hosting" if you plan to deploy the app
4. Click "Register app"
5. Firebase will provide your configuration object - copy this information

## Step 3: Configure Your App

1. Open `firebase/config.js` in your project
2. Replace the placeholder values with your Firebase configuration:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

## Step 4: Enable Authentication

1. In the Firebase Console, go to "Authentication" from the left menu
2. Click on "Get started"
3. In the "Sign-in method" tab, enable "Email/Password" provider
4. Save the changes

## Step 5: Create Firestore Database

1. In the Firebase Console, go to "Firestore Database" from the left menu
2. Click on "Create database"
3. Choose either "Start in production mode" or "Start in test mode" (test mode is easier for development)
   * If you choose production mode, you'll need to set up security rules
   * For test mode, your rules will allow anyone to read/write (not secure for production)
4. Select the Firestore location closest to your users
5. Click "Enable"

## Step 6: Set Up Firestore Security Rules

For development, you can use these rules:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow authenticated users to read and write their own data
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // For development only - you should restrict this further for production
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

Go to "Firestore Database" > "Rules" tab to paste these rules.

## Step 7: Understanding the Database Structure

The app uses the following Firestore structure:

```
/users/{userId}/                   // User-specific data
    sleepData/{sleepRecordId}      // Sleep records for a user
    settings/sleepGoals            // User's sleep goals settings
```

## Step 8: Testing Authentication

1. Run your app
2. Try to register a new user
3. Check the Firebase Authentication console to see if the user was created

## Step 9: Testing Firestore

1. After logging in, add a sleep record
2. Check the Firestore Database in Firebase Console to see if the data was stored
3. The record should appear under: users/{userId}/sleepData/{recordId}

## Troubleshooting

- If you encounter CORS issues, make sure to set up the appropriate rules in Firebase project settings
- For authentication issues, check the browser console for specific error messages
- For Firestore permission issues, verify your security rules and make sure users are properly authenticated 