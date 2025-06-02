// clear-cache.js
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const os = require('os');

console.log('เริ่มต้นล้างแคชของแอป...');

// ล้างแคช Metro
try {
  console.log('กำลังล้างแคช Node modules...');
  const nodeModulesPath = path.join(__dirname, 'node_modules', '.cache');
  if (fs.existsSync(nodeModulesPath)) {
    fs.rmSync(nodeModulesPath, { recursive: true, force: true });
    console.log('ล้างแคช Node modules เรียบร้อยแล้ว');
  } else {
    console.log('ไม่พบโฟลเดอร์แคช Node modules');
  }
} catch (err) {
  console.error('ข้อผิดพลาดในการล้างแคช Node modules:', err);
}

// ล้างแคช Expo
try {
  const homedir = os.homedir();
  const expoCachePath = path.join(homedir, '.expo', 'cache');
  
  console.log('กำลังล้างแคช Expo ที่:', expoCachePath);
  if (fs.existsSync(expoCachePath)) {
    fs.rmSync(expoCachePath, { recursive: true, force: true });
    console.log('ล้างแคช Expo เรียบร้อยแล้ว');
  } else {
    console.log('ไม่พบโฟลเดอร์แคช Expo');
  }
} catch (err) {
  console.error('ข้อผิดพลาดในการล้างแคช Expo:', err);
}

// ล้างแคช Temp
try {
  const tempDir = os.tmpdir();
  const expoTempPath = path.join(tempDir, 'Expo');
  
  console.log('กำลังล้างไฟล์ชั่วคราวของ Expo ที่:', expoTempPath);
  if (fs.existsSync(expoTempPath)) {
    fs.rmSync(expoTempPath, { recursive: true, force: true });
    console.log('ล้างไฟล์ชั่วคราว Expo เรียบร้อยแล้ว');
  } else {
    console.log('ไม่พบโฟลเดอร์ไฟล์ชั่วคราว Expo');
  }
} catch (err) {
  console.error('ข้อผิดพลาดในการล้างไฟล์ชั่วคราว Expo:', err);
}

// ล้างแคช Metro ด้วยคำสั่ง watchman
try {
  console.log('กำลังล้างแคช Watchman...');
  execSync('watchman watch-del-all', { stdio: 'inherit' });
  console.log('ล้างแคช Watchman เรียบร้อยแล้ว');
} catch (err) {
  console.log('ไม่พบ Watchman หรือมีข้อผิดพลาดในการล้างแคช Watchman');
}

console.log('ล้างแคชเสร็จสมบูรณ์ โปรดรันคำสั่ง "npm run metro-minimal" เพื่อเริ่มแอปใหม่'); 