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
  const [loading, setLoading] = useState(false);

  // โหลดข้อมูลผู้ใช้จาก AsyncStorage เมื่อแอปเริ่มทำงาน
  useEffect(() => {
    console.log("Setting up local auth...");
    const checkAsyncStorage = async () => {
      try {
        const asyncUser = await getCurrentUser();
        console.log("AsyncStorage user:", asyncUser ? "Found" : "Not found");
        setUser(asyncUser);
      } catch (error) {
        console.error("Error checking AsyncStorage:", error);
      } finally {
        setLoading(false);
      }
    };
    
    checkAsyncStorage();
  }, []);

  const handleRegister = async (email, password, displayName = '') => {
    console.log("Attempting to register user:", email);
    try {
      const newUser = await register(email, password, displayName);
      console.log("Registration successful:", newUser);
      setUser(newUser);
      return { success: true, user: newUser };
    } catch (error) {
      console.error("Registration error:", error);
      return { success: false, error: error.message };
    }
  };

  const handleLogin = async (email, password) => {
    console.log("Attempting to login user:", email);
    try {
      setLoading(true);
      const loggedInUser = await login(email, password);
      console.log("Login successful:", loggedInUser);
      
      // ตรวจสอบว่า loggedInUser มีค่าหรือไม่
      if (!loggedInUser) {
        throw new Error('ไม่สามารถเข้าสู่ระบบได้ กรุณาตรวจสอบอีเมลและรหัสผ่าน');
      }
      
      setUser(loggedInUser);
      return { success: true, user: loggedInUser };
    } catch (error) {
      console.error("Login error:", error);
      let errorMessage = error.message || 'ไม่สามารถเข้าสู่ระบบได้ กรุณาลองอีกครั้ง';
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    console.log("Attempting to logout user");
    try {
      await logout();
      console.log("Logout successful");
      setUser(null);
      return { success: true };
    } catch (error) {
      console.error("Logout error:", error);
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

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 