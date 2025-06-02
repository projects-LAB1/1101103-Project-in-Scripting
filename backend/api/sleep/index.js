// API endpoints for sleep data
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Path to our JSON file that will act as a database
const sleepFilePath = path.join(process.cwd(), 'data', 'sleep.json');

// Helper function to read sleep data
const readSleepData = () => {
  try {
    // Check if file exists, if not create it with empty array
    if (!fs.existsSync(sleepFilePath)) {
      const dirPath = path.join(process.cwd(), 'data');
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }
      fs.writeFileSync(sleepFilePath, JSON.stringify({ sleepRecords: [] }));
      return { sleepRecords: [] };
    }
    
    const jsonData = fs.readFileSync(sleepFilePath);
    return JSON.parse(jsonData);
  } catch (error) {
    console.error('Error reading sleep data:', error);
    return { sleepRecords: [] };
  }
};

// Helper function to write sleep data
const writeSleepData = (data) => {
  try {
    const dirPath = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
    fs.writeFileSync(sleepFilePath, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error('Error writing sleep data:', error);
    return false;
  }
};

export default function handler(req, res) {
  // Handle different HTTP methods
  switch (req.method) {
    case 'GET':
      return getSleepRecords(req, res);
    case 'POST':
      return createSleepRecord(req, res);
    default:
      return res.status(405).json({ message: 'Method not allowed' });
  }
}

// GET /api/sleep - Get all sleep records
function getSleepRecords(req, res) {
  try {
    const { userId, startDate, endDate } = req.query;
    const data = readSleepData();
    
    // Apply filters
    let filteredRecords = [...data.sleepRecords];
    
    // Filter by userId if provided
    if (userId) {
      filteredRecords = filteredRecords.filter(record => record.userId === userId);
    }
    
    // Filter by date range if provided
    if (startDate) {
      const start = new Date(startDate);
      filteredRecords = filteredRecords.filter(record => {
        const recordDate = new Date(record.bedTime);
        return recordDate >= start;
      });
    }
    
    if (endDate) {
      const end = new Date(endDate);
      filteredRecords = filteredRecords.filter(record => {
        const recordDate = new Date(record.bedTime);
        return recordDate <= end;
      });
    }
    
    // Sort by bedTime (newest first)
    filteredRecords.sort((a, b) => new Date(b.bedTime) - new Date(a.bedTime));
    
    return res.status(200).json(filteredRecords);
  } catch (error) {
    console.error('Error getting sleep records:', error);
    return res.status(500).json({ message: 'Failed to get sleep records', error: error.message });
  }
}

// POST /api/sleep - Create a new sleep record
function createSleepRecord(req, res) {
  try {
    const { 
      userId, 
      bedTime, 
      wakeTime, 
      quality, 
      notes,
      sleepEnvironment,
      interruptions 
    } = req.body;
    
    // Validate required fields
    if (!userId || !bedTime || !wakeTime) {
      return res.status(400).json({ message: 'User ID, bed time, and wake time are required' });
    }
    
    // Validate bedTime and wakeTime are valid dates
    const bedTimeDate = new Date(bedTime);
    const wakeTimeDate = new Date(wakeTime);
    
    if (isNaN(bedTimeDate.getTime()) || isNaN(wakeTimeDate.getTime())) {
      return res.status(400).json({ message: 'Invalid date format for bed time or wake time' });
    }
    
    // Validate that wake time is after bed time
    if (wakeTimeDate <= bedTimeDate) {
      return res.status(400).json({ message: 'Wake time must be after bed time' });
    }
    
    // Calculate duration in minutes
    const durationMs = wakeTimeDate - bedTimeDate;
    const durationMinutes = Math.floor(durationMs / (1000 * 60));
    
    // Read current data
    const data = readSleepData();
    
    // Create new sleep record
    const newRecord = {
      id: uuidv4(),
      userId,
      bedTime,
      wakeTime,
      durationMinutes,
      quality: quality || 3, // Default to medium quality (scale 1-5)
      notes: notes || '',
      sleepEnvironment: sleepEnvironment || {},
      interruptions: interruptions || [],
      createdAt: new Date().toISOString()
    };
    
    // Add to sleep records array
    data.sleepRecords.push(newRecord);
    
    // Write back to file
    if (writeSleepData(data)) {
      return res.status(201).json(newRecord);
    } else {
      return res.status(500).json({ message: 'Failed to create sleep record' });
    }
  } catch (error) {
    console.error('Error creating sleep record:', error);
    return res.status(500).json({ message: 'Failed to create sleep record', error: error.message });
  }
} 