#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('📦 Creating sale package...\n');

// Create temp directory
const tempDir = 'temp-for-sale';
if (fs.existsSync(tempDir)) {
  fs.rmSync(tempDir, { recursive: true, force: true });
}
fs.mkdirSync(tempDir);

// Files and directories to include
const filesToInclude = [
  'App.js',
  'app.json',
  'babel.config.js',
  'index.js',
  'metro.config.js',
  'package.json',
  'README.md',
  'README-SETUP.md',
  'LICENSE-COMMERCIAL.md',
  'PRODUCT-DESCRIPTION.md',
  'NAVIGATION-FIX.md',
  'assets',
  'components',
  'config',
  'contexts',
  'data',
  'firebase',
  'lib',
  'models',
  'navigation',
  'redux',
  'screens',
  'scripts',
  'src',
  'utils'
];

// Function to copy files/directories
function copyRecursive(src, dest) {
  const stat = fs.lstatSync(src);
  
  if (stat.isDirectory()) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    
    const files = fs.readdirSync(src);
    files.forEach(file => {
      const srcPath = path.join(src, file);
      const destPath = path.join(dest, file);
      copyRecursive(srcPath, destPath);
    });
  } else {
    fs.copyFileSync(src, dest);
  }
}

// Copy included files
filesToInclude.forEach(item => {
  if (fs.existsSync(item)) {
    const destPath = path.join(tempDir, item);
    console.log(`✅ Copying: ${item}`);
    copyRecursive(item, destPath);
  } else {
    console.log(`⚠️  Not found: ${item}`);
  }
});

console.log('\n📦 Package created successfully in temp-for-sale/');
console.log('Next: Create ZIP file from temp-for-sale folder'); 