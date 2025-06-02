// Demo Environment Configuration
// This is a demo configuration file
// Copy environment.example.js and fill in your actual values

export const ENV_CONFIG = {
  FIREBASE: {
    apiKey: "demo_api_key",
    authDomain: "demo-project.firebaseapp.com",
    databaseURL: "https://demo-project.firebaseio.com",
    projectId: "demo-project",
    storageBucket: "demo-project.appspot.com",
    messagingSenderId: "000000000000",
    appId: "1:000000000000:web:demo",
    measurementId: "G-DEMO"
  },
  WEATHER: {
    apiKey: "demo_weather_api_key",
    baseUrl: "https://api.openweathermap.org/data/2.5"
  },
  APP: {
    name: "Smart Alarm Clock",
    version: "1.0.0",
    environment: "development"
  }
};

export default ENV_CONFIG;
