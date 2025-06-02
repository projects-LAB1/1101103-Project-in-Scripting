# Sleep App Backend API with Firebase

Backend API สำหรับแอป Sleep App ที่ใช้ Firebase Authentication และ Firestore Database

## Features

- 🔐 Firebase Authentication integration
- 🗄️ Firestore Database สำหรับเก็บข้อมูล
- 👤 User management with Firebase Auth
- 📝 Task management
- 🎮 Game scores tracking
- 😴 Sleep data tracking
- 🔒 JWT token verification
- 🛡️ User-specific data access control

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Firebase Configuration

1. ไปที่ [Firebase Console](https://console.firebase.google.com/)
2. สร้างโปรเจกต์ใหม่หรือเลือกโปรเจกต์ที่มีอยู่
3. เปิดใช้งาน Authentication และ Firestore Database
4. ดาวน์โหลด Service Account Key:
   - ไปที่ Project Settings > Service Accounts
   - คลิก "Generate new private key"
   - บันทึกไฟล์ JSON

5. แก้ไขไฟล์ `firebase-config.js`:
   - ใส่ข้อมูลจาก Service Account Key
   - ใส่ Firebase Config จาก Project Settings

### 3. Start Server

```bash
# Development mode
npm run dev

# Production mode
npm start
```

Server จะรันที่ `http://localhost:5000`

## Authentication

### การสมัครสมาชิก (Register)

1. ใช้ Firebase Auth ในแอปเพื่อสร้างบัญชีผู้ใช้
2. ส่ง ID Token ไปยัง `/api/auth/register` เพื่อสร้างข้อมูลผู้ใช้ใน Firestore

### การเข้าสู่ระบบ (Login)

1. ใช้ Firebase Auth ในแอปเพื่อเข้าสู่ระบบ
2. ใช้ ID Token ที่ได้รับในการเรียก API อื่นๆ

### การใช้ Token

ส่ง Firebase ID Token ใน Authorization header:

```
Authorization: Bearer <firebase-id-token>
```

## API Endpoints

### Authentication

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/register` | สร้างข้อมูลผู้ใช้ใน Firestore | ✅ |
| GET | `/api/auth/profile` | ดูข้อมูลโปรไฟล์ | ✅ |
| PUT | `/api/auth/profile` | แก้ไขข้อมูลโปรไฟล์ | ✅ |

### Users

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/users` | ดูรายชื่อผู้ใช้ทั้งหมด | ❌ |
| GET | `/api/users/:id` | ดูข้อมูลผู้ใช้ตาม ID | ❌ |

### Tasks

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/tasks` | ดูงานของผู้ใช้ | ✅ |
| POST | `/api/tasks` | สร้างงานใหม่ | ✅ |
| PUT | `/api/tasks/:id` | แก้ไขงาน | ✅ |
| DELETE | `/api/tasks/:id` | ลบงาน | ✅ |

### Games

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/games` | ดูเกมทั้งหมด | ❌ |
| GET | `/api/games/scores` | ดูคะแนนเกมของผู้ใช้ | ✅ |
| POST | `/api/games/:gameId/score` | บันทึกคะแนนเกม | ✅ |

### Sleep Data

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/sleep` | ดูข้อมูลการนอนของผู้ใช้ | ✅ |
| POST | `/api/sleep` | บันทึกข้อมูลการนอน | ✅ |
| PUT | `/api/sleep/:id` | แก้ไขข้อมูลการนอน | ✅ |
| DELETE | `/api/sleep/:id` | ลบข้อมูลการนอน | ✅ |

## การใช้งาน API

### 1. สมัครสมาชิก

```bash
# ต้องมี Firebase ID Token ก่อน
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <firebase-id-token>" \
  -d '{
    "displayName": "John Doe",
    "phoneNumber": "0812345678",
    "birthDate": "1990-01-01",
    "preferences": {
      "theme": "dark",
      "notifications": true
    }
  }'
```

### 2. สร้างงาน

```bash
curl -X POST http://localhost:5000/api/tasks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <firebase-id-token>" \
  -d '{
    "title": "ออกกำลังกาย",
    "description": "วิ่งในสวนสาธารณะ 30 นาที",
    "category": "health",
    "priority": "high",
    "dueDate": "2024-01-15T18:00:00Z"
  }'
```

### 3. บันทึกข้อมูลการนอน

```bash
curl -X POST http://localhost:5000/api/sleep \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <firebase-id-token>" \
  -d '{
    "bedTime": "2024-01-14T22:30:00Z",
    "wakeTime": "2024-01-15T06:30:00Z",
    "quality": 4,
    "notes": "นอนหลับสบาย",
    "durationMinutes": 480
  }'
```

### 4. บันทึกคะแนนเกม

```bash
curl -X POST http://localhost:5000/api/games/memory-game/score \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <firebase-id-token>" \
  -d '{
    "score": 1250,
    "level": 5,
    "duration": 180,
    "metadata": {
      "difficulty": "hard",
      "mistakes": 2
    }
  }'
```

## Firestore Collections

### users
```javascript
{
  uid: string,
  email: string,
  displayName: string,
  phoneNumber: string,
  birthDate: string,
  preferences: object,
  emailVerified: boolean,
  createdAt: string,
  updatedAt: string
}
```

### tasks
```javascript
{
  userId: string,
  title: string,
  description: string,
  category: string,
  priority: string,
  completed: boolean,
  dueDate: string,
  createdAt: string,
  updatedAt: string
}
```

### sleepData
```javascript
{
  userId: string,
  bedTime: string,
  wakeTime: string,
  durationMinutes: number,
  quality: number,
  notes: string,
  createdAt: string,
  updatedAt: string
}
```

### gameScores
```javascript
{
  userId: string,
  gameId: string,
  score: number,
  level: number,
  duration: number,
  metadata: object,
  createdAt: string
}
```

## Security

- ✅ Firebase Authentication verification
- ✅ User-specific data access control
- ✅ Input validation
- ✅ Error handling
- ✅ CORS enabled

## Error Responses

```javascript
{
  "error": "Error type",
  "message": "Detailed error message"
}
```

## Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `500` - Internal Server Error 