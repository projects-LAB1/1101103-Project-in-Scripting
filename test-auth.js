// Simple test script for Supabase auth
import { createClient } from '@supabase/supabase-js';

// Use the same credentials from your supabase.config.js
const supabaseUrl = 'https://iabspnskcaiobwtfxxtv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlhYnNwbnNrY2Fpb2J3dGZ4eHR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIwNjU4NzksImV4cCI6MjA1NzY0MTg3OX0.DddzMmoZTPpDsp0ki4iwp8w45z-7XeO4eIPrTdZUSSk';

// Create Supabase client without any custom settings
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const testRegister = async () => {
  try {
    // Generate a unique email for testing
    const testEmail = `test${Date.now()}@example.com`;
    const testPassword = 'TestPassword123';
    
    console.log(`Attempting basic registration with email: ${testEmail}`);
    
    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword
    });
    
    if (error) {
      console.error('ERROR IN TEST:');
      console.error('Status:', error.status);
      console.error('Name:', error.name);
      console.error('Message:', error.message);
      console.error('Details:', JSON.stringify(error));
      return;
    }
    
    console.log('Registration successful!');
    console.log('User ID:', data.user?.id);
    console.log('Confirmation status:', data.user?.confirmed_at ? 'Confirmed' : 'Not confirmed');
    
    // Try to sign in with the same credentials
    console.log('Attempting to sign in with the same credentials...');
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    });
    
    if (signInError) {
      console.error('Sign-in error:', signInError.message);
    } else {
      console.log('Sign-in successful!');
    }
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
};

// Run the test
testRegister(); 