// ProfileScreen.js - User profile and settings screen
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Image,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { UserAuth } from "../models/UserAuth";

const ProfileScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(false);
  const { user, logout } = UserAuth();

  const handleLogout = async () => {
    Alert.alert(
      "ยืนยันการออกจากระบบ",
      "คุณต้องการออกจากระบบใช่หรือไม่?",
      [
        {
          text: "ยกเลิก",
          style: "cancel",
        },
        {
          text: "ออกจากระบบ",
          onPress: async () => {
            setLoading(true);
            try {
              await logout();
              // Firebase Auth state change will handle navigation
            } catch (error) {
              console.error("Logout error:", error);
              Alert.alert(
                "เกิดข้อผิดพลาด",
                "ไม่สามารถออกจากระบบได้ กรุณาลองอีกครั้ง"
              );
            } finally {
              setLoading(false);
            }
          },
          style: "destructive",
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <View style={styles.profileImageContainer}>
            <Icon name="account-circle" size={80} color="#4F46E5" />
          </View>
          <Text style={styles.userName}>{user?.displayName || "ผู้ใช้"}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>บัญชีผู้ใช้</Text>

          <TouchableOpacity style={styles.menuItem}>
            <Icon name="account-edit" size={24} color="#4F46E5" />
            <Text style={styles.menuItemText}>แก้ไขโปรไฟล์</Text>
            <Icon name="chevron-right" size={24} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <Icon name="lock-reset" size={24} color="#4F46E5" />
            <Text style={styles.menuItemText}>เปลี่ยนรหัสผ่าน</Text>
            <Icon name="chevron-right" size={24} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>การตั้งค่า</Text>

          <TouchableOpacity style={styles.menuItem}>
            <Icon name="bell-outline" size={24} color="#4F46E5" />
            <Text style={styles.menuItemText}>การแจ้งเตือน</Text>
            <Icon name="chevron-right" size={24} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <Icon name="theme-light-dark" size={24} color="#4F46E5" />
            <Text style={styles.menuItemText}>ธีม</Text>
            <Icon name="chevron-right" size={24} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>เกี่ยวกับ</Text>

          <TouchableOpacity style={styles.menuItem}>
            <Icon name="information-outline" size={24} color="#4F46E5" />
            <Text style={styles.menuItemText}>เกี่ยวกับแอป</Text>
            <Icon name="chevron-right" size={24} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <Icon name="help-circle-outline" size={24} color="#4F46E5" />
            <Text style={styles.menuItemText}>ช่วยเหลือ</Text>
            <Icon name="chevron-right" size={24} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <>
              <Icon name="logout" size={24} color="white" style={styles.logoutIcon} />
              <Text style={styles.logoutText}>ออกจากระบบ</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#12111D",
  },
  scrollContainer: {
    padding: 16,
  },
  header: {
    alignItems: "center",
    marginVertical: 24,
  },
  profileImageContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#1F1E2C",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  userName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: "#9CA3AF",
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#D8D5F5",
    marginBottom: 12,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1F1E2C",
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  menuItemText: {
    flex: 1,
    fontSize: 16,
    color: "white",
    marginLeft: 12,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EF4444",
    padding: 16,
    borderRadius: 12,
    marginVertical: 24,
  },
  logoutIcon: {
    marginRight: 8,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "white",
  },
});

export default ProfileScreen;
