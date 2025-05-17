// import axios from 'axios';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';

// OpenWeatherMap API key - Replace with your actual API key when using
const API_KEY = 'f9aa240d0d02d61ef411d0c90e751856';
const BASE_URL = 'https://api.openweathermap.org/data/2.5';

// Storage keys
const WEATHER_CACHE_KEY = '@weather_cache';
const WEATHER_CACHE_TIME_KEY = '@weather_cache_time';
const LOCATION_CACHE_KEY = '@location_cache';

// Cache duration in milliseconds (30 minutes)
const CACHE_DURATION = 30 * 60 * 1000;

// Using fetch instead of axios
const fetchAPI = async (url, params) => {
  const queryParams = new URLSearchParams(params).toString();
  const fullUrl = `${url}?${queryParams}`;
  
  const response = await fetch(fullUrl);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return await response.json();
};

/**
 * ขอสิทธิ์การเข้าถึงตำแหน่งปัจจุบัน
 * @returns {Promise<boolean>} สถานะการขอสิทธิ์
 */
export const requestLocationPermission = async () => {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.error('Error requesting location permission:', error);
    return false;
  }
};

/**
 * รับพิกัดปัจจุบันของผู้ใช้
 * @returns {Promise<object|null>} พิกัดปัจจุบัน (lat, lon) หรือ null ถ้าไม่สามารถรับได้
 */
export const getCurrentLocation = async () => {
  try {
    // ลองดูว่ามีข้อมูลใน cache หรือไม่
    const cachedLocation = await AsyncStorage.getItem(LOCATION_CACHE_KEY);
    if (cachedLocation) {
      return JSON.parse(cachedLocation);
    }
    
    // ขอสิทธิ์การเข้าถึงตำแหน่ง
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) {
      console.log('Location permission not granted');
      return null;
    }
    
    // รับตำแหน่งปัจจุบัน
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    
    const coordinates = {
      lat: location.coords.latitude,
      lon: location.coords.longitude,
    };
    
    // บันทึกลง cache
    await AsyncStorage.setItem(LOCATION_CACHE_KEY, JSON.stringify(coordinates));
    
    return coordinates;
  } catch (error) {
    console.error('Error getting current location:', error);
    return null;
  }
};

/**
 * ดึงข้อมูลสภาพอากาศจาก API
 * @param {object} coordinates พิกัด (lat, lon)
 * @returns {Promise<object|null>} ข้อมูลสภาพอากาศ หรือ null ถ้าไม่สามารถดึงได้
 */
export const fetchWeatherData = async (coordinates = null) => {
  try {
    // ตรวจสอบ cache ก่อน
    const cachedData = await AsyncStorage.getItem(WEATHER_CACHE_KEY);
    const cachedTimeStr = await AsyncStorage.getItem(WEATHER_CACHE_TIME_KEY);
    
    if (cachedData && cachedTimeStr) {
      const cachedTime = parseInt(cachedTimeStr);
      const now = Date.now();
      
      // ถ้า cache ยังไม่หมดอายุ ให้ใช้ข้อมูลจาก cache
      if (now - cachedTime < CACHE_DURATION) {
        return JSON.parse(cachedData);
      }
    }
    
    // ถ้าไม่มีพิกัดให้มา ให้รับพิกัดปัจจุบัน
    if (!coordinates) {
      coordinates = await getCurrentLocation();
    }
    
    if (!coordinates) {
      console.log('No coordinates available');
      return null;
    }
    
    // ดึงข้อมูลสภาพอากาศ (using fetch instead of axios)
    const params = {
      lat: coordinates.lat,
      lon: coordinates.lon,
      appid: API_KEY,
      units: 'metric', // หน่วยเป็น Celsius
      lang: 'th', // ภาษาไทย
    };
    
    const response = await fetchAPI(`${BASE_URL}/weather`, params);
    
    // เตรียมข้อมูลที่จะส่งกลับ
    const weatherData = {
      city: response.name,
      country: response.sys.country,
      temperature: response.main.temp,
      feelsLike: response.main.feels_like,
      humidity: response.main.humidity,
      windSpeed: response.wind.speed,
      description: response.weather[0].description,
      icon: response.weather[0].icon,
      condition: response.weather[0].main,
      pressure: response.main.pressure,
      timestamp: new Date().toISOString(),
    };
    
    // บันทึกลง cache
    await AsyncStorage.setItem(WEATHER_CACHE_KEY, JSON.stringify(weatherData));
    await AsyncStorage.setItem(WEATHER_CACHE_TIME_KEY, Date.now().toString());
    
    return weatherData;
  } catch (error) {
    console.error('Error fetching weather data:', error);
    return null;
  }
};

/**
 * ดึงข้อมูลสภาพอากาศล่วงหน้า 5 วัน
 * @param {object} coordinates พิกัด (lat, lon)
 * @returns {Promise<object|null>} ข้อมูลสภาพอากาศล่วงหน้า หรือ null ถ้าไม่สามารถดึงได้
 */
export const fetchWeatherForecast = async (coordinates = null) => {
  try {
    // ถ้าไม่มีพิกัดให้มา ให้รับพิกัดปัจจุบัน
    if (!coordinates) {
      coordinates = await getCurrentLocation();
    }
    
    if (!coordinates) {
      console.log('No coordinates available');
      return null;
    }
    
    // ดึงข้อมูลสภาพอากาศล่วงหน้า 5 วัน / 3 ชั่วโมง (using fetch instead of axios)
    const params = {
      lat: coordinates.lat,
      lon: coordinates.lon,
      appid: API_KEY,
      units: 'metric',
      lang: 'th',
      cnt: 40, // จำนวนการพยากรณ์ (3 ชั่วโมง x 40 = 5 วัน)
    };
    
    const response = await fetchAPI(`${BASE_URL}/forecast`, params);
    
    // กรองข้อมูลเฉพาะเวลากลางคืน (18:00 - 06:00)
    const nightForecast = response.list.filter(item => {
      const hour = new Date(item.dt * 1000).getHours();
      return hour >= 18 || hour <= 6;
    });
    
    // ปรับรูปแบบข้อมูล
    const formattedForecast = nightForecast.map(item => ({
      timestamp: item.dt * 1000,
      date: new Date(item.dt * 1000).toISOString(),
      temperature: item.main.temp,
      feelsLike: item.main.feels_like,
      humidity: item.main.humidity,
      description: item.weather[0].description,
      icon: item.weather[0].icon,
      condition: item.weather[0].main,
    }));
    
    return {
      city: response.city.name,
      country: response.city.country,
      forecast: formattedForecast,
    };
  } catch (error) {
    console.error('Error fetching weather forecast:', error);
    return null;
  }
};

/**
 * วิเคราะห์ผลกระทบของสภาพอากาศต่อการนอนหลับ
 * @param {object} weatherData ข้อมูลสภาพอากาศ
 * @returns {object} ผลกระทบของสภาพอากาศต่อการนอนหลับ
 */
export const analyzeWeatherImpactOnSleep = (weatherData) => {
  if (!weatherData) return null;
  
  const { temperature, humidity, condition } = weatherData;
  
  let sleepQualityImpact = 0; // -5 ถึง 5 (-5 = แย่มาก, 5 = ดีมาก)
  let recommendations = [];
  let impactDetails = [];
  
  // ผลกระทบจากอุณหภูมิ
  if (temperature < 15) {
    sleepQualityImpact -= 2;
    impactDetails.push('อุณหภูมิต่ำเกินไป อาจทำให้รู้สึกหนาวและนอนไม่สบาย');
    recommendations.push('ใช้ผ้าห่มหนาและสวมเสื้อผ้าที่อบอุ่น');
  } else if (temperature >= 15 && temperature <= 22) {
    sleepQualityImpact += 3;
    impactDetails.push('อุณหภูมิเหมาะสมสำหรับการนอนหลับที่ดี');
  } else if (temperature > 22 && temperature <= 27) {
    sleepQualityImpact += 1;
    impactDetails.push('อุณหภูมิค่อนข้างสูงสำหรับการนอน');
    recommendations.push('ใช้พัดลมหรือเครื่องปรับอากาศเพื่อลดอุณหภูมิลง');
  } else {
    sleepQualityImpact -= 3;
    impactDetails.push('อุณหภูมิสูงเกินไปทำให้นอนหลับยาก');
    recommendations.push('ใช้เครื่องปรับอากาศหรือพัดลมและดื่มน้ำให้เพียงพอ');
  }
  
  // ผลกระทบจากความชื้น
  if (humidity < 30) {
    sleepQualityImpact -= 1;
    impactDetails.push('ความชื้นต่ำเกินไปอาจทำให้จมูกและลำคอแห้ง');
    recommendations.push('ใช้เครื่องเพิ่มความชื้นในห้องนอน');
  } else if (humidity >= 30 && humidity <= 50) {
    sleepQualityImpact += 2;
    impactDetails.push('ความชื้นอยู่ในระดับที่เหมาะสมสำหรับการนอนหลับ');
  } else if (humidity > 50 && humidity <= 65) {
    sleepQualityImpact += 0;
    impactDetails.push('ความชื้นค่อนข้างสูง');
    recommendations.push('เปิดเครื่องปรับอากาศเพื่อลดความชื้น');
  } else {
    sleepQualityImpact -= 2;
    impactDetails.push('ความชื้นสูงเกินไปทำให้รู้สึกอึดอัดและนอนไม่สบาย');
    recommendations.push('ใช้เครื่องลดความชื้นหรือเปิดเครื่องปรับอากาศ');
  }
  
  // ผลกระทบจากสภาพอากาศ
  switch (condition) {
    case 'Rain':
    case 'Drizzle':
      sleepQualityImpact += 1;
      impactDetails.push('เสียงฝนตกเบาๆ ช่วยให้นอนหลับได้ดีขึ้น');
      break;
    case 'Thunderstorm':
      sleepQualityImpact -= 2;
      impactDetails.push('พายุฟ้าร้องอาจรบกวนการนอนหลับ');
      recommendations.push('ใช้ที่อุดหูหรือเปิดเสียงธรรมชาติเบาๆ เพื่อกลบเสียงฟ้าร้อง');
      break;
    case 'Snow':
      sleepQualityImpact += 1;
      impactDetails.push('อากาศหนาวเย็นอาจช่วยให้นอนหลับได้ดีขึ้น แต่ต้องรักษาอุณหภูมิร่างกายให้อบอุ่น');
      break;
    case 'Clear':
      if (temperature > 25) {
        sleepQualityImpact -= 1;
        impactDetails.push('ท้องฟ้าโปร่งแต่อุณหภูมิสูงอาจทำให้นอนหลับยาก');
      } else {
        sleepQualityImpact += 1;
        impactDetails.push('สภาพอากาศเหมาะสมสำหรับการนอนหลับ');
      }
      break;
    case 'Clouds':
      sleepQualityImpact += 0.5;
      impactDetails.push('ท้องฟ้ามีเมฆมากช่วยบดบังแสงแดดและอาจช่วยให้นอนหลับได้ดีขึ้น');
      break;
    default:
      sleepQualityImpact += 0;
  }
  
  // เพิ่มคำแนะนำทั่วไป
  recommendations.push('ปิดแอร์หรือลดอุณหภูมิลงให้อยู่ระหว่าง 18-22 องศา');
  recommendations.push('ใช้ผ้าห่มที่เหมาะสมกับอุณหภูมิห้อง');
  
  // แปลงค่า sleepQualityImpact เป็นเปอร์เซ็นต์
  const sleepQualityScore = Math.min(100, Math.max(0, 50 + sleepQualityImpact * 10));
  
  return {
    sleepQualityScore,
    impactDetails,
    recommendations: [...new Set(recommendations)], // ลบรายการที่ซ้ำกัน
    temperature,
    humidity,
    condition,
  };
}; 