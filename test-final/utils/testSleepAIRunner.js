/**
 * utils/testSleepAIRunner.js
 * Test runner for the sleep AI analysis functionality
 */

const { runAllTests } = require('./testSleepAI.js');

/**
 * Simple test runner to debug and verify sleep AI analysis
 */
function runSleepAITests() {
  console.log('======= Running Sleep AI Tests =======');
  console.log('This will test all AI analysis functions with sample data');
  
  try {
    const results = runAllTests();
    
    // Pretty print the results
    console.log('\n====== Test Results Summary ======');
    console.log(`Total tests run: ${results.testsRun}`);
    console.log(`Tests passed: ${results.testsPassed}`);
    
    if (results.errors.length > 0) {
      console.log('\n====== Errors Encountered ======');
      results.errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error.name}: ${error.message}`);
        if (error.stack) {
          console.log(`   Stack: ${error.stack.split('\n')[1]}`);
        }
      });
    }
    
    // Log a sample analysis to verify the data structure
    if (results.sampleAnalysis) {
      console.log('\n====== Sample Analysis ======');
      console.log('Message:', results.sampleAnalysis.message);
      console.log('Stats:', JSON.stringify(results.sampleAnalysis.stats, null, 2));
      console.log(`Insights: ${results.sampleAnalysis.insights.length} items`);
      console.log(`Recommendations: ${results.sampleAnalysis.recommendations.length} items`);
    }
    
    // Log a sample recommendation
    if (results.sampleRecommendation) {
      console.log('\n====== Sample Recommendation ======');
      console.log('Title:', results.sampleRecommendation.title);
      console.log('Message:', results.sampleRecommendation.message);
      console.log(`Action Items: ${results.sampleRecommendation.actionItems.length} items`);
    }
    
    return results;
  } catch (error) {
    console.error('Test runner failed with error:', error);
    return {
      testsRun: 0,
      testsPassed: 0,
      errors: [error],
      success: false
    };
  }
}

module.exports = runSleepAITests;

// Allow running the tests from a console/terminal
if (typeof require !== 'undefined' && require.main === module) {
  runSleepAITests();
} 