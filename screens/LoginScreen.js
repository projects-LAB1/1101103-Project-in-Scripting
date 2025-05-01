// 1. หน้าล็อกอิน (LoginScreen.js)
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
  Keyboard,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '../contexts/AuthContext';
import { BlurView } from 'expo-blur';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import { auth } from '../config/firebaseConfig';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';

WebBrowser.maybeCompleteAuthSession();

const { width } = Dimensions.get('window');

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleSignInLoading, setGoogleSignInLoading] = useState(false);
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const { login } = useAuth();

  // Animation values
  const logoOpacity = new Animated.Value(1);
  const formTranslateY = new Animated.Value(0);

  useEffect(() => {
    const keyboardWillShow = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => {
        setKeyboardVisible(true);
        Animated.parallel([
          Animated.timing(logoOpacity, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(formTranslateY, {
            toValue: -100,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start();
      }
    );

    const keyboardWillHide = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardVisible(false);
        Animated.parallel([
          Animated.timing(logoOpacity, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(formTranslateY, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start();
      }
    );

    return () => {
      keyboardWillShow.remove();
      keyboardWillHide.remove();
    };
  }, []);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("ข้อผิดพลาด", "กรุณากรอกอีเมลและรหัสผ่าน");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert("ข้อผิดพลาด", "รูปแบบอีเมลไม่ถูกต้อง");
      return;
    }

    setLoading(true);
    try {
      const result = await login(email.trim(), password);
      if (!result.success) {
        Alert.alert(
          "ล็อกอินไม่สำเร็จ",
          result.error || "อีเมลหรือรหัสผ่านไม่ถูกต้อง"
        );
      }
    } catch (error) {
      Alert.alert(
        "ล็อกอินไม่สำเร็จ",
        "เกิดข้อผิดพลาดในการเข้าสู่ระบบ โปรดลองอีกครั้ง"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setGoogleSignInLoading(true);
      
      // ใช้ email/password login แทน Google Sign-in เพื่อการทดสอบ
      Alert.alert(
        "Google Sign-in ไม่พร้อมใช้งาน",
        "ระบบเข้าสู่ระบบด้วย Google ยังอยู่ในระหว่างการพัฒนา โปรดใช้การเข้าสู่ระบบด้วยอีเมลและรหัสผ่านแทน"
      );
    } catch (error) {
      console.error('Error with Google sign-in:', error);
      Alert.alert(
        'ล็อกอินไม่สำเร็จ',
        'เกิดข้อผิดพลาดในการเข้าสู่ระบบด้วย Google'
      );
    } finally {
      setGoogleSignInLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardContainer}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View style={[styles.logoContainer, { opacity: logoOpacity }]}>
            <View style={styles.logoBackground}>
              <MaterialCommunityIcons name="alarm" size={80} color="#FF9500" />
            </View>
            <Text style={styles.appName}>Clock</Text>
            <Text style={styles.appSubtitle}>นาฬิกาปลุกอัจฉริยะ</Text>
          </Animated.View>

          <Animated.View 
            style={[
              styles.formContainer,
              { transform: [{ translateY: formTranslateY }] }
            ]}
          >
            <View style={styles.inputWrapper}>
              <MaterialCommunityIcons name="email-outline" size={24} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="อีเมล"
                placeholderTextColor="#666"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
              />
            </View>

            <View style={styles.inputWrapper}>
              <MaterialCommunityIcons name="lock-outline" size={24} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="รหัสผ่าน"
                placeholderTextColor="#666"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoComplete="password"
              />
            </View>

            <TouchableOpacity
              style={[styles.primaryButton, loading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#000000" />
              ) : (
                <Text style={styles.primaryButtonText}>เข้าสู่ระบบ</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.linkButton}
              onPress={() => navigation.navigate("ForgotPassword")}
            >
              <Text style={styles.linkButtonText}>ลืมรหัสผ่าน?</Text>
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>หรือ</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity
              style={styles.socialButton}
              onPress={handleGoogleSignIn}
              disabled={googleSignInLoading}
            >
              {googleSignInLoading ? (
                <ActivityIndicator size="small" color="#333" />
              ) : (
                <>
                  <MaterialCommunityIcons name="google" size={24} color="#DB4437" style={styles.socialIcon} />
                  <Text style={styles.socialButtonText}>เข้าสู่ระบบด้วย Google</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.outlineButton}
              onPress={() => navigation.navigate("Register")}
            >
              <Text style={styles.outlineButtonText}>สมัครสมาชิกใหม่</Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
  },
  logoContainer: {
    alignItems: "center",
    marginTop: 40,
    marginBottom: 48,
  },
  logoBackground: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 149, 0, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: "#FF9500",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
  },
  appName: {
    fontSize: 36,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 8,
  },
  appSubtitle: {
    fontSize: 17,
    color: "#A0A0A0",
    marginBottom: 24,
  },
  formContainer: {
    width: "100%",
    paddingHorizontal: 16,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: "#1C1C1E",
    borderRadius: 14,
    marginBottom: 16,
    paddingHorizontal: 16,
    height: 56,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 3,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 17,
    height: '100%',
  },
  // ปุ่มหลัก (เข้าสู่ระบบ)
  primaryButton: {
    backgroundColor: "#FF9500",
    borderRadius: 14,
    height: 56,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 24,
    shadowColor: "#FF9500",
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  primaryButtonText: {
    color: "#000000",
    fontSize: 17,
    fontWeight: "600",
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  // ปุ่มลิงก์ (ลืมรหัสผ่าน)
  linkButton: {
    height: 44,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 16,
  },
  linkButtonText: {
    color: "#FF9500",
    fontSize: 16,
    fontWeight: "500",
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 32,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#333",
  },
  dividerText: {
    color: "#A0A0A0",
    fontSize: 15,
    marginHorizontal: 16,
    fontWeight: "500",
  },
  // ปุ่ม Social (Google)
  socialButton: {
    flexDirection: 'row',
    height: 56,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5,
  },
  socialIcon: {
    marginRight: 12,
  },
  socialButtonText: {
    color: "#333333",
    fontSize: 17,
    fontWeight: "600",
  },
  // ปุ่ม Outline (สมัครสมาชิก)
  outlineButton: {
    height: 56,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "#FF9500",
    backgroundColor: 'rgba(255, 149, 0, 0.1)',
  },
  outlineButtonText: {
    color: "#FF9500",
    fontSize: 17,
    fontWeight: "600",
  },
});

export default LoginScreen;
