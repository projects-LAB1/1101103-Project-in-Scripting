// 1. หน้าล็อกอิน (LoginScreen.js)
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { FontAwesome, MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserAuth } from '../models/UserAuth';

const LoginScreen = ({ navigation }) => {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const auth = UserAuth();

  useEffect(() => {
    // ตรวจสอบว่า auth พร้อมใช้งานหรือไม่
    if (auth) {
      setAuthReady(true);
    } else {
      console.error("Auth context is not available");
    }
  }, [auth]);

  const handleLogin = async () => {
    if (!identifier || !password) {
      Alert.alert("ข้อผิดพลาด", "กรุณากรอกชื่อผู้ใช้หรืออีเมล และรหัสผ่าน");
      return;
    }

    if (!auth || typeof auth.login !== 'function') {
      console.error("Auth login function is not available");
      Alert.alert("ข้อผิดพลาด", "ไม่สามารถเชื่อมต่อกับระบบได้ กรุณาลองใหม่อีกครั้ง");
      return;
    }

    setLoading(true);
    try {
      const { session } = await auth.login(identifier.trim(), password);
      // Store session token
      if (session?.access_token) {
        await AsyncStorage.setItem('@session_token', session.access_token);
      }
    } catch (error) {
      console.error('Login error:', error);
      let errorMessage = "เกิดข้อผิดพลาดระหว่างการเข้าสู่ระบบ";
      
      switch (error.message) {
        case 'Invalid login credentials':
          errorMessage = "ชื่อผู้ใช้/อีเมล หรือรหัสผ่านไม่ถูกต้อง กรุณาลองอีกครั้ง";
          break;
        case 'Email not confirmed':
          errorMessage = "กรุณายืนยันอีเมลก่อนเข้าสู่ระบบ";
          break;
        case 'User not found':
          errorMessage = "ไม่พบบัญชีที่ใช้ชื่อผู้ใช้หรืออีเมลนี้ กรุณาตรวจสอบหรือสมัครสมาชิกก่อน";
          break;
        default:
          if (error.message && error.message.includes('network')) {
            errorMessage = "เกิดข้อผิดพลาดเครือข่าย กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต";
          }
      }
      
      Alert.alert("เข้าสู่ระบบไม่สำเร็จ", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (!auth || typeof auth.signInWithGoogle !== 'function') {
      console.error("Google sign-in function is not available");
      Alert.alert("ข้อผิดพลาด", "ไม่สามารถเชื่อมต่อกับระบบล็อกอิน Google ได้");
      return;
    }

    setGoogleLoading(true);
    try {
      const data = await auth.signInWithGoogle();
      if (data?.session?.access_token) {
        await AsyncStorage.setItem('@session_token', data.session.access_token);
      }
    } catch (error) {
      console.error('Google sign-in error:', error);
      Alert.alert(
        "เข้าสู่ระบบด้วย Google ไม่สำเร็จ",
        "เกิดข้อผิดพลาดขณะเข้าสู่ระบบด้วย Google กรุณาลองอีกครั้ง"
      );
    } finally {
      setGoogleLoading(false);
    }
  };

  if (!authReady) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6B46E5" />
          <Text style={styles.loadingText}>กำลังโหลด...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardContainer}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.logoContainer}>
            <Image
              source={require("../assets/logo.png")}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.title}>เข้าสู่ระบบ</Text>
          </View>

          <View style={styles.formContainer}>
            <View style={styles.inputContainer}>
              <FontAwesome name="user" size={20} color="#6B7280" style={styles.icon} />
              <TextInput
                style={styles.input}
                placeholder="ชื่อผู้ใช้หรืออีเมล"
                placeholderTextColor="#6B7280"
                value={identifier}
                onChangeText={setIdentifier}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputContainer}>
              <MaterialIcons name="lock" size={20} color="#6B7280" style={styles.icon} />
              <TextInput
                style={styles.input}
                placeholder="รหัสผ่าน"
                placeholderTextColor="#6B7280"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            <TouchableOpacity
              style={styles.loginButton}
              onPress={handleLogin}
              disabled={loading}
            >
              <LinearGradient
                colors={["#4F46E5", "#6B46E5"]}
                style={styles.gradientButton}
              >
                <Text style={styles.loginButtonText}>
                  {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.forgotButton}
              onPress={() => navigation.navigate("ForgotPassword")}
            >
              <Text style={styles.forgotButtonText}>ลืมรหัสผ่าน?</Text>
            </TouchableOpacity>

            <View style={styles.dividerContainer}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>หรือเข้าสู่ระบบด้วย</Text>
              <View style={styles.divider} />
            </View>

            <View style={styles.socialButtonsContainer}>
              <TouchableOpacity style={styles.socialButton}>
                <FontAwesome name="facebook" size={20} color="#1877F2" />
                <Text style={styles.socialButtonText}>Facebook</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.socialButton, googleLoading && styles.disabledButton]}
                onPress={handleGoogleSignIn}
                disabled={googleLoading}
              >
                {googleLoading ? (
                  <ActivityIndicator size="small" color="#DB4437" />
                ) : (
                  <>
                    <FontAwesome name="google" size={20} color="#DB4437" />
                    <Text style={styles.socialButtonText}>Google</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.signupContainer}>
              <Text style={styles.signupText}>ยังไม่มีบัญชี? </Text>
              <TouchableOpacity onPress={() => navigation.navigate("Register")}>
                <Text style={styles.signupLink}>สมัครสมาชิก</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1E1E2C",
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#FFFFFF',
    marginTop: 20,
    fontSize: 16,
  },
  logoContainer: {
    alignItems: "center",
    marginTop: 50,
    marginBottom: 30,
  },
  logo: {
    width: 100,
    height: 100,
    tintColor: "#6B46E5",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginTop: 10,
  },
  formContainer: {
    marginTop: 20,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2C2C3A",
    borderRadius: 10,
    paddingHorizontal: 10,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#3A3A4A",
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: "#FFFFFF",
    paddingVertical: 14,
    fontSize: 16,
  },
  loginButton: {
    marginTop: 10,
  },
  gradientButton: {
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: "center",
  },
  loginButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  forgotButton: {
    alignItems: "center",
    marginTop: 15,
  },
  forgotButtonText: {
    color: "#A3A3C2",
    fontSize: 14,
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: "#3A3A4A",
  },
  dividerText: {
    color: "#A3A3C2",
    fontSize: 14,
    marginHorizontal: 10,
  },
  socialButtonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  socialButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2C2C3A",
    borderRadius: 10,
    padding: 10,
    flex: 0.48,
    height: 50,
    borderWidth: 1,
    borderColor: "#3A3A4A",
  },
  socialButtonText: {
    color: "#FFFFFF",
    marginLeft: 10,
    fontSize: 14,
  },
  signupContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 25,
  },
  signupText: {
    color: "#A3A3C2",
    fontSize: 14,
  },
  signupLink: {
    color: "#6B46E5",
    fontSize: 14,
    fontWeight: "bold",
  },
  disabledButton: {
    opacity: 0.7,
  },
});

export default LoginScreen;
