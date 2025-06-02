import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  StatusBar,
  Platform 
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * HeaderBar - ส่วนหัวของหน้าจอ
 * 
 * @param {string} title - ชื่อเรื่องที่แสดงตรงกลาง
 * @param {function} onBackPress - ฟังก์ชันเมื่อกดปุ่มย้อนกลับ (ถ้าไม่กำหนด จะไม่แสดงปุ่ม)
 * @param {object} rightComponent - Component ที่แสดงด้านขวา
 * @param {string} rightIcon - ชื่อไอคอนที่แสดงด้านขวา
 * @param {function} onRightPress - ฟังก์ชันเมื่อกดปุ่มด้านขวา
 * @param {object} style - สไตล์เพิ่มเติม
 * @param {string} backgroundColor - สีพื้นหลัง
 * @param {string} textColor - สีตัวอักษร
 * @param {boolean} translucent - โปร่งใสหรือไม่
 * @param {string} backText - ข้อความสำหรับปุ่มย้อนกลับ (เช่น "กลับ")
 */
const HeaderBar = ({ 
  title, 
  onBackPress, 
  rightComponent, 
  rightIcon, 
  onRightPress, 
  style,
  backgroundColor = '#1C1C1E',
  textColor = '#FFFFFF',
  translucent = false,
  backText
}) => {
  const insets = useSafeAreaInsets();
  
  return (
    <View style={[
      styles.container, 
      { 
        backgroundColor,
        paddingTop: translucent ? insets.top : Platform.OS === 'ios' ? insets.top : StatusBar.currentHeight
      },
      style
    ]}>
      <StatusBar 
        backgroundColor={translucent ? 'transparent' : backgroundColor} 
        barStyle={backgroundColor === '#FFFFFF' ? 'dark-content' : 'light-content'} 
        translucent={translucent}
      />
      
      <View style={styles.content}>
        {/* Left/Back button */}
        <View style={styles.leftContainer}>
          {onBackPress && (
            <TouchableOpacity 
              style={styles.backButton} 
              onPress={onBackPress}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons 
                name="chevron-left" 
                size={28} 
                color={textColor}
              />
              {backText && (
                <Text style={[styles.backText, { color: textColor }]}>
                  {backText}
                </Text>
              )}
            </TouchableOpacity>
          )}
        </View>
        
        {/* Title */}
        <View style={styles.titleContainer}>
          <Text style={[styles.title, { color: textColor }]} numberOfLines={1}>
            {title}
          </Text>
        </View>
        
        {/* Right component/button */}
        <View style={styles.rightContainer}>
          {rightComponent}
          
          {!rightComponent && rightIcon && onRightPress && (
            <TouchableOpacity 
              style={styles.rightButton} 
              onPress={onRightPress}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons 
                name={rightIcon} 
                size={24} 
                color={textColor}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1.5,
    elevation: 3,
    zIndex: 1000,
  },
  content: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  leftContainer: {
    width: 80,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  backText: {
    fontSize: 16,
    marginLeft: -4,
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  rightContainer: {
    width: 80,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  rightButton: {
    padding: 8,
  }
});

export default HeaderBar; 