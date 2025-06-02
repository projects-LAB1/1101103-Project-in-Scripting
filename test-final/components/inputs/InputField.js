import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  StyleSheet, 
  TouchableOpacity 
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

/**
 * InputField - component สำหรับรับข้อมูลจากผู้ใช้
 * 
 * @param {string} label - ตัวหนังสือกำกับฟิลด์
 * @param {string} value - ค่าที่แสดงในฟิลด์
 * @param {function} onChangeText - ฟังก์ชันเมื่อข้อความเปลี่ยนแปลง
 * @param {string} placeholder - ข้อความเมื่อไม่มีค่าในฟิลด์
 * @param {string} icon - ไอคอนที่แสดงด้านซ้ายของฟิลด์
 * @param {boolean} isPassword - เป็นฟิลด์รหัสผ่านหรือไม่
 * @param {boolean} isError - เป็นสถานะผิดพลาดหรือไม่
 * @param {string} errorText - ข้อความแสดงความผิดพลาด
 * @param {string} keyboardType - ประเภทของแป้นพิมพ์
 * @param {object} style - สไตล์เพิ่มเติม
 * @param {boolean} disabled - สถานะปิดใช้งาน
 * @param {function} onPressIcon - ฟังก์ชันเมื่อกดไอคอน
 * @param {boolean} multiline - รับข้อความหลายบรรทัดหรือไม่
 * @param {boolean} autoCapitalize - ควบคุมการขึ้นอักษรตัวแรกอัตโนมัติ
 */
const InputField = ({ 
  label, 
  value, 
  onChangeText, 
  placeholder, 
  icon, 
  isPassword = false, 
  isError = false, 
  errorText, 
  keyboardType = 'default',
  style, 
  disabled = false,
  onPressIcon,
  multiline = false,
  autoCapitalize = 'none',
  ...props
}) => {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  
  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };
  
  return (
    <View style={[styles.container, style]}>
      {label && (
        <Text style={styles.label}>{label}</Text>
      )}
      
      <View style={[
        styles.inputContainer,
        isError && styles.inputError,
        disabled && styles.inputDisabled,
      ]}>
        {icon && (
          <TouchableOpacity 
            style={styles.iconContainer} 
            onPress={onPressIcon}
            disabled={!onPressIcon}
            activeOpacity={onPressIcon ? 0.7 : 1}
          >
            <MaterialCommunityIcons 
              name={icon} 
              size={20} 
              color={isError ? '#FF3B30' : disabled ? '#666666' : '#999999'} 
            />
          </TouchableOpacity>
        )}
        
        <TextInput 
          style={[
            styles.input,
            icon && styles.inputWithIcon,
            multiline && styles.multilineInput,
          ]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#666666"
          secureTextEntry={isPassword && !isPasswordVisible}
          editable={!disabled}
          keyboardType={keyboardType}
          multiline={multiline}
          autoCapitalize={autoCapitalize}
          {...props}
        />
        
        {isPassword && (
          <TouchableOpacity 
            style={styles.iconContainer} 
            onPress={togglePasswordVisibility}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons 
              name={isPasswordVisible ? 'eye-off' : 'eye'} 
              size={20} 
              color="#999999" 
            />
          </TouchableOpacity>
        )}
      </View>
      
      {isError && errorText && (
        <Text style={styles.errorText}>{errorText}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2C2C2E',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3A3A3C',
  },
  input: {
    flex: 1,
    height: 48,
    color: '#FFFFFF',
    fontSize: 16,
    paddingHorizontal: 12,
  },
  inputWithIcon: {
    paddingLeft: 0,
  },
  multilineInput: {
    height: 100,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  iconContainer: {
    paddingHorizontal: 12,
  },
  inputError: {
    borderColor: '#FF3B30',
  },
  inputDisabled: {
    opacity: 0.6,
  },
  errorText: {
    fontSize: 14,
    color: '#FF3B30',
    marginTop: 4,
  },
});

export default InputField; 