// faststart.js - สคริปต์สำหรับการเริ่มต้นแอพอย่างรวดเร็ว
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const os = require('os');

console.log('📱 เริ่มต้นแอพแบบเร็วขึ้น...');

// ล้างแคชที่สำคัญ
try {
  // ล้างแคช Metro ซึ่งมักเป็นปัญหาใหญ่
  const nodeModulesPath = path.join(__dirname, 'node_modules', '.cache');
  if (fs.existsSync(nodeModulesPath)) {
    console.log('🧹 กำลังล้างแคช Metro...');
    fs.rmSync(nodeModulesPath, { recursive: true, force: true });
  }

  // ล้างแคช Expo ที่อาจค้างอยู่
  const homedir = os.homedir();
  const expoCachePath = path.join(homedir, '.expo', 'cache');
  if (fs.existsSync(expoCachePath)) {
    console.log('🧹 กำลังล้างแคช Expo...');
    fs.rmSync(expoCachePath, { recursive: true, force: true });
  }
} catch (err) {
  console.error('เกิดข้อผิดพลาดในการล้างแคช:', err);
}

// เริ่มแอพด้วยโหมดที่เร็วที่สุด
try {
  console.log('🚀 กำลังเริ่มแอพในโหมดเร็ว...');
  console.log('✨ Metro จะเริ่มทำงานในไม่กี่วินาที...');
  
  // ใช้ execSync เพื่อเริ่ม expo ด้วยตัวเลือกที่เร็วขึ้น
  execSync('expo start --no-dev --minify', { 
    stdio: 'inherit',
    env: {
      ...process.env,
      EXPO_BUNDLER_WORKER_COUNT: '4' // เพิ่มจำนวน worker เพื่อเร่งความเร็ว
    }
  });
} catch (err) {
  console.error('เกิดข้อผิดพลาดในการเริ่มแอพ:', err);
} 