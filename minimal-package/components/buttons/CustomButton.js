import React from 'react';
import { 
  TouchableOpacity, 
  Text, 
  StyleSheet, 
  ActivityIndicator,
  View
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';

/**
 * CustomButton - ปุ่มใช้งานทั่วไปที่ปรับแต่งได้
 * 
 * @param {string} title - ข้อความบนปุ่ม
 * @param {function} onPress - ฟังก์ชันที่เรียกเมื่อกดปุ่ม
 * @param {string} type - ประเภทของปุ่ม ('primary', 'secondary', 'danger', 'success')
 * @param {string} size - ขนาดของปุ่ม ('small', 'medium', 'large')
 * @param {boolean} isLoading - แสดงสถานะกำลังโหลด
 * @param {boolean} disabled - สถานะปุ่มถูกปิดใช้งาน
 * @param {string} icon - ชื่อไอคอนจาก MaterialCommunityIcons (ถ้าต้องการ)
 * @param {boolean} rounded - กำหนดให้ปุ่มเป็นรูปวงกลมหรือไม่
 * @param {object} style - สไตล์เพิ่มเติม
 */
const CustomButton = ({
  title,
  onPress,
  type = 'primary',
  size = 'medium',
  isLoading = false,
  disabled = false,
  icon,
  rounded = false,
  style,
  gradientColors,
}) => {
  // กำหนดสีตามประเภทของปุ่ม
  const getColors = () => {
    if (gradientColors) return gradientColors;
    
    switch (type) {
      case 'primary':
        return ['#FF9500', '#FF5733'];
      case 'secondary':
        return ['#0A84FF', '#0062CC'];
      case 'danger':
        return ['#FF3B30', '#CC2D25'];
      case 'success':
        return ['#34C759', '#28A745'];
      default:
        return ['#FF9500', '#FF5733'];
    }
  };

  // กำหนดขนาดตาม size
  const getButtonStyle = () => {
    switch (size) {
      case 'small':
        return styles.buttonSmall;
      case 'large':
        return styles.buttonLarge;
      default:
        return styles.buttonMedium;
    }
  };

  // กำหนดขนาดตัวอักษรตาม size
  const getTextStyle = () => {
    switch (size) {
      case 'small':
        return styles.textSmall;
      case 'large':
        return styles.textLarge;
      default:
        return styles.textMedium;
    }
  };

  // กำหนดขนาดไอคอนตาม size
  const getIconSize = () => {
    switch (size) {
      case 'small':
        return 16;
      case 'large':
        return 24;
      default:
        return 20;
    }
  };

  // กำหนด borderRadius ตาม rounded
  const getBorderRadius = () => {
    if (rounded) {
      switch (size) {
        case 'small':
          return 15;
        case 'large':
          return 25;
        default:
          return 20;
      }
    }
    return 8;
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || isLoading}
      style={[
        styles.container,
        { borderRadius: getBorderRadius() },
        disabled && styles.disabled,
        style
      ]}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={getColors()}
        style={[
          styles.gradient,
          getButtonStyle(),
          { borderRadius: getBorderRadius() }
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        {isLoading ? (
          <ActivityIndicator color="#FFFFFF" size="small" />
        ) : (
          <View style={styles.contentContainer}>
            {icon && (
              <MaterialCommunityIcons
                name={icon}
                size={getIconSize()}
                color="#FFFFFF"
                style={styles.icon}
              />
            )}
            <Text style={[styles.text, getTextStyle()]}>{title}</Text>
          </View>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 8,
    overflow: 'hidden',
    marginVertical: 8,
  },
  gradient: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    color: '#FFFFFF',
    fontWeight: '600',
    textAlign: 'center',
  },
  disabled: {
    opacity: 0.6,
  },
  buttonSmall: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  buttonMedium: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  buttonLarge: {
    paddingVertical: 16,
    paddingHorizontal: 32,
  },
  textSmall: {
    fontSize: 12,
  },
  textMedium: {
    fontSize: 16,
  },
  textLarge: {
    fontSize: 18,
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    marginRight: 8,
  },
});

export default CustomButton; 