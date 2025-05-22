// API endpoint for getting sleep data for a specific user
import fs from 'fs';
import path from 'path';

// Path to our JSON file that will act as a database
const sleepFilePath = path.join(process.cwd(), 'data', 'sleep.json');

// Helper function to read sleep data
const readSleepData = () => {
  try {
    if (!fs.existsSync(sleepFilePath)) {
      return { sleepRecords: [] };
    }
    const jsonData = fs.readFileSync(sleepFilePath);
    return JSON.parse(jsonData);
  } catch (error) {
    console.error('Error reading sleep data:', error);
    return { sleepRecords: [] };
  }
};

export default function handler(req, res) {
  const { userId } = req.query;

  // Only allow GET method for this endpoint
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  return getUserSleepRecords(req, res, userId);
}

// GET /api/sleep/user/:userId - Get sleep records for a specific user
function getUserSleepRecords(req, res, userId) {
  try {
    const { startDate, endDate, limit } = req.query;
    const data = readSleepData();
    
    // Filter records for the specific user
    let userRecords = data.sleepRecords.filter(record => record.userId === userId);
    
    // Filter by date range if provided
    if (startDate) {
      const start = new Date(startDate);
      userRecords = userRecords.filter(record => {
        const recordDate = new Date(record.bedTime);
        return recordDate >= start;
      });
    }
    
    if (endDate) {
      const end = new Date(endDate);
      userRecords = userRecords.filter(record => {
        const recordDate = new Date(record.bedTime);
        return recordDate <= end;
      });
    }
    
    // Sort by bedTime (newest first)
    userRecords.sort((a, b) => new Date(b.bedTime) - new Date(a.bedTime));
    
    // Limit results if specified
    if (limit && !isNaN(parseInt(limit))) {
      userRecords = userRecords.slice(0, parseInt(limit));
    }
    
    // Calculate sleep statistics
    const stats = calculateSleepStats(userRecords);
    
    return res.status(200).json({
      userId,
      records: userRecords,
      stats,
      count: userRecords.length
    });
  } catch (error) {
    console.error('Error getting user sleep records:', error);
    return res.status(500).json({ message: 'Failed to get user sleep records', error: error.message });
  }
}

// Helper function to calculate sleep statistics
function calculateSleepStats(records) {
  if (!records || records.length === 0) {
    return {
      averageDuration: 0,
      averageQuality: 0,
      totalSleepTime: 0,
      recordCount: 0
    };
  }
  
  const totalDuration = records.reduce((sum, record) => sum + record.durationMinutes, 0);
  const totalQuality = records.reduce((sum, record) => sum + (record.quality || 0), 0);
  
  return {
    averageDuration: Math.round(totalDuration / records.length),
    averageQuality: records.some(r => r.quality) ? (totalQuality / records.filter(r => r.quality).length).toFixed(1) : 0,
    totalSleepTime: totalDuration,
    recordCount: records.length
  };
} 