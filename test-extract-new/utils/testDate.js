/**
 * Simple test script to verify date functions
 */

const testSleepAI = require('./testSleepAI.js');

console.log('Testing date functions...');

// Test bedTime and wakeTime from samples
try {
  // Test goodSleepPatternSample
  console.log('Testing goodSleepPatternSample:');
  const goodSample = testSleepAI.goodSleepPatternSample[0];
  console.log('  bedTime:', new Date(goodSample.bedTime).toLocaleString());
  console.log('  wakeTime:', new Date(goodSample.wakeTime).toLocaleString());
  console.log('  Duration in hours:', (new Date(goodSample.wakeTime) - new Date(goodSample.bedTime)) / (1000 * 60 * 60));

  // Test badSleepPatternSample
  console.log('\nTesting badSleepPatternSample:');
  const badSample = testSleepAI.badSleepPatternSample[0];
  console.log('  bedTime:', new Date(badSample.bedTime).toLocaleString());
  console.log('  wakeTime:', new Date(badSample.wakeTime).toLocaleString());
  console.log('  Duration in hours:', (new Date(badSample.wakeTime) - new Date(badSample.bedTime)) / (1000 * 60 * 60));

  // Test inconsistentSleepPatternSample
  console.log('\nTesting inconsistentSleepPatternSample:');
  const inconsistentSample = testSleepAI.inconsistentSleepPatternSample[0];
  console.log('  bedTime:', new Date(inconsistentSample.bedTime).toLocaleString());
  console.log('  wakeTime:', new Date(inconsistentSample.wakeTime).toLocaleString());
  console.log('  Duration in hours:', (new Date(inconsistentSample.wakeTime) - new Date(inconsistentSample.bedTime)) / (1000 * 60 * 60));

  // Test specific problematic entries
  console.log('\nTesting entry #203 (wake time fix):');
  const entry203 = testSleepAI.inconsistentSleepPatternSample[2];
  console.log('  bedTime:', new Date(entry203.bedTime).toLocaleString());
  console.log('  wakeTime:', new Date(entry203.wakeTime).toLocaleString());
  console.log('  Duration in hours:', (new Date(entry203.wakeTime) - new Date(entry203.bedTime)) / (1000 * 60 * 60));

  console.log('\nTesting entry #205 (wake time fix):');
  const entry205 = testSleepAI.inconsistentSleepPatternSample[4];
  console.log('  bedTime:', new Date(entry205.bedTime).toLocaleString());
  console.log('  wakeTime:', new Date(entry205.wakeTime).toLocaleString());
  console.log('  Duration in hours:', (new Date(entry205.wakeTime) - new Date(entry205.bedTime)) / (1000 * 60 * 60));

  console.log('\nTest completed successfully!');
} catch (error) {
  console.error('Error testing date functions:', error);
} 