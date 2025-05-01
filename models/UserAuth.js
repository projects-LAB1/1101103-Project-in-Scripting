import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabase.config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as WebBrowser from 'expo-web-browser';
import { Alert, Linking, Platform } from 'react-native';

// Try to complete the auth session if browser is redirected back to app
WebBrowser.maybeCompleteAuthSession && WebBrowser.maybeCompleteAuthSession();

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check active session
    checkSession();

    // Subscribe to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event);
      setUser(session?.user ?? null);
      setLoading(false);

      // Save or remove session
      if (session) {
        await AsyncStorage.setItem('supabase.session', JSON.stringify(session));
      } else {
        await AsyncStorage.removeItem('supabase.session');
      }
    });

    // Setup URL listener for deep links
    const handleUrl = ({ url }) => {
      console.log("Deep link URL:", url);
      if (url && url.startsWith('myproj://')) {
        // This is triggered when user returns to app via deep link
        supabase.auth.getSession(); // This will trigger onAuthStateChange if valid
      }
    };

    // Add event listener for deep links
    Linking.addEventListener('url', handleUrl);

    return () => {
      if (subscription) subscription.unsubscribe();
      // Clean up URL listener
      Linking.removeAllListeners('url');
    };
  }, []);

  const checkSession = async () => {
    try {
      // Check for existing session in AsyncStorage
      const storedSession = await AsyncStorage.getItem('supabase.session');
      if (storedSession) {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        setUser(session?.user ?? null);
      }
    } catch (error) {
      console.error('Error checking session:', error);
    } finally {
      setLoading(false);
    }
  };

  // ฟังก์ชันเข้าสู่ระบบที่รองรับทั้งอีเมลและชื่อผู้ใช้
  const login = async (identifier, password) => {
    try {
      let loginResult;

      // ตรวจสอบว่า identifier เป็นอีเมลหรือไม่
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const isEmail = emailRegex.test(identifier.trim());

      if (isEmail) {
        // ถ้าเป็นอีเมล ให้เข้าสู่ระบบด้วยอีเมลโดยตรง
        console.log("Login with email:", identifier);
        loginResult = await supabase.auth.signInWithPassword({
          email: identifier.trim(),
          password: password
        });
      } else {
        // ถ้าไม่เป็นอีเมล สันนิษฐานว่าเป็นชื่อผู้ใช้
        console.log("Login with username:", identifier);
        
        // 1. ค้นหาอีเมลที่เกี่ยวข้องกับชื่อผู้ใช้จากตาราง profiles
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('email')
          .eq('username', identifier.trim())
          .single();

        if (profileError || !profileData) {
          console.error('Username lookup error:', profileError);
          throw new Error('User not found');
        }

        // 2. ใช้อีเมลที่ค้นพบในการล็อกอิน
        loginResult = await supabase.auth.signInWithPassword({
          email: profileData.email,
          password: password
        });
      }

      // ตรวจสอบผลลัพธ์
      const { data, error } = loginResult;
      
      if (error) throw error;

      // Create/update profile if it doesn't exist
      if (data.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            user_id: data.user.id,
            email: data.user.email,
            updated_at: new Date()
          }, {
            onConflict: 'user_id'
          });

        if (profileError) {
          console.error('Profile update error:', profileError);
        }
      }

      return data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const resetPassword = async (email) => {
    try {
      // กำหนด redirectUrl ที่ถูกต้อง
      const redirectTo = Platform.select({
        web: 'https://iabspnskcaiobwtfxxtv.supabase.co/auth/v1/callback',
        ios: 'myproj://reset-password',
        android: 'myproj://reset-password'
      });

      console.log("Reset password - using redirect URL:", redirectTo);

      // ส่งคำขอรีเซ็ตรหัสผ่าน
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: redirectTo
      });

      if (error) throw error;
      
      // แสดงข้อมูลเพิ่มเติมสำหรับการแก้ไขปัญหา
      console.log("Reset password email sent successfully to:", email);
      
      return { success: true };
    } catch (error) {
      console.error('Reset password error:', error);
      throw error;
    }
  };

  // เพิ่มฟังก์ชันสำหรับการตั้งรหัสผ่านใหม่
  const updatePassword = async (newPassword) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Update password error:', error);
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    try {
      console.log("Starting Google Sign-In with OAuth...");
      
      // Use the app's deep link scheme as the redirectUrl
      const redirectUrl = Platform.select({
        web: 'https://iabspnskcaiobwtfxxtv.supabase.co/auth/v1/callback',
        default: 'myproj://auth/callback'
      });
      
      console.log("Using redirect URL:", redirectUrl);
      
      // Use signInWithOAuth with the updated redirect URL
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          // Add queryParams to get refresh token
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });
      
      if (error) {
        console.error("Supabase OAuth error:", error);
        throw error;
      }

      console.log("OAuth data received:", data);
      
      // Open browser to authenticate
      if (data?.url) {
        console.log("Opening browser with URL:", data.url);
        
        const result = await WebBrowser.openAuthSessionAsync(
          data.url,
          redirectUrl
        );
        
        console.log("Browser result:", result);

        if (result.type === 'success') {
          // After successful login, get session data
          console.log("Auth successful - checking session");
          
          // Wait briefly for Supabase to process the authentication
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
          
          if (sessionError) {
            console.error("Session error:", sessionError);
            throw sessionError;
          }
          
          console.log("Session data:", sessionData);
          
          if (sessionData?.session?.user) {
            console.log("User logged in:", sessionData.session.user.email);
            
            // Create/update profile
            await supabase.from('profiles').upsert({
              user_id: sessionData.session.user.id,
              email: sessionData.session.user.email,
              name: sessionData.session.user.user_metadata?.full_name,
              avatar_url: sessionData.session.user.user_metadata?.avatar_url,
              updated_at: new Date(),
            }, {
              onConflict: 'user_id'
            });
            
            return sessionData;
          } else {
            console.log("No user found in session data");
            // Show message to try again
            Alert.alert(
              "ล็อกอินไม่สำเร็จ",
              "ไม่พบข้อมูลผู้ใช้หลังจากล็อกอิน กรุณาลองอีกครั้ง"
            );
          }
        } else {
          console.log("Browser auth cancelled or failed");
          Alert.alert("การยืนยันถูกยกเลิก", "คุณได้ยกเลิกการล็อกอินด้วย Google หรือเกิดข้อผิดพลาด");
        }
      } else {
        console.log("No URL in data response");
        Alert.alert("ข้อผิดพลาด", "ไม่พบ URL สำหรับการยืนยันตัวตน");
      }
      
      return null;
    } catch (error) {
      console.error('Google sign-in error:', error);
      Alert.alert("ข้อผิดพลาด", `ไม่สามารถล็อกอินด้วย Google ได้: ${error.message}`);
      throw error;
    }
  };

  const register = async (email, password, metadata = {}) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: password,
        options: {
          data: metadata
        }
      });

      if (error) throw error;

      // Create initial profile
      if (data.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            user_id: data.user.id,
            email: data.user.email,
            name: metadata.name,
            username: metadata.username,
            created_at: new Date(),
            updated_at: new Date(),
            statistics: {
              totalAlarms: 0,
              alarmsCompleted: 0,
              alarmsSnooze: 0,
              avgWakeUpTime: null
            }
          }, {
            onConflict: 'user_id'
          });

        if (profileError) {
          console.error('Profile creation error:', profileError);
        }
      }

      return data;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      await AsyncStorage.removeItem('supabase.session');
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    signInWithGoogle,
    resetPassword,
    updatePassword
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const UserAuth = () => {
  return useContext(AuthContext);
};
