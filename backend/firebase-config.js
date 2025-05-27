import admin from 'firebase-admin';
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Firebase Admin SDK configuration (สำหรับ server-side)
// ข้อมูลจาก Firebase project "Lesson01"
const serviceAccount = {
  "type": "service_account",
  "project_id": "lesson01-61612",
  "private_key_id": "your-private-key-id-here",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-xxxxx@lesson01-61612.iam.gserviceaccount.com",
  "client_id": "your-client-id-here",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-xxxxx%40lesson01-61612.iam.gserviceaccount.com"
};

// Firebase Client SDK configuration (สำหรับ client-side authentication)
// ข้อมูลจาก Firebase project "Lesson01" - อัพเดทแล้ว
const firebaseConfig = {
  apiKey: "AIzaSyCrZWZYg2kId2I7ZRH4m1c_tJCKYSEsImo",
  authDomain: "lesson01-61612.firebaseapp.com",
  databaseURL: "https://lesson01-61612-default-rtdb.firebaseio.com",
  projectId: "lesson01-61612",
  storageBucket: "lesson01-61612.firebasestorage.app",
  messagingSenderId: "988759265113",
  appId: "1:988759265113:web:8c2fc5fd14d6e8ee8b0648",
  measurementId: "G-K7W8TCSBDG"
};

// Initialize Firebase Admin (เฉพาะเมื่อมี service account key ที่ถูกต้อง)
let adminDb;
try {
  if (!admin.apps.length && serviceAccount.private_key.includes('BEGIN PRIVATE KEY')) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: `https://${serviceAccount.project_id}-default-rtdb.firebaseio.com`
    });
    adminDb = admin.firestore();
    console.log('Firebase Admin initialized successfully');
  } else {
    console.log('Firebase Admin not initialized - using mock database');
    // สร้าง mock database สำหรับการทดสอบ
    adminDb = createMockFirestore();
  }
} catch (error) {
  console.log('Firebase Admin initialization failed, using mock database:', error.message);
  adminDb = createMockFirestore();
}

// Initialize Firebase Client
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Mock Firestore สำหรับการทดสอบ
function createMockFirestore() {
  const mockData = {
    users: new Map(),
    tasks: new Map(),
    sleepData: new Map(),
    gameScores: new Map(),
    games: new Map()
  };

  // เพิ่มข้อมูลเกมตัวอย่าง
  mockData.games.set('memory-game', {
    id: 'memory-game',
    name: 'Memory Game',
    description: 'เกมทดสอบความจำ',
    category: 'brain-training',
    difficulty: 'medium',
    createdAt: '2024-01-01T00:00:00Z'
  });
  
  mockData.games.set('puzzle-game', {
    id: 'puzzle-game',
    name: 'Puzzle Game',
    description: 'เกมจิ๊กซอว์',
    category: 'brain-training',
    difficulty: 'hard',
    createdAt: '2024-01-01T00:00:00Z'
  });

  return {
    collection: (name) => ({
      doc: (id) => ({
        get: async () => ({
          exists: mockData[name].has(id),
          data: () => mockData[name].get(id),
          id: id
        }),
        set: async (data) => {
          mockData[name].set(id, { ...data, id });
          return { id };
        },
        update: async (data) => {
          const existing = mockData[name].get(id) || {};
          mockData[name].set(id, { ...existing, ...data, id });
          return { id };
        },
        delete: async () => {
          mockData[name].delete(id);
          return { id };
        }
      }),
      add: async (data) => {
        const id = 'mock_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        mockData[name].set(id, { ...data, id });
        return { id };
      },
      where: (field, op, value) => ({
        orderBy: (orderField, direction) => ({
          limit: (limitNum) => ({
            get: async () => ({
              forEach: (callback) => {
                const items = Array.from(mockData[name].values())
                  .filter(item => {
                    if (op === '==') return item[field] === value;
                    if (op === '>=') return item[field] >= value;
                    if (op === '<=') return item[field] <= value;
                    return true;
                  })
                  .slice(0, limitNum);
                items.forEach(item => callback({ id: item.id, data: () => item }));
              }
            })
          }),
          get: async () => ({
            forEach: (callback) => {
              const items = Array.from(mockData[name].values())
                .filter(item => {
                  if (op === '==') return item[field] === value;
                  if (op === '>=') return item[field] >= value;
                  if (op === '<=') return item[field] <= value;
                  return true;
                });
              items.forEach(item => callback({ id: item.id, data: () => item }));
            }
          })
        }),
        get: async () => ({
          forEach: (callback) => {
            const items = Array.from(mockData[name].values())
              .filter(item => {
                if (op === '==') return item[field] === value;
                if (op === '>=') return item[field] >= value;
                if (op === '<=') return item[field] <= value;
                return true;
              });
            items.forEach(item => callback({ id: item.id, data: () => item }));
          }
        })
      }),
      get: async () => ({
        forEach: (callback) => {
          Array.from(mockData[name].values()).forEach(item => 
            callback({ id: item.id, data: () => item })
          );
        }
      })
    })
  };
}

export { admin, auth, db, adminDb };

/*
=== วิธีการตั้งค่า Firebase จริง ===

1. ไปที่ Firebase Console: https://console.firebase.google.com/
2. เลือกโปรเจกต์ "Lesson01"
3. ไปที่ Project Settings (เฟืองด้านบน)

4. ในแท็บ "Service Accounts":
   - คลิก "Generate new private key"
   - ดาวน์โหลดไฟล์ JSON
   - คัดลอกข้อมูลทั้งหมดมาแทนที่ในส่วน serviceAccount

5. ในแท็บ "General" > "Your apps":
   - คัดลอก Firebase configuration
   - แทนที่ข้อมูลใน firebaseConfig object

6. เปิดใช้งาน:
   - Authentication (ไปที่ Authentication > Sign-in method)
   - Firestore Database (ไปที่ Firestore Database > Create database)

หมายเหตุ: ตอนนี้ใช้ Mock Database สำหรับการทดสอบ
เมื่อตั้งค่า Firebase จริงแล้ว ระบบจะเปลี่ยนไปใช้ Firestore อัตโนมัติ
*/ 