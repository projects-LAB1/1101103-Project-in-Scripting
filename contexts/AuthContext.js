import React, { createContext, useState, useContext, useEffect } from 'react';
import { connectToMongoDB } from '../config/mongoConfig';
import {
  register as mongoRegister,
  login as mongoLogin,
  logout as mongoLogout,
  getCurrentUser as mongoGetCurrentUser,
  updateUser as mongoUpdateUser,
  changePassword as mongoChangePassword,
  sendResetPasswordEmail as mongoSendResetEmail
} from '../utils/mongoAuthService';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dbInitializing, setDbInitializing] = useState(true);

  // Initialize MongoDB and check login state
  useEffect(() => {
    const initializeApp = async () => {
      try {
        console.log('Initializing auth context...');
        
        // Attempt to connect to MongoDB
        console.log('Connecting to MongoDB...');
        const connected = await connectToMongoDB();
        
        if (!connected) {
          console.error('MongoDB connection failed during app initialization');
          setDbInitializing(false);
        } else {
          console.log('MongoDB connected successfully');
          setDbInitializing(false);
        }
        
        // Check current user regardless of MongoDB connection
        // (user might be cached in AsyncStorage)
        console.log('Checking for current user...');
        const userData = await mongoGetCurrentUser();
        
        if (userData) {
          console.log('User found:', userData.email);
          setUser(userData);
        } else {
          console.log('No user found in AsyncStorage');
        }
      } catch (error) {
        console.error('Error initializing app:', error);
        setDbInitializing(false);
      } finally {
        setLoading(false);
      }
    };

    initializeApp();
  }, []);

  // Handle registration
  const handleRegister = async (email, password) => {
    try {
      setLoading(true);
      
      // Attempt to connect to MongoDB first
      const connected = await connectToMongoDB();
      if (!connected) {
        return { 
          success: false, 
          error: 'ไม่สามารถเชื่อมต่อกับฐานข้อมูล กรุณาตรวจสอบการเชื่อมต่อและลองอีกครั้ง' 
        };
      }
      
      const newUser = await mongoRegister(email, password);
      setUser(newUser);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Handle login
  const handleLogin = async (email, password) => {
    try {
      setLoading(true);
      
      // Attempt to connect to MongoDB first
      const connected = await connectToMongoDB();
      if (!connected) {
        return { 
          success: false, 
          error: 'ไม่สามารถเชื่อมต่อกับฐานข้อมูล กรุณาตรวจสอบการเชื่อมต่อและลองอีกครั้ง' 
        };
      }
      
      const loggedInUser = await mongoLogin(email, password);
      setUser(loggedInUser);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      setLoading(true);
      await mongoLogout();
      setUser(null);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Update user profile
  const handleUpdateUser = async (userData) => {
    try {
      if (!user) throw new Error('ยังไม่มีการเข้าสู่ระบบ');
      
      // Attempt to connect to MongoDB first
      const connected = await connectToMongoDB();
      if (!connected) {
        return { 
          success: false, 
          error: 'ไม่สามารถเชื่อมต่อกับฐานข้อมูล กรุณาตรวจสอบการเชื่อมต่อและลองอีกครั้ง' 
        };
      }
      
      const updatedUser = await mongoUpdateUser(user.id, userData);
      setUser(updatedUser);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  // Change password
  const handleChangePassword = async (currentPassword, newPassword) => {
    try {
      if (!user) throw new Error('ยังไม่มีการเข้าสู่ระบบ');
      
      // Attempt to connect to MongoDB first
      const connected = await connectToMongoDB();
      if (!connected) {
        return { 
          success: false, 
          error: 'ไม่สามารถเชื่อมต่อกับฐานข้อมูล กรุณาตรวจสอบการเชื่อมต่อและลองอีกครั้ง' 
        };
      }
      
      const result = await mongoChangePassword(user.id, currentPassword, newPassword);
      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  // Send password reset email
  const handleResetPassword = async (email) => {
    try {
      // Attempt to connect to MongoDB first
      const connected = await connectToMongoDB();
      if (!connected) {
        return { 
          success: false, 
          error: 'ไม่สามารถเชื่อมต่อกับฐานข้อมูล กรุณาตรวจสอบการเชื่อมต่อและลองอีกครั้ง' 
        };
      }
      
      const result = await mongoSendResetEmail(email);
      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  // Context value
  const value = {
    user,
    loading,
    dbInitializing,
    register: handleRegister,
    login: handleLogin,
    logout: handleLogout,
    updateUser: handleUpdateUser,
    changePassword: handleChangePassword,
    resetPassword: handleResetPassword,
    isAuthenticated: !!user
  };

  // Return loading state
  if (loading) {
    return (
      <AuthContext.Provider value={value}>
        {null}
      </AuthContext.Provider>
    );
  }

  // Return fully initialized context
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};