import admin from 'firebase-admin';
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Firebase Admin SDK configuration (สำหรับ server-side)
// ดาวน์โหลด service account key จาก Firebase Console
// Project Settings > Service Accounts > Generate new private key
const serviceAccount = {
  "type": "service_account",
  "project_id": "your-project-id", // เปลี่ยนเป็น project ID ของคุณ
  "private_key_id": "your-private-key-id",
  "private_key": "-----BEGIN PRIVATE KEY-----\nyour-private-key\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com",
  "client_id": "your-client-id",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-xxxxx%40your-project-id.iam.gserviceaccount.com"
};

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://your-project-id-default-rtdb.firebaseio.com" // เปลี่ยนเป็น URL ของคุณ
  });
}

// Firebase Client SDK configuration (สำหรับ client-side authentication)
// ได้จาก Project Settings > General > Your apps > Web app
const firebaseConfig = {
  apiKey: "your-api-key", // เปลี่ยนเป็น API key ของคุณ
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id"
};

// Initialize Firebase Client
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Admin Firestore
const adminDb = admin.firestore();

export { admin, auth, db, adminDb };

/*
วิธีการตั้งค่า:

1. ไปที่ Firebase Console (https://console.firebase.google.com/)
2. เลือกโปรเจกต์ของคุณ
3. ไปที่ Project Settings (เฟืองด้านบน)
4. ในแท็บ General:
   - คัดลอก Firebase configuration สำหรับ Web app
   - ใส่ใน firebaseConfig object
5. ในแท็บ Service Accounts:
   - คลิก "Generate new private key"
   - ดาวน์โหลดไฟล์ JSON
   - คัดลอกข้อมูลใส่ใน serviceAccount object
6. เปลี่ยนชื่อไฟล์นี้เป็น firebase-config.js
7. เปิดใช้งาน Authentication และ Firestore ใน Firebase Console

หมายเหตุ: อย่าเผยแพร่ไฟล์ firebase-config.js ใน Git repository
เพิ่ม firebase-config.js ใน .gitignore
*/ 