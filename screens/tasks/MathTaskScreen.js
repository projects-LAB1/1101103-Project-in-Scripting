// MathTaskScreen.js - หน้าโจทย์คณิตศาสตร์สำหรับปิดนาฬิกาปลุก
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  Alert, Vibration, KeyboardAvoidingView, Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAlarmSound } from '../../contexts/AlarmSoundContext';

const MathTaskScreen = ({ route, navigation }) => {
  const { alarm, difficulty = 'medium', onComplete, gameCompletionHandler, soundAlreadyStopped = false } = route.params || {};
  const [problem, setProblem] = useState('');
  const [answer, setAnswer] = useState('');
  const [userAnswer, setUserAnswer] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [maxAttempts, setMaxAttempts] = useState(5);
  
  // สร้าง ref เพื่อป้องกันการเรียก onComplete ซ้ำ
  const isCompletedRef = useRef(false);
  // สร้าง ref เพื่อเก็บข้อมูลโจทย์และคำตอบ
  const problemRef = useRef({ problem: '', answer: '' });
  // สร้าง ref เพื่อตรวจสอบว่าได้สร้างโจทย์ไปแล้วหรือยัง
  const hasGeneratedProblem = useRef(false);
  
  // ใช้ AlarmSoundContext
  const { isPlaying, stopAlarmSound } = useAlarmSound();
  
  // Generate math problem based on difficulty only once when component mounts
  useEffect(() => {
    if (!hasGeneratedProblem.current) {
      generateProblem();
      hasGeneratedProblem.current = true;
    }
    
    // ฟังก์ชัน cleanup
    return () => {
      // ถ้าผู้ใช้ออกจากหน้าโดยไม่ตอบโจทย์ให้ถูกต้อง ให้แน่ใจว่ามีการจัดการเสียงที่เหมาะสม
      if (isPlaying && !soundAlreadyStopped) {
        console.log('Stopping alarm sound on MathTaskScreen unmount');
        stopAlarmSound();
      } else {
        console.log('Sound was already stopped or not playing in MathTaskScreen unmount');
      }
    };
  }, [difficulty, isPlaying, stopAlarmSound, soundAlreadyStopped]);
  
  const generateProblem = () => {
    let num1, num2, num3, operator1, operator2, result;
    
    // Set difficulty parameters
    switch (difficulty) {
      case 'easy':
        // Simple addition or subtraction with small numbers
        num1 = Math.floor(Math.random() * 10) + 1;
        num2 = Math.floor(Math.random() * 10) + 1;
        operator1 = Math.random() > 0.5 ? '+' : '-';
        
        if (operator1 === '+') {
          result = num1 + num2;
        } else {
          // Ensure positive result for subtraction
          if (num1 < num2) {
            [num1, num2] = [num2, num1];
          }
          result = num1 - num2;
        }
        
        problemRef.current = {
          problem: `${num1} ${operator1} ${num2}`,
          answer: result.toString()
        };
        break;
        
      case 'medium':
        // Multiplication or more complex addition/subtraction
        num1 = Math.floor(Math.random() * 12) + 1;
        num2 = Math.floor(Math.random() * 12) + 1;
        operator1 = Math.random() > 0.3 ? '+' : (Math.random() > 0.5 ? '-' : '*');
        
        if (operator1 === '+') {
          num1 = Math.floor(Math.random() * 50) + 10;
          num2 = Math.floor(Math.random() * 50) + 10;
          result = num1 + num2;
        } else if (operator1 === '-') {
          num1 = Math.floor(Math.random() * 50) + 30;
          num2 = Math.floor(Math.random() * 30) + 10;
          result = num1 - num2;
        } else {
          result = num1 * num2;
        }
        
        problemRef.current = {
          problem: `${num1} ${operator1} ${num2}`,
          answer: result.toString()
        };
        break;
        
      case 'hard':
        // Complex problem with multiple operations
        num1 = Math.floor(Math.random() * 20) + 5;
        num2 = Math.floor(Math.random() * 15) + 5;
        num3 = Math.floor(Math.random() * 10) + 1;
        
        // Randomly select operators
        const operators = ['+', '-', '*'];
        operator1 = operators[Math.floor(Math.random() * 3)];
        operator2 = operators[Math.floor(Math.random() * 3)];
        
        // Calculate result based on operators
        let intermediateResult;
        if (operator1 === '+') {
          intermediateResult = num1 + num2;
        } else if (operator1 === '-') {
          intermediateResult = num1 - num2;
        } else {
          intermediateResult = num1 * num2;
        }
        
        if (operator2 === '+') {
          result = intermediateResult + num3;
        } else if (operator2 === '-') {
          result = intermediateResult - num3;
        } else {
          result = intermediateResult * num3;
        }
        
        problemRef.current = {
          problem: `${num1} ${operator1} ${num2} ${operator2} ${num3}`,
          answer: result.toString()
        };
        break;
        
      default:
        // Default to medium difficulty
        num1 = Math.floor(Math.random() * 12) + 1;
        num2 = Math.floor(Math.random() * 12) + 1;
        operator1 = '+';
        result = num1 + num2;
        
        problemRef.current = {
          problem: `${num1} ${operator1} ${num2}`,
          answer: result.toString()
        };
    }
    
    // Update state with the generated problem
    setProblem(problemRef.current.problem);
    setAnswer(problemRef.current.answer);
  };
  
  const handleSuccess = () => {
    // ป้องกันการเรียกซ้ำ
    if (isCompletedRef.current) {
      return;
    }
    
    isCompletedRef.current = true;
    
    // หยุดเสียงเมื่อตอบถูก (ถ้ายังไม่ได้หยุด)
    if (isPlaying && !soundAlreadyStopped) {
      console.log('Stopping alarm sound in MathTaskScreen');
      stopAlarmSound();
    } else {
      console.log('Sound was already stopped or not playing in MathTaskScreen');
    }
    
    // เรียกใช้ callback onComplete ถ้ามี หรือใช้ gameCompletionHandler
    if (typeof onComplete === 'function') {
      console.log('Using onComplete function');
      onComplete();
    } else if (gameCompletionHandler === 'handleGameComplete') {
      console.log('Using gameCompletionHandler to navigate back');
      // กลับไปที่หน้า GameSelector และให้ GameSelector จัดการต่อ
      navigation.navigate('GameSelector', { 
        gameCompleted: true,
        completionAction: 'completeAlarm'
      });
    } else {
      // ถ้าไม่มีทั้งสองอย่าง ให้กลับไปที่หน้า AlarmList โดยตรง
      console.log('No completion handler found, navigating to AlarmList directly');
      navigation.reset({
        index: 0,
        routes: [{ name: 'Alarm', params: { screen: 'AlarmList' } }],
      });
    }
  };
  
  const handleSubmit = () => {
    // ใช้ค่าจาก ref แทนที่จะใช้จาก state เพื่อป้องกันการเปลี่ยนแปลงที่ไม่ได้ตั้งใจ
    if (userAnswer === problemRef.current.answer) {
      // ถูกต้อง
      Alert.alert(
        'ถูกต้อง!',
        'คุณตอบถูกต้อง นาฬิกาปลุกจะหยุดดัง',
        [
          {
            text: 'ตกลง',
            onPress: handleSuccess,
          },
        ]
      );
    } else {
      // ผิด
      setAttempts(attempts + 1);
      if (attempts + 1 >= maxAttempts) {
        // เกินจำนวนครั้งที่พยายาม สร้างโจทย์ใหม่
        Alert.alert(
          'ผิด',
          `คุณพยายามเกินจำนวนครั้งที่กำหนด จะสร้างโจทย์ใหม่ให้`,
          [
            {
              text: 'ตกลง',
              onPress: () => {
                setAttempts(0);
                setUserAnswer('');
                hasGeneratedProblem.current = false; // Reset flag to allow new problem generation
                generateProblem();
              },
            },
          ]
        );
      } else {
        // ยังมีโอกาสลองอีก
        Alert.alert(
          'ผิด',
          `คำตอบไม่ถูกต้อง คุณเหลือโอกาสอีก ${maxAttempts - attempts - 1} ครั้ง`,
          [
            {
              text: 'ลองอีกครั้ง',
              onPress: () => {
                setUserAnswer('');
              },
            },
          ]
        );
      }
    }
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoidingView}
      >
        <View style={styles.header}>
          <Text style={styles.headerText}>โจทย์คณิตศาสตร์</Text>
          <Text style={styles.subHeaderText}>
            ตอบให้ถูกต้องเพื่อปิดนาฬิกาปลุก
          </Text>
        </View>
        
        <View style={styles.problemContainer}>
          <Text style={styles.problemText}>{problem} = ?</Text>
        </View>
        
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={userAnswer}
            onChangeText={setUserAnswer}
            placeholder="ใส่คำตอบ"
            placeholderTextColor="#888"
            autoFocus
          />
          
          <TouchableOpacity 
            style={styles.submitButton}
            onPress={handleSubmit}
          >
            <Text style={styles.submitButtonText}>ตรวจคำตอบ</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.attemptsContainer}>
          <Text style={styles.attemptsText}>
            ความพยายาม: {attempts}/{maxAttempts}
          </Text>
        </View>
        
        <TouchableOpacity 
          style={styles.skipButton}
          onPress={() => {
            Alert.alert(
              "ข้ามโจทย์นี้?",
              "คุณแน่ใจหรือไม่ว่าต้องการข้ามโจทย์นี้? โจทย์ใหม่จะถูกสร้างขึ้น",
              [
                { text: "ยกเลิก", style: "cancel" },
                { text: "ข้าม", onPress: () => {
                  setAttempts(0);
                  setUserAnswer('');
                  hasGeneratedProblem.current = false; // Reset flag to allow new problem generation
                  generateProblem();
                }}
              ]
            );
          }}
        >
          <Text style={styles.skipButtonText}>ข้ามโจทย์นี้</Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  keyboardAvoidingView: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  headerText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subHeaderText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  problemContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 30,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  problemText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
  },
  inputContainer: {
    marginBottom: 30,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    fontSize: 20,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#ddd',
    textAlign: 'center',
  },
  submitButton: {
    backgroundColor: '#4F46E5',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  attemptsContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  attemptsText: {
    fontSize: 16,
    color: '#666',
  },
  skipButton: {
    alignItems: 'center',
    padding: 10,
  },
  skipButtonText: {
    color: '#4F46E5',
    fontSize: 16,
  },
});

export default MathTaskScreen;