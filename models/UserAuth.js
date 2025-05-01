import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabase.config';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const clearAuthData = async () => {
    try {
      await AsyncStorage.removeItem('supabase.session');
      await AsyncStorage.removeItem('@session_token');
      // Clear any other auth-related items
      const keys = await AsyncStorage.getAllKeys();
      const authKeys = keys.filter(key => key.includes('auth') || key.includes('firebase'));
      if (authKeys.length > 0) {
        await AsyncStorage.multiRemove(authKeys);
      }
    } catch (error) {
      console.error('Error clearing auth data:', error);
    }
  };

  useEffect(() => {
    // Check active session
    checkSession();

    // Subscribe to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        await clearAuthData();
      }
      setUser(session?.user ?? null);
      setLoading(false);

      // Save or remove session
      if (session) {
        await AsyncStorage.setItem('supabase.session', JSON.stringify(session));
      }
    });

    return () => {
      if (subscription) subscription.unsubscribe();
    };
  }, []);

  const checkSession = async () => {
    try {
      // Check for existing session in AsyncStorage
      const storedSession = await AsyncStorage.getItem('supabase.session');
      if (storedSession) {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          await clearAuthData();
          throw error;
        }
        setUser(session?.user ?? null);
      }
    } catch (error) {
      console.error('Error checking session:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      await clearAuthData(); // Clear any stale auth data before login
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password
      });

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
      await clearAuthData();
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
    clearAuthData
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
