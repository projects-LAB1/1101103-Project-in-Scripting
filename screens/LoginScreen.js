// 1. หน้าล็อกอิน (LoginScreen.js)
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '../contexts/AuthContext';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [loading, setLoading] = useState(false);

  const { login, register } = useAuth();

  const handleAuthentication = async () => {
    if (!email || !password) {
      Alert.alert("แจ้งเตือน", "กรุณากรอกอีเมลและรหัสผ่าน");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert("แจ้งเตือน", "กรุณากรอกอีเมลให้ถูกต้อง");
      return;
    }

    if (password.length < 6) {
      Alert.alert("แจ้งเตือน", "รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร");
      return;
    }

    try {
      setLoading(true);
      
      let result;
      if (isRegistering) {
        // ถ้าเป็นการสมัครสมาชิก ให้ใช้ register แทนที่จะนำทางไปยังหน้า Register
        result = await register(email, password, "");
      } else {
        console.log("Attempting login with:", email);
        result = await login(email, password);
      }
      
      if (result && result.success) {
        console.log("Authentication successful, navigating to Main");
        navigation.navigate('Main');
      } else {
        const errorMsg = result?.error || 'ไม่สามารถดำเนินการได้ กรุณาตรวจสอบข้อมูลและลองใหม่อีกครั้ง';
        console.log("Authentication failed:", errorMsg);
        Alert.alert(isRegistering ? 'สมัครสมาชิกไม่สำเร็จ' : 'เข้าสู่ระบบไม่สำเร็จ', errorMsg);
      }
    } catch (error) {
      console.error("Authentication exception:", error);
      Alert.alert('เกิดข้อผิดพลาด', error.message || 'ไม่สามารถดำเนินการได้ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.inner}>
            {/* Clock App Logo */}
            <View style={styles.logoContainer}>
              <View style={styles.clockIconContainer}>
                <MaterialCommunityIcons name="clock-outline" size={80} color="#FF9500" />
              </View>
              <Text style={styles.appTitle}>นาฬิกา</Text>
              <Text style={styles.appSubtitle}>นาฬิกาปลุกอัจฉริยะ</Text>
            </View>
            
            <View style={styles.formContainer}>
              <Text style={styles.headerTitle}>{isRegistering ? 'สร้างบัญชี' : 'เข้าสู่ระบบ'}</Text>
            
              <View style={styles.inputContainer}>
                <View style={styles.inputWrapper}>
                  <MaterialCommunityIcons name="email-outline" size={22} color="#767676" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="อีเมล"
                    placeholderTextColor="#767676"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={email}
                    onChangeText={setEmail}
                  />
                </View>
              </View>
              
              <View style={styles.inputContainer}>
                <View style={styles.inputWrapper}>
                  <MaterialCommunityIcons name="lock-outline" size={22} color="#767676" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="รหัสผ่าน"
                    placeholderTextColor="#767676"
                    secureTextEntry
                    value={password}
                    onChangeText={setPassword}
                  />
                </View>
              </View>
              
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={handleAuthentication}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#000" size="small" />
                ) : (
                  <Text style={styles.primaryButtonText}>
                    {isRegistering ? 'สร้างบัญชี' : 'เข้าสู่ระบบ'}
                  </Text>
                )}
              </TouchableOpacity>
              
              <View style={styles.switchContainer}>
                <Text style={styles.switchText}>
                  {isRegistering ? 'มีบัญชีอยู่แล้ว?' : 'ยังไม่มีบัญชี?'}
                </Text>
                <TouchableOpacity onPress={() => setIsRegistering(!isRegistering)}>
                  <Text style={styles.switchActionText}>
                    {isRegistering ? 'เข้าสู่ระบบ' : 'สร้างบัญชีใหม่'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
            
            <TouchableOpacity 
              style={styles.skipButton}
              onPress={() => navigation.navigate('Main')}
            >
              <Text style={styles.skipButtonText}>ข้ามการเข้าสู่ระบบ</Text>
            </TouchableOpacity>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  inner: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 24,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  clockIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 149, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  appTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFF',
    marginTop: 16,
    marginBottom: 4,
  },
  appSubtitle: {
    fontSize: 16,
    color: '#767676',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 20,
  },
  formContainer: {
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C1C1E',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 50,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#FFF',
    height: 50,
  },
  primaryButton: {
    backgroundColor: '#FF9500', // iOS orange color
    borderRadius: 10,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
    shadowColor: '#FF9500',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  primaryButtonText: {
    color: '#000', // Black text on orange button like iOS
    fontSize: 17,
    fontWeight: '600',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
    alignItems: 'center',
  },
  switchText: {
    color: '#999',
    fontSize: 15,
    marginRight: 5,
  },
  switchActionText: {
    color: '#FF9500', // iOS orange
    fontSize: 15,
    fontWeight: '600',
  },
  skipButton: {
    paddingVertical: 15,
    alignItems: 'center',
  },
  skipButtonText: {
    color: '#767676',
    fontSize: 15,
  },
});

export default LoginScreen;
