// metro.minimal.config.js - คอนฟิกขั้นต่ำสำหรับ Metro Bundler
const { getDefaultConfig } = require("expo/metro-config");

// กำหนดค่าเริ่มต้น
const config = getDefaultConfig(__dirname);

// ไม่มีการตั้งค่าเพิ่มเติมใดๆ เพื่อลดความเสี่ยงที่จะเกิดข้อผิดพลาด
// ใช้เฉพาะเมื่อต้องการแก้ไขปัญหา bundling

module.exports = config; 