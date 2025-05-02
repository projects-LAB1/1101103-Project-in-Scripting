/**
 * Authentication Service using AsyncStorage
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import bcrypt from 'react-native-bcrypt';
import User from '../models/User';
import * as Notifications from 'expo-notifications';

const CURRENT_USER_KEY = '@currentUser';

// Helper for safe operations
const safeOperation = async (operation, errorMsg) => {
  try {
    return await operation();
  } catch (error) {
    console.error(`${errorMsg} error:`, error);
    throw error;
  }
};

export const register = async (email, password) => {
  console.log('Registering new user with email:', email);
  
  return safeOperation(async () => {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new Error('อีเมลนี้ถูกใช้งานแล้ว');
    }

    const newUser = await User.create({
      email,
      password,
      displayName: email.split('@')[0],
      createdAt: new Date(),
      updatedAt: new Date()
    });

    const userData = {
      id: newUser._id,
      email: newUser.email,
      displayName: newUser.displayName,
      photoURL: newUser.photoURL || null,
      createdAt: newUser.createdAt
    };

    await AsyncStorage.setItem(CURRENT_USER_KEY, JSON.stringify(userData));
    return userData;
  }, 'registration');
};

export const login = async (email, password) => {
  return safeOperation(async () => {
    const user = await User.findOne({ email });
    
    if (!user || !bcrypt.compareSync(password, user.password)) {
      throw new Error('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
    }

    const userData = {
      id: user._id,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL || null
    };

    await AsyncStorage.setItem(CURRENT_USER_KEY, JSON.stringify(userData));
    return userData;
  }, 'login');
};

export const logout = async () => {
  try {
    // ยกเลิกการแจ้งเตือนทั้งหมดก่อนออกจากระบบ
    await Notifications.cancelAllScheduledNotificationsAsync();
    
    // ลบข้อมูลผู้ใช้จาก AsyncStorage
    await AsyncStorage.removeItem(CURRENT_USER_KEY);
    
    console.log('ออกจากระบบสำเร็จ');
    return true;
  } catch (error) {
    console.error('Error during logout:', error);
    throw error;
  }
};

export const getCurrentUser = async () => {
  try {
    const userJson = await AsyncStorage.getItem(CURRENT_USER_KEY);
    return userJson ? JSON.parse(userJson) : null;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
};

export const updateUser = async (userId, updatedData) => {
  return safeOperation(async () => {
    const user = await User.findByIdAndUpdate(userId, {
      ...updatedData,
      updatedAt: new Date()
    });

    if (!user) {
      throw new Error('ไม่พบผู้ใช้ในระบบ');
    }

    const userData = {
      id: user._id,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL || null
    };

    const currentUserJson = await AsyncStorage.getItem(CURRENT_USER_KEY);
    if (currentUserJson) {
      const currentUser = JSON.parse(currentUserJson);
      if (currentUser.id === userId) {
        await AsyncStorage.setItem(CURRENT_USER_KEY, JSON.stringify(userData));
      }
    }

    return userData;
  }, 'user update');
};

export const changePassword = async (userId, currentPassword, newPassword) => {
  return safeOperation(async () => {
    const user = await User.findById(userId);
    
    if (!user) {
      return { success: false, error: 'ไม่พบผู้ใช้ในระบบ' };
    }

    if (!bcrypt.compareSync(currentPassword, user.password)) {
      return { success: false, error: 'รหัสผ่านปัจจุบันไม่ถูกต้อง' };
    }

    await User.findByIdAndUpdate(userId, {
      password: bcrypt.hashSync(newPassword, 10),
      updatedAt: new Date()
    });
    
    return { success: true };
  }, 'password change');
};

export const sendResetPasswordEmail = async (email) => {
  return safeOperation(async () => {
    const user = await User.findOne({ email });
    
    if (!user) {
      return { success: false, error: 'ไม่พบบัญชีผู้ใช้ที่ตรงกับอีเมลนี้' };
    }

    // In a real app, you would send an actual email here
    console.log(`[MOCK] Sent password reset email to: ${email}`);
    
    return { success: true };
  }, 'password reset');
};