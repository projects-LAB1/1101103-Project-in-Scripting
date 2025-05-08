import React, { createContext, useState, useContext, useEffect } from 'react';
import { register, login, logout, getCurrentUser } from '../utils/authStorage';

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

  useEffect(() => {
    // ตรวจสอบสถานะการเข้าสู่ระบบเมื่อแอพเริ่มทำงาน
    const initializeAuth = async () => {
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const handleRegister = async (email, password) => {
    try {
      const newUser = await register(email, password);
      setUser(newUser);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const handleLogin = async (email, password) => {
    try {
      const loggedInUser = await login(email, password);
      setUser(loggedInUser);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      setUser(null);
      return { success: true };
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
  };

  if (loading) {
    // คุณอาจจะแสดง loading screen ที่นี่
    return null;
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 