import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { 
  goodSleepPatternSample, 
  badSleepPatternSample, 
  inconsistentSleepPatternSample,
  testSleepPatternAnalysis,
  testDailyRecommendation,
  testSleepIssueDetection,
  sampleSleepGoals
} from '../../utils/testSleepAI';
import runSleepAITests from '../../utils/testSleepAIRunner';

const SleepTestScreen = ({ navigation }) => {
  const [selectedPattern, setSelectedPattern] = useState('good');
  const [analysisResult, setAnalysisResult] = useState(null);
  const [recommendation, setRecommendation] = useState(null);
  const [sleepIssues, setSleepIssues] = useState([]);
  const [testResults, setTestResults] = useState(null);
  
  // Run the selected test when pattern changes
  useEffect(() => {
    runPatternTest(selectedPattern);
  }, [selectedPattern]);
  
  // Run a specific pattern test
  const runPatternTest = (pattern) => {
    try {
      // Run the pattern analysis test
      const analysisTest = testSleepPatternAnalysis(pattern);
      setAnalysisResult(analysisTest.analysis);
      
      // Run the recommendation test with the same pattern
      const recommendationTest = testDailyRecommendation(pattern);
      setRecommendation(recommendationTest.recommendation);
      
      // Get sleep issues
      const issuesTest = testSleepIssueDetection(pattern);
      setSleepIssues(issuesTest.issues);
    } catch (error) {
      console.error('Error running pattern test:', error);
      Alert.alert('Test Error', 'เกิดข้อผิดพลาดในการทดสอบ: ' + error.message);
    }
  };
  
  // Run all tests
  const runAllTestSuite = () => {
    try {
      const results = runSleepAITests();
      setTestResults(results);
      
      if (results.success) {
        Alert.alert(
          'ทดสอบสำเร็จ',
          `ผ่านการทดสอบ ${results.testsPassed} จาก ${results.testsRun} การทดสอบ`
        );
      } else {
        Alert.alert(
          'ทดสอบไม่สำเร็จ',
          `พบข้อผิดพลาด ${results.errors.length} รายการ\nผ่านการทดสอบ ${results.testsPassed} จาก ${results.testsRun} การทดสอบ`
        );
      }
    } catch (error) {
      console.error('Error running all tests:', error);
      Alert.alert('Test Error', 'เกิดข้อผิดพลาดในการทดสอบทั้งหมด: ' + error.message);
    }
  };
  
  return (
    <SafeAreaView style={styles.container} edges={['right', 'left']}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>ทดสอบการวิเคราะห์ AI</Text>
          <Text style={styles.description}>
            ทดสอบการวิเคราะห์รูปแบบการนอนและคำแนะนำด้วยข้อมูลตัวอย่าง
          </Text>
        </View>
        
        <View style={styles.patternSelector}>
          <TouchableOpacity
            style={[
              styles.patternButton,
              selectedPattern === 'good' && styles.selectedPatternButton,
            ]}
            onPress={() => setSelectedPattern('good')}
          >
            <Text style={styles.patternButtonText}>รูปแบบดี</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.patternButton,
              selectedPattern === 'bad' && styles.selectedPatternButton,
            ]}
            onPress={() => setSelectedPattern('bad')}
          >
            <Text style={styles.patternButtonText}>รูปแบบแย่</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.patternButton,
              selectedPattern === 'inconsistent' && styles.selectedPatternButton,
            ]}
            onPress={() => setSelectedPattern('inconsistent')}
          >
            <Text style={styles.patternButtonText}>ไม่สม่ำเสมอ</Text>
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity 
          style={styles.runTestButton}
          onPress={runAllTestSuite}
        >
          <Text style={styles.runTestButtonText}>ทดสอบฟังก์ชันทั้งหมด</Text>
        </TouchableOpacity>
        
        {/* Analysis Results */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="brain" size={24} color="#0A84FF" />
            <Text style={styles.cardTitle}>ผลการวิเคราะห์</Text>
          </View>
          
          {analysisResult ? (
            <View style={styles.analysisContent}>
              <Text style={styles.messageText}>{analysisResult.message || 'ไม่มีข้อมูลการวิเคราะห์'}</Text>
              
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>ข้อมูลเชิงลึก</Text>
                {(analysisResult.insights || []).map((insight, index) => (
                  <View key={`insight-${index}`} style={styles.item}>
                    <MaterialCommunityIcons name="lightbulb-outline" size={18} color="#0A84FF" />
                    <Text style={styles.itemText}>{insight}</Text>
                  </View>
                ))}
              </View>
              
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>คำแนะนำ</Text>
                {(analysisResult.recommendations || []).map((recommendation, index) => (
                  <View key={`recommendation-${index}`} style={styles.item}>
                    <MaterialCommunityIcons name="check-circle-outline" size={18} color="#4CAF50" />
                    <Text style={styles.itemText}>{recommendation}</Text>
                  </View>
                ))}
              </View>
              
              <View style={styles.statsContainer}>
                <Text style={styles.sectionTitle}>สถิติ</Text>
                
                <View style={styles.statsGrid}>
                  <View style={styles.statItem}>
                    <Text style={styles.statLabel}>ระยะเวลานอนเฉลี่ย</Text>
                    <Text style={styles.statValue}>
                      {analysisResult.stats?.averageDurationHours || '0.0'} ชั่วโมง
                    </Text>
                  </View>
                  
                  <View style={styles.statItem}>
                    <Text style={styles.statLabel}>ความสม่ำเสมอ</Text>
                    <Text style={styles.statValue}>
                      {analysisResult.stats?.consistencyScore || 0}%
                    </Text>
                  </View>
                  
                  <View style={styles.statItem}>
                    <Text style={styles.statLabel}>จำนวนวันที่วิเคราะห์</Text>
                    <Text style={styles.statValue}>
                      {analysisResult.stats?.daysAnalyzed || 0} วัน
                    </Text>
                  </View>
                  
                  <View style={styles.statItem}>
                    <Text style={styles.statLabel}>อัตราการนอนน้อย</Text>
                    <Text style={styles.statValue}>
                      {analysisResult.stats?.lowSleepPercentage || 0}%
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          ) : (
            <Text style={styles.noDataText}>ไม่มีข้อมูลการวิเคราะห์</Text>
          )}
        </View>
        
        {/* Daily Recommendation */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="lightbulb-on" size={24} color="#FF9500" />
            <Text style={styles.cardTitle}>คำแนะนำประจำวัน</Text>
          </View>
          
          {recommendation ? (
            <View style={styles.recommendationContent}>
              <Text style={styles.recommendationTitle}>{recommendation.title || 'ไม่มีคำแนะนำ'}</Text>
              <Text style={styles.recommendationMessage}>{recommendation.message || ''}</Text>
              
              {recommendation.actionItems && recommendation.actionItems.length > 0 && (
                <View style={styles.actionItemsContainer}>
                  {recommendation.actionItems.map((item, index) => (
                    <View key={`action-${index}`} style={styles.actionItem}>
                      <MaterialCommunityIcons name="check-circle-outline" size={18} color="#FF9500" />
                      <Text style={styles.actionItemText}>{item}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          ) : (
            <Text style={styles.noDataText}>ไม่มีคำแนะนำประจำวัน</Text>
          )}
        </View>
        
        {/* Sleep Issues */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="alert-circle-outline" size={24} color="#FF5722" />
            <Text style={styles.cardTitle}>ปัญหาการนอนที่ตรวจพบ</Text>
          </View>
          
          {sleepIssues && sleepIssues.length > 0 ? (
            <View style={styles.issuesContainer}>
              {sleepIssues.map((issue, index) => (
                <View key={`issue-${index}`} style={styles.issueItem}>
                  <MaterialCommunityIcons name="alert-circle" size={18} color="#FF5722" />
                  <View style={styles.issueContent}>
                    <Text style={styles.issueType}>{issue.type}</Text>
                    <Text style={styles.issueMessage}>{issue.message}</Text>
                    <Text style={styles.issueSeverity}>ระดับความรุนแรง: {issue.severity}</Text>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.noDataText}>ไม่พบปัญหาการนอนที่น่ากังวล</Text>
          )}
        </View>
        
        {/* Test Results */}
        {testResults && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons name="test-tube" size={24} color="#8E44AD" />
              <Text style={styles.cardTitle}>ผลการทดสอบฟังก์ชัน</Text>
            </View>
            
            <View style={styles.testResultsContainer}>
              <View style={styles.testResultItem}>
                <Text style={styles.testResultLabel}>จำนวนการทดสอบทั้งหมด</Text>
                <Text style={styles.testResultValue}>{testResults.testsRun}</Text>
              </View>
              
              <View style={styles.testResultItem}>
                <Text style={styles.testResultLabel}>ผ่านการทดสอบ</Text>
                <Text style={[
                  styles.testResultValue, 
                  testResults.testsPassed === testResults.testsRun 
                    ? styles.testSuccessText 
                    : styles.testFailText
                ]}>
                  {testResults.testsPassed} / {testResults.testsRun}
                </Text>
              </View>
              
              {testResults.errors.length > 0 && (
                <View style={styles.errorsContainer}>
                  <Text style={styles.errorsTitle}>ข้อผิดพลาดที่พบ</Text>
                  {testResults.errors.map((error, index) => (
                    <Text key={`error-${index}`} style={styles.errorText}>
                      {index + 1}. {error.message}
                    </Text>
                  ))}
                </View>
              )}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: '#CCCCCC',
    lineHeight: 22,
  },
  patternSelector: {
    flexDirection: 'row',
    backgroundColor: '#1C1C1E',
    borderRadius: 8,
    margin: 16,
    marginTop: 8,
    overflow: 'hidden',
  },
  patternButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  selectedPatternButton: {
    backgroundColor: '#333333',
  },
  patternButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  runTestButton: {
    backgroundColor: '#0A84FF',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 16,
  },
  runTestButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    padding: 16,
    margin: 16,
    marginTop: 0,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  analysisContent: {
    
  },
  messageText: {
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 16,
    lineHeight: 22,
  },
  section: {
    marginBottom: 16,
    backgroundColor: 'rgba(10, 132, 255, 0.1)',
    borderRadius: 8,
    padding: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  item: {
    flexDirection: 'row',
    marginBottom: 10,
    alignItems: 'flex-start',
  },
  itemText: {
    fontSize: 14,
    color: '#FFFFFF',
    marginLeft: 10,
    flex: 1,
    lineHeight: 20,
  },
  statsContainer: {
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  statItem: {
    width: '48%',
    backgroundColor: '#2C2C2E',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  statLabel: {
    fontSize: 12,
    color: '#999999',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  recommendationContent: {
    
  },
  recommendationTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  recommendationMessage: {
    fontSize: 15,
    color: '#CCCCCC',
    marginBottom: 16,
    lineHeight: 22,
  },
  actionItemsContainer: {
    backgroundColor: 'rgba(255, 149, 0, 0.1)',
    borderRadius: 8,
    padding: 12,
  },
  actionItem: {
    flexDirection: 'row',
    marginBottom: 10,
    alignItems: 'flex-start',
  },
  actionItemText: {
    fontSize: 14,
    color: '#FFFFFF',
    marginLeft: 10,
    flex: 1,
    lineHeight: 20,
  },
  issuesContainer: {
    
  },
  issueItem: {
    flexDirection: 'row',
    marginBottom: 16,
    backgroundColor: 'rgba(255, 87, 34, 0.1)',
    borderRadius: 8,
    padding: 12,
  },
  issueContent: {
    marginLeft: 10,
    flex: 1,
  },
  issueType: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF5722',
    marginBottom: 4,
  },
  issueMessage: {
    fontSize: 14,
    color: '#FFFFFF',
    marginBottom: 6,
    lineHeight: 20,
  },
  issueSeverity: {
    fontSize: 12,
    color: '#CCCCCC',
  },
  noDataText: {
    fontSize: 15,
    color: '#999999',
    textAlign: 'center',
    padding: 16,
  },
  testResultsContainer: {
    
  },
  testResultItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    padding: 10,
    backgroundColor: '#2C2C2E',
    borderRadius: 8,
  },
  testResultLabel: {
    fontSize: 14,
    color: '#CCCCCC',
  },
  testResultValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  testSuccessText: {
    color: '#4CAF50',
  },
  testFailText: {
    color: '#FF5722',
  },
  errorsContainer: {
    backgroundColor: 'rgba(255, 87, 34, 0.1)',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  errorsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF5722',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 13,
    color: '#FFFFFF',
    marginBottom: 4,
    lineHeight: 18,
  },
});

export default SleepTestScreen; 