// optimizeAssets.js - ปรับแต่งทรัพยากรแอพให้ทำงานได้เร็วขึ้น
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('📝 เริ่มการปรับแต่งแอพเพื่อเพิ่มความเร็ว...');

// ปรับแต่ง babel.config.js เพื่อลดเวลาในการ transpile
try {
  const babelConfigPath = path.join(__dirname, 'babel.config.js');
  
  if (!fs.existsSync(babelConfigPath)) {
    console.log('🔧 กำลังสร้างไฟล์ babel.config.js ที่เหมาะสม...');
    
    // สร้าง babel config ที่เร็วขึ้น
    const optimizedBabelConfig = `module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // เพิ่มการทำ constant folding เพื่อเพิ่มความเร็ว
      ['transform-remove-console', { exclude: ['error', 'warn'] }]
    ]
  };
};`;
    
    fs.writeFileSync(babelConfigPath, optimizedBabelConfig);
    console.log('✅ สร้าง babel.config.js เสร็จเรียบร้อย');
  }
} catch (err) {
  console.error('❌ เกิดข้อผิดพลาดในการปรับแต่ง babel.config.js:', err);
}

// ตรวจสอบว่ามีไฟล์ metro.config.js ที่เหมาะสมหรือไม่
try {
  const metroConfigPath = path.join(__dirname, 'metro.config.js');
  
  if (fs.existsSync(metroConfigPath)) {
    console.log('🔍 ตรวจสอบ metro.config.js...');
    
    // อ่านไฟล์ปัจจุบัน
    const currentConfig = fs.readFileSync(metroConfigPath, 'utf8');
    
    // ตรวจสอบว่ามีการตั้งค่า maxWorkers หรือไม่
    if (!currentConfig.includes('maxWorkers')) {
      console.log('🔧 เพิ่มการตั้งค่า maxWorkers เพื่อเร่งความเร็ว...');
      
      // ปรับปรุงคอนฟิก
      const updatedConfig = currentConfig.replace(
        'const config = getDefaultConfig(__dirname);',
        'const config = getDefaultConfig(__dirname);\n// เพิ่มความเร็วในการ bundle\nconfig.maxWorkers = 4;'
      );
      
      fs.writeFileSync(metroConfigPath, updatedConfig);
      console.log('✅ ปรับปรุง metro.config.js เสร็จเรียบร้อย');
    }
  }
} catch (err) {
  console.error('❌ เกิดข้อผิดพลาดในการปรับแต่ง metro.config.js:', err);
}

// ติดตั้ง package ที่ช่วยในการทำงานเร็วขึ้น
try {
  console.log('📦 ตรวจสอบ package ที่จำเป็น...');
  
  // ดำเนินการติดตั้งแพ็คเกจ babel-plugin-transform-remove-console ถ้ายังไม่มี
  try {
    require.resolve('babel-plugin-transform-remove-console');
    console.log('✅ พบแพ็คเกจ babel-plugin-transform-remove-console แล้ว');
  } catch (e) {
    console.log('📦 กำลังติดตั้ง babel-plugin-transform-remove-console...');
    execSync('npm install --save-dev babel-plugin-transform-remove-console', { stdio: 'inherit' });
  }
} catch (err) {
  console.error('❌ เกิดข้อผิดพลาดในการติดตั้งแพ็คเกจ:', err);
}

console.log('🎉 ปรับแต่งแอพเสร็จสมบูรณ์!');
console.log('📱 คุณสามารถใช้คำสั่ง "npm run fast" เพื่อเริ่มแอพได้เร็วขึ้น'); 