// Environment Configuration Example
// Copy this file to environment.js and fill in your actual values

export const ENV_CONFIG = {
  // Firebase Configuration
  FIREBASE: {
    apiKey: "your_firebase_api_key_here",
    authDomain: "your_project.firebaseapp.com", 
    databaseURL: "https://your_project.firebaseio.com",
    projectId: "your_project_id",
    storageBucket: "your_project.appspot.com",
    messagingSenderId: "your_sender_id",
    appId: "your_app_id",
    measurementId: "your_measurement_id"
  },
  
  // Weather API Configuration
  WEATHER: {
    apiKey: "your_openweather_api_key_here",
    baseUrl: "https://api.openweathermap.org/data/2.5"
  },
  
  // App Configuration
  APP: {
    name: "Smart Alarm Clock",
    version: "1.0.0",
    environment: "development"
  }
};

export default ENV_CONFIG; 