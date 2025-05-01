// ไฟล์ทดสอบการเชื่อมต่อ MongoDB
import { connectToMongoDB, isConnected } from './config/mongoConfig.js';

// ทดสอบเชื่อมต่อ MongoDB
const testConnection = async () => {
  console.log('กำลังทดสอบการเชื่อมต่อกับ MongoDB...');
  
  try {
    const connected = await connectToMongoDB();
    
    if (connected) {
      console.log('✅ เชื่อมต่อกับ MongoDB สำเร็จ!');
    } else {
      console.log('❌ ไม่สามารถเชื่อมต่อกับ MongoDB ได้');
    }
    
    // ตรวจสอบสถานะการเชื่อมต่ออีกครั้ง
    console.log('สถานะการเชื่อมต่อ:', isConnected() ? 'เชื่อมต่อแล้ว' : 'ไม่ได้เชื่อมต่อ');
    
  } catch (error) {
    console.error('เกิดข้อผิดพลาดในการเชื่อมต่อ:', error);
  }
};

// เรียกใช้ฟังก์ชันทดสอบ
testConnection();