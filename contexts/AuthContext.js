import React, { createContext, useState, useContext, useEffect } from 'react';
import { register, login, logout, getCurrentUser } from '../utils/authStorage';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase/config';

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

  // Debug function to check Firebase initialization
  useEffect(() => {
    console.log("Checking Firebase initialization...");
    try {
      console.log("Firebase auth object:", auth);
      console.log("Firebase initialized:", auth._initializationPromise !== undefined);
    } catch (error) {
      console.error("Error checking Firebase:", error);
    }
  }, []);

  useEffect(() => {
    console.log("Setting up auth state listener...");
    let unsubscribe;
    
    try {
      // ตรวจสอบสถานะการเข้าสู่ระบบเมื่อแอพเริ่มทำงาน
      unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        console.log("Auth state changed:", firebaseUser ? "User found" : "No user");
        try {
          if (firebaseUser) {
            console.log("Firebase user data:", {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName || "No display name"
            });
            
            const userData = {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName,
              photoURL: firebaseUser.photoURL,
            };
            setUser(userData);
          } else {
            // ถ้าไม่มีผู้ใช้ใน Firebase ให้ลองเช็คใน AsyncStorage
            console.log("Checking AsyncStorage for user data...");
            const asyncUser = await getCurrentUser();
            console.log("AsyncStorage user:", asyncUser ? "Found" : "Not found");
            setUser(asyncUser);
          }
        } catch (error) {
          console.error("Error in auth state listener:", error);
        } finally {
          setLoading(false);
        }
      });
    } catch (error) {
      console.error("Critical error setting up auth state listener:", error);
      setLoading(false);
    }

    return () => {
      if (unsubscribe) unsubscribe();
    }
  }, []);

  const handleRegister = async (email, password) => {
    console.log("Attempting to register user:", email);
    try {
      const newUser = await register(email, password);
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
      const loggedInUser = await login(email, password);
      console.log("Login successful:", loggedInUser);
      setUser(loggedInUser);
      return { success: true, user: loggedInUser };
    } catch (error) {
      console.error("Login error:", error);
      return { success: false, error: error.message };
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