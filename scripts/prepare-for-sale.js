#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🚀 Preparing project for sale...\n');

// Files and directories to clean/remove
const filesToClean = [
  'node_modules',
  '.expo',
  'ios/build',
  'android/build',
  'android/.gradle',
  '.git',
  'coverage',
  'backup'
];

// Sensitive files to check
const sensitiveFiles = [
  'config/environment.js',
  'google-services.json',
  'GoogleService-Info.plist',
  '.env',
  '.env.local'
];

// Function to remove directories/files
function removeIfExists(filePath) {
  if (fs.existsSync(filePath)) {
    if (fs.lstatSync(filePath).isDirectory()) {
      fs.rmSync(filePath, { recursive: true, force: true });
      console.log(`✅ Removed directory: ${filePath}`);
    } else {
      fs.unlinkSync(filePath);
      console.log(`✅ Removed file: ${filePath}`);
    }
  }
}

// Function to check for sensitive data
function checkSensitiveFiles() {
  console.log('🔍 Checking for sensitive files...');
  
  sensitiveFiles.forEach(file => {
    if (fs.existsSync(file)) {
      console.log(`⚠️  WARNING: Sensitive file found: ${file}`);
      console.log(`   Please review and remove sensitive data before sale.`);
    }
  });
}

// Function to create necessary files
function createNecessaryFiles() {
  console.log('\n📝 Creating necessary files...');
  
  // Create .gitignore for buyer
  const gitignoreContent = `# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Expo
.expo/
dist/
web-build/

# Native
*.orig.*
*.jks
*.p8
*.p12
*.key
*.mobileprovision

# Metro
.metro-health-check*

# Debug
npm-debug.*
yarn-debug.*
yarn-error.*

# macOS
.DS_Store
*.pem

# local env files
.env*.local
.env
config/environment.js

# typescript
*.tsbuildinfo

# IDE
.vscode/
.idea/

# Build
build/
android/build/
ios/build/
`;

  fs.writeFileSync('.gitignore', gitignoreContent);
  console.log('✅ Created .gitignore');
  
  // Update package.json to remove personal info
  if (fs.existsSync('package.json')) {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    
    // Remove personal information
    delete packageJson.author;
    delete packageJson.repository;
    delete packageJson.bugs;
    delete packageJson.homepage;
    
    // Update name and description for buyer
    packageJson.name = 'smart-alarm-clock-app';
    packageJson.description = 'A modern React Native alarm clock application with mini-games and sleep tracking';
    packageJson.version = '1.0.0';
    packageJson.private = true;
    
    fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));
    console.log('✅ Updated package.json');
  }
}

// Function to create demo environment file
function createDemoEnvironment() {
  const demoEnvPath = 'config/environment.js';
  
  if (!fs.existsSync('config')) {
    fs.mkdirSync('config');
  }
  
  const demoEnvContent = `// Demo Environment Configuration
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
`;

  fs.writeFileSync(demoEnvPath, demoEnvContent);
  console.log('✅ Created demo environment.js');
}

// Main execution
function main() {
  try {
    // Clean build files and sensitive directories
    console.log('🧹 Cleaning build files and sensitive directories...');
    filesToClean.forEach(removeIfExists);
    
    // Check for sensitive files
    checkSensitiveFiles();
    
    // Create necessary files
    createNecessaryFiles();
    
    // Create demo environment
    createDemoEnvironment();
    
    console.log('\n✨ Project preparation completed!');
    console.log('\n📋 Next steps:');
    console.log('1. Review all files for any remaining sensitive data');
    console.log('2. Test the app with demo configuration');
    console.log('3. Create a ZIP file for distribution');
    console.log('4. Include README-SETUP.md and LICENSE-COMMERCIAL.md');
    console.log('\n🎉 Your project is ready for sale!');
    
  } catch (error) {
    console.error('❌ Error preparing project:', error.message);
    process.exit(1);
  }
}

// Run the script
main(); 