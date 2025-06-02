# คู่มือการอัปโหลดไฟล์สำหรับขาย Smart Alarm Clock App

## 📋 รายการไฟล์ที่ต้องเตรียม

### 1. ชื่อสินค้า (สูงสุด 100 ตัวอักษร)
```
Smart Alarm Clock App - React Native Source Code with Mini-Games & Sleep Tracking
```

### 2. คำอธิบายสินค้า
ใช้เนื้อหาจากไฟล์ `PRODUCT-DESCRIPTION.md`

### 3. ไฟล์ที่ต้องอัปโหลด

#### 📁 ไฟล์หลัก (ZIP - สำหรับผู้ซื้อ)
- **ไฟล์**: `Smart-Alarm-Clock-App-Source-Code.zip`
- **ขนาด**: ประมาณ 2-5 MB
- **เนื้อหา**: โค้ดทั้งหมด, เอกสาร, ไฟล์ config ตัวอย่าง

#### 🖼️ ภาพย่อ (Thumbnail)
- **ขนาด**: 80x80 พิกเซล
- **รูปแบบ**: JPEG หรือ PNG
- **วิธีสร้าง**: 
  1. เปิดไฟล์ `create-thumbnail.html` ในเบราว์เซอร์
  2. จับภาพหน้าจอบริเวณ thumbnail (80x80 พิกเซล)
  3. บันทึกเป็น `thumbnail.png`

#### 🖼️ ภาพตัวอย่างแบบอินไลน์
- **ขนาด**: 590x300 พิกเซล
- **รูปแบบ**: JPEG หรือ PNG
- **วิธีสร้าง**:
  1. เปิดไฟล์ `create-preview.html` ในเบราว์เซอร์
  2. จับภาพหน้าจอบริเวณ preview container (590x300 พิกเซล)
  3. บันทึกเป็น `preview-inline.png`

#### 📱 ตัวอย่างการดูตัวอย่างสด (Live Preview)
- **ไฟล์**: `Live-Preview-Demo.zip`
- **เนื้อหา**: ไฟล์ `index.html` และไฟล์สนับสนุน
- **คำอธิบาย**: Demo แบบ interactive ที่แสดงฟีเจอร์หลักของแอป

#### 📸 ภาพหน้าจอตัวอย่าง (Screenshots)
สร้างภาพหน้าจอจากแอปจริง:
- หน้าหลัก (Alarm List)
- หน้าตั้งปลุก (Add Alarm)
- หน้าเกม (Mini-Games)
- หน้าเสียง (Sound Picker)
- หน้าสถิติการนอน (Sleep Analytics)

บันทึกเป็น ZIP ไฟล์ชื่อ `Screenshots.zip`

## 🔧 ขั้นตอนการเตรียมไฟล์

### 1. เตรียมโค้ดให้พร้อม
```bash
npm run prepare-for-sale
node scripts/create-sale-package.js
```

### 2. สร้างไฟล์ ZIP หลัก
ไฟล์ `Smart-Alarm-Clock-App-Source-Code.zip` ถูกสร้างแล้ว

### 3. สร้างภาพต่างๆ
- เปิด `create-thumbnail.html` → จับภาพ 80x80
- เปิด `create-preview.html` → จับภาพ 590x300
- รันแอปจริง → จับภาพหน้าจอต่างๆ

### 4. เตรียม Live Preview
ไฟล์ `Live-Preview-Demo.zip` ถูกสร้างแล้ว

## 📝 ข้อมูลสำหรับการขาย

### หมวดหมู่ที่แนะนำ
- Mobile Apps
- React Native
- Source Code
- Alarm Clock
- Productivity Apps

### แท็กที่แนะนำ
```
react-native, alarm-clock, mobile-app, source-code, mini-games, 
sleep-tracking, firebase, cross-platform, ios, android, 
javascript, expo, redux, navigation, notifications
```

### ราคาที่แนะนำ
- **Regular License**: $29-49
- **Extended License**: $149-199

### คุณสมบัติเด่น
- ✅ Complete source code
- ✅ Commercial license included
- ✅ Cross-platform (iOS & Android)
- ✅ Modern React Native architecture
- ✅ Firebase integration ready
- ✅ Mini-games for alarm dismissal
- ✅ Sleep tracking & analytics
- ✅ Custom sound management
- ✅ Well-documented code
- ✅ Easy to customize

## ⚠️ สิ่งที่ต้องตรวจสอบก่อนอัปโหลด

### ✅ Checklist
- [ ] ลบข้อมูลส่วนตัวทั้งหมด (API keys, Firebase config)
- [ ] ทดสอบว่าโค้ดทำงานได้จริง
- [ ] ตรวจสอบไฟล์ ZIP ว่าไม่มีไฟล์ที่ไม่ต้องการ
- [ ] อ่านเอกสารทั้งหมดให้ครบถ้วน
- [ ] ตรวจสอบ license ให้ถูกต้อง
- [ ] ทดสอบ Live Preview ใน browser
- [ ] ตรวจสอบขนาดภาพให้ตรงตามที่กำหนด

### 🚫 สิ่งที่ต้องหลีกเลี่ยง
- ❌ อัปโหลดไฟล์ที่มี node_modules
- ❌ รวมไฟล์ .git หรือ build files
- ❌ ใส่ข้อมูลส่วนตัวในโค้ด
- ❌ ใช้ภาพที่มี copyright
- ❌ คำอธิบายที่เกินจริง

## 📞 หากมีปัญหา

### ปัญหาที่พบบ่อย
1. **ไฟล์ ZIP ใหญ่เกินไป**: ลบ node_modules และไฟล์ build
2. **ภาพไม่ชัด**: ใช้ความละเอียดสูงกว่าที่กำหนด แล้วย่อลง
3. **Live Preview ไม่ทำงาน**: ตรวจสอบ path ของไฟล์ให้ถูกต้อง

### การติดต่อ
หากมีปัญหาในการอัปโหลด สามารถใช้บริการ FTP ของเว็บไซต์สำหรับไฟล์ขนาดใหญ่

---

**หมายเหตุ**: คู่มือนี้จัดทำขึ้นเพื่อช่วยในการเตรียมไฟล์สำหรับขายบนเว็บไซต์ขายโค้ด ให้ปฏิบัติตามข้อกำหนดของแต่ละเว็บไซต์ 