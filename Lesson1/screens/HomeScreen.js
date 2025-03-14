import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { auth } from '../App';
import { signOut } from 'firebase/auth';

const HomeScreen = ({ navigation }) => {
  const handleSignOut = async () => {
    try {
      await signOut(auth);
      console.log('User signed out');
      navigation.replace('Login');
    } catch (error) {
      console.error('Error signing out:', error);
      alert('Error signing out: ' + error.message);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.headerContainer}>
        <Text style={styles.headerText}>Welcome Home</Text>
        <Text style={styles.subHeaderText}>
          {auth.currentUser?.email ? `Logged in as: ${auth.currentUser.email}` : 'Logged in successfully'}
        </Text>
      </View>

      <View style={styles.contentContainer}>
        <Text style={styles.contentText}>This is your home screen</Text>
      </View>

      <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
        <Text style={styles.signOutButtonText}>Sign Out</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    padding: 20,
  },
  headerContainer: {
    marginTop: 60,
    alignItems: 'center',
    marginBottom: 40,
  },
  headerText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
  },
  subHeaderText: {
    fontSize: 16,
    color: '#cccccc',
    marginTop: 10,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentText: {
    fontSize: 18,
    color: 'white',
    textAlign: 'center',
  },
  signOutButton: {
    backgroundColor: '#f05454',
    borderRadius: 25,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  signOutButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default HomeScreen;