import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Replace these with your Supabase project credentials
const supabaseUrl = 'https://iabspnskcaiobwtfxxtv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlhYnNwbnNrY2Fpb2J3dGZ4eHR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIwNjU4NzksImV4cCI6MjA1NzY0MTg3OX0.DddzMmoZTPpDsp0ki4iwp8w45z-7XeO4eIPrTdZUSSk';

// Initialize Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  db: {
    schema: 'public',
  },
});

// Helper function to get current user
export const getUser = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  } catch (error) {
    console.error('Error getting user:', error);
    return null;
  }
};

// Check if user is logged in
export const isLoggedIn = async () => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return !!session;
  } catch (error) {
    console.error('Error checking auth status:', error);
    return false;
  }
};

// Helper function to handle errors
export const handleError = (error) => {
  console.error('Supabase error:', error);
  let message = 'An unexpected error occurred';
  
  if (error.message?.includes('network')) {
    message = 'Network error. Please check your internet connection.';
  } else if (error.message?.includes('credentials')) {
    message = 'Invalid login credentials.';
  } else if (error.message?.includes('not found')) {
    message = 'User not found.';
  }
  
  return message;
};