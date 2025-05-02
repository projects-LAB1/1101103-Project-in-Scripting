import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import bcrypt from 'react-native-bcrypt';
import * as Notifications from 'expo-notifications';

const AuthContext = createContext(null);
const USERS_KEY = '@users';
const CURRENT_USER_KEY = '@currentUser';

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

  // Initialize app and check login state
  useEffect(() => {
    const initializeApp = async () => {
      try {
        console.log('Checking for current user...');
        const userJson = await AsyncStorage.getItem(CURRENT_USER_KEY);
        if (userJson) {
          const userData = JSON.parse(userJson);
          console.log('User found:', userData.email);
          setUser(userData);
        } else {
          console.log('No user found in storage');
        }
      } catch (error) {
        console.error('Error initializing app:', error);
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
      
      // Check if user exists
      const usersJson = await AsyncStorage.getItem(USERS_KEY);
      const users = usersJson ? JSON.parse(usersJson) : [];
      
      if (users.find(u => u.email === email)) {
        throw new Error('อีเมลนี้ถูกใช้งานแล้ว');
      }

      // Create new user
      const hashedPassword = bcrypt.hashSync(password, 10);
      const newUser = {
        id: Date.now().toString(),
        email,
        password: hashedPassword,
        displayName: email.split('@')[0],
        createdAt: new Date().toISOString()
      };

      // Save user
      await AsyncStorage.setItem(USERS_KEY, JSON.stringify([...users, newUser]));
      
      // Set current user
      const userData = {
        id: newUser.id,
        email: newUser.email,
        displayName: newUser.displayName
      };
      await AsyncStorage.setItem(CURRENT_USER_KEY, JSON.stringify(userData));
      setUser(userData);
      
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
      
      // Find user
      const usersJson = await AsyncStorage.getItem(USERS_KEY);
      const users = usersJson ? JSON.parse(usersJson) : [];
      const user = users.find(u => u.email === email);
      
      if (!user || !bcrypt.compareSync(password, user.password)) {
        throw new Error('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
      }

      // Set current user
      const userData = {
        id: user.id,
        email: user.email,
        displayName: user.displayName
      };
      await AsyncStorage.setItem(CURRENT_USER_KEY, JSON.stringify(userData));
      setUser(userData);
      
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
      await Notifications.cancelAllScheduledNotificationsAsync();
      await AsyncStorage.removeItem(CURRENT_USER_KEY);
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
      
      // Update user in users list
      const usersJson = await AsyncStorage.getItem(USERS_KEY);
      const users = usersJson ? JSON.parse(usersJson) : [];
      const updatedUsers = users.map(u => 
        u.id === user.id ? { ...u, ...userData } : u
      );
      await AsyncStorage.setItem(USERS_KEY, JSON.stringify(updatedUsers));

      // Update current user
      const updatedUser = { ...user, ...userData };
      await AsyncStorage.setItem(CURRENT_USER_KEY, JSON.stringify(updatedUser));
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
      
      // Verify current password
      const usersJson = await AsyncStorage.getItem(USERS_KEY);
      const users = usersJson ? JSON.parse(usersJson) : [];
      const currentUser = users.find(u => u.id === user.id);
      
      if (!currentUser || !bcrypt.compareSync(currentPassword, currentUser.password)) {
        throw new Error('รหัสผ่านปัจจุบันไม่ถูกต้อง');
      }

      // Update password
      const hashedNewPassword = bcrypt.hashSync(newPassword, 10);
      const updatedUsers = users.map(u => 
        u.id === user.id ? { ...u, password: hashedNewPassword } : u
      );
      await AsyncStorage.setItem(USERS_KEY, JSON.stringify(updatedUsers));
      
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
    updateUser: handleUpdateUser,
    changePassword: handleChangePassword,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};