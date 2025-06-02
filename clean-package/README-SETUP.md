# Smart Alarm Clock App - Setup Guide

## 📱 Overview
A modern React Native alarm clock application with mini-games, sound management, and sleep tracking features.

## ✨ Features
- 🔔 Smart alarm system with custom sounds
- 🎮 Mini-games for alarm dismissal (Math, Memory, Photo)
- 🌙 Sleep tracking and analytics
- 🎵 Custom sound library
- 🔥 Firebase integration ready
- 📱 Cross-platform (iOS & Android)
- 🎨 Modern dark theme UI

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Expo CLI (`npm install -g @expo/cli`)
- React Native development environment

### Installation

1. **Extract the project files**
   ```bash
   cd your-project-directory
   npm install
   ```

2. **Configure Environment**
   ```bash
   # Copy the example environment file
   cp config/environment.example.js config/environment.js
   ```

3. **Setup Firebase (Optional)**
   - Create a new Firebase project at https://console.firebase.google.com
   - Enable Authentication, Firestore, and Storage
   - Copy your Firebase config to `config/environment.js`

4. **Setup Weather API (Optional)**
   - Get a free API key from https://openweathermap.org/api
   - Add your API key to `config/environment.js`

5. **Run the application**
   ```bash
   # For development
   npm start
   
   # For iOS
   npm run ios
   
   # For Android
   npm run android
   ```

## ⚙️ Configuration

### Environment Setup
Edit `config/environment.js` with your actual values:

```javascript
export const ENV_CONFIG = {
  FIREBASE: {
    apiKey: "your_actual_firebase_api_key",
    authDomain: "your-project.firebaseapp.com",
    // ... other Firebase config
  },
  WEATHER: {
    apiKey: "your_actual_weather_api_key",
    baseUrl: "https://api.openweathermap.org/data/2.5"
  }
};
```

### Firebase Setup (Optional)
1. Create a Firebase project
2. Enable the following services:
   - Authentication (Email/Password)
   - Cloud Firestore
   - Cloud Storage
3. Download the configuration and update `config/environment.js`

### Weather API Setup (Optional)
1. Sign up at OpenWeatherMap
2. Get your free API key
3. Update the `WEATHER.apiKey` in `config/environment.js`

## 📁 Project Structure

```
├── components/          # Reusable UI components
├── contexts/           # React Context providers
├── firebase/           # Firebase configuration
├── models/             # Data models and managers
├── navigation/         # Navigation configuration
├── redux/              # Redux store and slices
├── screens/            # App screens
├── utils/              # Utility functions
├── assets/             # Images, sounds, fonts
└── config/             # Environment configuration
```

## 🎮 Features Guide

### Alarm System
- Create multiple alarms with custom times
- Set repeat patterns (daily, weekdays, weekends)
- Choose from built-in sounds or upload custom ones
- Enable mini-games for alarm dismissal

### Mini-Games
- **Math Game**: Solve arithmetic problems
- **Memory Game**: Match card pairs
- **Photo Game**: Take a specific photo to dismiss

### Sleep Tracking
- Track sleep duration and quality
- View sleep analytics and trends
- Weather impact analysis on sleep

## 🛠️ Customization

### Adding New Sounds
1. Place audio files in `assets/sounds/`
2. Update the sound list in `screens/SoundPickerScreen.js`

### Adding New Games
1. Create a new game component in `screens/games/`
2. Add the game to the navigation in `navigation/AlarmNavigator.js`
3. Update the game selection in `screens/AddAlarmScreen.js`

### Theming
- Colors and styles are defined in each component's StyleSheet
- Main theme colors can be found in component style objects

## 📱 Building for Production

### Android
```bash
# Build APK
expo build:android

# Or using EAS Build
eas build --platform android
```

### iOS
```bash
# Build IPA
expo build:ios

# Or using EAS Build
eas build --platform ios
```

## 🔧 Troubleshooting

### Common Issues

1. **Metro bundler issues**
   ```bash
   npx react-native start --reset-cache
   ```

2. **Node modules issues**
   ```bash
   rm -rf node_modules
   npm install
   ```

3. **iOS build issues**
   ```bash
   cd ios && pod install
   ```

### Environment Issues
- Make sure `config/environment.js` exists and has valid configuration
- Check that all required API keys are properly set
- Verify Firebase project settings match your configuration

## 📄 License
This project is provided as-is for educational and commercial use.

## 🆘 Support
For technical support or questions about this codebase, please refer to the documentation or create an issue in your project repository.

## 🔄 Updates
Check for updates and new features in future releases.

---

**Note**: This is a complete, production-ready React Native application. Make sure to test thoroughly before deploying to app stores. 