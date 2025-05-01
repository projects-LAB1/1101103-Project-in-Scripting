import User from '../models/User';
import { isConnected } from '../config/mongoConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CURRENT_USER_KEY = '@currentUser';

// ลงทะเบียนผู้ใช้ใหม่
export const register = async (email, password) => {
  try {
    // ตรวจสอบการเชื่อมต่อกับ MongoDB
    if (!isConnected()) {
      throw new Error('ไม่สามารถเชื่อมต่อกับฐานข้อมูลได้');
    }

    // ตรวจสอบว่ามีอีเมลนี้ในระบบแล้วหรือไม่
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new Error('อีเมลนี้ถูกใช้งานแล้ว');
    }

    // สร้างผู้ใช้ใหม่
    const newUser = new User({
      email,
      password, // รหัสผ่านจะถูกเข้ารหัสโดย mongoose middleware
      displayName: email.split('@')[0]
    });

    // บันทึกผู้ใช้ลงในฐานข้อมูล
    await newUser.save();

    // สร้างข้อมูลผู้ใช้สำหรับส่งกลับ (ไม่มีรหัสผ่าน)
    const userData = {
      id: newUser._id.toString(), // ใช้ toString() เพื่อป้องกันปัญหาการแปลง ObjectId
      email: newUser.email,
      displayName: newUser.displayName,
      photoURL: newUser.photoURL
    };

    // เก็บข้อมูลผู้ใช้ปัจจุบันใน AsyncStorage
    await AsyncStorage.setItem(CURRENT_USER_KEY, JSON.stringify(userData));

    return userData;
  } catch (error) {
    console.error('Error registering:', error);
    throw error;
  }
};

// เข้าสู่ระบบ
export const login = async (email, password) => {
  try {
    // ตรวจสอบการเชื่อมต่อกับ MongoDB
    if (!isConnected()) {
      throw new Error('ไม่สามารถเชื่อมต่อกับฐานข้อมูลได้');
    }

    // ค้นหาผู้ใช้ด้วยอีเมล (เลือกเอาฟิลด์รหัสผ่านด้วยเพราะปกติจะไม่ถูกส่งกลับ)
    const user = await User.findOne({ email }).select('+password');
    
    // ตรวจสอบว่ามีผู้ใช้นี้หรือไม่
    if (!user) {
      throw new Error('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
    }

    // ตรวจสอบรหัสผ่าน
    const isMatch = user.matchPassword(password);
    if (!isMatch) {
      throw new Error('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
    }

    // สร้างข้อมูลผู้ใช้สำหรับส่งกลับ (ไม่มีรหัสผ่าน)
    const userData = {
      id: user._id.toString(),
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL
    };

    // เก็บข้อมูลผู้ใช้ปัจจุบันใน AsyncStorage
    await AsyncStorage.setItem(CURRENT_USER_KEY, JSON.stringify(userData));

    return userData;
  } catch (error) {
    console.error('Error logging in:', error);
    throw error;
  }
};

// ออกจากระบบ
export const logout = async () => {
  try {
    // ลบข้อมูลผู้ใช้ปัจจุบันออกจาก AsyncStorage
    await AsyncStorage.removeItem(CURRENT_USER_KEY);
  } catch (error) {
    console.error('Error logging out:', error);
    throw error;
  }
};

// ตรวจสอบสถานะการเข้าสู่ระบบปัจจุบัน
export const getCurrentUser = async () => {
  try {
    const userJson = await AsyncStorage.getItem(CURRENT_USER_KEY);
    return userJson ? JSON.parse(userJson) : null;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
};

// อัพเดทข้อมูลผู้ใช้
export const updateUser = async (userId, updatedData) => {
  try {
    // ตรวจสอบการเชื่อมต่อกับ MongoDB
    if (!isConnected()) {
      throw new Error('ไม่สามารถเชื่อมต่อกับฐานข้อมูลได้');
    }

    // อัพเดทข้อมูลและรับข้อมูลล่าสุดกลับมา
    const user = await User.findByIdAndUpdate(
      userId,
      { ...updatedData, updatedAt: Date.now() },
      { new: true }
    );

    if (!user) {
      throw new Error('ไม่พบผู้ใช้ในระบบ');
    }

    // สร้างข้อมูลผู้ใช้สำหรับส่งกลับ
    const userData = {
      id: user._id.toString(),
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL
    };

    // อัพเดท AsyncStorage ถ้าเป็นผู้ใช้ปัจจุบัน
    const currentUserJson = await AsyncStorage.getItem(CURRENT_USER_KEY);
    if (currentUserJson) {
      const currentUser = JSON.parse(currentUserJson);
      if (currentUser.id === userId) {
        await AsyncStorage.setItem(CURRENT_USER_KEY, JSON.stringify(userData));
      }
    }

    return userData;
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
};

// เปลี่ยนรหัสผ่าน
export const changePassword = async (userId, currentPassword, newPassword) => {
  try {
    // ตรวจสอบการเชื่อมต่อกับ MongoDB
    if (!isConnected()) {
      return { success: false, error: 'ไม่สามารถเชื่อมต่อกับฐานข้อมูลได้' };
    }

    // ค้นหาผู้ใช้ด้วย ID และเลือกเอาฟิลด์รหัสผ่านด้วย
    const user = await User.findById(userId).select('+password');
    
    if (!user) {
      return { success: false, error: 'ไม่พบผู้ใช้ในระบบ' };
    }

    // ตรวจสอบรหัสผ่านปัจจุบัน
    const isMatch = user.matchPassword(currentPassword);
    if (!isMatch) {
      return { success: false, error: 'รหัสผ่านปัจจุบันไม่ถูกต้อง' };
    }

    // อัพเดทรหัสผ่านใหม่
    user.password = newPassword;
    user.updatedAt = Date.now();
    await user.save(); // บันทึกจะเรียกใช้ middleware เข้ารหัสรหัสผ่านอัตโนมัติ

    return { success: true };
  } catch (error) {
    console.error('Error changing password:', error);
    return { success: false, error: 'เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน' };
  }
};

// ส่งอีเมลรีเซ็ตรหัสผ่าน (จำลอง)
export const sendResetPasswordEmail = async (email) => {
  try {
    // ตรวจสอบการเชื่อมต่อกับ MongoDB
    if (!isConnected()) {
      return { success: false, error: 'ไม่สามารถเชื่อมต่อกับฐานข้อมูลได้' };
    }

    // ตรวจสอบว่ามีอีเมลนี้ในระบบหรือไม่
    const user = await User.findOne({ email });
    
    if (!user) {
      return { success: false, error: 'ไม่พบบัญชีผู้ใช้ที่ตรงกับอีเมลนี้' };
    }

    // ในโปรเจกต์จริง คุณควรส่งอีเมลรีเซ็ตรหัสผ่านจริงๆ
    // แต่ในตัวอย่างนี้เราจะจำลองว่าส่งสำเร็จ
    
    console.log(`[จำลอง] ส่งอีเมลรีเซ็ตรหัสผ่านไปที่: ${email}`);
    
    return { success: true };
  } catch (error) {
    console.error('Error sending password reset email:', error);
    return { success: false, error: 'เกิดข้อผิดพลาดในการส่งอีเมลรีเซ็ตรหัสผ่าน' };
  }
};