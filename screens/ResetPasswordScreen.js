// ResetPasswordScreen.js - หน้าตั้งรหัสผ่านใหม่
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
  Image,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons } from "@expo/vector-icons";
import { UserAuth } from "../models/UserAuth";
import { supabase } from "../supabase.config";

const ResetPasswordScreen = ({ navigation }) => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const auth = UserAuth();

  // ตรวจสอบว่าเป็นลิงก์สำหรับรีเซ็ตรหัสผ่านหรือไม่
  useEffect(() => {
    const checkSession = async () => {
      try {
        setInitializing(true);
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Error getting session:", error);
          Alert.alert(
            "ลิงก์รีเซ็ตรหัสผ่านไม่ถูกต้อง",
            "กรุณาขอลิงก์รีเซ็ตรหัสผ่านใหม่",
            [{ text: "กลับไปหน้าลืมรหัสผ่าน", onPress: () => navigation.navigate("ForgotPassword") }]
          );
        } else {
          console.log("Session data:", data);
        }
      } catch (error) {
        console.error("Error in checkSession:", error);
      } finally {
        setInitializing(false);
      }
    };

    checkSession();
  }, [navigation]);

  const handleResetPassword = async () => {
    // ตรวจสอบว่า auth มีค่าและมีฟังก์ชัน updatePassword
    if (!auth || typeof auth.updatePassword !== 'function') {
      console.error("Auth context is not available or updatePassword is not a function");
      Alert.alert("ข้อผิดพลาด", "ไม่สามารถเชื่อมต่อกับระบบยืนยันตัวตนได้ กรุณาลองใหม่อีกครั้ง");
      return;
    }

    // ตรวจสอบความถูกต้องของรหัสผ่าน
    if (!password || !confirmPassword) {
      Alert.alert("ข้อผิดพลาด", "กรุณากรอกรหัสผ่านให้ครบทุกช่อง");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("ข้อผิดพลาด", "รหัสผ่านไม่ตรงกัน กรุณาตรวจสอบอีกครั้ง");
      return;
    }

    if (password.length < 6) {
      Alert.alert("ข้อผิดพลาด", "รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร");
      return;
    }

    setLoading(true);
    try {
      const { success } = await auth.updatePassword(password);
      
      if (success) {
        setSuccess(true);
        Alert.alert(
          "เปลี่ยนรหัสผ่านสำเร็จ",
          "คุณสามารถเข้าสู่ระบบด้วยรหัสผ่านใหม่ได้ทันที",
          [{ text: "เข้าสู่ระบบ", onPress: () => navigation.navigate("Login") }]
        );
      }
    } catch (error) {
      console.error("Reset password error:", error);
      let errorMessage = "เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน กรุณาลองอีกครั้ง";
      
      if (error.message?.includes('expired')) {
        errorMessage = "ลิงก์รีเซ็ตรหัสผ่านหมดอายุ กรุณาขอลิงก์ใหม่";
      }
      
      Alert.alert("ข้อผิดพลาด", errorMessage, [
        { text: "ขอลิงก์ใหม่", onPress: () => navigation.navigate("ForgotPassword") }
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (initializing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6B46E5" />
          <Text style={styles.loadingText}>กำลังตรวจสอบข้อมูล...</Text>
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
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.navigate("Login")}
          >
            <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>

          <View style={styles.logoContainer}>
            <Image
              source={require("../assets/logo.png")}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.title}>รีเซ็ตรหัสผ่าน</Text>
            <Text style={styles.subtitle}>
              กรุณากำหนดรหัสผ่านใหม่ของคุณ
            </Text>
          </View>

          <View style={styles.formContainer}>
            <View style={styles.inputContainer}>
              <MaterialIcons name="lock" size={20} color="#6B7280" style={styles.icon} />
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="รหัสผ่านใหม่"
                placeholderTextColor="#6B7280"
                secureTextEntry
                editable={!success}
              />
            </View>

            <View style={styles.inputContainer}>
              <MaterialIcons name="lock" size={20} color="#6B7280" style={styles.icon} />
              <TextInput
                style={styles.input}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="ยืนยันรหัสผ่านใหม่"
                placeholderTextColor="#6B7280"
                secureTextEntry
                editable={!success}
              />
            </View>

            {!success ? (
              <TouchableOpacity
                style={styles.resetButton}
                onPress={handleResetPassword}
                disabled={loading}
              >
                <LinearGradient
                  colors={["#4F46E5", "#6B46E5"]}
                  style={styles.gradientButton}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.resetButtonText}>บันทึกรหัสผ่านใหม่</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            ) : (
              <View style={styles.successContainer}>
                <MaterialIcons name="check-circle" size={60} color="#4F46E5" style={styles.successIcon} />
                <Text style={styles.successText}>
                  เปลี่ยนรหัสผ่านสำเร็จแล้ว คุณสามารถเข้าสู่ระบบด้วยรหัสผ่านใหม่ได้ทันที
                </Text>
              </View>
            )}

            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>จำรหัสผ่านได้แล้ว? </Text>
              <TouchableOpacity onPress={() => navigation.navigate("Login")}>
                <Text style={styles.loginLink}>เข้าสู่ระบบ</Text>
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
  backButton: {
    marginTop: 10,
    marginBottom: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  logoContainer: {
    alignItems: "center",
    marginTop: 20,
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
    paddingHorizontal: 20,
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
  resetButton: {
    marginTop: 10,
  },
  gradientButton: {
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: "center",
  },
  resetButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  successContainer: {
    alignItems: "center",
    marginTop: 20,
    padding: 20,
    backgroundColor: "#2C2C3A",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#3A3A4A",
  },
  successIcon: {
    marginBottom: 20,
  },
  successText: {
    fontSize: 14,
    color: "#FFFFFF",
    textAlign: "center",
    lineHeight: 20,
  },
  loginContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 25,
  },
  loginText: {
    color: "#A3A3C2",
    fontSize: 14,
  },
  loginLink: {
    color: "#6B46E5",
    fontSize: 14,
    fontWeight: "bold",
  },
});

export default ResetPasswordScreen; 