import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';

const USERS_KEY = '@users';
const CURRENT_USER_KEY = '@currentUser';
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
export const register = async (email, password) => {
  try {
    const users = await loadUsers();
    
    // ตรวจสอบว่ามีอีเมลนี้ในระบบแล้วหรือไม่
    if (users.some(user => user.email === email)) {
      throw new Error('อีเมลนี้ถูกใช้งานแล้ว');
    }

    const newUser = {
      id: Date.now().toString(),
      email,
      password, // ในระบบจริงควรเข้ารหัสรหัสผ่านก่อนเก็บ
      createdAt: new Date().toISOString()
    };

    const updatedUsers = [...users, newUser];
    await saveUsers(updatedUsers);
    await AsyncStorage.setItem(CURRENT_USER_KEY, JSON.stringify(newUser));

    return newUser;
  } catch (error) {
    console.error('Error registering:', error);
    throw error;
  }
};

// เข้าสู่ระบบ
export const login = async (email, password) => {
  try {
    const users = await loadUsers();
    const user = users.find(u => u.email === email && u.password === password);
    
    if (!user) {
      throw new Error('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
    }

    await AsyncStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    return user;
  } catch (error) {
    console.error('Error logging in:', error);
    throw error;
  }
};

// ออกจากระบบ
export const logout = async () => {
  try {
    await AsyncStorage.removeItem(CURRENT_USER_KEY);
  } catch (error) {
    console.error('Error logging out:', error);
    throw error;
  }
};

// ตรวจสอบสถานะการเข้าสู่ระบบ
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
    const users = await loadUsers();
    const updatedUsers = users.map(user =>
      user.id === userId ? { ...user, ...updatedData } : user
    );
    
    await saveUsers(updatedUsers);
    
    // อัพเดท current user ถ้าเป็นผู้ใช้ปัจจุบัน
    const currentUser = await getCurrentUser();
    if (currentUser?.id === userId) {
      const updatedUser = updatedUsers.find(u => u.id === userId);
      await AsyncStorage.setItem(CURRENT_USER_KEY, JSON.stringify(updatedUser));
    }
    
    return true;
  } catch (error) {
    console.error('Error updating user:', error);
    return false;
  }
}; 