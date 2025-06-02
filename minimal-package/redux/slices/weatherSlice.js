import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { 
  fetchWeatherData, 
  fetchWeatherForecast, 
  getCurrentLocation,
  analyzeWeatherImpactOnSleep
} from '../../utils/WeatherService';

// Initial State
const initialState = {
  currentWeather: null,
  weatherForecast: null,
  location: null,
  sleepImpact: null,
  loading: false,
  error: null,
  lastUpdated: null,
};

// Async Thunks
export const getWeatherData = createAsyncThunk(
  'weather/getWeatherData',
  async (_, { rejectWithValue }) => {
    try {
      // รับพิกัดปัจจุบัน
      const coordinates = await getCurrentLocation();
      
      if (!coordinates) {
        return rejectWithValue('ไม่สามารถรับพิกัดปัจจุบันได้');
      }
      
      // ดึงข้อมูลสภาพอากาศ
      const weatherData = await fetchWeatherData(coordinates);
      
      if (!weatherData) {
        return rejectWithValue('ไม่สามารถดึงข้อมูลสภาพอากาศได้');
      }
      
      // วิเคราะห์ผลกระทบต่อการนอนหลับ
      const sleepImpact = analyzeWeatherImpactOnSleep(weatherData);
      
      return {
        currentWeather: weatherData,
        location: coordinates,
        sleepImpact,
        lastUpdated: new Date().toISOString(),
      };
    } catch (error) {
      return rejectWithValue(error.message || 'เกิดข้อผิดพลาดในการดึงข้อมูลสภาพอากาศ');
    }
  }
);

export const getWeatherForecast = createAsyncThunk(
  'weather/getWeatherForecast',
  async (_, { rejectWithValue, getState }) => {
    try {
      // ดึงพิกัดจาก state หรือรับพิกัดใหม่
      let coordinates = getState().weather.location;
      
      if (!coordinates) {
        coordinates = await getCurrentLocation();
      }
      
      if (!coordinates) {
        return rejectWithValue('ไม่สามารถรับพิกัดปัจจุบันได้');
      }
      
      // ดึงข้อมูลสภาพอากาศล่วงหน้า
      const forecastData = await fetchWeatherForecast(coordinates);
      
      if (!forecastData) {
        return rejectWithValue('ไม่สามารถดึงข้อมูลสภาพอากาศล่วงหน้าได้');
      }
      
      return forecastData;
    } catch (error) {
      return rejectWithValue(error.message || 'เกิดข้อผิดพลาดในการดึงข้อมูลสภาพอากาศล่วงหน้า');
    }
  }
);

// Create Slice
const weatherSlice = createSlice({
  name: 'weather',
  initialState,
  reducers: {
    clearWeatherData: (state) => {
      state.currentWeather = null;
      state.weatherForecast = null;
      state.sleepImpact = null;
      state.lastUpdated = null;
    },
    resetWeatherState: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      // getWeatherData
      .addCase(getWeatherData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getWeatherData.fulfilled, (state, action) => {
        state.loading = false;
        state.currentWeather = action.payload.currentWeather;
        state.location = action.payload.location;
        state.sleepImpact = action.payload.sleepImpact;
        state.lastUpdated = action.payload.lastUpdated;
      })
      .addCase(getWeatherData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // getWeatherForecast
      .addCase(getWeatherForecast.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getWeatherForecast.fulfilled, (state, action) => {
        state.loading = false;
        state.weatherForecast = action.payload;
      })
      .addCase(getWeatherForecast.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

// Export Actions and Reducer
export const { clearWeatherData, resetWeatherState } = weatherSlice.actions;
export default weatherSlice.reducer;

// Selectors
export const selectCurrentWeather = (state) => state.weather.currentWeather;
export const selectWeatherForecast = (state) => state.weather.weatherForecast;
export const selectLocation = (state) => state.weather.location;
export const selectSleepImpact = (state) => state.weather.sleepImpact;
export const selectWeatherLoading = (state) => state.weather.loading;
export const selectWeatherError = (state) => state.weather.error;
export const selectLastUpdated = (state) => state.weather.lastUpdated; 