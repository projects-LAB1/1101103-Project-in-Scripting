import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View, KeyboardAvoidingView, Platform, Image, SafeAreaView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { auth } from '../App';
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import * as AuthSession from 'expo-auth-session';
// Import Appwrite account
import { account } from '../utils/appwrite';

// ต้องเรียกเมธอดนี้เพื่อให้ WebBrowser ทำงานได้ถูกต้อง
WebBrowser.maybeCompleteAuthSession();

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // เพิ่มโค้ดนี้เพื่อแสดง Redirect URI
  useEffect(() => {
    const redirectUri = AuthSession.makeRedirectUri({ 
      native: 'lesson01-61612://',
      useProxy: false 
    });
    console.log('Expo Redirect URI:', redirectUri);
    // Also log the proxy redirect URI that will be used with Google
    const proxyRedirectUri = AuthSession.makeRedirectUri({ 
      native: 'lesson01-61612://',
      useProxy: true 
    });
    console.log('Expo Proxy Redirect URI (for Google):', proxyRedirectUri);
  }, []);
  
  // สร้าง Google Auth Request โดยใช้ expo-auth-session
  const [request, response, promptAsync] = Google.useAuthRequest({
    androidClientId: '988759265113-rvvtqnvs8kkfvjm3vgp2qj3d5kcl9iqg.apps.googleusercontent.com',
    webClientId: '988759265113-re85jw9qqfm671qrmm22kmjav3ir.apps.googleusercontent.com',
    expoClientId: '988759265113-re85jw9qqfm671qrmm22kmjav3ir.apps.googleusercontent.com',
    // แก้ไข redirectUri ให้ใช้ URI ที่สร้างจาก AuthSession
    redirectUri: AuthSession.makeRedirectUri({ 
      native: 'lesson01-61612://',
      useProxy: true
    }),
    scopes: ['profile', 'email'],
  });
  
  // แสดง URL ที่ใช้สำหรับ redirect
  useEffect(() => {
    if (request) {
      console.log('Redirect URL:', request.redirectUri);
      // Log additional information for debugging
      console.log('Client ID being used:', '988759265113-re85jw9qqfm671qrmm22kmjav3ir.apps.googleusercontent.com');
      console.log('Authorized JavaScript origins from Google Console:', 'http://localhost:8081');
    }
  }, [request]);
  
  // เพิ่ม debug log เพื่อตรวจสอบ request
  useEffect(() => {
    if (request) {
      console.log('Auth Request:', request);
    }
  }, [request]);
  
  // แก้ไข useEffect เพื่อแสดงข้อมูล debug ที่ละเอียดขึ้น
  useEffect(() => {
    if (response) {
      console.log('Auth response:', JSON.stringify(response));
    }
  }, [response]);
  
  // จัดการกับ response จาก Google Auth
  useEffect(() => {
    if (response) {
      console.log('Auth response type:', response.type);
      console.log('Auth response full:', JSON.stringify(response, null, 2));
      
      if (response?.type === 'success') {
        const { id_token } = response.params;
        
        if (!id_token) {
          console.error('No id_token received from Google');
          alert('ไม่สามารถล็อกอินด้วย Google ได้: ไม่ได้รับ token');
          return;
        }
        
        const credential = GoogleAuthProvider.credential(id_token);
        signInWithCredential(auth, credential)
          .then(userCredential => {
            console.log('Google sign in successful:', userCredential.user);
            navigation.navigate('Home');
          })
          .catch(error => {
            console.error('Firebase sign in error:', error);
            alert('ล็อกอินด้วย Google ไม่สำเร็จ: ' + error.message);
          });
      } else if (response?.type === 'error') {
        console.error('Google auth error:', response.error);
        alert('ล็อกอินด้วย Google ไม่สำเร็จ: ' + (response.error?.message || 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ'));
      }
    }
  }, [response]);

  const handleSignup = () => {
    console.log('Navigating to Signup screen');
    navigation.navigate('Signup');
  };

  const handleLogin = async () => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log('Logged in:', userCredential.user);
      navigation.navigate('Home');
    } catch (error) {
      console.error('Login error:', error);
      alert('Login failed: ' + error.message);
    }
  };
  
  const handleGoogleSignIn = async () => {
    try {
      console.log('Starting Google Sign In process...');
      const result = await promptAsync();
      console.log('promptAsync result:', result);
    } catch (error) {
      console.error('Google sign in error:', error);
      alert('ล็อกอินด้วย Google ไม่สำเร็จ: ' + error.message);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.headerContainer}>
        <Text style={styles.headerText}>Login</Text>
      </View>

      <View style={styles.formContainer}>
        <TextInput
          style={styles.input}
          placeholder="Email/Username"
          placeholderTextColor="#999"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#999"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          autoCapitalize="none"
        />
        <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
          <Text style={styles.loginButtonText}>Login</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.forgotPasswordContainer} onPress={() => alert('Feature coming soon!')}>
          <Text style={styles.forgotPasswordText}>Forgot your password?</Text>
        </TouchableOpacity>
        
        <View style={styles.dividerContainer}>
          <View style={styles.divider} />
          <Text style={styles.dividerText}>OR</Text>
          <View style={styles.divider} />
        </View>
        
        <TouchableOpacity style={styles.googleButton} onPress={handleGoogleSignIn}>
          <View style={styles.googleIconContainer}>
            <Text style={styles.googleIcon}>G</Text>
          </View>
          <Text style={styles.googleButtonText}>Sign in with Google</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.signupContainer}>
        <Text style={styles.noAccountText}>Don't have account? </Text>
        <TouchableOpacity onPress={handleSignup}>
          <Text style={styles.signupText}>Sign up</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 20,
  },
  headerContainer: {
    marginTop: 60,
    alignItems: 'center',
    marginBottom: 40,
  },
  headerText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  formContainer: {
    marginTop: 20,
  },
  input: {
    backgroundColor: 'white',
    borderRadius: 10,
    paddingVertical: 15,
    paddingHorizontal: 20,
    fontSize: 16,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  loginButton: {
    backgroundColor: '#4361ee',
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 10,
    elevation: 2,
  },
  loginButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  forgotPasswordContainer: {
    alignItems: 'center',
    marginTop: 15,
  },
  forgotPasswordText: {
    color: '#4361ee',
    fontSize: 14,
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 30,
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
  },
  noAccountText: {
    color: '#333',
    fontSize: 14,
  },
  signupText: {
    color: '#4361ee',
    fontSize: 14,
    fontWeight: 'bold',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#ddd',
  },
  dividerText: {
    color: '#999',
    paddingHorizontal: 10,
    fontSize: 14,
  },
  googleButton: {
    backgroundColor: 'white',
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    elevation: 1,
  },
  googleButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  googleIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#4285F4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  googleIcon: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default LoginScreen;