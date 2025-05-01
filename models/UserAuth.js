import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, authOnlyClient } from '../supabase.config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as WebBrowser from 'expo-web-browser';
import { Alert, Linking, Platform } from 'react-native';

// Try to complete the auth session if browser is redirected back to app
WebBrowser.maybeCompleteAuthSession && WebBrowser.maybeCompleteAuthSession();

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

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

  // login - เข้าสู่ระบบด้วยอีเมลและรหัสผ่าน
  const login = async (identifier, password) => {
    try {
      // Check if this is the test account
      if (identifier === "test@example.com" && password === "password123") {
        console.log("Using test account login bypass");
        const mockSession = {
          access_token: "test-token-123456",
          user: {
            id: "test-user-id",
            email: "test@example.com",
            user_metadata: {
              name: "Test User",
              username: "testuser"
            }
          }
        };
        setUser({
          id: "test-user-id",
          email: "test@example.com",
          name: "Test User",
          username: "testuser"
        });
        setIsAuthenticated(true);
        return { data: { session: mockSession }, error: null };
      }

      console.log("Attempting login with identifier:", identifier);

      // Check if identifier is an email
      const isEmail = identifier.includes('@');
      let email = identifier;

      // If identifier is not an email, look up the email by username
      if (!isEmail) {
        console.log("Looking up email for username:", identifier);
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('email')
          .eq('username', identifier.trim())
          .single();

        if (profileError || !profileData?.email) {
          console.error("Username lookup error:", profileError);
          throw new Error('ไม่พบชื่อผู้ใช้นี้ในระบบ');
        }

        email = profileData.email;
        console.log("Found email for username:", email);
      }

      // Attempt to sign in with email
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password
      });

      if (signInError) {
        console.error("Sign in error:", signInError);
        throw signInError;
      }

      if (!signInData?.user) {
        console.error("No user data received");
        throw new Error("Login failed - no user data");
      }

      console.log("Sign in successful, fetching profile...");

      // Fetch the user's profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', signInData.user.id)
        .single();

      // If profile doesn't exist, create it
      if (profileError && profileError.code === 'PGRST116') {
        console.log("Profile not found, creating new profile...");
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .upsert({
            id: signInData.user.id,
            email: signInData.user.email,
            username: isEmail ? email.split('@')[0] : identifier,
            name: signInData.user.user_metadata?.name || email.split('@')[0],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'id'
          });

        if (createError) {
          console.error("Error creating profile:", createError);
          // Don't throw here - we can still proceed with basic user data
        } else {
          profileData = newProfile;
        }
      }

      // Set user state with combined data
      const userData = {
        id: signInData.user.id,
        email: signInData.user.email,
        name: profileData?.name || signInData.user.user_metadata?.name || email.split('@')[0],
        username: profileData?.username || signInData.user.user_metadata?.username || (isEmail ? email.split('@')[0] : identifier),
      };

      console.log("Setting user data:", userData);
      setUser(userData);
      setIsAuthenticated(true);

      // Store session
      if (signInData.session?.access_token) {
        await AsyncStorage.setItem('supabase.session', JSON.stringify(signInData.session));
      }

      return { 
        data: signInData,
        error: null 
      };
    } catch (error) {
      console.error("Login process error:", error);
      setUser(null);
      setIsAuthenticated(false);
      return { 
        data: null, 
        error: {
          message: error.message || "Login failed",
          details: error
        }
      };
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
      console.log(`Last resort registration attempt for email: ${email}`);
      
      // Use the separate authOnlyClient for a clean attempt
      const { data, error } = await authOnlyClient.auth.signUp({
        email: email.trim(),
        password: password
      });

      if (error) {
        console.error('Final auth registration error:', error);
        console.error('Raw error details:', JSON.stringify(error));
        throw error;
      }

      console.log('Direct signup result:', data?.user?.id);
      
      // If we've gotten this far, we've succeeded with basic auth registration
      // We'll handle profile creation later through login
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
