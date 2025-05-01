import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Replace these with your Supabase project URL and anon key
const supabaseUrl = 'https://iabspnskcaiobwtfxxtv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlhYnNwbnNrY2Fpb2J3dGZ4eHR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIwNjU4NzksImV4cCI6MjA1NzY0MTg3OX0.DddzMmoZTPpDsp0ki4iwp8w45z-7XeO4eIPrTdZUSSk';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});