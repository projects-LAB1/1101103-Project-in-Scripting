import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { 
  startAccelerometerTracking,
  stopAccelerometerTracking,
  startLightSensorTracking,
  stopLightSensorTracking,
  saveSleepDetectionData,
  getSleepDetectionHistory,
  clearSleepDetectionHistory
} from '../../utils/SensorManager';

// Initial State
const initialState = {
  // Motion Sensor
  motionTracking: false,
  motionData: {
    count: 0,
    noMotionCount: 0,
    sleepDetected: false,
    lastUpdate: null,
  },
  // Light Sensor
  lightTracking: false,
  lightData: {
    currentLightLevel: null,
    recommendation: null,
    lastUpdate: null,
  },
  // Auto Sleep Detection
  sleepDetectionHistory: [],
  sleepDetectionEnabled: false,
  // Loading states
  loading: false,
  error: null,
};

// Async Thunks
export const startMotionTracking = createAsyncThunk(
  'sensor/startMotionTracking',
  async (updateInterval = 1000, { rejectWithValue }) => {
    try {
      const success = await startAccelerometerTracking(updateInterval);
      if (!success) {
        return rejectWithValue('ไม่สามารถเริ่มการตรวจจับการเคลื่อนไหวได้');
      }
      return true;
    } catch (error) {
      return rejectWithValue(error.message || 'เกิดข้อผิดพลาดในการเริ่มการตรวจจับการเคลื่อนไหว');
    }
  }
);

export const stopMotionTracking = createAsyncThunk(
  'sensor/stopMotionTracking',
  async (_, { rejectWithValue }) => {
    try {
      const success = stopAccelerometerTracking();
      if (!success) {
        return rejectWithValue('ไม่สามารถหยุดการตรวจจับการเคลื่อนไหวได้');
      }
      return true;
    } catch (error) {
      return rejectWithValue(error.message || 'เกิดข้อผิดพลาดในการหยุดการตรวจจับการเคลื่อนไหว');
    }
  }
);

export const startLightTracking = createAsyncThunk(
  'sensor/startLightTracking',
  async (updateInterval = 1000, { rejectWithValue }) => {
    try {
      const success = await startLightSensorTracking(updateInterval);
      if (!success) {
        return rejectWithValue('ไม่สามารถเริ่มการตรวจจับแสงได้');
      }
      return true;
    } catch (error) {
      return rejectWithValue(error.message || 'เกิดข้อผิดพลาดในการเริ่มการตรวจจับแสง');
    }
  }
);

export const stopLightTracking = createAsyncThunk(
  'sensor/stopLightTracking',
  async (_, { rejectWithValue }) => {
    try {
      const success = stopLightSensorTracking();
      if (!success) {
        return rejectWithValue('ไม่สามารถหยุดการตรวจจับแสงได้');
      }
      return true;
    } catch (error) {
      return rejectWithValue(error.message || 'เกิดข้อผิดพลาดในการหยุดการตรวจจับแสง');
    }
  }
);

export const saveSleepDetection = createAsyncThunk(
  'sensor/saveSleepDetection',
  async (sleepData, { rejectWithValue }) => {
    try {
      const success = await saveSleepDetectionData(sleepData);
      if (!success) {
        return rejectWithValue('ไม่สามารถบันทึกข้อมูลการตรวจจับการนอนได้');
      }
      return sleepData;
    } catch (error) {
      return rejectWithValue(error.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูลการตรวจจับการนอน');
    }
  }
);

export const fetchSleepDetectionHistory = createAsyncThunk(
  'sensor/fetchSleepDetectionHistory',
  async (_, { rejectWithValue }) => {
    try {
      const history = await getSleepDetectionHistory();
      return history;
    } catch (error) {
      return rejectWithValue(error.message || 'เกิดข้อผิดพลาดในการดึงข้อมูลประวัติการตรวจจับการนอน');
    }
  }
);

export const clearSleepDetectionHistoryAction = createAsyncThunk(
  'sensor/clearSleepDetectionHistory',
  async (_, { rejectWithValue }) => {
    try {
      const success = await clearSleepDetectionHistory();
      if (!success) {
        return rejectWithValue('ไม่สามารถลบประวัติการตรวจจับการนอนได้');
      }
      return true;
    } catch (error) {
      return rejectWithValue(error.message || 'เกิดข้อผิดพลาดในการลบประวัติการตรวจจับการนอน');
    }
  }
);

// Create Slice
const sensorSlice = createSlice({
  name: 'sensor',
  initialState,
  reducers: {
    updateMotionData: (state, action) => {
      state.motionData = {
        ...state.motionData,
        ...action.payload,
      };
    },
    updateLightData: (state, action) => {
      state.lightData = {
        ...state.lightData,
        ...action.payload,
      };
    },
    setSleepDetectionEnabled: (state, action) => {
      state.sleepDetectionEnabled = action.payload;
    },
    addSleepDetection: (state, action) => {
      state.sleepDetectionHistory.push(action.payload);
      
      // จำกัดจำนวนประวัติที่เก็บ (เก็บแค่ 30 รายการล่าสุด)
      if (state.sleepDetectionHistory.length > 30) {
        state.sleepDetectionHistory = state.sleepDetectionHistory.slice(-30);
      }
    },
    resetSensorState: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      // startMotionTracking
      .addCase(startMotionTracking.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(startMotionTracking.fulfilled, (state) => {
        state.loading = false;
        state.motionTracking = true;
      })
      .addCase(startMotionTracking.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // stopMotionTracking
      .addCase(stopMotionTracking.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(stopMotionTracking.fulfilled, (state) => {
        state.loading = false;
        state.motionTracking = false;
        state.motionData = initialState.motionData;
      })
      .addCase(stopMotionTracking.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // startLightTracking
      .addCase(startLightTracking.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(startLightTracking.fulfilled, (state) => {
        state.loading = false;
        state.lightTracking = true;
      })
      .addCase(startLightTracking.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // stopLightTracking
      .addCase(stopLightTracking.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(stopLightTracking.fulfilled, (state) => {
        state.loading = false;
        state.lightTracking = false;
        state.lightData = initialState.lightData;
      })
      .addCase(stopLightTracking.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // saveSleepDetection
      .addCase(saveSleepDetection.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(saveSleepDetection.fulfilled, (state, action) => {
        state.loading = false;
        state.sleepDetectionHistory.push(action.payload);
        
        // จำกัดจำนวนประวัติที่เก็บ (เก็บแค่ 30 รายการล่าสุด)
        if (state.sleepDetectionHistory.length > 30) {
          state.sleepDetectionHistory = state.sleepDetectionHistory.slice(-30);
        }
      })
      .addCase(saveSleepDetection.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // fetchSleepDetectionHistory
      .addCase(fetchSleepDetectionHistory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSleepDetectionHistory.fulfilled, (state, action) => {
        state.loading = false;
        state.sleepDetectionHistory = action.payload;
      })
      .addCase(fetchSleepDetectionHistory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // clearSleepDetectionHistory
      .addCase(clearSleepDetectionHistoryAction.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(clearSleepDetectionHistoryAction.fulfilled, (state) => {
        state.loading = false;
        state.sleepDetectionHistory = [];
      })
      .addCase(clearSleepDetectionHistoryAction.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

// Export Actions and Reducer
export const { 
  updateMotionData, 
  updateLightData, 
  setSleepDetectionEnabled,
  addSleepDetection,
  resetSensorState
} = sensorSlice.actions;
export default sensorSlice.reducer;

// Selectors
export const selectMotionTracking = (state) => state.sensor.motionTracking;
export const selectMotionData = (state) => state.sensor.motionData;
export const selectLightTracking = (state) => state.sensor.lightTracking;
export const selectLightData = (state) => state.sensor.lightData;
export const selectSleepDetectionHistory = (state) => state.sensor.sleepDetectionHistory;
export const selectSleepDetectionEnabled = (state) => state.sensor.sleepDetectionEnabled;
export const selectSensorLoading = (state) => state.sensor.loading;
export const selectSensorError = (state) => state.sensor.error; 