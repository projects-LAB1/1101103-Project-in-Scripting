import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  ScrollView,
  Platform,
  Linking,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { isAppExitMonitoringEnabled, setAppExitMonitoring } from '../utils/AppStateManager';
import { useAuth } from '../contexts/AuthContext';

const SettingsScreen = ({ navigation }) => {
  const [exitMonitoringEnabled, setExitMonitoringEnabled] = useState(true);
  const [notificationsPermissionGranted, setNotificationsPermissionGranted] = useState(false);
  const { user, logout } = useAuth();
  
  // Load settings on component mount
  useEffect(() => {
    loadSettings();
    checkNotificationPermissions();
  }, []);

  // Load user settings from AsyncStorage
  const loadSettings = async () => {
    try {
      const isEnabled = await isAppExitMonitoringEnabled();
      setExitMonitoringEnabled(isEnabled);
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  // Check notification permissions
  const checkNotificationPermissions = async () => {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      setNotificationsPermissionGranted(status === 'granted');
    } catch (error) {
      console.error('Error checking notification permissions:', error);
    }
  };
  
  // Toggle exit monitoring setting
  const toggleExitMonitoring = async (value) => {
    try {
      if (value && !notificationsPermissionGranted) {
        // If trying to enable but no notification permissions, request them
        const { status } = await Notifications.requestPermissionsAsync();
        
        if (status !== 'granted') {
          Alert.alert(
            'การแจ้งเตือนถูกปิดใช้งาน',
            'คุณต้องเปิดการแจ้งเตือนเพื่อใช้คุณสมบัตินี้',
            [
              { text: 'ยกเลิก', style: 'cancel' },
              { text: 'ไปที่การตั้งค่า', onPress: openSettings }
            ]
          );
          return;
        }
        
        setNotificationsPermissionGranted(true);
      }
      
      await setAppExitMonitoring(value);
      setExitMonitoringEnabled(value);
    } catch (error) {
      console.error('Error toggling app exit monitoring:', error);
    }
  };
  
  // Open app settings
  const openSettings = () => {
    if (Platform.OS === 'ios') {
      Linking.openURL('app-settings:');
    } else {
      Linking.openSettings();
    }
  };
  
  // ออกจากระบบ
  const handleLogout = async () => {
    Alert.alert(
      'ออกจากระบบ',
      'คุณต้องการออกจากระบบหรือไม่?',
      [
        { text: 'ยกเลิก', style: 'cancel' },
        { 
          text: 'ออกจากระบบ', 
          style: 'destructive', 
          onPress: async () => {
            try {
              const result = await logout();
              if (result.success) {
                navigation.navigate('Login');
              } else {
                Alert.alert('เกิดข้อผิดพลาด', result.error || 'ไม่สามารถออกจากระบบได้');
              }
            } catch (error) {
              Alert.alert('เกิดข้อผิดพลาด', error.message || 'ไม่สามารถออกจากระบบได้');
            }
          } 
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.screenTitle}>ตั้งค่า</Text>
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>การแจ้งเตือน</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingTextContainer}>
              <Text style={styles.settingTitle}>แจ้งเตือนเมื่อออกจากแอป</Text>
              <Text style={styles.settingDescription}>
                แสดงการแจ้งเตือนเต็มหน้าจอเมื่อออกจากแอปหรือปิดหน้าจอ
              </Text>
            </View>
            <Switch
              value={exitMonitoringEnabled}
              onValueChange={toggleExitMonitoring}
              trackColor={{ false: '#767577', true: '#FF950050' }}
              thumbColor={exitMonitoringEnabled ? '#FF9500' : '#f4f3f4'}
              ios_backgroundColor='#3e3e3e'
            />
          </View>
          
          <TouchableOpacity 
            style={styles.settingItem}
            onPress={openSettings}
          >
            <View style={styles.settingTextContainer}>
              <Text style={styles.settingTitle}>การตั้งค่าการแจ้งเตือน</Text>
              <Text style={styles.settingDescription}>
                ตั้งค่าการแจ้งเตือนในการตั้งค่าระบบ
              </Text>
            </View>
            <MaterialCommunityIcons
              name="chevron-right"
              size={24}
              color="#666"
            />
          </TouchableOpacity>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>บัญชีผู้ใช้</Text>
          
          {user ? (
            <>
              <View style={styles.userInfoContainer}>
                <View style={styles.userAvatarPlaceholder}>
                  <MaterialCommunityIcons name="account" size={40} color="#666" />
                </View>
                <View style={styles.userDetails}>
                  <Text style={styles.userName}>{user.displayName || 'ผู้ใช้งาน'}</Text>
                  <Text style={styles.userEmail}>{user.email}</Text>
                </View>
              </View>
              
              <TouchableOpacity 
                style={[styles.settingItem, styles.logoutButton]}
                onPress={handleLogout}
              >
                <Text style={styles.logoutText}>ออกจากระบบ</Text>
                <MaterialCommunityIcons
                  name="logout"
                  size={24}
                  color="#FF3B30"
                />
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity 
              style={[styles.settingItem, styles.loginButton]}
              onPress={() => navigation.navigate('Login')}
            >
              <Text style={styles.loginText}>เข้าสู่ระบบ</Text>
              <MaterialCommunityIcons
                name="login"
                size={24}
                color="#FF9500"
              />
            </TouchableOpacity>
          )}
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>เกี่ยวกับแอป</Text>
          
          <TouchableOpacity style={styles.settingItem}>
            <Text style={styles.settingTitle}>เวอร์ชัน</Text>
            <Text style={styles.versionText}>1.0.0</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  screenTitle: {
    fontSize: 34,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 10,
    marginBottom: 20,
    marginLeft: 16,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    marginBottom: 32,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FF9500',
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: '#333',
  },
  settingTextContainer: {
    flex: 1,
    marginRight: 16,
  },
  settingTitle: {
    fontSize: 17,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: '#999',
  },
  userInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: '#333',
  },
  userAvatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userDetails: {
    marginLeft: 16,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#999',
  },
  versionText: {
    fontSize: 17,
    color: '#999',
  },
  logoutButton: {
    borderBottomColor: '#FF3B3030',
    borderBottomWidth: 0.5,
  },
  logoutText: {
    fontSize: 17,
    color: '#FF3B30',
    fontWeight: '500',
  },
  loginButton: {
    borderBottomColor: '#FF950030',
  },
  loginText: {
    fontSize: 17,
    color: '#FF9500',
    fontWeight: '500',
  },
});

export default SettingsScreen; 