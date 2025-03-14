import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View, KeyboardAvoidingView, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';

const SignupScreen = ({ navigation }) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <StatusBar style="light" />
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.backButtonText}>กลับไปที่หน้าการเข้าสู่ระบบ</Text>
      </TouchableOpacity>

      <View style={styles.headerContainer}>
        <Text style={styles.headerText}>Create your account</Text>
        <Text style={styles.subHeaderText}>กรอกข้อมูลผู้ใช้</Text>
      </View>

      <View style={styles.formContainer}>
        <TextInput
          style={styles.input}
          placeholder="Username"
          value={username}
          onChangeText={setUsername}
        />
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        <TouchableOpacity style={styles.signupButton}>
          <Text style={styles.signupButtonText}>สมัครสมาชิก</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  backButton: {
    marginTop: 40,
    marginLeft: 20,
  },
  backButtonText: {
    color: 'white',
    fontSize: 14,
  },
  headerContainer: {
    marginTop: 20,
    alignItems: 'center',
    marginBottom: 30,
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  subHeaderText: {
    fontSize: 14,
    color: 'white',
    marginTop: 5,
  },
  formContainer: {
    paddingHorizontal: 30,
  },
  input: {
    backgroundColor: 'white',
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 20,
    fontSize: 16,
    marginBottom: 15,
  },
  signupButton: {
    backgroundColor: '#737af7',
    borderRadius: 25,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  signupButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default SignupScreen;
