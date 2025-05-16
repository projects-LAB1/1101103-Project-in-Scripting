// 1. หน้าล็อกอิน (LoginScreen.js)
import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '../contexts/AuthContext';

// Import custom components
import InputField from '../components/inputs/InputField';
import CustomButton from '../components/buttons/CustomButton';

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
            
              <InputField
                placeholder="อีเมล"
                icon="email-outline"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
              
              <InputField
                placeholder="รหัสผ่าน"
                icon="lock-outline"
                secureTextEntry
                isPassword={true}
                value={password}
                onChangeText={setPassword}
              />
              
              {!isRegistering && (
                <TouchableOpacity 
                  style={styles.forgotPasswordContainer}
                  onPress={() => navigation.navigate('ResetPassword')}
                >
                  <Text style={styles.forgotPasswordText}>ลืมรหัสผ่าน?</Text>
                </TouchableOpacity>
              )}
              
              <CustomButton
                title={isRegistering ? 'สร้างบัญชี' : 'เข้าสู่ระบบ'}
                onPress={handleAuthentication}
                isLoading={loading}
                type="primary"
                size="large"
                style={styles.authButton}
              />
              
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
            
            <CustomButton
              title="ข้ามการเข้าสู่ระบบ"
              onPress={() => navigation.navigate('Main')}
              type="secondary"
              size="medium"
              style={styles.skipButton}
            />
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
  forgotPasswordContainer: {
    alignSelf: 'flex-end',
    marginTop: 8,
    marginBottom: 16,
  },
  forgotPasswordText: {
    color: '#FF9500',
    fontSize: 14,
  },
  authButton: {
    marginTop: 8,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
  },
  switchText: {
    color: '#767676',
    fontSize: 14,
    marginRight: 4,
  },
  switchActionText: {
    color: '#FF9500',
    fontSize: 14,
    fontWeight: '600',
  },
  skipButton: {
    marginBottom: 16,
  },
});

export default LoginScreen;
