// ForgotPasswordScreen.js - หน้าลืมรหัสผ่าน
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
import { FontAwesome, MaterialIcons } from "@expo/vector-icons";
import { UserAuth } from "../models/UserAuth";

const ForgotPasswordScreen = ({ navigation }) => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const auth = UserAuth();
  
  useEffect(() => {
    if (!auth) {
      console.error("Auth context is not available");
    }
  }, [auth]);

  const handleResetPassword = async () => {
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      Alert.alert("ข้อผิดพลาด", "กรุณากรอกอีเมลให้ถูกต้อง");
      return;
    }

    // Check if auth context is available
    if (!auth || typeof auth.resetPassword !== 'function') {
      console.error("Auth resetPassword function is not available");
      Alert.alert("ข้อผิดพลาด", "ไม่สามารถเชื่อมต่อกับระบบได้ กรุณาลองใหม่อีกครั้ง");
      return;
    }

    setLoading(true);
    try {
      const { success } = await auth.resetPassword(email);
      
      if (success) {
        setSuccess(true);
        Alert.alert(
          "ส่งคำขอรีเซ็ตรหัสผ่านสำเร็จ",
          "กรุณาตรวจสอบอีเมลของคุณเพื่อดำเนินการรีเซ็ตรหัสผ่าน"
        );
      }
    } catch (error) {
      console.error("Reset password error:", error);
      let errorMessage = "เกิดข้อผิดพลาดในการรีเซ็ตรหัสผ่าน กรุณาลองอีกครั้ง";
      
      if (error.message?.includes('Email not found')) {
        errorMessage = "ไม่พบอีเมลนี้ในระบบ กรุณาตรวจสอบอีกครั้ง";
      }
      
      Alert.alert("ข้อผิดพลาด", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardContainer}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>

          <View style={styles.logoContainer}>
            <Image
              source={require("../assets/logo.png")}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.title}>ลืมรหัสผ่าน</Text>
            <Text style={styles.subtitle}>
              กรุณากรอกอีเมลของคุณเพื่อรีเซ็ตรหัสผ่าน
            </Text>
          </View>

          <View style={styles.formContainer}>
            <View style={styles.inputContainer}>
              <MaterialIcons name="email" size={20} color="#6B7280" style={styles.icon} />
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="อีเมลของคุณ"
                placeholderTextColor="#6B7280"
                keyboardType="email-address"
                autoCapitalize="none"
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
                    <Text style={styles.resetButtonText}>รีเซ็ตรหัสผ่าน</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            ) : (
              <View style={styles.successContainer}>
                <MaterialIcons name="check-circle" size={60} color="#4F46E5" style={styles.successIcon} />
                <Text style={styles.successText}>
                  กรุณาตรวจสอบอีเมลของคุณและทำตามขั้นตอนเพื่อรีเซ็ตรหัสผ่าน
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

export default ForgotPasswordScreen; 