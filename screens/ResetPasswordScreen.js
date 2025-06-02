import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Alert, 
  TouchableWithoutFeedback,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '../contexts/AuthContext';

// Import custom components
import HeaderBar from '../components/headers/HeaderBar';
import InputField from '../components/inputs/InputField';
import CustomButton from '../components/buttons/CustomButton';

const ResetPasswordScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { resetPassword } = useAuth();
  
  const handleResetPassword = async () => {
    if (!email) {
      Alert.alert('แจ้งเตือน', 'กรุณากรอกอีเมล');
      return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('แจ้งเตือน', 'กรุณากรอกอีเมลให้ถูกต้อง');
      return;
    }
    
    try {
      setIsLoading(true);
      const result = await resetPassword(email);
      
      if (result.success) {
        Alert.alert(
          'รีเซ็ตรหัสผ่านสำเร็จ', 
          result.message || 'รหัสผ่านชั่วคราวของคุณคือ "123456" กรุณาเปลี่ยนรหัสผ่านหลังจากเข้าสู่ระบบ',
          [{ 
            text: 'ตกลง', 
            onPress: () => navigation.navigate('Login')
          }]
        );
      } else {
        Alert.alert('เกิดข้อผิดพลาด', result.error || 'ไม่สามารถรีเซ็ตรหัสผ่านได้ กรุณาลองใหม่อีกครั้ง');
      }
    } catch (error) {
      Alert.alert('เกิดข้อผิดพลาด', error.message || 'ไม่สามารถรีเซ็ตรหัสผ่านได้ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <HeaderBar 
        title="รีเซ็ตรหัสผ่าน" 
        onBackPress={() => navigation.goBack()}
        backgroundColor="#000000"
      />
      
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView contentContainerStyle={styles.scrollContainer}>
            <Text style={styles.instructionText}>
              กรุณากรอกอีเมลที่คุณใช้ในการลงทะเบียน ระบบจะรีเซ็ตรหัสผ่านให้คุณเป็นรหัสชั่วคราว
            </Text>
            
            <InputField
              label="อีเมล"
              value={email}
              onChangeText={setEmail}
              placeholder="กรอกอีเมลของคุณ"
              icon="email-outline"
              keyboardType="email-address"
              autoCapitalize="none"
            />
            
            <CustomButton
              title="รีเซ็ตรหัสผ่าน"
              onPress={handleResetPassword}
              isLoading={isLoading}
              type="primary"
              size="large"
              style={styles.button}
            />
            
            <CustomButton
              title="กลับไปหน้าเข้าสู่ระบบ"
              onPress={() => navigation.goBack()}
              type="secondary"
              size="medium"
              style={styles.secondaryButton}
            />
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContainer: {
    padding: 24,
  },
  instructionText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginBottom: 24,
    lineHeight: 24,
  },
  button: {
    marginTop: 32,
  },
  secondaryButton: {
    marginTop: 16,
  }
});

export default ResetPasswordScreen; 