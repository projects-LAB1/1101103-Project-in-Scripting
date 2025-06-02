import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';

const USERS_KEY = '@users';
const CURRENT_USER_KEY = '@localUser';
const JSON_FILE_PATH = `${FileSystem.documentDirectory}users.json`;

// โหลดข้อมูลผู้ใช้ทั้งหมด
const loadUsers = async () => {
  try {
    const storedUsers = await AsyncStorage.getItem(USERS_KEY);
    if (storedUsers) {
      return JSON.parse(storedUsers);
    }

    const fileExists = await FileSystem.getInfoAsync(JSON_FILE_PATH);
    if (fileExists.exists) {
      const jsonContent = await FileSystem.readAsStringAsync(JSON_FILE_PATH);
      const data = JSON.parse(jsonContent);
      await AsyncStorage.setItem(USERS_KEY, JSON.stringify(data.users));
      return data.users;
    }

    const initialData = { users: [] };
    await FileSystem.writeAsStringAsync(JSON_FILE_PATH, JSON.stringify(initialData));
    return [];
  } catch (error) {
    console.error('Error loading users:', error);
    return [];
  }
};

// บันทึกข้อมูลผู้ใช้
const saveUsers = async (users) => {
  try {
    await AsyncStorage.setItem(USERS_KEY, JSON.stringify(users));
    const data = { users };
    await FileSystem.writeAsStringAsync(JSON_FILE_PATH, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error saving users:', error);
    throw new Error('ไม่สามารถบันทึกข้อมูลผู้ใช้ได้');
  }
};

// ลงทะเบียนผู้ใช้ใหม่
export const register = async (email, password, displayName = '') => {
  try {
    // สร้างผู้ใช้ในระบบ local
    const users = await loadUsers();
    
    // ตรวจสอบว่ามีอีเมลนี้อยู่แล้วหรือไม่
    if (users.some(u => u.email === email)) {
      throw new Error('อีเมลนี้ถูกใช้งานแล้ว');
    }
    
    // สร้างผู้ใช้ใหม่
    const userData = {
      uid: "local-user-" + Date.now(),
      email,
      displayName,
      photoURL: null,
      createdAt: new Date().toISOString()
    };
    
    // เพิ่มผู้ใช้ใหม่ลงในรายการ
    users.push({...userData, password});
    await saveUsers(users);
    
    // เก็บข้อมูลผู้ใช้ปัจจุบันใน AsyncStorage (ไม่รวมรหัสผ่าน)
    await AsyncStorage.setItem(CURRENT_USER_KEY, JSON.stringify(userData));
    return userData;
  } catch (error) {
    console.error('Error registering user:', error);
    throw error;
  }
};

// เข้าสู่ระบบ
export const login = async (email, password) => {
  try {
    // ตรวจสอบผู้ใช้จาก AsyncStorage
    const users = await loadUsers();
    
    // ค้นหาผู้ใช้ที่มีอีเมลและรหัสผ่านตรงกัน
    const user = users.find(u => u.email === email && u.password === password);
    
    if (user) {
      // ไม่ส่งรหัสผ่านกลับไป
      const { password: pwd, ...userWithoutPassword } = user;
      
      // เก็บข้อมูลผู้ใช้ปัจจุบันใน AsyncStorage
      await AsyncStorage.setItem(CURRENT_USER_KEY, JSON.stringify(userWithoutPassword));
      return userWithoutPassword;
    } else {
      throw new Error('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
    }
  } catch (error) {
    console.error('Error logging in:', error);
    throw error;
  }
};

// ออกจากระบบ
export const logout = async () => {
  try {
    await AsyncStorage.removeItem(CURRENT_USER_KEY);
    return { success: true };
  } catch (error) {
    console.error('Error signing out:', error);
    throw new Error('ไม่สามารถออกจากระบบได้: ' + error.message);
  }
};

// รีเซ็ตรหัสผ่าน
export const resetPassword = async (email) => {
  try {
    // โหลดข้อมูลผู้ใช้
    const users = await loadUsers();
    
    // ตรวจสอบว่ามีอีเมลนี้ในระบบหรือไม่
    const userIndex = users.findIndex(u => u.email === email);
    
    if (userIndex === -1) {
      throw new Error('ไม่พบบัญชีผู้ใช้ที่ตรงกับอีเมลนี้');
    }
    
    // ในระบบจริงจะส่งอีเมลพร้อมลิงก์รีเซ็ตรหัสผ่าน
    // แต่ในโปรเจคนี้เป็นเพียงการจำลอง เราจะกำหนดรหัสผ่านใหม่เป็น "123456"
    const tempPassword = "123456";
    
    // อัพเดทรหัสผ่านใหม่
    users[userIndex].password = tempPassword;
    
    // บันทึกข้อมูลผู้ใช้
    await saveUsers(users);
    
    console.log(`รีเซ็ตรหัสผ่านสำหรับ ${email} สำเร็จ (รหัสใหม่: ${tempPassword})`);
    
    // ในระบบจริงจะไม่ต้อง return รหัสผ่านใหม่
    return { 
      success: true, 
      message: `รีเซ็ตรหัสผ่านสำเร็จ ระบบได้กำหนดรหัสผ่านชั่วคราวเป็น "${tempPassword}" กรุณาเปลี่ยนรหัสผ่านหลังจากเข้าสู่ระบบ` 
    };
  } catch (error) {
    console.error('Error resetting password:', error);
    throw error;
  }
};

// ตรวจสอบสถานะการเข้าสู่ระบบ
export const getCurrentUser = async () => {
  try {
    // ตรวจสอบจาก AsyncStorage
    const userJson = await AsyncStorage.getItem(CURRENT_USER_KEY);
    if (userJson) {
      return JSON.parse(userJson);
    }
    
    return null;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
};

// อัพเดทข้อมูลผู้ใช้
export const updateUserProfile = async (displayName, photoURL) => {
  try {
    // ตรวจสอบจาก AsyncStorage
    const userJson = await AsyncStorage.getItem(CURRENT_USER_KEY);
    if (!userJson) {
      throw new Error('ไม่พบข้อมูลผู้ใช้');
    }
    
    const currentUser = JSON.parse(userJson);
    
    // อัพเดทข้อมูล
    const updatedUser = {
      ...currentUser,
      displayName: displayName || currentUser.displayName,
      photoURL: photoURL || currentUser.photoURL,
    };
    
    // บันทึกลง AsyncStorage
    await AsyncStorage.setItem(CURRENT_USER_KEY, JSON.stringify(updatedUser));
    
    // อัพเดทข้อมูลใน users list ด้วย
    const users = await loadUsers();
    const updatedUsers = users.map(u => {
      if (u.uid === currentUser.uid) {
        return { ...u, displayName, photoURL };
      }
      return u;
    });
    
    await saveUsers(updatedUsers);
    
    return updatedUser;
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
}; 