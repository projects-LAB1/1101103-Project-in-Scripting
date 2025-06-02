import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { 
  fetchSleepData, 
  addSleepRecordToFirestore, 
  updateSleepRecordInFirestore, 
  deleteSleepRecordFromFirestore,
  fetchSleepGoals,
  saveSleepGoalsToFirestore
} from '../../utils/firebaseStorage';
import { analyzeSleepPatterns } from '../../utils/sleepStorage';

// Async Thunks
export const fetchSleepRecords = createAsyncThunk(
  'sleep/fetchRecords',
  async (_, { rejectWithValue }) => {
    try {
      const records = await fetchSleepData();
      return records;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchGoals = createAsyncThunk(
  'sleep/fetchGoals',
  async (_, { rejectWithValue }) => {
    try {
      const goals = await fetchSleepGoals();
      return goals;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const addSleepRecord = createAsyncThunk(
  'sleep/addRecord',
  async (sleepRecord, { rejectWithValue }) => {
    try {
      const newRecord = await addSleepRecordToFirestore(sleepRecord);
      return newRecord;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateSleepRecord = createAsyncThunk(
  'sleep/updateRecord',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const success = await updateSleepRecordInFirestore(id, data);
      if (success) {
        return { id, changes: data };
      }
      return rejectWithValue('ไม่สามารถอัพเดทข้อมูลได้');
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const deleteSleepRecord = createAsyncThunk(
  'sleep/deleteRecord',
  async (id, { rejectWithValue }) => {
    try {
      const success = await deleteSleepRecordFromFirestore(id);
      if (success) {
        return id;
      }
      return rejectWithValue('ไม่สามารถลบข้อมูลได้');
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateSleepGoals = createAsyncThunk(
  'sleep/updateGoals',
  async (goals, { rejectWithValue }) => {
    try {
      const success = await saveSleepGoalsToFirestore(goals);
      if (success) {
        return goals;
      }
      return rejectWithValue('ไม่สามารถบันทึกเป้าหมายการนอนได้');
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Initial State
const initialState = {
  sleepRecords: [],
  sleepGoals: null,
  sleepAnalytics: null,
  loading: false,
  refreshing: false,
  error: null,
  isLoggedIn: false,
};

// Create Slice
const sleepSlice = createSlice({
  name: 'sleep',
  initialState,
  reducers: {
    setIsLoggedIn: (state, action) => {
      state.isLoggedIn = action.payload;
      if (!action.payload) {
        // รีเซ็ตข้อมูลเมื่อออกจากระบบ
        state.sleepRecords = [];
        state.sleepGoals = null;
        state.sleepAnalytics = null;
      }
    },
    setRefreshing: (state, action) => {
      state.refreshing = action.payload;
    },
    updateAnalytics: (state) => {
      if (state.sleepRecords.length > 0) {
        state.sleepAnalytics = analyzeSleepPatterns(state.sleepRecords);
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchSleepRecords
      .addCase(fetchSleepRecords.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSleepRecords.fulfilled, (state, action) => {
        state.loading = false;
        state.sleepRecords = action.payload;
        // อัพเดทการวิเคราะห์เมื่อได้รับข้อมูล
        if (action.payload.length > 0) {
          state.sleepAnalytics = analyzeSleepPatterns(action.payload);
        }
      })
      .addCase(fetchSleepRecords.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // fetchGoals
      .addCase(fetchGoals.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchGoals.fulfilled, (state, action) => {
        state.loading = false;
        state.sleepGoals = action.payload;
      })
      .addCase(fetchGoals.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // addSleepRecord
      .addCase(addSleepRecord.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addSleepRecord.fulfilled, (state, action) => {
        state.loading = false;
        state.sleepRecords.push(action.payload);
        // อัพเดทการวิเคราะห์
        state.sleepAnalytics = analyzeSleepPatterns(state.sleepRecords);
      })
      .addCase(addSleepRecord.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // updateSleepRecord
      .addCase(updateSleepRecord.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateSleepRecord.fulfilled, (state, action) => {
        state.loading = false;
        const { id, changes } = action.payload;
        state.sleepRecords = state.sleepRecords.map(record => 
          record.id === id ? { ...record, ...changes } : record
        );
        // อัพเดทการวิเคราะห์
        state.sleepAnalytics = analyzeSleepPatterns(state.sleepRecords);
      })
      .addCase(updateSleepRecord.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // deleteSleepRecord
      .addCase(deleteSleepRecord.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteSleepRecord.fulfilled, (state, action) => {
        state.loading = false;
        state.sleepRecords = state.sleepRecords.filter(record => record.id !== action.payload);
        // อัพเดทการวิเคราะห์
        state.sleepAnalytics = analyzeSleepPatterns(state.sleepRecords);
      })
      .addCase(deleteSleepRecord.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // updateSleepGoals
      .addCase(updateSleepGoals.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateSleepGoals.fulfilled, (state, action) => {
        state.loading = false;
        state.sleepGoals = action.payload;
      })
      .addCase(updateSleepGoals.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

// Export Actions and Reducer
export const { setIsLoggedIn, setRefreshing, updateAnalytics } = sleepSlice.actions;
export default sleepSlice.reducer;

// Selectors
export const selectSleepRecords = (state) => state.sleep.sleepRecords;
export const selectSleepGoals = (state) => state.sleep.sleepGoals;
export const selectSleepAnalytics = (state) => state.sleep.sleepAnalytics;
export const selectLoading = (state) => state.sleep.loading;
export const selectRefreshing = (state) => state.sleep.refreshing;
export const selectError = (state) => state.sleep.error;
export const selectIsLoggedIn = (state) => state.sleep.isLoggedIn;

// Helper Selectors
export const selectWeeklySummary = (state) => {
  const { sleepRecords } = state.sleep;
  
  if (sleepRecords.length === 0) {
    return null;
  }
  
  // ดึงข้อมูลย้อนหลัง 7 วัน
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  
  const weekRecords = sleepRecords.filter(record => 
    new Date(record.bedTime) >= oneWeekAgo
  );
  
  if (weekRecords.length === 0) {
    return null;
  }
  
  // คำนวณระยะเวลาเฉลี่ย
  const totalDuration = weekRecords.reduce((sum, record) => sum + record.durationMinutes, 0);
  const avgDuration = totalDuration / weekRecords.length;
  
  // หาวันที่นอนมากที่สุดและน้อยที่สุด
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