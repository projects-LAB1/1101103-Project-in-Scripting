// TestingScreen.js - Screen for testing alarm features
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  ScrollView,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { testMiniGames, runTest, createDemoAlarms } from '../utils/alarmTesting';
import { loadAlarms, saveAlarms } from '../utils/alarmStorage';

const TestingScreen = ({ navigation }) => {
  const [selectedTest, setSelectedTest] = useState(null);
  const [testResults, setTestResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  
  // Get all available tests
  const allTests = testMiniGames();
  
  // Run selected test
  const handleRunTest = () => {
    if (!selectedTest) {
      Alert.alert('Select Test', 'Please select a test to run first');
      return;
    }
    
    // Log test execution
    const testResult = {
      name: selectedTest.name,
      timestamp: new Date().toISOString(),
      status: 'Running'
    };
    
    setTestResults([testResult, ...testResults]);
    
    // Run the test
    runTest(navigation, selectedTest);
  };
  
  // Run all tests sequentially
  const handleRunAllTests = () => {
    Alert.alert(
      'Run All Tests',
      'This will run all tests one after another. You will need to complete each test to proceed to the next one.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Run All',
          onPress: () => {
            // Start with the first test
            if (allTests.length > 0) {
              runTest(navigation, allTests[0]);
              
              // Log all tests as queued
              const newResults = allTests.map(test => ({
                name: test.name,
                timestamp: new Date().toISOString(),
                status: 'Queued'
              }));
              
              setTestResults([...newResults, ...testResults]);
            }
          }
        }
      ]
    );
  };
  
  // Add demo alarms to storage
  const handleAddDemoAlarms = async () => {
    try {
      // Get current alarms
      const currentAlarms = await loadAlarms();
      
      // Generate demo alarms
      const demoAlarms = createDemoAlarms();
      
      // Add demo alarms to existing alarms
      const updatedAlarms = [...currentAlarms, ...demoAlarms];
      
      // Save updated alarms
      await saveAlarms(updatedAlarms);
      
      Alert.alert(
        'Demo Alarms Added',
        `${demoAlarms.length} demo alarms have been added to your alarm list.`
      );
    } catch (error) {
      console.error('Error adding demo alarms:', error);
      Alert.alert('Error', 'Failed to add demo alarms');
    }
  };
  
  // Render a test item
  const renderTestItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.testItem,
        selectedTest?.name === item.name && styles.selectedTestItem
      ]}
      onPress={() => setSelectedTest(item)}
    >
      <Icon
        name={
          item.alarm.gameType === 'memory'
            ? 'cards'
            : item.alarm.gameType === 'math'
            ? 'calculator'
            : 'camera'
        }
        size={24}
        color={selectedTest?.name === item.name ? '#FFFFFF' : '#0A84FF'}
        style={styles.testIcon}
      />
      <View style={styles.testInfo}>
        <Text style={styles.testName}>{item.name}</Text>
        <Text style={styles.testDetail}>
          {item.alarm.gameType} - {item.alarm.gameDifficulty}
        </Text>
      </View>
    </TouchableOpacity>
  );
  
  // Render a test result item
  const renderResultItem = ({ item, index }) => (
    <View style={styles.resultItem}>
      <View style={styles.resultHeader}>
        <Text style={styles.resultName}>{item.name}</Text>
        <Text
          style={[
            styles.resultStatus,
            { color: item.status === 'Running' ? '#FFC107' : '#4CAF50' }
          ]}
        >
          {item.status}
        </Text>
      </View>
      <Text style={styles.resultTime}>
        {new Date(item.timestamp).toLocaleTimeString()}
      </Text>
    </View>
  );
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Alarm Testing</Text>
        <Text style={styles.headerSubtitle}>
          Test alarm features and mini-games
        </Text>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Select Test</Text>
        <FlatList
          data={allTests}
          renderItem={renderTestItem}
          keyExtractor={(item) => item.name}
          contentContainerStyle={styles.testList}
        />
      </View>
      
      <View style={styles.actionContainer}>
        <TouchableOpacity
          style={[styles.actionButton, styles.primaryButton]}
          onPress={handleRunTest}
        >
          <Text style={styles.actionButtonText}>Run Selected Test</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, styles.secondaryButton]}
          onPress={handleRunAllTests}
        >
          <Text style={styles.actionButtonText}>Run All Tests</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.optionsContainer}>
        <TouchableOpacity
          style={styles.optionButton}
          onPress={handleAddDemoAlarms}
        >
          <Icon name="alarm-plus" size={24} color="#0A84FF" />
          <Text style={styles.optionText}>Add Demo Alarms</Text>
        </TouchableOpacity>
        
        <View style={styles.optionToggle}>
          <Text style={styles.optionText}>Show Test Results</Text>
          <Switch
            value={showResults}
            onValueChange={setShowResults}
            trackColor={{ false: '#767577', true: '#0A84FF50' }}
            thumbColor={showResults ? '#0A84FF' : '#f4f3f4'}
          />
        </View>
      </View>
      
      {showResults && (
        <View style={styles.resultsSection}>
          <Text style={styles.sectionTitle}>Test Results</Text>
          <FlatList
            data={testResults}
            renderItem={renderResultItem}
            keyExtractor={(item, index) => `${item.name}-${index}`}
            contentContainerStyle={styles.resultsList}
            ListEmptyComponent={
              <Text style={styles.emptyResults}>No test results yet</Text>
            }
          />
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#222222',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#8E8E93',
  },
  section: {
    margin: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  testList: {
    paddingBottom: 8,
  },
  testItem: {
    flexDirection: 'row',
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    alignItems: 'center',
  },
  selectedTestItem: {
    backgroundColor: '#0A84FF',
  },
  testIcon: {
    marginRight: 16,
  },
  testInfo: {
    flex: 1,
  },
  testName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  testDetail: {
    fontSize: 14,
    color: '#8E8E93',
  },
  actionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
  },
  actionButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
  },
  primaryButton: {
    backgroundColor: '#0A84FF',
  },
  secondaryButton: {
    backgroundColor: '#2C2C2E',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  optionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#222222',
    borderBottomWidth: 1,
    borderBottomColor: '#222222',
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionToggle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginLeft: 8,
  },
  resultsSection: {
    flex: 1,
    margin: 16,
  },
  resultsList: {
    paddingBottom: 16,
  },
  resultItem: {
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  resultName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  resultStatus: {
    fontSize: 14,
    fontWeight: '600',
  },
  resultTime: {
    fontSize: 14,
    color: '#8E8E93',
  },
  emptyResults: {
    textAlign: 'center',
    color: '#8E8E93',
    marginTop: 20,
  },
});

export default TestingScreen; 