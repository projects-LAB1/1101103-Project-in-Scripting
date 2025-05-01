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

const LoginScreen = ({ route, navigation }) => {
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

  // Check for test credentials passed from RegisterScreen
  useEffect(() => {
    if (route.params?.testCredentials) {
      const { email, password: testPassword } = route.params.testCredentials;
      setIdentifier(email);
      setPassword(testPassword);
      
      // Auto login with test credentials after a brief delay
      const timer = setTimeout(() => {
        handleLogin(email, testPassword);
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [route.params]);

  const handleLogin = async (overrideEmail = null, overridePassword = null) => {
    try {
      const identifierToUse = overrideEmail || identifier;
      const passwordToUse = overridePassword || password;
      
      if (!identifierToUse || !passwordToUse) {
        Alert.alert("ข้อผิดพลาด", "กรุณากรอกชื่อผู้ใช้หรืออีเมล และรหัสผ่าน");
        return;
      }

      setLoading(true);
      console.log("Attempting login with:", identifierToUse);
      
      const { data, error } = await auth.login(identifierToUse, passwordToUse);

      if (error) {
        console.error("Login error:", error);
        let errorMessage = "ไม่สามารถเข้าสู่ระบบได้";
        let showTestAccount = true;

        // Check specific error conditions
        if (error.message?.toLowerCase().includes("invalid login credentials")) {
          errorMessage = "รหัสผ่านไม่ถูกต้อง กรุณาตรวจสอบและลองอีกครั้ง";
        } else if (error.message?.toLowerCase().includes("user not found") || error.message?.toLowerCase().includes("ไม่พบชื่อผู้ใช้")) {
          errorMessage = "ไม่พบบัญชีผู้ใช้ กรุณาตรวจสอบชื่อผู้ใช้หรืออีเมล หรือสมัครสมาชิกก่อนเข้าสู่ระบบ";
        } else if (error.message?.toLowerCase().includes("email not confirmed")) {
          errorMessage = "กรุณายืนยันอีเมลของคุณก่อนเข้าสู่ระบบ";
          showTestAccount = false;
        } else if (error.message?.toLowerCase().includes("too many requests")) {
          errorMessage = "คุณพยายามเข้าสู่ระบบหลายครั้งเกินไป กรุณารอสักครู่แล้วลองใหม่";
          showTestAccount = false;
        }

        const buttons = [{ text: "ตกลง" }];
        if (showTestAccount) {
          buttons.push({
            text: "ใช้บัญชีทดสอบ",
            onPress: loginWithTestAccount
          });
        }

        Alert.alert("เข้าสู่ระบบไม่สำเร็จ", errorMessage, buttons);
        return;
      }

      console.log("Login successful:", data?.user?.id);
      
      // Store session if available
      if (data?.session?.access_token) {
        await AsyncStorage.setItem('@session_token', data.session.access_token);
      }
    } catch (error) {
      console.error("Login process error:", error);
      Alert.alert(
        "เกิดข้อผิดพลาด",
        "เกิดข้อผิดพลาดในการเข้าสู่ระบบ กรุณาลองใหม่อีกครั้ง",
        [
          { text: "ตกลง" },
          {
            text: "ใช้บัญชีทดสอบ",
            onPress: loginWithTestAccount
          }
        ]
      );
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

  const loginWithTestAccount = () => {
    const testEmail = "test@example.com";
    const testPassword = "password123";
    
    setIdentifier(testEmail);
    setPassword(testPassword);
    
    // Show a loading message
    Alert.alert(
      "เข้าสู่ระบบด้วยบัญชีทดสอบ",
      "กำลังเข้าสู่ระบบด้วยบัญชีทดสอบ...",
      [{ text: "ตกลง" }]
    );
    
    // Login after dialog is dismissed
    setTimeout(() => {
      handleLogin(testEmail, testPassword);
    }, 500);
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
            <Text style={styles.subtitle}>
              ยินดีต้อนรับกลับมา! เข้าสู่ระบบเพื่อใช้งานแอปนาฬิกาปลุก
            </Text>
          </View>

          <View style={styles.formContainer}>
            <View style={styles.inputContainer}>
              <MaterialIcons name="alternate-email" size={20} color="#6B7280" style={styles.icon} />
              <TextInput
                style={styles.input}
                value={identifier}
                onChangeText={setIdentifier}
                placeholder="อีเมลหรือชื่อผู้ใช้"
                placeholderTextColor="#6B7280"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputContainer}>
              <MaterialIcons name="lock" size={20} color="#6B7280" style={styles.icon} />
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="รหัสผ่าน"
                placeholderTextColor="#6B7280"
                secureTextEntry
              />
            </View>

            <TouchableOpacity
              style={styles.forgotPasswordContainer}
              onPress={() => navigation.navigate("ForgotPassword")}
            >
              <Text style={styles.forgotPasswordText}>ลืมรหัสผ่าน?</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.loginButton}
              onPress={() => handleLogin()}
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

            {/* Test Account Login Button */}
            <TouchableOpacity
              style={styles.testAccountButton}
              onPress={loginWithTestAccount}
            >
              <Text style={styles.testAccountButtonText}>
                ใช้บัญชีทดสอบ
              </Text>
            </TouchableOpacity>

            <View style={styles.orContainer}>
              <View style={styles.orLine} />
              <Text style={styles.orText}>หรือ</Text>
              <View style={styles.orLine} />
            </View>

            <TouchableOpacity
              style={styles.googleButton}
              onPress={handleGoogleSignIn}
              disabled={googleLoading}
            >
              <FontAwesome name="google" size={20} color="#EA4335" style={styles.googleIcon} />
              <Text style={styles.googleButtonText}>เข้าสู่ระบบด้วย Google</Text>
            </TouchableOpacity>

            <View style={styles.registerContainer}>
              <Text style={styles.registerText}>ยังไม่มีบัญชี? </Text>
              <TouchableOpacity onPress={() => navigation.navigate("Register")}>
                <Text style={styles.registerLink}>สมัครสมาชิก</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#6B46E5" />
          <Text style={styles.loadingText}>กำลังเข้าสู่ระบบ...</Text>
        </View>
      )}
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
    marginTop: 40,
    marginBottom: 30,
  },
  logo: {
    width: 80,
    height: 80,
    tintColor: "#6B46E5",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginTop: 10,
  },
  subtitle: {
    fontSize: 14,
    color: "#A3A3C2",
    textAlign: "center",
    marginTop: 5,
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
  forgotPasswordContainer: {
    alignSelf: "flex-end",
    marginBottom: 15,
  },
  forgotPasswordText: {
    color: "#A3A3C2",
    fontSize: 14,
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
  testAccountButton: {
    marginTop: 15,
    paddingVertical: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#6B46E5",
    borderRadius: 10,
    borderStyle: "dashed",
  },
  testAccountButtonText: {
    color: "#6B46E5",
    fontSize: 14,
    fontWeight: "500",
  },
  orContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
  },
  orLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#3A3A4A",
  },
  orText: {
    color: "#A3A3C2",
    paddingHorizontal: 10,
    fontSize: 14,
  },
  googleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2C2C3A",
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#3A3A4A",
  },
  googleIcon: {
    marginRight: 10,
  },
  googleButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "500",
  },
  registerContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 25,
  },
  registerText: {
    color: "#A3A3C2",
    fontSize: 14,
  },
  registerLink: {
    color: "#6B46E5",
    fontSize: 14,
    fontWeight: "bold",
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#FFFFFF",
    marginTop: 10,
    fontSize: 16,
  },
});

export default LoginScreen;
