// NotificationManager.js - จัดการการแจ้งเตือนแบบพุชในแอปพลิเคชัน
import * as Notifications from "expo-notifications";
import { Platform, Alert, Linking } from "react-native";
import Constants from "expo-constants";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState } from 'react-native';
import { Asset } from 'expo-asset';
import * as Device from 'expo-device';

// Add warning about expo-notifications in Expo Go
// This addresses the warning about push notifications being removed from Expo Go in SDK 53
const notificationsWarning = () => {
  if (__DEV__) {
    // Suppress the built-in warning by providing our own controlled warning
    console.warn(
      "Note: Push notifications functionality provided by expo-notifications will be removed from Expo Go in SDK 53. " +
        "For full notification support, use a development build instead."
    );
  }
};

// Call the warning function once when the module is imported
notificationsWarning();

// ฟังก์ชันดีเลย์แบบ Promise
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// ฟังก์ชันสำหรับตรวจสอบและจัดการนาฬิกาปลุกที่กำลังจะเกิดขึ้น
const checkUpcomingAlarms = async () => {
  try {
    // ดึงข้อมูลนาฬิกาปลุกจาก AsyncStorage
    const alarmsJson = await AsyncStorage.getItem('alarms');
    if (!alarmsJson) return [];

    const alarms = JSON.parse(alarmsJson);
    const activeAlarms = alarms.filter(alarm => alarm.isActive);
    const now = new Date();
    const upcomingAlarms = [];

    // ตรวจสอบนาฬิกาปลุกที่ใกล้จะเกิดขึ้น (ภายใน 15 นาที)
    for (const alarm of activeAlarms) {
      const alarmTime = getNextAlarmTime(alarm);
      
      if (alarmTime) {
        const timeDiff = alarmTime.getTime() - now.getTime();
        
        // ถ้าเวลาอยู่ใน 15 นาที ให้เพิ่มลงในรายการ
        if (timeDiff > 0 && timeDiff <= 15 * 60 * 1000) {
          upcomingAlarms.push({
            ...alarm,
            nextAlarmTime: alarmTime,
            timeDiff: timeDiff
          });
        }
      }
    }

    return upcomingAlarms;
  } catch (error) {
    console.error('Error checking upcoming alarms:', error);
    return [];
  }
};

// แก้ไขฟังก์ชัน registerBackgroundTask ให้เรียบง่ายขึ้น
export const registerBackgroundTask = async () => {
  try {
    console.log('ลงทะเบียนการตรวจสอบนาฬิกาปลุกในพื้นหลัง');
    return true;
  } catch (error) {
    console.error('ไม่สามารถลงทะเบียนการตรวจสอบในพื้นหลัง:', error);
    return false;
  }
};

// ฟังก์ชันคำนวณเวลาที่จะแจ้งเตือนครั้งถัดไปอย่างแม่นยำ
export const getNextAlarmTime = (alarm) => {
  try {
    if (!alarm || !alarm.isActive) {
      return null;
    }

    // ดึงเวลาปัจจุบัน
    const now = new Date();
    
    // สร้างวัตถุ Date ใหม่เพื่อกำหนดเวลาปลุกแบบใหม่ทั้งหมด
    let nextAlarm = new Date();
    
    // กำหนดเวลาตามที่ตั้งไว้ในนาฬิกาปลุก และรีเซ็ตวินาทีและมิลลิวินาที
    nextAlarm.setHours(parseInt(alarm.hour, 10));
    nextAlarm.setMinutes(parseInt(alarm.minute, 10));
    nextAlarm.setSeconds(0);
    nextAlarm.setMilliseconds(0);
    
    console.log(`[TIMING] เวลาปัจจุบัน: ${now.toLocaleString()}`);
    console.log(`[TIMING] เวลาที่ตั้งไว้: ${nextAlarm.toLocaleString()}`);

    // กรณีไม่มีการเปิดใช้งานการปลุกซ้ำ (ใช้ครั้งเดียว)
    if (!alarm.repeatDays || alarm.repeatDays.length === 0) {
      // ถ้าเวลาที่ตั้งไว้ผ่านไปแล้วในวันนี้ ให้เลื่อนไปวันถัดไป
      if (nextAlarm <= now) {
        nextAlarm.setDate(nextAlarm.getDate() + 1);
        console.log(`[INFO] เวลาปลุกผ่านไปแล้ว เลื่อนไป 1 วัน: ${nextAlarm.toLocaleString()}`);
      }
      
      // ตรวจสอบอีกครั้งว่าเวลาที่คำนวณอยู่ในอนาคต
      if (nextAlarm <= now) {
        console.log(`[ERROR] เวลาแจ้งเตือนยังไม่ถูกต้อง หลังจากเลื่อน: ${nextAlarm.toLocaleString()}`);
        // เพิ่มเวลาอีก 1 นาที เพื่อให้แน่ใจว่าอยู่ในอนาคต
        nextAlarm = new Date(now.getTime() + 60000); 
        console.log(`[RECOVERY] ปรับแก้เวลาเป็น: ${nextAlarm.toLocaleString()}`);
      }
      
      return nextAlarm;
    }

    // กรณีมีการเปิดใช้งานการปลุกซ้ำ
    // แปลงรูปแบบวันให้ตรงกับรูปแบบของ JavaScript (0=อาทิตย์, 1=จันทร์, ..., 6=เสาร์)
    const repeatDaysJS = alarm.repeatDays.map(day => {
      // แปลงจากรูปแบบของแอพ (0=จันทร์, ..., 6=อาทิตย์) เป็นรูปแบบของ JS Date
      return day === 6 ? 0 : day + 1;
    });
    
    console.log(`[DEBUG] วันที่ตั้งซ้ำ (JS format): ${repeatDaysJS.join(', ')}`);

    // วันปัจจุบันในรูปแบบของ JavaScript
    const todayJS = now.getDay(); // 0=อาทิตย์, 1=จันทร์, ..., 6=เสาร์
    console.log(`[DEBUG] วันนี้ (JS format): ${todayJS}`);

    // เรียงลำดับวันในสัปดาห์เริ่มจากวันปัจจุบัน
    const orderedDays = [];
    for (let i = 0; i < 7; i++) {
      const day = (todayJS + i) % 7;
      orderedDays.push(day);
    }
    
    console.log(`[DEBUG] วันเรียงลำดับจากวันนี้: ${orderedDays.join(', ')}`);

    // ค้นหาวันที่ใกล้ที่สุดที่มีการตั้งปลุก
    for (const day of orderedDays) {
      if (repeatDaysJS.includes(day)) {
        // สร้างวัตถุ Date ใหม่สำหรับวันนี้
        const candidateDate = new Date(now);
        
        // คำนวณจำนวนวันที่ต้องเพิ่ม
        const daysToAdd = (day - todayJS + 7) % 7;
        
        // เพิ่มจำนวนวัน
        candidateDate.setDate(candidateDate.getDate() + daysToAdd);
        
        // กำหนดเวลา
        candidateDate.setHours(parseInt(alarm.hour, 10));
        candidateDate.setMinutes(parseInt(alarm.minute, 10));
        candidateDate.setSeconds(0);
        candidateDate.setMilliseconds(0);
        
        console.log(`[DEBUG] พิจารณาวันที่ ${day} (เพิ่ม ${daysToAdd} วัน): ${candidateDate.toLocaleString()}`);

        // ถ้าเป็นวันนี้ แต่เวลาผ่านไปแล้ว ให้ข้ามไป
        if (daysToAdd === 0 && candidateDate <= now) {
          console.log(`[DEBUG] ข้ามวันนี้เนื่องจากเวลาผ่านไปแล้ว`);
          continue;
        }
        
        // ถ้าเวลาในอนาคต ใช้วันนี้
        console.log(`[SUCCESS] พบวันที่เหมาะสม: ${candidateDate.toLocaleString()}`);
        return candidateDate;
      }
    }

    // หากไม่พบวันที่เหมาะสม (ไม่ควรเกิดขึ้น)
    console.log('[WARNING] ไม่พบวันที่เหมาะสมสำหรับการปลุกซ้ำ');
    
    // สร้างเวลาแจ้งเตือนเริ่มต้นในวันถัดไป
    const fallbackDate = new Date(now);
    fallbackDate.setDate(fallbackDate.getDate() + 1);
    fallbackDate.setHours(parseInt(alarm.hour, 10));
    fallbackDate.setMinutes(parseInt(alarm.minute, 10));
    fallbackDate.setSeconds(0);
    fallbackDate.setMilliseconds(0);
    
    console.log(`[RECOVERY] กำหนดเวลาเริ่มต้นเป็นวันถัดไป: ${fallbackDate.toLocaleString()}`);
    return fallbackDate;
    
  } catch (error) {
    console.error('[ERROR] เกิดข้อผิดพลาดในการคำนวณเวลาแจ้งเตือน:', error);
    
    // สร้างเวลาแจ้งเตือนในกรณีเกิดข้อผิดพลาด (5 นาทีถัดไป)
    const errorFallbackDate = new Date();
    errorFallbackDate.setMinutes(errorFallbackDate.getMinutes() + 5);
    errorFallbackDate.setSeconds(0);
    errorFallbackDate.setMilliseconds(0);
    
    console.log(`[RECOVERY] กำหนดเวลาฉุกเฉินเป็น 5 นาทีหลังจากนี้: ${errorFallbackDate.toLocaleString()}`);
    return errorFallbackDate;
  }
}

// ตั้งค่าการแจ้งเตือนเมื่อแอปทำงานในพื้นหลัง
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    priority: Notifications.AndroidNotificationPriority.MAX,
    sound: true,
  }),
});

// ขอสิทธิ์การแจ้งเตือน
export const registerForPushNotificationsAsync = async () => {
  try {
    // ตรวจสอบว่าเป็นอุปกรณ์จริงหรือไม่
    if (!Device.isDevice) {
      console.warn('การแจ้งเตือนอาจไม่ทำงานบน simulator หรือ emulator');
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      Alert.alert(
        "ไม่ได้รับสิทธิ์",
        "กรุณาเปิดการแจ้งเตือนในการตั้งค่าเพื่อให้นาฬิกาปลุกทำงานได้",
        [
          { text: "ปิด", style: "cancel" },
          { text: "ไปที่การตั้งค่า", onPress: () => Linking.openSettings() }
        ]
      );
      return null;
    }

    // ตั้งค่าช่องทางการแจ้งเตือนสำหรับ Android
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("alarms", {
        name: "การปลุก",
        description: "แจ้งเตือนสำหรับนาฬิกาปลุก",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#FF231F7C",
        sound: "default",
        enableVibrate: true,
        enableLights: true,
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
        bypassDnd: true,
      });

      // เพิ่มช่องทางสำหรับการแจ้งเตือนฉุกเฉิน
      await Notifications.setNotificationChannelAsync("critical_alarms", {
        name: "การปลุกแบบสำคัญ",
        description: "แจ้งเตือนสำหรับนาฬิกาปลุกที่สำคัญ",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 500, 250, 500],
        lightColor: "#FF0000",
        sound: "default",
        enableVibrate: true,
        enableLights: true,
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
        bypassDnd: true,
      });
    }

    return true;
  } catch (error) {
    console.error("Error setting up notifications:", error);
    return false;
  }
};

// บันทึก token ลงใน AsyncStorage
export const savePushToken = async (userId, token) => {
  if (!userId || !token) return;

  try {
    const deviceInfo = {
      pushToken: token,
      platform: Platform.OS,
      version: Platform.Version,
      lastUpdated: new Date().toISOString(),
    };
    
    await AsyncStorage.setItem(`@device_info_${userId}`, JSON.stringify(deviceInfo));
    console.log("บันทึก Push Token สำเร็จ");
  } catch (error) {
    console.error("Error saving push token:", error);
  }
};

// ฟังก์ชันสำหรับการตั้งค่าการแจ้งเตือนนาฬิกาปลุก - ปรับปรุงโดยใช้ setTimeout แทน setInterval
export const scheduleAlarmNotification = async (alarm) => {
  if (!alarm || !alarm.isActive) {
    console.log('[INFO] ข้ามการตั้งค่าการแจ้งเตือนสำหรับนาฬิกาปลุกที่ไม่ได้เปิดใช้งาน');
    return null;
  }

  // ตรวจสอบการอนุญาตการแจ้งเตือน
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  
  if (finalStatus !== 'granted') {
    console.log('[ERROR] ไม่ได้รับสิทธิ์ในการส่งการแจ้งเตือน');
    Alert.alert(
      'การแจ้งเตือนถูกปิดใช้งาน',
      'กรุณาเปิดการแจ้งเตือนในการตั้งค่าเพื่อให้นาฬิกาปลุกทำงานได้',
      [
        { text: "ปิด", style: "cancel" },
        { text: "ไปที่การตั้งค่า", onPress: () => Linking.openSettings() }
      ]
    );
    return null;
  }

  try {
    // ตั้งค่าช่องทางการแจ้งเตือนหากยังไม่ได้ตั้งค่า
    await setupNotificationChannel();
    
    // ยกเลิกการแจ้งเตือนเดิมของนาฬิกาปลุกนี้ (ถ้ามี)
    if (alarm.notificationId) {
      try {
        console.log(`[INFO] กำลังยกเลิกการแจ้งเตือนเดิม ID: ${alarm.notificationId}`);
        await Notifications.cancelScheduledNotificationAsync(alarm.notificationId);
      } catch (cancelError) {
        console.log(`[WARN] ไม่สามารถยกเลิกการแจ้งเตือนเดิมได้: ${cancelError.message}`);
      }
    }
    
    // คำนวณเวลาในการแจ้งเตือนครั้งถัดไป
    const nextAlarmTime = getNextAlarmTime(alarm);
    
    if (!nextAlarmTime) {
      console.log('[ERROR] ไม่สามารถคำนวณเวลาการแจ้งเตือนได้');
      return null;
    }

    // ตรวจสอบว่าเวลาแจ้งเตือนถูกต้อง (อยู่ในอนาคตอย่างน้อย 10 วินาที)
    const now = new Date();
    const timeDifference = nextAlarmTime.getTime() - now.getTime();
    
    if (timeDifference <= 10000) { // น้อยกว่า 10 วินาที
      console.log('[WARN] เวลาแจ้งเตือนใกล้เกินไป อาจไม่ทำงานถูกต้อง:', nextAlarmTime.toString());
      
      // ถ้าเวลาผ่านไปแล้ว ให้เลื่อนไปเป็นวันถัดไป
      if (timeDifference <= 0) {
        if (alarm.repeatDays && alarm.repeatDays.length > 0) {
          // กรณีตั้งซ้ำ ให้เลื่อนไปวันที่ตรงกับการตั้งปลุกครั้งถัดไป
          nextAlarmTime.setDate(nextAlarmTime.getDate() + 1);
        } else {
          // กรณีไม่ตั้งซ้ำ ให้เลื่อนไปวันถัดไป
          nextAlarmTime.setDate(nextAlarmTime.getDate() + 1);
        }
        console.log('[INFO] เลื่อนการแจ้งเตือนไปวันถัดไป:', nextAlarmTime.toString());
      }
    }

    // คำนวณเวลาที่เหลืออีกครั้ง (อาจมีการเปลี่ยนแปลงหลังจากปรับ)
    const updatedTimeDifference = nextAlarmTime.getTime() - new Date().getTime();
    const minutesUntilAlarm = updatedTimeDifference / (60 * 1000);
    
    console.log(`[TIMING] เวลาปัจจุบัน: ${now.toLocaleString()}`);
    console.log(`[TIMING] เวลาที่จะแจ้งเตือน: ${nextAlarmTime.toLocaleString()}`);
    console.log(`[TIMING] เวลาที่เหลือ: ${minutesUntilAlarm.toFixed(2)} นาที`);

    // สร้างเนื้อหาของการแจ้งเตือน
    const content = {
      title: alarm.label || 'นาฬิกาปลุก',
      body: `เวลา ${alarm.hour.toString().padStart(2, '0')}:${alarm.minute.toString().padStart(2, '0')} น.`,
      sound: true,
      priority: 'max',
      sticky: true,
      data: { 
        alarm: {
          ...alarm,
          timestamp: nextAlarmTime.getTime()
        },
        alarmId: alarm.id,
        taskType: alarm.taskType || 'none',
        snooze: alarm.snooze || false,
        created: new Date().getTime(),
        timezone: new Date().getTimezoneOffset() // บันทึก timezone offset เพื่อตรวจสอบภายหลัง
      },
      channelId: Platform.OS === 'android' ? 'alarm-channel' : undefined,
    };

    // กำหนด trigger เวลาสำหรับการแจ้งเตือน
    const trigger = {
      date: nextAlarmTime,
      channelId: Platform.OS === 'android' ? 'alarm-channel' : undefined,
    };

    // ตั้งค่าการแจ้งเตือนโดยใช้ exposition-notification API
    let notificationId = await Notifications.scheduleNotificationAsync({
      content,
      trigger
    });

    console.log(`[SUCCESS] ตั้งค่าการแจ้งเตือนสำเร็จ ID: ${notificationId} สำหรับ "${alarm.label || 'นาฬิกาปลุก'}" เวลา: ${nextAlarmTime.toString()}`);
    
    // แบบการใช้งาน setTimeout (แนะนำเฉพาะกรณีแอพทำงานตลอดเวลาเท่านั้น)
    if (updatedTimeDifference <= 15 * 60 * 1000 && updatedTimeDifference > 0) { // ถ้าเหลือเวลาน้อยกว่า 15 นาที
      console.log(`[INFO] ตั้ง setTimeout สำหรับการแจ้งเตือนใน ${(updatedTimeDifference/1000).toFixed(0)} วินาที`);
      
      // ใช้ setTimeout เพื่อทริกเกอร์การแจ้งเตือนเมื่อถึงเวลา
      setTimeout(async () => {
        try {
          // ส่งการแจ้งเตือนทันทีเมื่อถึงเวลา
          await Notifications.scheduleNotificationAsync({
            content: {
              ...content,
              title: `${content.title} (ถึงเวลาแล้ว!)`,
              priority: 'max'
            },
            trigger: null // ส่งทันทีไม่ต้องรอ
          });
          
          console.log(`[ALERT] ส่งการแจ้งเตือนด่วนทันทีสำหรับ "${alarm.label || 'นาฬิกาปลุก'}"`);
        } catch (immediateError) {
          console.error('[ERROR] ไม่สามารถส่งการแจ้งเตือนทันที:', immediateError);
        }
      }, updatedTimeDifference);
    }
    
    return notificationId;
    
  } catch (error) {
    console.error('[ERROR] ไม่สามารถตั้งค่าการแจ้งเตือนได้:', error);
    return null;
  }
}

// ยกเลิกการแจ้งเตือน
export const cancelAlarmNotification = async (notificationIdOrIds) => {
  if (!notificationIdOrIds) {
    console.log('[INFO] ไม่มี notificationId ที่จะยกเลิก');
    return false;
  }

  try {
    // เช็คว่าเป็น object หรือไม่
    if (typeof notificationIdOrIds === 'object') {
      console.log('[DEBUG] notificationId เป็น object, กำลังแปลงค่า');
      
      // ถ้าเป็น object และมี allIds
      if (Array.isArray(notificationIdOrIds.allIds)) {
        console.log(`[INFO] ยกเลิก ${notificationIdOrIds.allIds.length} การแจ้งเตือนจาก allIds`);
        let success = true;
        for (const id of notificationIdOrIds.allIds) {
          if (typeof id === 'string' && id) {
            try {
              await Notifications.cancelScheduledNotificationAsync(id);
              console.log(`[INFO] ยกเลิกการแจ้งเตือน ID: ${id} สำเร็จ`);
            } catch (err) {
              console.log(`[WARN] ไม่สามารถยกเลิกการแจ้งเตือน ID: ${id} - ${err.message}`);
              success = false;
            }
          }
        }
        return success;
      }
      
      // ถ้ามี primaryId
      if (notificationIdOrIds.primaryId) {
        const id = notificationIdOrIds.primaryId;
        if (typeof id === 'string' && id) {
          await Notifications.cancelScheduledNotificationAsync(id);
          console.log(`[INFO] ยกเลิกการแจ้งเตือน (primaryId) ID: ${id} สำเร็จ`);
          return true;
        }
      }
      
      // ถ้ามี id
      if (notificationIdOrIds.id) {
        const id = notificationIdOrIds.id;
        if (typeof id === 'string' && id) {
          await Notifications.cancelScheduledNotificationAsync(id);
          console.log(`[INFO] ยกเลิกการแจ้งเตือน (id) ID: ${id} สำเร็จ`);
          return true;
        }
      }
      
      // ถ้าเป็น string (ไม่แน่ใจ)
      if (typeof notificationIdOrIds === 'string') {
        await Notifications.cancelScheduledNotificationAsync(notificationIdOrIds);
        console.log(`[INFO] ยกเลิกการแจ้งเตือน ID: ${notificationIdOrIds} สำเร็จ`);
        return true;
      }
      
      console.log('[ERROR] ไม่พบ ID ที่ถูกต้องใน object');
      return false;
    }
    
    // ถ้าเป็น array
    if (Array.isArray(notificationIdOrIds)) {
      console.log(`[INFO] ยกเลิก ${notificationIdOrIds.length} การแจ้งเตือนจาก array`);
      let success = true;
      for (const id of notificationIdOrIds) {
        if (typeof id === 'string' && id) {
          try {
            await Notifications.cancelScheduledNotificationAsync(id);
            console.log(`[INFO] ยกเลิกการแจ้งเตือน ID: ${id} สำเร็จ`);
          } catch (err) {
            console.log(`[WARN] ไม่สามารถยกเลิกการแจ้งเตือน ID: ${id} - ${err.message}`);
            success = false;
          }
        }
      }
      return success;
    }

    // ถ้าเป็น string
    if (typeof notificationIdOrIds === 'string') {
      await Notifications.cancelScheduledNotificationAsync(notificationIdOrIds);
      console.log(`[INFO] ยกเลิกการแจ้งเตือน ID: ${notificationIdOrIds} สำเร็จ`);
      return true;
    }

    console.log('[ERROR] รูปแบบ notificationId ไม่ถูกต้อง:', typeof notificationIdOrIds);
    return false;
  } catch (error) {
    console.error("[ERROR] เกิดข้อผิดพลาดในการยกเลิกการแจ้งเตือน:", error.message);
    return false;
  }
};

// ตรวจสอบการแจ้งเตือนที่ตั้งไว้
export const checkScheduledNotifications = async () => {
  try {
    const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
    console.log('การแจ้งเตือนที่ตั้งไว้:', scheduledNotifications.length, 'รายการ');
    return scheduledNotifications;
  } catch (error) {
    console.error('Error checking scheduled notifications:', error);
    return [];
  }
};

// รีเซ็ตการแจ้งเตือนทั้งหมดจากข้อมูลนาฬิกาปลุกที่มีอยู่
export const resetAllAlarmNotifications = async () => {
  try {
    // ยกเลิกการแจ้งเตือนทั้งหมดที่มีอยู่
    console.log('กำลังยกเลิกการแจ้งเตือนทั้งหมด...');
    await Notifications.cancelAllScheduledNotificationsAsync();
    
    // ดึงข้อมูลนาฬิกาปลุกจาก AsyncStorage
    const alarmsJson = await AsyncStorage.getItem('alarms');
    if (!alarmsJson) return [];

    const alarms = JSON.parse(alarmsJson);
    const activeAlarms = alarms.filter(alarm => alarm.isActive);
    
    console.log(`กำลังตั้งค่าการแจ้งเตือนใหม่ ${activeAlarms.length} รายการ`);
    
    // รอให้ข้อมูลพร้อมก่อนดำเนินการต่อ (ให้เวลาระบบได้ยกเลิกการแจ้งเตือนเดิมให้หมด)
    await delay(500);
    
    // ตั้งการแจ้งเตือนใหม่สำหรับทุกนาฬิกาปลุกที่เปิดใช้งาน
    const notifications = [];
    const updatedAlarms = [];
    
    for (const alarm of activeAlarms) {
      // รอให้แต่ละการตั้งค่าเสร็จสิ้นเพื่อหลีกเลี่ยงการแข่งขันกัน
      const notificationId = await scheduleAlarmNotification(alarm);
      
      if (notificationId) {
        // บันทึก notificationId 
        const updatedAlarm = {
          ...alarm,
          notificationId: notificationId
        };
        
        updatedAlarms.push(updatedAlarm);
        notifications.push({
          id: alarm.id,
          notificationId: notificationId
        });
      } else {
        // ถ้าไม่สามารถตั้งค่าการแจ้งเตือนได้ ให้คงข้อมูลเดิมไว้
        updatedAlarms.push(alarm);
      }
    }
    
    // เพิ่มกลับนาฬิกาปลุกที่ไม่ได้เปิดใช้งาน
    const inactiveAlarms = alarms.filter(alarm => !alarm.isActive);
    updatedAlarms.push(...inactiveAlarms);
    
    // บันทึกข้อมูลที่อัปเดต
    await AsyncStorage.setItem('alarms', JSON.stringify(updatedAlarms));
    
    console.log(`รีเซ็ตการแจ้งเตือนสำเร็จ ${notifications.length} รายการ`);
    return notifications;
  } catch (error) {
    console.error('Error resetting notifications:', error);
    return [];
  }
};

// ตั้งค่าการจัดการเมื่อได้รับการแจ้งเตือน
export const setupNotificationListeners = (navigation) => {
  // เมื่อได้รับการแจ้งเตือนและแอปกำลังทำงาน
  const foregroundSubscription = Notifications.addNotificationReceivedListener(
    (notification) => {
      const alarmData = notification.request.content.data.alarm;
      console.log("ได้รับการแจ้งเตือนในขณะที่แอปทำงาน:", alarmData);

      // ถ้าแอปกำลังทำงานอยู่แล้ว ให้นำทางไปยังหน้าปลุกทันที
      if (alarmData && navigation) {
        navigation.navigate("AlarmRinging", { alarm: alarmData });
      }
    }
  );

  // เมื่อผู้ใช้กดที่การแจ้งเตือน
  const responseSubscription =
    Notifications.addNotificationResponseReceivedListener((response) => {
      const alarmData = response.notification.request.content.data.alarm;
      console.log("ผู้ใช้กดที่การแจ้งเตือน:", alarmData);

      // นำทางไปยังหน้าปลุก
      if (alarmData && navigation) {
        navigation.navigate("AlarmRinging", { alarm: alarmData });
      }
    });

  // ตรวจจับการเปลี่ยนสถานะของแอป
  const appStateSubscription = AppState.addEventListener('change', nextAppState => {
    // เมื่อแอปกลับมาทำงาน foreground
    if (nextAppState === 'active') {
      // ตรวจสอบและสร้าง notifications ใหม่สำหรับนาฬิกาปลุกที่มีปัญหา
      checkAndFixAlarmNotifications();
      
      // ตรวจสอบสถานะเวลาและ timezone
      verifyTimeSettings();
    }
  });

  // คืนค่าฟังก์ชันสำหรับยกเลิกการติดตาม
  return () => {
    foregroundSubscription.remove();
    responseSubscription.remove();
    appStateSubscription.remove();
  };
};

// ฟังก์ชันตรวจสอบสถานะเวลาและ timezone
const verifyTimeSettings = () => {
  const now = new Date();
  console.log(`[SYSTEM] เวลาปัจจุบันของระบบ: ${now.toLocaleString()}`);
  console.log(`[SYSTEM] Timezone offset: ${now.getTimezoneOffset()} นาที`);
  
  // ตรวจสอบว่าเวลาระบบถูกต้อง (ตรวจสอบกับ network time ถ้าเป็นไปได้)
  // แสดงคำเตือนถ้าพบปัญหา
  
  return {
    currentTime: now.toLocaleString(),
    timezoneOffset: now.getTimezoneOffset()
  };
};

// ฟังก์ชันตรวจสอบและซ่อมแซมการแจ้งเตือน
const checkAndFixAlarmNotifications = async () => {
  try {
    // ดึงข้อมูลนาฬิกาปลุกจาก storage
    const alarmsJson = await AsyncStorage.getItem('alarms');
    if (!alarmsJson) return;

    const alarms = JSON.parse(alarmsJson);
    const activeAlarms = alarms.filter(alarm => alarm.isActive);
    
    // ดึงข้อมูลการแจ้งเตือนที่ตั้งไว้
    const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
    
    let needUpdate = false;
    const updatedAlarms = alarms.map(alarm => {
      // ตรวจสอบเฉพาะนาฬิกาปลุกที่เปิดใช้งาน
      if (alarm.isActive) {
        // หาการแจ้งเตือนทั้งหมดที่เกี่ยวข้องกับนาฬิกาปลุกนี้
        const notifications = scheduledNotifications.filter(n => 
          n.content?.data?.alarmId === alarm.id || 
          n.content?.data?.alarm?.id === alarm.id
        );
        
        // คำนวณเวลาถัดไปของการปลุก
        const nextAlarmTime = getNextAlarmTime(alarm);
        const now = new Date();
        const timeDiff = nextAlarmTime ? nextAlarmTime.getTime() - now.getTime() : 0;
        
        // ถ้าไม่มีการแจ้งเตือนหรือไม่ครบจำนวน หรือเวลาไม่ถูกต้อง
        const notificationMissing = !notifications.length;
        const notificationIdMismatch = alarm.notificationId && !notifications.some(n => n.identifier === alarm.notificationId);
        
        // ถ้าการแจ้งเตือนหายไป หรือรหัสไม่ตรงกัน และเวลาที่ต้องเตือนอยู่ในอนาคต
        if ((notificationMissing || notificationIdMismatch) && timeDiff > 0) {
          console.log(`การแจ้งเตือนสำหรับนาฬิกาปลุก ${alarm.id} สูญหายหรือไม่ถูกต้อง กำลังสร้างใหม่...`);
          
          // ตั้งการแจ้งเตือนใหม่
          scheduleAlarmNotification(alarm).then(notificationId => {
            if (notificationId) {
              alarm.notificationId = notificationId;
              needUpdate = true;
            }
          });
        }
      }
      return alarm;
    });
    
    // บันทึกข้อมูลที่อัปเดต
    if (needUpdate) {
      await AsyncStorage.setItem('alarms', JSON.stringify(updatedAlarms));
      console.log('อัพเดตข้อมูลนาฬิกาปลุกและการแจ้งเตือนสำเร็จ');
    }
  } catch (error) {
    console.error('Error checking and fixing alarm notifications:', error);
  }
};

// ตรวจสอบและขอสิทธิ์การแจ้งเตือนถ้ายังไม่ได้รับ
export const checkNotificationPermissions = async () => {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();

  if (existingStatus !== "granted") {
    console.log("ไม่ได้รับสิทธิ์การแจ้งเตือน กำลังขอสิทธิ์...");
    const { status } = await Notifications.requestPermissionsAsync();

    if (status !== "granted") {
      console.log("ไม่ได้รับสิทธิ์การแจ้งเตือน");
      return false;
    }
  }

  return true;
};

// เริ่มต้นระบบการแจ้งเตือนทั้งหมด (ควรเรียกใช้เมื่อแอปเริ่มต้น)
export const initializeNotifications = async () => {
  try {
    // 1. ตรวจสอบและขอสิทธิ์การแจ้งเตือน
    const hasPermission = await checkNotificationPermissions();
    if (!hasPermission) {
      console.warn('ไม่ได้รับสิทธิ์การแจ้งเตือน นาฬิกาปลุกอาจทำงานไม่ถูกต้อง');
      return false;
    }
    
    // 2. กำหนดช่องทางการแจ้งเตือน
    await setupNotificationChannel();
    
    // 3. ตรวจสอบเวลาระบบและ timezone
    verifyTimeSettings();
    
    // 4. ตรวจสอบและแก้ไขการแจ้งเตือนที่มีปัญหา
    // รอให้แอพโหลดเสร็จก่อนตรวจสอบการแจ้งเตือน
    setTimeout(async () => {
      await checkAndFixAlarmNotifications();
      console.log('ตรวจสอบและแก้ไขการแจ้งเตือนเสร็จสิ้น');
    }, 2000);
    
    return true;
  } catch (error) {
    console.error('Error initializing notifications:', error);
    return false;
  }
};

// เริ่มต้นการตรวจสอบการแจ้งเตือนทำงานในพื้นหลัง
export const startBackgroundAlarmCheck = async () => {
  try {
    return true;
  } catch (error) {
    console.error('Error starting background alarm check:', error);
    return false;
  }
};

// ตั้งค่าช่องทางการแจ้งเตือน
export const setupNotificationChannel = async () => {
  // ตั้งค่าเฉพาะใน Android
  if (Platform.OS === 'android') {
    // สร้างช่องทางหลักสำหรับการแจ้งเตือนนาฬิกาปลุก
    await Notifications.setNotificationChannelAsync('alarm-channel', {
      name: 'การแจ้งเตือนนาฬิกาปลุก',
      description: 'แจ้งเตือนเมื่อถึงเวลาปลุก',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
      sound: 'default',
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      bypassDnd: true,
    });
    
    // สร้างช่องทางสำหรับการแจ้งเตือนทั่วไป
    await Notifications.setNotificationChannelAsync('general', {
      name: 'การแจ้งเตือนทั่วไป',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250, 250, 250],
      sound: 'default',
    });
  }
};
