import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Animated,
  Dimensions,
  StatusBar,
  Linking
} from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import CustomButton from '../components/CustomButton';

const { width, height } = Dimensions.get('window');

const HelpScreen = ({ navigation }) => {
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(50)).current;
  
  // Start animations when component mounts
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 700,
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  const handleEmailSupport = () => {
    Linking.openURL('mailto:support@myapp.com?subject=ขอความช่วยเหลือ');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>ปัญหาที่พบบ่อย</Text>
      </View>
      
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Animated.View 
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{ translateY: translateY }]
            }
          ]}
        >
          <View style={styles.questionContainer}>
            <Text style={styles.questionText}>คุณตั้งค่าการแจ้งเตือนสุดท้ายเมื่อใด?</Text>
            <Text style={styles.answerText}>
              หากคุณประสบปัญหาเกี่ยวกับการแจ้งเตือน โปรดตรวจสอบว่าคุณได้เปิดการอนุญาตให้แจ้งเตือนในการตั้งค่าของอุปกรณ์ ไปที่การตั้งค่า {'>'}การแจ้งเตือน
            </Text>
          </View>
          
          <View style={styles.questionContainer}>
            <Text style={styles.questionText}>นาฬิกาปลุกไม่ทำงาน?</Text>
            <Text style={styles.answerText}>
              ตรวจสอบว่าแอปของเราไม่ได้ถูกปิดการทำงานในพื้นหลัง ไปที่การตั้งค่า {'>'}แบตเตอรี่ {'>'}การใช้แบตเตอรี่ และตั้งค่าให้อนุญาตให้ทำงานในพื้นหลังได้
            </Text>
          </View>
          
          <View style={styles.questionContainer}>
            <Text style={styles.questionText}>เสียงปลุกไม่ดัง?</Text>
            <Text style={styles.answerText}>
              แอปของเราใช้การสั่นแทนเสียงในบางกรณี โปรดตรวจสอบว่าอุปกรณ์ของคุณไม่ได้อยู่ในโหมดห้ามรบกวน และระดับเสียงอยู่ในระดับที่ได้ยิน
            </Text>
          </View>
          
          <View style={styles.questionContainer}>
            <Text style={styles.questionText}>ภารกิจปลุกไม่แสดง?</Text>
            <Text style={styles.answerText}>
              ตรวจสอบว่าคุณได้ตั้งค่าภารกิจสำหรับนาฬิกาปลุกนั้นๆ หรือไม่ โดยไปที่การตั้งค่านาฬิกาปลุก และเลือกประเภทภารกิจที่ต้องการ
            </Text>
          </View>
          
          <View style={styles.contactContainer}>
            <Text style={styles.contactTitle}>ยังต้องการความช่วยเหลือ?</Text>
            <Text style={styles.contactText}>
              หากคุณยังพบปัญหาอยู่ โปรดติดต่อทีมสนับสนุนของเรา
            </Text>
            
            <CustomButton
              title="ส่งอีเมลถึงทีมสนับสนุน"
              type="outline"
              icon={<Icon name="email-outline" size={18} color="#4F46E5" />}
              onPress={handleEmailSupport}
              style={styles.emailButton}
            />
          </View>
        </Animated.View>
      </ScrollView>
      
      <View style={styles.footer}>
        <CustomButton
          title="กลับไปที่หน้าหลัก"
          type="link"
          onPress={() => navigation.goBack()}
        />
        <CustomButton
          title="แจ้งปัญหา"
          type="primary"
          size="small"
          onPress={() => Linking.openURL('mailto:bugs@myapp.com')}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  content: {
    padding: 24,
  },
  questionContainer: {
    marginBottom: 24,
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#4F46E5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  questionText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  answerText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#4B5563',
  },
  contactContainer: {
    marginTop: 16,
    padding: 20,
    backgroundColor: '#EEF2FF',
    borderRadius: 12,
    alignItems: 'center',
  },
  contactTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  contactText: {
    fontSize: 15,
    textAlign: 'center',
    color: '#4B5563',
    marginBottom: 20,
  },
  emailButton: {
    marginTop: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
});

export default HelpScreen; 