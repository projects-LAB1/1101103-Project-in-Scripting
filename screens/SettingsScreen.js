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
import { StatusBar } from 'expo-status-bar';
import { isAppExitMonitoringEnabled, setAppExitMonitoring } from '../utils/AppStateManager';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

// Import animations
import FadeIn from '../components/animations/FadeIn';
import SlideIn from '../components/animations/SlideIn';

const SettingsScreen = ({ navigation }) => {
  const [exitMonitoringEnabled, setExitMonitoringEnabled] = useState(true);
  const [notificationsPermissionGranted, setNotificationsPermissionGranted] = useState(false);
  const { user, logout } = useAuth();
  const { theme, isDark, toggleTheme, themeType, setTheme } = useTheme();
  
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
                navigation.navigate('LoginRoot');
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

  // เลือกธีม
  const handleSelectTheme = (selectedTheme) => {
    setTheme(selectedTheme);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top', 'right', 'left', 'bottom']}>
      <StatusBar style={theme.statusBar} />
      <Text style={[styles.screenTitle, { color: theme.colors.text }]}>ตั้งค่า</Text>
      
      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={[styles.section, { borderBottomColor: theme.colors.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.primary }]}>ธีม</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingTextContainer}>
              <Text style={[styles.settingTitle, { color: theme.colors.text }]}>โหมดมืด</Text>
              <Text style={[styles.settingDescription, { color: theme.colors.secondaryText }]}>
                สลับระหว่างธีมสว่างและธีมมืด
              </Text>
            </View>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: theme.colors.switchTrackInactive, true: `${theme.colors.primary}50` }}
              thumbColor={isDark ? theme.colors.primary : '#f4f3f4'}
              ios_backgroundColor={theme.colors.card}
            />
          </View>
          
          <View style={styles.themeOptions}>
            <TouchableOpacity 
              style={[
                styles.themeOption, 
                { backgroundColor: theme.colors.card },
                themeType === 'light' && styles.selectedThemeOption
              ]}
              onPress={() => handleSelectTheme('light')}
            >
              <View style={[styles.themePreview, styles.lightThemePreview]}>
                <View style={styles.previewBar} />
              </View>
              <Text style={[
                styles.themeOptionText,
                { color: theme.colors.text }
              ]}>สว่าง</Text>
              {themeType === 'light' && (
                <MaterialCommunityIcons 
                  name="check-circle" 
                  size={20} 
                  color={theme.colors.primary} 
                  style={styles.checkIcon}
                />
              )}
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.themeOption,
                { backgroundColor: theme.colors.card },
                themeType === 'dark' && styles.selectedThemeOption
              ]}
              onPress={() => handleSelectTheme('dark')}
            >
              <View style={[styles.themePreview, styles.darkThemePreview]}>
                <View style={[styles.previewBar, styles.darkPreviewBar]} />
              </View>
              <Text style={[
                styles.themeOptionText,
                { color: theme.colors.text }
              ]}>มืด</Text>
              {themeType === 'dark' && (
                <MaterialCommunityIcons 
                  name="check-circle" 
                  size={20} 
                  color={theme.colors.primary} 
                  style={styles.checkIcon}
                />
              )}
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={[styles.section, { borderBottomColor: theme.colors.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.primary }]}>การแจ้งเตือน</Text>
          
          <View style={[styles.settingItem, { borderBottomColor: theme.colors.border }]}>
            <View style={styles.settingTextContainer}>
              <Text style={[styles.settingTitle, { color: theme.colors.text }]}>แจ้งเตือนเมื่อออกจากแอป</Text>
              <Text style={[styles.settingDescription, { color: theme.colors.secondaryText }]}>
                แสดงการแจ้งเตือนเต็มหน้าจอเมื่อออกจากแอปหรือปิดหน้าจอ
              </Text>
            </View>
            <Switch
              value={exitMonitoringEnabled}
              onValueChange={toggleExitMonitoring}
              trackColor={{ false: theme.colors.switchTrackInactive, true: `${theme.colors.primary}50` }}
              thumbColor={exitMonitoringEnabled ? theme.colors.primary : '#f4f3f4'}
              ios_backgroundColor={theme.colors.card}
            />
          </View>
          
          <TouchableOpacity 
            style={[styles.settingItem, { borderBottomColor: theme.colors.border }]}
            onPress={openSettings}
          >
            <View style={styles.settingTextContainer}>
              <Text style={[styles.settingTitle, { color: theme.colors.text }]}>การตั้งค่าการแจ้งเตือน</Text>
              <Text style={[styles.settingDescription, { color: theme.colors.secondaryText }]}>
                ตั้งค่าการแจ้งเตือนในการตั้งค่าระบบ
              </Text>
            </View>
            <MaterialCommunityIcons
              name="chevron-right"
              size={24}
              color={theme.colors.secondaryText}
            />
          </TouchableOpacity>
        </View>
        
        <View style={[styles.section, { borderBottomColor: theme.colors.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.primary }]}>บัญชีผู้ใช้</Text>
          
          {user ? (
            <>
              <View style={styles.userInfoContainer}>
                <View style={[styles.userAvatarPlaceholder, { backgroundColor: theme.colors.card }]}>
                  <MaterialCommunityIcons name="account" size={40} color={theme.colors.secondaryText} />
                </View>
                <View style={styles.userDetails}>
                  <Text style={[styles.userName, { color: theme.colors.text }]}>{user.displayName || 'ผู้ใช้งาน'}</Text>
                  <Text style={[styles.userEmail, { color: theme.colors.secondaryText }]}>{user.email}</Text>
                </View>
              </View>
              
              <TouchableOpacity 
                style={[styles.settingItem, styles.logoutButton, { borderBottomColor: theme.colors.border }]}
                onPress={handleLogout}
              >
                <Text style={[styles.logoutText, { color: theme.colors.danger }]}>ออกจากระบบ</Text>
                <MaterialCommunityIcons
                  name="logout"
                  size={24}
                  color={theme.colors.danger}
                />
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity 
              style={[styles.settingItem, styles.loginButton, { borderBottomColor: theme.colors.border }]}
              onPress={() => navigation.navigate('LoginRoot')}
            >
              <Text style={[styles.loginText, { color: theme.colors.primary }]}>เข้าสู่ระบบ</Text>
              <MaterialCommunityIcons
                name="login"
                size={24}
                color={theme.colors.primary}
              />
            </TouchableOpacity>
          )}
        </View>
        
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.primary }]}>เกี่ยวกับแอป</Text>
          
          <TouchableOpacity style={[styles.settingItem, { borderBottomColor: theme.colors.border }]}>
            <Text style={[styles.settingTitle, { color: theme.colors.text }]}>เวอร์ชัน</Text>
            <Text style={[styles.versionText, { color: theme.colors.secondaryText }]}>1.0.0</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  screenTitle: {
    fontSize: 34,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 20,
    marginLeft: 16,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 30,
  },
  section: {
    marginBottom: 32,
    paddingHorizontal: 16,
    borderBottomWidth: 0.5,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 0.5,
  },
  settingTextContainer: {
    flex: 1,
    marginRight: 16,
  },
  settingTitle: {
    fontSize: 17,
    fontWeight: '500',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
  },
  userInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
  },
  userAvatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userDetails: {
    marginLeft: 16,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 15,
  },
  logoutButton: {
    borderTopWidth: 0,
  },
  loginButton: {
    paddingVertical: 16,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '500',
  },
  loginText: {
    fontSize: 16,
    fontWeight: '500',
  },
  versionText: {
    fontSize: 15,
  },
  themeOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    marginBottom: 16,
  },
  themeOption: {
    width: '48%',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    position: 'relative',
  },
  selectedThemeOption: {
    borderWidth: 2,
    borderColor: '#FF9500',
  },
  themePreview: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginBottom: 8,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 8,
  },
  lightThemePreview: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DDDDDD',
  },
  darkThemePreview: {
    backgroundColor: '#000000',
    borderWidth: 1,
    borderColor: '#333333',
  },
  previewBar: {
    width: '80%',
    height: 10,
    backgroundColor: '#FF9500',
    borderRadius: 5,
  },
  darkPreviewBar: {
    backgroundColor: '#FF9500',
  },
  themeOptionText: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: 8,
  },
  checkIcon: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
});

export default SettingsScreen; 