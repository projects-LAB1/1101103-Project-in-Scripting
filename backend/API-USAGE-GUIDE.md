# 📚 คู่มือการใช้งาน Sleep App API

## 🚀 การเริ่มต้น

### 1. รัน Server
```bash
cd backend
npm install
npm run dev
```

Server จะรันที่: `http://localhost:5000`

### 2. การทดสอบ API
```bash
node test-api.js
```

## 🔐 Authentication

### การใช้ Token
ส่ง token ใน Authorization header:
```
Authorization: Bearer <token>
```

**สำหรับการทดสอบ:** ใช้ `mock-token`
**สำหรับ Firebase จริง:** ใช้ Firebase ID Token

## 📋 API Endpoints

### 🏠 Root Endpoint
```
GET /
```
**Response:**
```json
{
  "message": "Sleep App API with Firebase",
  "version": "2.0.0",
  "endpoints": {
    "auth": "/api/auth/*",
    "users": "/api/users",
    "tasks": "/api/tasks",
    "games": "/api/games",
    "sleep": "/api/sleep"
  }
}
```

---

### 👤 Authentication APIs

#### สมัครสมาชิก
```
POST /api/auth/register
Authorization: Bearer <firebase-id-token>
Content-Type: application/json
```

**Body:**
```json
{
  "displayName": "ชื่อผู้ใช้",
  "phoneNumber": "0812345678",
  "birthDate": "1990-01-01",
  "preferences": {
    "theme": "dark",
    "notifications": true
  }
}
```

**Response:**
```json
{
  "message": "User registered successfully",
  "user": {
    "uid": "user-id",
    "email": "user@example.com",
    "displayName": "ชื่อผู้ใช้",
    "phoneNumber": "0812345678",
    "birthDate": "1990-01-01",
    "preferences": {
      "theme": "dark",
      "notifications": true
    },
    "emailVerified": true,
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
}
```

#### ดูโปรไฟล์
```
GET /api/auth/profile
Authorization: Bearer <firebase-id-token>
```

#### แก้ไขโปรไฟล์
```
PUT /api/auth/profile
Authorization: Bearer <firebase-id-token>
Content-Type: application/json
```

**Body:**
```json
{
  "displayName": "ชื่อใหม่",
  "phoneNumber": "0887654321"
}
```

---

### 👥 Users APIs

#### ดูผู้ใช้ทั้งหมด
```
GET /api/users
```

**Response:**
```json
[
  {
    "uid": "user-id",
    "displayName": "ชื่อผู้ใช้",
    "email": "user@example.com",
    "createdAt": "2024-01-01T00:00:00Z"
  }
]
```

#### ดูผู้ใช้ตาม ID
```
GET /api/users/{userId}
```

---

### 📋 Tasks APIs

#### ดูงานทั้งหมดของผู้ใช้
```
GET /api/tasks
Authorization: Bearer <firebase-id-token>
```

#### สร้างงานใหม่
```
POST /api/tasks
Authorization: Bearer <firebase-id-token>
Content-Type: application/json
```

**Body:**
```json
{
  "title": "ออกกำลังกาย",
  "description": "วิ่งในสวนสาธารณะ 30 นาที",
  "category": "health",
  "priority": "high",
  "dueDate": "2024-01-15T18:00:00Z",
  "completed": false
}
```

**Response:**
```json
{
  "id": "task-id",
  "title": "ออกกำลังกาย",
  "description": "วิ่งในสวนสาธารณะ 30 นาที",
  "category": "health",
  "priority": "high",
  "dueDate": "2024-01-15T18:00:00Z",
  "completed": false,
  "userId": "user-id",
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z"
}
```

#### แก้ไขงาน
```
PUT /api/tasks/{taskId}
Authorization: Bearer <firebase-id-token>
Content-Type: application/json
```

**Body:**
```json
{
  "completed": true,
  "notes": "เสร็จแล้ว!"
}
```

#### ลบงาน
```
DELETE /api/tasks/{taskId}
Authorization: Bearer <firebase-id-token>
```

---

### 🎮 Games APIs

#### ดูเกมทั้งหมด
```
GET /api/games
```

**Response:**
```json
[
  {
    "id": "memory-game",
    "name": "Memory Game",
    "description": "เกมทดสอบความจำ",
    "category": "brain-training",
    "difficulty": "medium",
    "createdAt": "2024-01-01T00:00:00Z"
  }
]
```

#### ดูคะแนนเกมของผู้ใช้
```
GET /api/games/scores
Authorization: Bearer <firebase-id-token>
```

#### บันทึกคะแนนเกม
```
POST /api/games/{gameId}/score
Authorization: Bearer <firebase-id-token>
Content-Type: application/json
```

**Body:**
```json
{
  "score": 1250,
  "level": 5,
  "duration": 180,
  "metadata": {
    "difficulty": "hard",
    "mistakes": 2
  }
}
```

**Response:**
```json
{
  "id": "score-id",
  "userId": "user-id",
  "gameId": "memory-game",
  "score": 1250,
  "level": 5,
  "duration": 180,
  "metadata": {
    "difficulty": "hard",
    "mistakes": 2
  },
  "createdAt": "2024-01-01T00:00:00Z"
}
```

---

### 😴 Sleep APIs

#### ดูข้อมูลการนอนของผู้ใช้
```
GET /api/sleep
Authorization: Bearer <firebase-id-token>
```

**Query Parameters:**
- `startDate`: วันที่เริ่มต้น (ISO string)
- `endDate`: วันที่สิ้นสุด (ISO string)
- `limit`: จำนวนข้อมูลสูงสุด (default: 30)

#### บันทึกข้อมูลการนอน
```
POST /api/sleep
Authorization: Bearer <firebase-id-token>
Content-Type: application/json
```

**Body:**
```json
{
  "bedTime": "2024-01-14T22:30:00Z",
  "wakeTime": "2024-01-15T06:30:00Z",
  "quality": 4,
  "notes": "นอนหลับสบาย",
  "durationMinutes": 480
}
```

**Response:**
```json
{
  "id": "sleep-id",
  "bedTime": "2024-01-14T22:30:00Z",
  "wakeTime": "2024-01-15T06:30:00Z",
  "quality": 4,
  "notes": "นอนหลับสบาย",
  "durationMinutes": 480,
  "userId": "user-id",
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z"
}
```

#### แก้ไขข้อมูลการนอน
```
PUT /api/sleep/{sleepId}
Authorization: Bearer <firebase-id-token>
Content-Type: application/json
```

**Body:**
```json
{
  "quality": 5,
  "notes": "นอนหลับสบายมาก!"
}
```

#### ลบข้อมูลการนอน
```
DELETE /api/sleep/{sleepId}
Authorization: Bearer <firebase-id-token>
```

---

## 🧪 ตัวอย่างการใช้งาน

### JavaScript/React Native
```javascript
// สมัครสมาชิก
const registerUser = async (firebaseToken, userData) => {
  const response = await fetch('http://localhost:5000/api/auth/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${firebaseToken}`
    },
    body: JSON.stringify(userData)
  });
  
  return await response.json();
};

// สร้างงาน
const createTask = async (firebaseToken, taskData) => {
  const response = await fetch('http://localhost:5000/api/tasks', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${firebaseToken}`
    },
    body: JSON.stringify(taskData)
  });
  
  return await response.json();
};

// บันทึกข้อมูลการนอน
const recordSleep = async (firebaseToken, sleepData) => {
  const response = await fetch('http://localhost:5000/api/sleep', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${firebaseToken}`
    },
    body: JSON.stringify(sleepData)
  });
  
  return await response.json();
};
```

### cURL Examples
```bash
# สมัครสมาชิก
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer mock-token" \
  -d '{
    "displayName": "ทดสอบ",
    "phoneNumber": "0812345678"
  }'

# สร้างงาน
curl -X POST http://localhost:5000/api/tasks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer mock-token" \
  -d '{
    "title": "ออกกำลังกาย",
    "description": "วิ่ง 30 นาที",
    "category": "health",
    "priority": "high"
  }'

# บันทึกการนอน
curl -X POST http://localhost:5000/api/sleep \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer mock-token" \
  -d '{
    "bedTime": "2024-01-14T22:30:00Z",
    "wakeTime": "2024-01-15T06:30:00Z",
    "quality": 4,
    "notes": "นอนหลับสบาย"
  }'
```

---

## ⚠️ Error Responses

### 401 Unauthorized
```json
{
  "error": "Unauthorized",
  "message": "No token provided or invalid format"
}
```

### 403 Forbidden
```json
{
  "error": "Access denied"
}
```

### 404 Not Found
```json
{
  "error": "User not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Failed to create task"
}
```

---

## 🔧 การตั้งค่า Firebase จริง

1. ไปที่ [Firebase Console](https://console.firebase.google.com/)
2. เลือกโปรเจกต์ "Lesson01"
3. เปิดใช้งาน Authentication และ Firestore Database
4. ดาวน์โหลด Service Account Key
5. แก้ไขไฟล์ `firebase-config.js`
6. แทนที่ mock token ด้วย Firebase ID Token จริง

---

## 📊 สถานะปัจจุบัน

✅ **ใช้งานได้แล้ว:**
- Authentication API (Register, Profile)
- Users API (List, Get by ID)
- Tasks API (CRUD operations)
- Games API (List, Record scores)
- Sleep API (CRUD operations)
- Mock Database สำหรับการทดสอบ
- Firebase integration พร้อม

🔄 **พร้อมอัปเกรด:**
- เชื่อมต่อ Firebase จริงเมื่อพร้อม
- เพิ่ม validation และ security rules
- เพิ่ม API endpoints ตามต้องการ

🎉 **Backend API พร้อมใช้งานสำหรับ React Native App แล้ว!** 