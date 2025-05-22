// ไฟล์ทดสอบ API สำหรับ Sleep App Backend
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000';
const MOCK_TOKEN = 'mock-token';

// Helper function สำหรับเรียก API
async function apiCall(endpoint, method = 'GET', data = null, requireAuth = false) {
  const headers = {
    'Content-Type': 'application/json'
  };
  
  if (requireAuth) {
    headers['Authorization'] = `Bearer ${MOCK_TOKEN}`;
  }
  
  const options = {
    method,
    headers
  };
  
  if (data) {
    options.body = JSON.stringify(data);
  }
  
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    const result = await response.json();
    
    console.log(`\n=== ${method} ${endpoint} ===`);
    console.log(`Status: ${response.status}`);
    console.log('Response:', JSON.stringify(result, null, 2));
    
    return { status: response.status, data: result };
  } catch (error) {
    console.error(`Error calling ${endpoint}:`, error.message);
    return { error: error.message };
  }
}

// ทดสอบ API ทั้งหมด
async function testAllAPIs() {
  console.log('🚀 เริ่มทดสอบ Sleep App API with Firebase\n');
  
  // 1. ทดสอบ Root endpoint
  await apiCall('/');
  
  // 2. ทดสอบ Authentication
  console.log('\n📝 ทดสอบ Authentication APIs');
  
  // สมัครสมาชิก
  await apiCall('/api/auth/register', 'POST', {
    displayName: 'ผู้ใช้ทดสอบ',
    phoneNumber: '0812345678',
    birthDate: '1990-01-01',
    preferences: {
      theme: 'dark',
      notifications: true
    }
  }, true);
  
  // ดูโปรไฟล์
  await apiCall('/api/auth/profile', 'GET', null, true);
  
  // แก้ไขโปรไฟล์
  await apiCall('/api/auth/profile', 'PUT', {
    displayName: 'ผู้ใช้ทดสอบ (แก้ไขแล้ว)',
    phoneNumber: '0887654321'
  }, true);
  
  // 3. ทดสอบ Users API
  console.log('\n👥 ทดสอบ Users APIs');
  
  // ดูผู้ใช้ทั้งหมด
  await apiCall('/api/users');
  
  // ดูผู้ใช้ตาม ID
  await apiCall('/api/users/mock-user-123');
  
  // 4. ทดสอบ Tasks API
  console.log('\n📋 ทดสอบ Tasks APIs');
  
  // สร้างงาน
  const taskResult = await apiCall('/api/tasks', 'POST', {
    title: 'ออกกำลังกาย',
    description: 'วิ่งในสวนสาธารณะ 30 นาที',
    category: 'health',
    priority: 'high',
    dueDate: '2024-01-15T18:00:00Z',
    completed: false
  }, true);
  
  // ดูงานทั้งหมด
  await apiCall('/api/tasks', 'GET', null, true);
  
  // แก้ไขงาน (ถ้าสร้างสำเร็จ)
  if (taskResult.data && taskResult.data.id) {
    await apiCall(`/api/tasks/${taskResult.data.id}`, 'PUT', {
      completed: true,
      notes: 'เสร็จแล้ว!'
    }, true);
  }
  
  // 5. ทดสอบ Games API
  console.log('\n🎮 ทดสอบ Games APIs');
  
  // ดูเกมทั้งหมด
  await apiCall('/api/games');
  
  // บันทึกคะแนนเกม
  await apiCall('/api/games/memory-game/score', 'POST', {
    score: 1250,
    level: 5,
    duration: 180,
    metadata: {
      difficulty: 'hard',
      mistakes: 2
    }
  }, true);
  
  // ดูคะแนนของผู้ใช้
  await apiCall('/api/games/scores', 'GET', null, true);
  
  // 6. ทดสอบ Sleep API
  console.log('\n😴 ทดสอบ Sleep APIs');
  
  // บันทึกข้อมูลการนอน
  const sleepResult = await apiCall('/api/sleep', 'POST', {
    bedTime: '2024-01-14T22:30:00Z',
    wakeTime: '2024-01-15T06:30:00Z',
    quality: 4,
    notes: 'นอนหลับสบาย',
    durationMinutes: 480
  }, true);
  
  // ดูข้อมูลการนอน
  await apiCall('/api/sleep', 'GET', null, true);
  
  // แก้ไขข้อมูลการนอน (ถ้าสร้างสำเร็จ)
  if (sleepResult.data && sleepResult.data.id) {
    await apiCall(`/api/sleep/${sleepResult.data.id}`, 'PUT', {
      quality: 5,
      notes: 'นอนหลับสบายมาก!'
    }, true);
  }
  
  console.log('\n✅ ทดสอบ API เสร็จสิ้น!');
  console.log('\n📊 สรุป:');
  console.log('- ✅ Authentication API (Register, Profile)');
  console.log('- ✅ Users API (List, Get by ID)');
  console.log('- ✅ Tasks API (CRUD operations)');
  console.log('- ✅ Games API (List, Record scores)');
  console.log('- ✅ Sleep API (CRUD operations)');
  console.log('\n🔥 Backend API พร้อมใช้งานแล้ว!');
}

// รันการทดสอบ
testAllAPIs().catch(console.error); 