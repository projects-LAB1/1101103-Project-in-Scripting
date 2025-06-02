const fs = require('fs');
const path = require('path');

// ไฟล์และโฟลเดอร์ที่จำเป็น
const essentialFiles = [
    'App.js',
    'app.json', 
    'babel.config.js',
    'index.js',
    'metro.config.js',
    'package.json',
    'README.md',
    'README-SETUP.md',
    'LICENSE-COMMERCIAL.md',
    'NAVIGATION-FIX.md'
];

const essentialFolders = [
    'components',
    'screens', 
    'navigation',
    'contexts',
    'redux',
    'utils',
    'config',
    'firebase',
    'assets/sounds',
    'assets/images'
];

// สร้างโฟลเดอร์ minimal-package
const targetDir = './minimal-package';
if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
}

// คัดลอกไฟล์จำเป็น
console.log('📁 Creating minimal package...');

essentialFiles.forEach(file => {
    const sourcePath = path.join('./temp-for-sale', file);
    const targetPath = path.join(targetDir, file);
    
    if (fs.existsSync(sourcePath)) {
        fs.copyFileSync(sourcePath, targetPath);
        console.log(`✅ Copied: ${file}`);
    } else {
        console.log(`❌ Missing: ${file}`);
    }
});

// คัดลอกโฟลเดอร์จำเป็น
function copyFolderRecursive(source, target) {
    if (!fs.existsSync(source)) {
        console.log(`❌ Missing folder: ${source}`);
        return;
    }
    
    if (!fs.existsSync(target)) {
        fs.mkdirSync(target, { recursive: true });
    }
    
    const files = fs.readdirSync(source);
    files.forEach(file => {
        const sourcePath = path.join(source, file);
        const targetPath = path.join(target, file);
        
        if (fs.statSync(sourcePath).isDirectory()) {
            copyFolderRecursive(sourcePath, targetPath);
        } else {
            fs.copyFileSync(sourcePath, targetPath);
        }
    });
}

essentialFolders.forEach(folder => {
    const sourcePath = path.join('./temp-for-sale', folder);
    const targetPath = path.join(targetDir, folder);
    
    copyFolderRecursive(sourcePath, targetPath);
    console.log(`✅ Copied folder: ${folder}`);
});

console.log('🎉 Minimal package created successfully!');
console.log('📦 Location: ./minimal-package');

// แสดงขนาดโฟลเดอร์
function getFolderSize(folderPath) {
    let totalSize = 0;
    
    function calculateSize(currentPath) {
        const stats = fs.statSync(currentPath);
        if (stats.isFile()) {
            totalSize += stats.size;
        } else if (stats.isDirectory()) {
            const files = fs.readdirSync(currentPath);
            files.forEach(file => {
                calculateSize(path.join(currentPath, file));
            });
        }
    }
    
    calculateSize(folderPath);
    return totalSize;
}

const size = getFolderSize(targetDir);
console.log(`📊 Package size: ${(size / 1024 / 1024).toFixed(2)} MB`); 