import React, { createContext, useState, useContext, useEffect } from 'react';
import { connectToMongoDB, isConnected } from '../config/mongoConfig';
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
  const [isMongoInitialized, setIsMongoInitialized] = useState(false);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Ensure MongoDB is connected before proceeding
        const connected = await connectToMongoDB();
        if (!connected) {
          throw new Error('ไม่สามารถเชื่อมต่อกับฐานข้อมูลได้');
        }
        setIsMongoInitialized(true);

        // ตรวจสอบสถานะการเข้าสู่ระบบ
        const userData = await mongoGetCurrentUser();
        setUser(userData);
      } catch (error) {
        console.error('Error initializing app:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeApp();
  }, []);

  const handleRegister = async (email, password) => {
    if (!isMongoInitialized) {
      return { success: false, error: 'ระบบกำลังเริ่มต้น กรุณาลองใหม่อีกครั้ง' };
    }
    try {
      setLoading(true);
      const newUser = await mongoRegister(email, password);
      setUser(newUser);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (email, password) => {
    if (!isMongoInitialized) {
      return { success: false, error: 'ระบบกำลังเริ่มต้น กรุณาลองใหม่อีกครั้ง' };
    }
    try {
      setLoading(true);
      const loggedInUser = await mongoLogin(email, password);
      setUser(loggedInUser);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

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

  const handleUpdateUser = async (userData) => {
    try {
      if (!user) throw new Error('ยังไม่มีการเข้าสู่ระบบ');
      
      const updatedUser = await mongoUpdateUser(user.id, userData);
      setUser(updatedUser);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const handleChangePassword = async (currentPassword, newPassword) => {
    try {
      if (!user) throw new Error('ยังไม่มีการเข้าสู่ระบบ');
      
      const result = await mongoChangePassword(user.id, currentPassword, newPassword);
      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const handleResetPassword = async (email) => {
    try {
      const result = await mongoSendResetEmail(email);
      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const value = {
    user,
    loading,
    register: handleRegister,
    login: handleLogin,
    logout: handleLogout,
    updateUser: handleUpdateUser,
    changePassword: handleChangePassword,
    resetPassword: handleResetPassword,
    isAuthenticated: !!user,
    isMongoInitialized
  };

  if (loading) {
    return (
      <AuthContext.Provider value={value}>
        {null}
      </AuthContext.Provider>
    );
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};