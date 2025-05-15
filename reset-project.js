// reset-project.js - สคริปต์สำหรับติดตั้งโปรเจคใหม่ทั้งหมด
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('=== โปรแกรมรีเซ็ตโปรเจค Expo ===');
console.log('คำเตือน: สคริปต์นี้จะลบโฟลเดอร์ node_modules และไฟล์แคชทั้งหมด');
console.log('แล้วติดตั้งแพ็คเกจใหม่ทั้งหมด\n');

rl.question('กด Y เพื่อดำเนินการต่อ หรือ N เพื่อยกเลิก: ', (answer) => {
  if (answer.toLowerCase() !== 'y') {
    console.log('ยกเลิกการรีเซ็ตโปรเจค');
    rl.close();
    return;
  }

  console.log('\n[1/7] กำลังลบโฟลเดอร์ node_modules...');
  try {
    if (fs.existsSync(path.join(__dirname, 'node_modules'))) {
      if (process.platform === 'win32') {
        // บน Windows ใช้ cmd พร้อมกับ /s /q เพื่อลบแบบเงียบและรวมโฟลเดอร์ย่อย
        execSync('rmdir /s /q node_modules', { stdio: 'inherit' });
      } else {
        // บน Linux/Mac ใช้ rm -rf
        execSync('rm -rf node_modules', { stdio: 'inherit' });
      }
    }
    console.log('✅ ลบโฟลเดอร์ node_modules เรียบร้อยแล้ว');
  } catch (err) {
    console.error('❌ เกิดข้อผิดพลาดในการลบโฟลเดอร์ node_modules:', err.message);
  }

  console.log('\n[2/7] กำลังลบไฟล์ package-lock.json...');
  try {
    if (fs.existsSync(path.join(__dirname, 'package-lock.json'))) {
      fs.unlinkSync(path.join(__dirname, 'package-lock.json'));
    }
    console.log('✅ ลบไฟล์ package-lock.json เรียบร้อยแล้ว');
  } catch (err) {
    console.error('❌ เกิดข้อผิดพลาดในการลบไฟล์ package-lock.json:', err.message);
  }

  console.log('\n[3/7] กำลังล้างแคช npm...');
  try {
    execSync('npm cache clean --force', { stdio: 'inherit' });
    console.log('✅ ล้างแคช npm เรียบร้อยแล้ว');
  } catch (err) {
    console.error('❌ เกิดข้อผิดพลาดในการล้างแคช npm:', err.message);
  }

  console.log('\n[4/7] กำลังล้างแคช Expo...');
  try {
    const homedir = os.homedir();
    const expoCachePath = path.join(homedir, '.expo', 'cache');
    if (fs.existsSync(expoCachePath)) {
      if (process.platform === 'win32') {
        execSync(`rmdir /s /q "${expoCachePath}"`, { stdio: 'inherit' });
      } else {
        execSync(`rm -rf "${expoCachePath}"`, { stdio: 'inherit' });
      }
    }
    console.log('✅ ล้างแคช Expo เรียบร้อยแล้ว');
  } catch (err) {
    console.error('❌ เกิดข้อผิดพลาดในการล้างแคช Expo:', err.message);
  }

  console.log('\n[5/7] กำลังติดตั้ง npm แบบทั่วไป...');
  try {
    execSync('npm install', { stdio: 'inherit' });
    console.log('✅ ติดตั้ง npm แบบทั่วไปเรียบร้อยแล้ว');
  } catch (err) {
    console.error('❌ เกิดข้อผิดพลาดในการติดตั้ง npm:', err.message);
    rl.close();
    return;
  }

  console.log('\n[6/7] กำลังติดตั้ง Expo CLI...');
  try {
    execSync('npm install -g expo-cli', { stdio: 'inherit' });
    console.log('✅ ติดตั้ง Expo CLI เรียบร้อยแล้ว');
  } catch (err) {
    console.error('⚠️ ไม่สามารถติดตั้ง Expo CLI ได้ แต่อาจไม่จำเป็น:', err.message);
  }

  console.log('\n[7/7] กำลังตรวจสอบการติดตั้ง...');
  try {
    execSync('expo --version', { stdio: 'inherit' });
    console.log('✅ Expo พร้อมใช้งาน');
  } catch (err) {
    console.error('⚠️ ไม่สามารถตรวจสอบเวอร์ชัน Expo ได้:', err.message);
  }

  console.log('\n✅ การรีเซ็ตโปรเจคเสร็จสมบูรณ์!');
  console.log('\nคำสั่งสำหรับรันโปรเจค:');
  console.log('  npm start');
  console.log('\nหากยังมีปัญหา ให้ลองคำสั่ง:');
  console.log('  npx expo start --clear');

  rl.close();
}); 