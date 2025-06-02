import { configureStore } from '@reduxjs/toolkit';
import sleepReducer from './slices/sleepSlice';
import sensorReducer from './slices/sensorSlice';
import weatherReducer from './slices/weatherSlice';

const store = configureStore({
  reducer: {
    sleep: sleepReducer,
    sensor: sensorReducer,
    weather: weatherReducer,
    // อื่นๆ เช่น alarmReducer, userReducer
  },
  middleware: getDefaultMiddleware => 
    getDefaultMiddleware({
      serializableCheck: false // ป้องกันปัญหา non-serializable values (เช่น Date objects)
    }),
});

export default store; 