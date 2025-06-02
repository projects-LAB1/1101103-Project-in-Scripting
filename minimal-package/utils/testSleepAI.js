/**
 * utils/testSleepAI.js
 * ระบบทดสอบการวิเคราะห์การนอนด้วย AI
 */

const sleepAI = require('./sleepAI.js');
const { analyzeSleepPatterns, getDailyRecommendation, detectSleepIssues } = sleepAI;

// ข้อมูลตัวอย่างสำหรับการทดสอบ - รูปแบบการนอนที่ดี
exports.goodSleepPatternSample = [
  {
    id: 'test-001',
    bedTime: new Date(new Date().setDate(new Date().getDate() - 1)).toISOString(),
    wakeTime: new Date(new Date(new Date().setDate(new Date().getDate() - 1)).getTime() + 8 * 60 * 60 * 1000).toISOString(),
    durationMinutes: 480, // 8 ชั่วโมง
    interruptions: 0,
    timeToFallAsleep: 10,
    quality: 'good',
    notes: 'นอนหลับดี',
  },
  {
    id: 'test-002',
    bedTime: new Date(new Date().setDate(new Date().getDate() - 2)).toISOString(),
    wakeTime: new Date(new Date(new Date().setDate(new Date().getDate() - 2)).getTime() + 7.5 * 60 * 60 * 1000).toISOString(),
    durationMinutes: 450, // 7.5 ชั่วโมง
    interruptions: 1,
    timeToFallAsleep: 15,
    quality: 'good',
    notes: 'นอนหลับค่อนข้างดี',
  },
  {
    id: 'test-003',
    bedTime: new Date(new Date().setDate(new Date().getDate() - 3)).toISOString(),
    wakeTime: new Date(new Date(new Date().setDate(new Date().getDate() - 3)).getTime() + 8 * 60 * 60 * 1000).toISOString(),
    durationMinutes: 480, // 8 ชั่วโมง
    interruptions: 0,
    timeToFallAsleep: 10,
    quality: 'excellent',
    notes: 'นอนหลับดีมาก',
  },
  {
    id: 'test-004',
    bedTime: new Date(new Date().setDate(new Date().getDate() - 4)).toISOString(),
    wakeTime: new Date(new Date(new Date().setDate(new Date().getDate() - 4)).getTime() + 7.8 * 60 * 60 * 1000).toISOString(),
    durationMinutes: 468, // 7.8 ชั่วโมง
    interruptions: 1,
    timeToFallAsleep: 12,
    quality: 'good',
    notes: 'นอนหลับดี',
  },
  {
    id: 'test-005',
    bedTime: new Date(new Date().setDate(new Date().getDate() - 5)).toISOString(),
    wakeTime: new Date(new Date(new Date().setDate(new Date().getDate() - 5)).getTime() + 8.2 * 60 * 60 * 1000).toISOString(),
    durationMinutes: 492, // 8.2 ชั่วโมง
    interruptions: 0,
    timeToFallAsleep: 5,
    quality: 'excellent',
    notes: 'นอนหลับดีมาก',
  },
];

// ข้อมูลตัวอย่างสำหรับการทดสอบ - รูปแบบการนอนที่แย่
exports.badSleepPatternSample = [
  {
    id: 'test-101',
    bedTime: new Date(new Date().setHours(2, 30, 0, 0)).toISOString(), // นอนดึกมาก
    wakeTime: new Date(new Date().setHours(7, 0, 0, 0)).toISOString(),
    durationMinutes: 270, // 4.5 ชั่วโมง
    interruptions: 3,
    timeToFallAsleep: 45,
    quality: 'poor',
    notes: 'นอนหลับไม่ดี',
  },
  {
    id: 'test-102',
    bedTime: new Date(new Date(new Date().setDate(new Date().getDate() - 1)).setHours(1, 15, 0, 0)).toISOString(),
    wakeTime: new Date(new Date(new Date().setDate(new Date().getDate() - 1)).setHours(6, 0, 0, 0)).toISOString(),
    durationMinutes: 285, // 4.75 ชั่วโมง
    interruptions: 2,
    timeToFallAsleep: 60,
    quality: 'poor',
    notes: 'นอนไม่หลับ',
  },
  {
    id: 'test-103',
    bedTime: new Date(new Date(new Date().setDate(new Date().getDate() - 2)).setHours(3, 0, 0, 0)).toISOString(),
    wakeTime: new Date(new Date(new Date().setDate(new Date().getDate() - 2)).setHours(8, 30, 0, 0)).toISOString(),
    durationMinutes: 330, // 5.5 ชั่วโมง
    interruptions: 4,
    timeToFallAsleep: 30,
    quality: 'fair',
    notes: 'นอนหลับพอใช้',
  },
  {
    id: 'test-104',
    bedTime: new Date(new Date(new Date().setDate(new Date().getDate() - 3)).setHours(0, 30, 0, 0)).toISOString(),
    wakeTime: new Date(new Date(new Date().setDate(new Date().getDate() - 3)).setHours(5, 45, 0, 0)).toISOString(),
    durationMinutes: 315, // 5.25 ชั่วโมง
    interruptions: 2,
    timeToFallAsleep: 35,
    quality: 'poor',
    notes: 'นอนไม่ค่อยหลับ',
  },
  {
    id: 'test-105',
    bedTime: new Date(new Date(new Date().setDate(new Date().getDate() - 4)).setHours(2, 0, 0, 0)).toISOString(),
    wakeTime: new Date(new Date(new Date().setDate(new Date().getDate() - 4)).setHours(7, 30, 0, 0)).toISOString(),
    durationMinutes: 330, // 5.5 ชั่วโมง
    interruptions: 3,
    timeToFallAsleep: 40,
    quality: 'poor',
    notes: 'นอนแย่',
  },
];

// ข้อมูลตัวอย่างสำหรับการทดสอบ - รูปแบบการนอนที่ไม่สม่ำเสมอ
exports.inconsistentSleepPatternSample = [
  {
    id: 'test-201',
    bedTime: new Date(new Date().setHours(23, 0, 0, 0)).toISOString(), // วันจันทร์
    wakeTime: new Date(new Date(new Date().setHours(7, 0, 0, 0)).getTime() + 24 * 60 * 60 * 1000).toISOString(),
    durationMinutes: 480, // 8 ชั่วโมง
    interruptions: 1,
    timeToFallAsleep: 15,
    quality: 'good',
    notes: 'นอนหลับดี',
  },
  {
    id: 'test-202',
    bedTime: new Date(new Date(new Date().setDate(new Date().getDate() - 1)).setHours(1, 30, 0, 0)).toISOString(), // วันอังคาร
    wakeTime: new Date(new Date(new Date().setDate(new Date().getDate() - 1)).setHours(8, 0, 0, 0)).toISOString(),
    durationMinutes: 390, // 6.5 ชั่วโมง
    interruptions: 1,
    timeToFallAsleep: 20,
    quality: 'fair',
    notes: 'นอนหลับพอใช้',
  },
  {
    id: 'test-203',
    bedTime: new Date(new Date(new Date().setDate(new Date().getDate() - 2)).setHours(22, 0, 0, 0)).toISOString(), // วันพุธ
    wakeTime: new Date(new Date(new Date().setDate(new Date().getDate() - 1)).setHours(6, 0, 0, 0)).toISOString(),
    durationMinutes: 480, // 8 ชั่วโมง
    interruptions: 0,
    timeToFallAsleep: 10,
    quality: 'good',
    notes: 'นอนหลับดี',
  },
  {
    id: 'test-204',
    bedTime: new Date(new Date(new Date().setDate(new Date().getDate() - 3)).setHours(3, 0, 0, 0)).toISOString(), // วันพฤหัสบดี
    wakeTime: new Date(new Date(new Date().setDate(new Date().getDate() - 3)).setHours(9, 30, 0, 0)).toISOString(),
    durationMinutes: 390, // 6.5 ชั่วโมง
    interruptions: 2,
    timeToFallAsleep: 30,
    quality: 'fair',
    notes: 'นอนหลับพอใช้',
  },
  {
    id: 'test-205',
    bedTime: new Date(new Date(new Date().setDate(new Date().getDate() - 4)).setHours(23, 30, 0, 0)).toISOString(), // วันศุกร์
    wakeTime: new Date(new Date(new Date().setDate(new Date().getDate() - 3)).setHours(11, 0, 0, 0)).toISOString(),
    durationMinutes: 690, // 11.5 ชั่วโมง
    interruptions: 1,
    timeToFallAsleep: 15,
    quality: 'good',
    notes: 'นอนชดเชย',
  },
];

// เป้าหมายการนอนตัวอย่าง
exports.sampleSleepGoals = {
  targetHours: 8,
  bedTimeTarget: '23:00',
  wakeTimeTarget: '07:00',
  weekdayBedTime: '23:00',
  weekdayWakeTime: '07:00',
  weekendBedTime: '23:30',
  weekendWakeTime: '08:00',
  consistency: true
};

// ฟังก์ชันทดสอบวิเคราะห์รูปแบบการนอน
exports.testSleepPatternAnalysis = (pattern = 'good') => {
  let sampleData;
  
  switch (pattern) {
    case 'good':
      sampleData = exports.goodSleepPatternSample;
      break;
    case 'bad':
      sampleData = exports.badSleepPatternSample;
      break;
    case 'inconsistent':
      sampleData = exports.inconsistentSleepPatternSample;
      break;
    default:
      sampleData = exports.goodSleepPatternSample;
  }

  // วิเคราะห์รูปแบบการนอน
  const analysis = analyzeSleepPatterns(sampleData, exports.sampleSleepGoals);
  
  return {
    pattern,
    analysis
  };
};

// ฟังก์ชันทดสอบคำแนะนำประจำวัน
exports.testDailyRecommendation = (sleepQuality = 'good') => {
  let latestRecord;
  
  switch (sleepQuality) {
    case 'good':
      latestRecord = exports.goodSleepPatternSample[0]; // บันทึกล่าสุดของรูปแบบการนอนที่ดี
      break;
    case 'bad':
      latestRecord = exports.badSleepPatternSample[0]; // บันทึกล่าสุดของรูปแบบการนอนที่แย่
      break;
    case 'inconsistent':
      latestRecord = exports.inconsistentSleepPatternSample[0]; // บันทึกล่าสุดของรูปแบบการนอนที่ไม่สม่ำเสมอ
      break;
    default:
      latestRecord = exports.goodSleepPatternSample[0];
  }

  // วิเคราะห์รูปแบบการนอนสำหรับใช้เป็นข้อมูลเพิ่มเติม
  const analysis = analyzeSleepPatterns(
    sleepQuality === 'good' ? exports.goodSleepPatternSample : 
    sleepQuality === 'bad' ? exports.badSleepPatternSample : 
    exports.inconsistentSleepPatternSample,
    exports.sampleSleepGoals
  );
  
  // ขอคำแนะนำประจำวัน
  const recommendation = getDailyRecommendation(latestRecord, exports.sampleSleepGoals, analysis);
  
  return {
    sleepQuality,
    latestRecord,
    recommendation
  };
};

// ฟังก์ชันทดสอบการตรวจจับปัญหาการนอน
exports.testSleepIssueDetection = (pattern = 'bad') => {
  let sampleData;
  
  switch (pattern) {
    case 'good':
      sampleData = exports.goodSleepPatternSample;
      break;
    case 'bad':
      sampleData = exports.badSleepPatternSample;
      break;
    case 'inconsistent':
      sampleData = exports.inconsistentSleepPatternSample;
      break;
    default:
      sampleData = exports.badSleepPatternSample;
  }

  // ตรวจจับปัญหาการนอน
  const issues = detectSleepIssues(sampleData);
  
  return {
    pattern,
    issues,
    hasIssues: issues.length > 0
  };
};

/**
 * Run all tests and return a comprehensive result
 */
exports.runAllTests = () => {
  const results = {
    testsRun: 0,
    testsPassed: 0,
    errors: [],
    success: true,
    sampleAnalysis: null,
    sampleRecommendation: null
  };

  try {
    // Test pattern analysis
    console.log('Testing sleep pattern analysis...');
    
    // Good sleep pattern
    const goodPatternTest = exports.testSleepPatternAnalysis('good');
    results.testsRun++;
    
    if (goodPatternTest.analysis && 
        goodPatternTest.analysis.insights && 
        goodPatternTest.analysis.recommendations &&
        goodPatternTest.analysis.stats) {
      results.testsPassed++;
      console.log('✓ Good sleep pattern analysis passed');
      // Save sample for display
      results.sampleAnalysis = goodPatternTest.analysis;
    } else {
      results.success = false;
      results.errors.push(new Error('Good sleep pattern analysis failed'));
      console.log('✗ Good sleep pattern analysis failed');
    }
    
    // Bad sleep pattern
    const badPatternTest = exports.testSleepPatternAnalysis('bad');
    results.testsRun++;
    
    if (badPatternTest.analysis && 
        badPatternTest.analysis.insights && 
        badPatternTest.analysis.recommendations &&
        badPatternTest.analysis.stats) {
      results.testsPassed++;
      console.log('✓ Bad sleep pattern analysis passed');
    } else {
      results.success = false;
      results.errors.push(new Error('Bad sleep pattern analysis failed'));
      console.log('✗ Bad sleep pattern analysis failed');
    }
    
    // Inconsistent sleep pattern
    const inconsistentPatternTest = exports.testSleepPatternAnalysis('inconsistent');
    results.testsRun++;
    
    if (inconsistentPatternTest.analysis && 
        inconsistentPatternTest.analysis.insights && 
        inconsistentPatternTest.analysis.recommendations &&
        inconsistentPatternTest.analysis.stats) {
      results.testsPassed++;
      console.log('✓ Inconsistent sleep pattern analysis passed');
    } else {
      results.success = false;
      results.errors.push(new Error('Inconsistent sleep pattern analysis failed'));
      console.log('✗ Inconsistent sleep pattern analysis failed');
    }

    // Test daily recommendations
    console.log('\nTesting daily recommendations...');
    
    // Good sleep recommendation
    const goodRecommendationTest = exports.testDailyRecommendation('good');
    results.testsRun++;
    
    if (goodRecommendationTest.recommendation && 
        goodRecommendationTest.recommendation.title && 
        goodRecommendationTest.recommendation.message) {
      results.testsPassed++;
      console.log('✓ Good sleep recommendation test passed');
      // Save sample for display
      results.sampleRecommendation = goodRecommendationTest.recommendation;
    } else {
      results.success = false;
      results.errors.push(new Error('Good sleep recommendation test failed'));
      console.log('✗ Good sleep recommendation test failed');
    }
    
    // Bad sleep recommendation
    const badRecommendationTest = exports.testDailyRecommendation('bad');
    results.testsRun++;
    
    if (badRecommendationTest.recommendation && 
        badRecommendationTest.recommendation.title && 
        badRecommendationTest.recommendation.message &&
        badRecommendationTest.recommendation.actionItems.length > 0) {
      results.testsPassed++;
      console.log('✓ Bad sleep recommendation test passed');
    } else {
      results.success = false;
      results.errors.push(new Error('Bad sleep recommendation test failed'));
      console.log('✗ Bad sleep recommendation test failed');
    }

    // Test issue detection
    console.log('\nTesting sleep issue detection...');
    
    // Sleep issues in bad pattern
    const issueDetectionTest = exports.testSleepIssueDetection('bad');
    results.testsRun++;
    
    if (issueDetectionTest.issues && Array.isArray(issueDetectionTest.issues)) {
      results.testsPassed++;
      console.log('✓ Sleep issue detection test passed');
      console.log(`   Detected ${issueDetectionTest.issues.length} issues`);
    } else {
      results.success = false;
      results.errors.push(new Error('Sleep issue detection test failed'));
      console.log('✗ Sleep issue detection test failed');
    }

    // Verify stats structure (important for UI)
    const verifyStatsTest = verifyStatsStructure();
    results.testsRun++;
    
    if (verifyStatsTest.success) {
      results.testsPassed++;
      console.log('✓ Stats structure verification passed');
    } else {
      results.success = false;
      results.errors.push(new Error('Stats structure verification failed: ' + verifyStatsTest.message));
      console.log('✗ Stats structure verification failed: ' + verifyStatsTest.message);
    }

    return results;
  } catch (error) {
    results.success = false;
    results.errors.push(error);
    console.error('Test suite failed with error:', error);
    return results;
  }
};

/**
 * Verify that the stats structure from analyzeSleepPatterns matches what the UI expects
 */
const verifyStatsStructure = () => {
  try {
    const analysis = analyzeSleepPatterns(exports.goodSleepPatternSample, exports.sampleSleepGoals);
    
    // Check for required stats properties
    const requiredStats = [
      'averageDurationHours', 
      'avgDurationHours',  // For compatibility 
      'consistencyScore',
      'daysAnalyzed'
    ];
    
    const missingStats = requiredStats.filter(stat => 
      analysis.stats[stat] === undefined || analysis.stats[stat] === null
    );
    
    if (missingStats.length > 0) {
      return {
        success: false,
        message: `Missing required stats: ${missingStats.join(', ')}`
      };
    }
    
    return { success: true };
  } catch (error) {
    return {
      success: false,
      message: error.message
    };
  }
};

module.exports = {
  testSleepPatternAnalysis: exports.testSleepPatternAnalysis,
  testDailyRecommendation: exports.testDailyRecommendation,
  testSleepIssueDetection: exports.testSleepIssueDetection,
  runAllTests: exports.runAllTests,
  goodSleepPatternSample: exports.goodSleepPatternSample,
  badSleepPatternSample: exports.badSleepPatternSample,
  inconsistentSleepPatternSample: exports.inconsistentSleepPatternSample,
  sampleSleepGoals: exports.sampleSleepGoals
}; 