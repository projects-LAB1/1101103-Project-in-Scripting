/**
 * MongoDB Authentication Service
 * Handles user authentication operations with MongoDB
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { connectToMongoDB, isConnected } from '../config/mongoConfig';
import User from '../models/User';

// Storage key for current user
const CURRENT_USER_KEY = '@currentUser';

/**
 * Register a new user
 * @param {string} email - User's email
 * @param {string} password - User's password
 * @returns {Promise<Object>} - User data
 */
export const register = async (email, password) => {
  console.log('Registering new user with email:', email);
  
  try {
    // Connect to MongoDB
    const connected = await connectToMongoDB();
    if (!connected) {
      console.error('Failed to connect to MongoDB during registration');
      throw new Error('ไม่สามารถเชื่อมต่อกับฐานข้อมูล กรุณาลองอีกครั้ง');
    }
    
    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log('Email already registered:', email);
      throw new Error('อีเมลนี้ถูกใช้งานแล้ว');
    }

    // Create new user
    console.log('Creating new user...');
    const newUser = new User({
      email,
      password, // Will be hashed by mongoose middleware
      displayName: email.split('@')[0]
    });

    // Save user to database
    await newUser.save();
    console.log('User saved successfully:', email);

    // Prepare user data for response (without password)
    const userData = {
      id: newUser._id.toString(),
      email: newUser.email,
      displayName: newUser.displayName,
      photoURL: newUser.photoURL || null,
      createdAt: newUser.createdAt
    };

    // Store current user in AsyncStorage
    await AsyncStorage.setItem(CURRENT_USER_KEY, JSON.stringify(userData));
    console.log('User data saved to AsyncStorage');

    return userData;
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
};

/**
 * Login user
 * @param {string} email - User's email
 * @param {string} password - User's password
 * @returns {Promise<Object>} - User data
 */
export const login = async (email, password) => {
  console.log('Attempting login for email:', email);
  
  try {
    // Connect to MongoDB
    const connected = await connectToMongoDB();
    if (!connected) {
      console.error('Failed to connect to MongoDB during login');
      throw new Error('ไม่สามารถเชื่อมต่อกับฐานข้อมูล กรุณาลองอีกครั้ง');
    }

    // Find user by email with password field included
    const user = await User.findOne({ email }).select('+password');
    
    // Verify user exists
    if (!user) {
      console.log('User not found:', email);
      throw new Error('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
    }

    // Verify password
    const isMatch = user.matchPassword(password);
    if (!isMatch) {
      console.log('Password mismatch for user:', email);
      throw new Error('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
    }

    console.log('Login successful for user:', email);
    
    // Prepare user data for response (without password)
    const userData = {
      id: user._id.toString(),
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL || null
    };

    // Store current user in AsyncStorage
    await AsyncStorage.setItem(CURRENT_USER_KEY, JSON.stringify(userData));
    console.log('User data saved to AsyncStorage');

    return userData;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

/**
 * Logout current user
 */
export const logout = async () => {
  try {
    console.log('Logging out user...');
    await AsyncStorage.removeItem(CURRENT_USER_KEY);
    console.log('User logged out successfully');
  } catch (error) {
    console.error('Logout error:', error);
    throw error;
  }
};

/**
 * Get current logged-in user
 * @returns {Promise<Object|null>} - User data or null if not logged in
 */
export const getCurrentUser = async () => {
  try {
    const userJson = await AsyncStorage.getItem(CURRENT_USER_KEY);
    return userJson ? JSON.parse(userJson) : null;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
};

/**
 * Update user data
 * @param {string} userId - User ID
 * @param {Object} updatedData - User data to update
 * @returns {Promise<Object>} - Updated user data
 */
export const updateUser = async (userId, updatedData) => {
  console.log('Updating user data for ID:', userId);
  
  try {
    // Connect to MongoDB
    const connected = await connectToMongoDB();
    if (!connected) {
      console.error('Failed to connect to MongoDB during user update');
      throw new Error('ไม่สามารถเชื่อมต่อกับฐานข้อมูล กรุณาลองอีกครั้ง');
    }
    
    // Update user and get updated document
    const user = await User.findByIdAndUpdate(
      userId,
      { ...updatedData, updatedAt: Date.now() },
      { new: true }
    );

    if (!user) {
      console.error('User not found for update:', userId);
      throw new Error('ไม่พบผู้ใช้ในระบบ');
    }

    console.log('User updated successfully:', userId);

    // Prepare user data for response
    const userData = {
      id: user._id.toString(),
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL || null
    };

    // Update AsyncStorage if this is current user
    const currentUserJson = await AsyncStorage.getItem(CURRENT_USER_KEY);
    if (currentUserJson) {
      const currentUser = JSON.parse(currentUserJson);
      if (currentUser.id === userId) {
        await AsyncStorage.setItem(CURRENT_USER_KEY, JSON.stringify(userData));
        console.log('Current user data updated in AsyncStorage');
      }
    }

    return userData;
  } catch (error) {
    console.error('User update error:', error);
    throw error;
  }
};

/**
 * Change user password
 * @param {string} userId - User ID
 * @param {string} currentPassword - Current password
 * @param {string} newPassword - New password
 * @returns {Promise<Object>} - Result object
 */
export const changePassword = async (userId, currentPassword, newPassword) => {
  console.log('Changing password for user ID:', userId);
  
  try {
    // Connect to MongoDB
    const connected = await connectToMongoDB();
    if (!connected) {
      console.error('Failed to connect to MongoDB during password change');
      return { success: false, error: 'ไม่สามารถเชื่อมต่อกับฐานข้อมูล กรุณาลองอีกครั้ง' };
    }
    
    // Find user and include password field
    const user = await User.findById(userId).select('+password');
    
    if (!user) {
      console.error('User not found for password change:', userId);
      return { success: false, error: 'ไม่พบผู้ใช้ในระบบ' };
    }

    // Verify current password
    const isMatch = user.matchPassword(currentPassword);
    if (!isMatch) {
      console.log('Current password mismatch for user:', userId);
      return { success: false, error: 'รหัสผ่านปัจจุบันไม่ถูกต้อง' };
    }

    // Update password
    user.password = newPassword;
    user.updatedAt = Date.now();
    await user.save(); // This will trigger the password hashing middleware
    
    console.log('Password changed successfully for user:', userId);
    return { success: true };
  } catch (error) {
    console.error('Password change error:', error);
    return { success: false, error: 'เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน' };
  }
};

/**
 * Send reset password email (mock implementation)
 * @param {string} email - User's email
 * @returns {Promise<Object>} - Result object
 */
export const sendResetPasswordEmail = async (email) => {
  console.log('Sending reset password email to:', email);
  
  try {
    // Connect to MongoDB
    const connected = await connectToMongoDB();
    if (!connected) {
      console.error('Failed to connect to MongoDB during reset password');
      return { success: false, error: 'ไม่สามารถเชื่อมต่อกับฐานข้อมูล กรุณาลองอีกครั้ง' };
    }
    
    // Check if user exists
    const user = await User.findOne({ email });
    
    if (!user) {
      console.log('User not found for reset password:', email);
      return { success: false, error: 'ไม่พบบัญชีผู้ใช้ที่ตรงกับอีเมลนี้' };
    }

    // In a real project, you would send an actual email here
    // But for this example, we'll just simulate it
    console.log(`[MOCK] Sent password reset email to: ${email}`);
    
    return { success: true };
  } catch (error) {
    console.error('Reset password error:', error);
    return { success: false, error: 'เกิดข้อผิดพลาดในการส่งอีเมลรีเซ็ตรหัสผ่าน' };
  }
};