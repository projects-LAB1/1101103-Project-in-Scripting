import React, { createContext, useState, useContext, useEffect } from 'react';
import { 
  loadSleepData, 
  saveSleepData, 
  addSleepRecord, 
  updateSleepRecord, 
  deleteSleepRecord,
  loadSleepGoals,
  saveSleepGoals,
  analyzeSleepPatterns
} from '../utils/sleepStorage';

// Create the context
const SleepContext = createContext();

// Custom hook to use the sleep context
export const useSleep = () => useContext(SleepContext);

// Provider component
export const SleepProvider = ({ children }) => {
  const [sleepRecords, setSleepRecords] = useState([]);
  const [sleepGoals, setSleepGoals] = useState(null);
  const [sleepAnalytics, setSleepAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Load sleep data on mount
  useEffect(() => {
    loadSleepDataFromStorage();
  }, []);

  // Load sleep data and analytics
  const loadSleepDataFromStorage = async () => {
    try {
      setLoading(true);
      
      // Load sleep records
      const records = await loadSleepData();
      setSleepRecords(records);
      
      // Load sleep goals
      const goals = await loadSleepGoals();
      setSleepGoals(goals);
      
      // Generate analytics if we have records
      if (records.length > 0) {
        const analytics = analyzeSleepPatterns(records);
        setSleepAnalytics(analytics);
      }
    } catch (error) {
      console.error('Error loading sleep data in context:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Refresh data
  const refresh = async () => {
    setRefreshing(true);
    await loadSleepDataFromStorage();
  };

  // Add a new sleep record
  const addSleep = async (sleepRecord) => {
    try {
      const newRecord = await addSleepRecord(sleepRecord);
      setSleepRecords(prev => [...prev, newRecord]);
      
      // Update analytics
      const analytics = analyzeSleepPatterns([...sleepRecords, newRecord]);
      setSleepAnalytics(analytics);
      
      return newRecord;
    } catch (error) {
      console.error('Error adding sleep record in context:', error);
      throw error;
    }
  };

  // Update a sleep record
  const updateSleep = async (id, data) => {
    try {
      const success = await updateSleepRecord(id, data);
      if (success) {
        // Update the state with the updated record
        const updatedRecords = sleepRecords.map(record => 
          record.id === id ? { ...record, ...data } : record
        );
        setSleepRecords(updatedRecords);
        
        // Update analytics
        const analytics = analyzeSleepPatterns(updatedRecords);
        setSleepAnalytics(analytics);
      }
      return success;
    } catch (error) {
      console.error('Error updating sleep record in context:', error);
      throw error;
    }
  };

  // Delete a sleep record
  const deleteSleep = async (id) => {
    try {
      const success = await deleteSleepRecord(id);
      if (success) {
        // Remove the record from state
        const updatedRecords = sleepRecords.filter(record => record.id !== id);
        setSleepRecords(updatedRecords);
        
        // Update analytics
        const analytics = analyzeSleepPatterns(updatedRecords);
        setSleepAnalytics(analytics);
      }
      return success;
    } catch (error) {
      console.error('Error deleting sleep record in context:', error);
      throw error;
    }
  };

  // Update sleep goals
  const updateSleepGoals = async (goals) => {
    try {
      const success = await saveSleepGoals(goals);
      if (success) {
        setSleepGoals(goals);
      }
      return success;
    } catch (error) {
      console.error('Error updating sleep goals in context:', error);
      throw error;
    }
  };

  // Calculate summary statistics for the past week
  const getWeeklySummary = () => {
    if (sleepRecords.length === 0) {
      return null;
    }
    
    // Get records for the past 7 days
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const weekRecords = sleepRecords.filter(record => 
      new Date(record.bedTime) >= oneWeekAgo
    );
    
    if (weekRecords.length === 0) {
      return null;
    }
    
    // Average sleep duration
    const totalDuration = weekRecords.reduce((sum, record) => sum + record.durationMinutes, 0);
    const avgDuration = totalDuration / weekRecords.length;
    
    // Best and worst days
    weekRecords.sort((a, b) => b.durationMinutes - a.durationMinutes);
    const bestSleep = weekRecords[0];
    const worstSleep = weekRecords[weekRecords.length - 1];
    
    return {
      recordsCount: weekRecords.length,
      avgDurationHours: (avgDuration / 60).toFixed(1),
      avgDurationMinutes: Math.round(avgDuration),
      bestSleep,
      worstSleep,
    };
  };

  // Provide the context value
  const value = {
    sleepRecords,
    sleepGoals,
    sleepAnalytics,
    loading,
    refreshing,
    refresh,
    addSleep,
    updateSleep,
    deleteSleep,
    updateSleepGoals,
    getWeeklySummary
  };

  return (
    <SleepContext.Provider value={value}>
      {children}
    </SleepContext.Provider>
  );
}; 