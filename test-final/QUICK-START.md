# 🚀 Quick Start Guide

## ⚡ รันแอปใน 3 ขั้นตอน

### 1. ติดตั้ง Dependencies
```bash
npm install
```

### 2. รันแอป
```bash
npm start
```

### 3. เปิดในโทรศัพท์
- สแกน QR Code ด้วยแอป Expo Go
- หรือกด `a` สำหรับ Android, `i` สำหรับ iOS

## 📱 ต้องการอะไรบ้าง

### ✅ ติดตั้งก่อนใช้งาน
```bash
# ติดตั้ง Node.js (v16+)
# ติดตั้ง Expo CLI
npm install -g @expo/cli

# ติดตั้งแอป Expo Go บนโทรศัพท์
# iOS: App Store
# Android: Google Play Store
```

### 🔧 หากมีปัญหา
```bash
# ล้าง cache
npm start -- --clear

# ติดตั้งใหม่
rm -rf node_modules
npm install
npm start
```

## 🎯 ฟีเจอร์หลัก
- ⏰ ตั้งเวลาปลุก
- 🎮 เกมมินิ (คณิตศาสตร์, จับคู่, ถ่ายรูป)
- 🔊 ไลบรารีเสียง
- 📊 ติดตามการนอน
- 🌤️ ข้อมูลสภาพอากาศ

## 🔥 Firebase (ไม่บังคับ)
หากต้องการใช้ Firebase:
1. สร้างโปรเจค Firebase
2. แก้ไข `config/environment.js`
3. ใส่ API keys ของคุณ

**แอปจะรันได้ปกติแม้ไม่มี Firebase!**

---
💡 **เคล็ดลับ:** แอปนี้ใช้ Expo ทำให้รันง่ายมาก ไม่ต้องติดตั้ง Android Studio หรือ Xcode! 