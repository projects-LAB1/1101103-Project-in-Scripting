import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ค่า key สำหรับบันทึกธีม
const THEME_PREFERENCE_KEY = '@theme_preference';

// กำหนดค่าสีและสไตล์สำหรับแต่ละธีม
const themes = {
  light: {
    type: 'light',
    colors: {
      primary: '#FF9500',
      background: '#F2F2F7',
      card: '#FFFFFF',
      text: '#000000',
      secondaryText: '#757575',
      border: '#DDDDDD',
      danger: '#FF3B30',
      success: '#34C759',
      warning: '#FFCC00',
      info: '#0A84FF',
      inputBackground: '#E5E5EA',
      headerBackground: '#FFFFFF',
      tabBarBackground: '#FFFFFF',
      switchTrackActive: '#34C759',
      switchTrackInactive: '#E5E5EA',
    },
    statusBar: 'dark-content',
  },
  dark: {
    type: 'dark',
    colors: {
      primary: '#FF9500',
      background: '#000000',
      card: '#1C1C1E',
      text: '#FFFFFF',
      secondaryText: '#ADADAD',
      border: '#38383A',
      danger: '#FF453A',
      success: '#30D158',
      warning: '#FFD60A',
      info: '#0A84FF',
      inputBackground: '#2C2C2E',
      headerBackground: '#000000',
      tabBarBackground: '#000000',
      switchTrackActive: '#30D158',
      switchTrackInactive: '#38383A',
    },
    statusBar: 'light-content',
  },
};

// สร้าง Context สำหรับธีม
const ThemeContext = createContext();

// Hook สำหรับใช้งานธีม
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Provider component
export const ThemeProvider = ({ children }) => {
  // ตรวจสอบธีมอุปกรณ์
  const deviceTheme = useColorScheme();
  
  // สถานะธีมปัจจุบัน
  const [theme, setTheme] = useState(deviceTheme === 'dark' ? 'dark' : 'light');
  
  // โหลดธีมที่ผู้ใช้เลือกจาก AsyncStorage
  useEffect(() => {
    const loadThemePreference = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem(THEME_PREFERENCE_KEY);
        if (savedTheme !== null) {
          // ถ้ามีการบันทึกธีมไว้ ให้ใช้ธีมนั้น
          setTheme(savedTheme);
        } else {
          // ถ้าไม่มี ให้ใช้ธีมตามอุปกรณ์ (system default)
          setTheme(deviceTheme === 'dark' ? 'dark' : 'light');
        }
      } catch (error) {
        console.error('Error loading theme preference:', error);
        // ถ้ามีข้อผิดพลาด ใช้ธีมตามอุปกรณ์เป็นค่าเริ่มต้น
        setTheme(deviceTheme === 'dark' ? 'dark' : 'light');
      }
    };
    
    loadThemePreference();
  }, [deviceTheme]);
  
  // บันทึกธีมลง AsyncStorage
  const saveThemePreference = async (newTheme) => {
    try {
      await AsyncStorage.setItem(THEME_PREFERENCE_KEY, newTheme);
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  };
  
  // เปลี่ยนธีม
  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    saveThemePreference(newTheme);
  };
  
  // ตั้งค่าธีมเป็นค่าเฉพาะ
  const setThemeExplicitly = (themeType) => {
    if (themeType === 'light' || themeType === 'dark') {
      setTheme(themeType);
      saveThemePreference(themeType);
    }
  };
  
  // ตั้งค่าธีมตามอุปกรณ์ (system)
  const setSystemTheme = () => {
    const systemTheme = deviceTheme === 'dark' ? 'dark' : 'light';
    setTheme(systemTheme);
    saveThemePreference('system');
    return systemTheme;
  };
  
  // ค่าที่ส่งให้ context
  const value = {
    theme: themes[theme],
    isDark: theme === 'dark',
    themeType: theme,
    toggleTheme,
    setTheme: setThemeExplicitly,
    setSystemTheme,
  };
  
  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export default themes; 