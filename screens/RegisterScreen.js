// RegisterScreen.js - หน้าสมัครสมาชิก
import React, { useState } from "react";
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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { FontAwesome, MaterialIcons } from "@expo/vector-icons";
import { supabase } from "../supabase.config";
import { UserAuth } from "../models/UserAuth";

const RegisterScreen = ({ navigation }) => {
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  
  const { register } = UserAuth();

  const handleRegister = async () => {
    // Validate inputs
    if (!name || !username || !email || !password || !confirmPassword) {
      Alert.alert("ข้อผิดพลาด", "กรุณากรอกข้อมูลให้ครบทุกช่อง");
      return;
    }

    // Validate username format (ไม่มีเว้นวรรค และความยาวขั้นต่ำ 3 ตัวอักษร)
    if (username.length < 3 || username.includes(' ')) {
      Alert.alert("ข้อผิดพลาด", "ชื่อผู้ใช้ต้องมีความยาวอย่างน้อย 3 ตัวอักษร และห้ามมีเว้นวรรค");
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert("ข้อผิดพลาด", "รูปแบบอีเมลไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง");
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

    // ตรวจสอบว่าชื่อผู้ใช้ซ้ำหรือไม่
    try {
      const { data: existingUser, error: usernameError } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', username.trim())
        .single();

      if (existingUser) {
        Alert.alert("ข้อผิดพลาด", "ชื่อผู้ใช้นี้ถูกใช้งานแล้ว กรุณาเลือกชื่อผู้ใช้อื่น");
        return;
      }
    } catch (error) {
      // ไม่พบผู้ใช้ สามารถดำเนินการต่อได้
      console.log("Username check - no existing user found");
    }

    setLoading(true);
    try {
      // Register user with Supabase Auth
      const { data, error } = await register(email, password, {
        name: name,
        username: username.trim(),
        created_at: new Date().toISOString()
      });

      if (error) throw error;

      Alert.alert(
        "สมัครสมาชิกสำเร็จ", 
        "กรุณายืนยันอีเมลของคุณก่อนเข้าสู่ระบบ",
        [{ text: "ตกลง", onPress: () => navigation.navigate("Login") }]
      );
    } catch (error) {
      console.error("Registration error:", error);
      let errorMessage = "ไม่สามารถสมัครสมาชิกได้ กรุณาลองอีกครั้ง";

      if (error.message?.includes('already registered')) {
        errorMessage = "อีเมลนี้ถูกใช้งานแล้ว กรุณาใช้อีเมลอื่น";
      } else if (error.message?.includes('weak password')) {
        errorMessage = "รหัสผ่านไม่ปลอดภัย กรุณาใช้รหัสผ่านที่ซับซ้อนมากขึ้น";
      } else if (error.message?.includes('invalid email')) {
        errorMessage = "รูปแบบอีเมลไม่ถูกต้อง";
      }

      Alert.alert("สมัครสมาชิกไม่สำเร็จ", errorMessage);
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
          <View style={styles.logoContainer}>
            <Image
              source={require("../assets/logo.png")}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.title}>สมัครสมาชิก</Text>
            <Text style={styles.subtitle}>
              สร้างบัญชีใหม่เพื่อใช้งานแอปนาฬิกาปลุก
            </Text>
          </View>

          <View style={styles.formContainer}>
            <View style={styles.inputContainer}>
              <FontAwesome name="user" size={20} color="#6B7280" style={styles.icon} />
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="ชื่อของคุณ"
                placeholderTextColor="#6B7280"
                autoCapitalize="words"
              />
            </View>

            <View style={styles.inputContainer}>
              <FontAwesome name="id-badge" size={20} color="#6B7280" style={styles.icon} />
              <TextInput
                style={styles.input}
                value={username}
                onChangeText={setUsername}
                placeholder="ชื่อผู้ใช้"
                placeholderTextColor="#6B7280"
                autoCapitalize="none"
              />
            </View>

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

            <View style={styles.inputContainer}>
              <MaterialIcons name="lock" size={20} color="#6B7280" style={styles.icon} />
              <TextInput
                style={styles.input}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="ยืนยันรหัสผ่าน"
                placeholderTextColor="#6B7280"
                secureTextEntry
              />
            </View>

            <TouchableOpacity
              style={styles.registerButton}
              onPress={handleRegister}
              disabled={loading}
            >
              <LinearGradient
                colors={["#4F46E5", "#6B46E5"]}
                style={styles.gradientButton}
              >
                <Text style={styles.registerButtonText}>
                  {loading ? "กำลังสมัครสมาชิก..." : "สมัครสมาชิก"}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>มีบัญชีอยู่แล้ว? </Text>
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
  registerButton: {
    marginTop: 10,
  },
  gradientButton: {
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: "center",
  },
  registerButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
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

export default RegisterScreen;
