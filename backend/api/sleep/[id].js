// API endpoints for individual sleep record operations
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

// Helper function to write sleep data
const writeSleepData = (data) => {
  try {
    fs.writeFileSync(sleepFilePath, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error('Error writing sleep data:', error);
    return false;
  }
};

export default function handler(req, res) {
  const { id } = req.query;

  // Handle different HTTP methods
  switch (req.method) {
    case 'GET':
      return getSleepRecordById(req, res, id);
    case 'PUT':
      return updateSleepRecord(req, res, id);
    case 'DELETE':
      return deleteSleepRecord(req, res, id);
    default:
      return res.status(405).json({ message: 'Method not allowed' });
  }
}

// GET /api/sleep/:id - Get a specific sleep record
function getSleepRecordById(req, res, id) {
  try {
    const data = readSleepData();
    const record = data.sleepRecords.find(record => record.id === id);

    if (!record) {
      return res.status(404).json({ message: 'Sleep record not found' });
    }

    return res.status(200).json(record);
  } catch (error) {
    console.error('Error getting sleep record:', error);
    return res.status(500).json({ message: 'Failed to get sleep record', error: error.message });
  }
}

// PUT /api/sleep/:id - Update a sleep record
function updateSleepRecord(req, res, id) {
  try {
    const { 
      bedTime, 
      wakeTime, 
      quality, 
      notes,
      sleepEnvironment,
      interruptions 
    } = req.body;
    
    // Read current data
    const data = readSleepData();
    
    // Find record index
    const recordIndex = data.sleepRecords.findIndex(record => record.id === id);
    
    if (recordIndex === -1) {
      return res.status(404).json({ message: 'Sleep record not found' });
    }
    
    // Calculate duration if bed time or wake time changed
    let durationMinutes = data.sleepRecords[recordIndex].durationMinutes;
    
    if (bedTime || wakeTime) {
      const bedTimeDate = new Date(bedTime || data.sleepRecords[recordIndex].bedTime);
      const wakeTimeDate = new Date(wakeTime || data.sleepRecords[recordIndex].wakeTime);
      
      if (wakeTimeDate <= bedTimeDate) {
        return res.status(400).json({ message: 'Wake time must be after bed time' });
      }
      
      const durationMs = wakeTimeDate - bedTimeDate;
      durationMinutes = Math.floor(durationMs / (1000 * 60));
    }
    
    // Update record data
    data.sleepRecords[recordIndex] = {
      ...data.sleepRecords[recordIndex],
      bedTime: bedTime || data.sleepRecords[recordIndex].bedTime,
      wakeTime: wakeTime || data.sleepRecords[recordIndex].wakeTime,
      durationMinutes,
      quality: quality !== undefined ? quality : data.sleepRecords[recordIndex].quality,
      notes: notes !== undefined ? notes : data.sleepRecords[recordIndex].notes,
      sleepEnvironment: sleepEnvironment || data.sleepRecords[recordIndex].sleepEnvironment,
      interruptions: interruptions || data.sleepRecords[recordIndex].interruptions,
      updatedAt: new Date().toISOString()
    };
    
    // Write back to file
    if (writeSleepData(data)) {
      return res.status(200).json(data.sleepRecords[recordIndex]);
    } else {
      return res.status(500).json({ message: 'Failed to update sleep record' });
    }
  } catch (error) {
    console.error('Error updating sleep record:', error);
    return res.status(500).json({ message: 'Failed to update sleep record', error: error.message });
  }
}

// DELETE /api/sleep/:id - Delete a sleep record
function deleteSleepRecord(req, res, id) {
  try {
    // Read current data
    const data = readSleepData();
    
    // Check if record exists
    const recordIndex = data.sleepRecords.findIndex(record => record.id === id);
    
    if (recordIndex === -1) {
      return res.status(404).json({ message: 'Sleep record not found' });
    }
    
    // Remove record
    data.sleepRecords.splice(recordIndex, 1);
    
    // Write back to file
    if (writeSleepData(data)) {
      return res.status(200).json({ message: 'Sleep record deleted successfully' });
    } else {
      return res.status(500).json({ message: 'Failed to delete sleep record' });
    }
  } catch (error) {
    console.error('Error deleting sleep record:', error);
    return res.status(500).json({ message: 'Failed to delete sleep record', error: error.message });
  }
} 