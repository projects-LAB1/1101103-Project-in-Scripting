// MathTaskScreen.js - หน้าโจทย์คณิตศาสตร์สำหรับปิดนาฬิกาปลุก
import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  Alert, Vibration, KeyboardAvoidingView, Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const MathTaskScreen = ({ route, navigation }) => {
  const { alarm, difficulty, onComplete } = route.params;
  const [problem, setProblem] = useState('');
  const [answer, setAnswer] = useState('');
  const [userAnswer, setUserAnswer] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [maxAttempts, setMaxAttempts] = useState(3);
  
  // Generate math problem based on difficulty
  useEffect(() => {
    generateProblem();
  }, []);
  
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
        
        setProblem(`${num1} ${operator1} ${num2}`);
        setAnswer(result.toString());
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
        
        setProblem(`${num1} ${operator1} ${num2}`);
        setAnswer(result.toString());
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
        
        setProblem(`${num1} ${operator1} ${num2} ${operator2} ${num3}`);        
        setAnswer(result.toString());
        break;
        
      default:
        // Default to medium difficulty
        num1 = Math.floor(Math.random() * 12) + 1;
        num2 = Math.floor(Math.random() * 12) + 1;
        operator1 = '+';
        result = num1 + num2;
        
        setProblem(`${num1} ${operator1} ${num2}`);
        setAnswer(result.toString());
    }
  };
  
  const checkAnswer = () => {
    if (userAnswer.trim() === answer) {
      // Correct answer
      Alert.alert(
        "ถูกต้อง!",
        "คุณตอบถูกต้อง นาฬิกาปลุกจะถูกปิด",
        [{ text: "OK", onPress: () => onComplete && onComplete() }]
      );
    } else {
      // Wrong answer
      setAttempts(attempts + 1);
      Vibration.vibrate(500);
      
      if (attempts + 1 >= maxAttempts) {
        // Generate new problem after max attempts
        Alert.alert(
          "ผิด!",
          "คุณตอบผิดหลายครั้ง โจทย์ใหม่จะถูกสร้างขึ้น",
          [{ text: "OK", onPress: () => {
            setAttempts(0);
            setUserAnswer('');
            generateProblem();
          }}]
        );
      } else {
        Alert.alert(
          "ผิด!",
          `ลองอีกครั้ง (พยายามครั้งที่ ${attempts + 1}/${maxAttempts})`,
          [{ text: "OK", onPress: () => setUserAnswer('') }]
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
            onPress={checkAnswer}
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