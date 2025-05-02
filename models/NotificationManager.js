// NotificationManager.js - จัดการการแจ้งเตือนแบบพุชในแอปพลิเคชัน
import * as Notifications from "expo-notifications";
import { Platform, Alert } from "react-native";
import Constants from "expo-constants";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState } from 'react-native';
import { Asset } from 'expo-asset';

// Import เพิ่มเติมแบบ conditional
let TaskManager;
let BackgroundFetch;

try {
  TaskManager = require('expo-task-manager');
  BackgroundFetch = require('expo-background-fetch');
} catch (err) {
  console.log('Task Manager or Background Fetch is not available:', err.message);
  // สร้าง mock objects สำหรับการทำงานที่ไม่มี packages
  TaskManager = {
    defineTask: () => console.log('TaskManager.defineTask mock called'),
  };
  BackgroundFetch = {
    registerTaskAsync: () => console.log('BackgroundFetch.registerTaskAsync mock called'),
    isTaskRegisteredAsync: () => Promise.resolve(false),
    BackgroundFetchResult: {
      NewData: 'new-data',
      NoData: 'no-data',
      Failed: 'failed',
    }
  };
}

// Add warning about expo-notifications in Expo Go
// This addresses the warning about push notifications being removed from Expo Go in SDK 53
const notificationsWarning = () => {
  if (__DEV__) {
    // Suppress the built-in warning by providing our own controlled warning
    // This helps prevent duplicate warnings in the console
    console.warn(
      "Note: Push notifications functionality provided by expo-notifications will be removed from Expo Go in SDK 53. " +
        "For full notification support, use a development build instead. " +
        "Learn more at https://docs.expo.dev/develop/development-builds/introduction/"
    );

    // Add additional guidance for developers with more detailed steps
    console.log(
      "Developer Guide: To resolve this warning permanently:\n" +
        "1. Install EAS CLI: npm install -g eas-cli\n" +
        "2. Configure your project: eas build:configure\n" +
        "3. Create a development build: eas build --profile development --platform all\n" +
        "The app will continue to function in Expo Go for now, but for full notification support, use a development build."
    );
  }
};

// Call the warning function once when the module is imported
notificationsWarning();

// Task name สำหรับ Background Fetch
const BACKGROUND_ALARM_TASK = 'background-alarm-check';
const ALARM_CHANNEL_ID = 'alarms';

// ตั้งค่า Background Task เพื่อตรวจสอบและแจ้งเตือนนาฬิกาปลุก
TaskManager.defineTask(BACKGROUND_ALARM_TASK, async () => {
  try {
    // ตรวจสอบนาฬิกาปลุกที่กำลังจะเกิดขึ้น
    const alarms = await checkUpcomingAlarms();
    if (alarms && alarms.length > 0) {
      console.log(`พบ ${alarms.length} นาฬิกาปลุกที่กำลังจะเกิดขึ้น`);
      return BackgroundFetch.BackgroundFetchResult.NewData;
    }
    return BackgroundFetch.BackgroundFetchResult.NoData;
  } catch (error) {
    console.error('เกิดข้อผิดพลาดในการตรวจสอบนาฬิกาปลุก:', error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

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
            nextAlarmTime: alarmTime
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

// ลงทะเบียน Background Fetch
export const registerBackgroundTask = async () => {
  try {
    // ตรวจสอบว่าลงทะเบียนแล้วหรือไม่
    const isRegistered = await BackgroundFetch.isTaskRegisteredAsync(BACKGROUND_ALARM_TASK);
    
    if (!isRegistered) {
      await BackgroundFetch.registerTaskAsync(BACKGROUND_ALARM_TASK, {
        minimumInterval: 60, // ตรวจสอบทุก 1 นาที
        stopOnTerminate: false, // ทำงานต่อเมื่อแอปถูกปิด
        startOnBoot: true, // เริ่มการทำงานเมื่อมีการรีบูตอุปกรณ์
      });
      console.log('ลงทะเบียน Background Task สำเร็จ');
    } else {
      console.log('Background Task ลงทะเบียนไว้แล้ว');
    }
    return true;
  } catch (error) {
    console.error('ไม่สามารถลงทะเบียน Background Task:', error);
    return false;
  }
};

// ฟังก์ชันคำนวณเวลาที่จะแจ้งเตือนครั้งถัดไป
export const getNextAlarmTime = (alarm) => {
  try {
    if (!alarm || !alarm.isActive) {
      return null;
    }

    const now = new Date();
    const nextAlarm = new Date();

    // ตั้งค่าเวลาเริ่มต้นเป็นวันนี้ตามเวลาที่กำหนดในนาฬิกาปลุก
    nextAlarm.setHours(alarm.hour);
    nextAlarm.setMinutes(alarm.minute);
    nextAlarm.setSeconds(0);
    nextAlarm.setMilliseconds(0);

    // กรณีนาฬิกาปลุกที่ไม่มีการเปิดใช้งานการปลุกซ้ำ
    if (!alarm.repeatDays || !alarm.repeatDays.length) {
      // ถ้าเวลาที่ตั้งผ่านไปแล้วในวันนี้ ให้เลื่อนไปเป็นพรุ่งนี้
      if (nextAlarm < now) {
        nextAlarm.setDate(nextAlarm.getDate() + 1);
      }
      console.log(`[INFO] คำนวณการแจ้งเตือนแบบครั้งเดียว: ${nextAlarm.toString()}`);
      return nextAlarm;
    }

    // กรณีนาฬิกาปลุกที่มีการเปิดใช้งานการปลุกซ้ำรายสัปดาห์
    // แปลงรูปแบบวันให้เริ่มจาก 0 (วันอาทิตย์) ถึง 6 (วันเสาร์)
    const repeatDays = alarm.repeatDays.map(day => {
      // แปลงวันตามที่บันทึกในแอพ (0 = จันทร์, 6 = อาทิตย์) ให้ตรงกับ JS Date (0 = อาทิตย์, 6 = เสาร์)
      return day === 6 ? 0 : day + 1;
    });

    // ตรวจสอบว่าวันนี้เป็นวันที่มีการตั้งปลุกหรือไม่
    const today = now.getDay(); // 0 = อาทิตย์, 1 = จันทร์, ..., 6 = เสาร์
    
    // เรียงลำดับวันในสัปดาห์เริ่มจากวันปัจจุบัน
    const orderedDays = [];
    for (let i = 0; i < 7; i++) {
      const day = (today + i) % 7;
      orderedDays.push(day);
    }

    // ค้นหาวันที่ใกล้ที่สุดที่มีการตั้งปลุก
    for (const day of orderedDays) {
      if (repeatDays.includes(day)) {
        // ถ้าเป็นวันนี้ และเวลาปลุกยังไม่ผ่านไป ใช้วันนี้
        if (day === today) {
          if (nextAlarm > now) {
            console.log(`[INFO] คำนวณการแจ้งเตือนแบบซ้ำ (วันนี้): ${nextAlarm.toString()}`);
            return nextAlarm;
          }
        }
        // ถ้าไม่ใช่วันนี้ หรือวันนี้แต่เวลาผ่านไปแล้ว ให้เลื่อนไปยังวันถัดไปที่มีการตั้งปลุก
        const daysToAdd = (day - today + 7) % 7;
        if (daysToAdd > 0 || (daysToAdd === 0 && nextAlarm < now)) {
          nextAlarm.setDate(now.getDate() + daysToAdd);
          console.log(`[INFO] คำนวณการแจ้งเตือนแบบซ้ำ (วันอื่น): ${nextAlarm.toString()}`);
          return nextAlarm;
        }
      }
    }

    // หากไม่พบวันที่เหมาะสม (ไม่ควรเกิดขึ้น)
    console.log('[WARNING] ไม่พบวันที่เหมาะสมสำหรับการปลุกซ้ำ');
    return null;
  } catch (error) {
    console.error('[ERROR] เกิดข้อผิดพลาดในการคำนวณเวลาแจ้งเตือน:', error);
    return null;
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
    if (!Device.isDevice) {
      Alert.alert(
        "แจ้งเตือน",
        "การแจ้งเตือนอาจไม่ทำงานบน simulator หรือ emulator"
      );
      return null;
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
          { 
            text: "ไปที่การตั้งค่า", 
            onPress: () => Linking.openSettings() 
          },
          { text: "ยกเลิก" }
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

// ฟังก์ชันสำหรับการตั้งค่าการแจ้งเตือนนาฬิกาปลุก
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
      [{ text: 'ตกลง' }]
    );
    return null;
  }

  try {
    // ตั้งค่าช่องทางการแจ้งเตือนหากยังไม่ได้ตั้งค่า
    await setupNotificationChannel();
    
    // ยกเลิกการแจ้งเตือนเดิมของนาฬิกาปลุกนี้ (ถ้ามี)
    if (alarm.notificationId) {
      await Notifications.cancelScheduledNotificationAsync(alarm.notificationId);
    }
    
    // คำนวณเวลาในการแจ้งเตือนครั้งถัดไป
    const nextAlarmTime = getNextAlarmTime(alarm);
    
    if (!nextAlarmTime) {
      console.log('[ERROR] ไม่สามารถคำนวณเวลาการแจ้งเตือนได้');
      return null;
    }

    // ตรวจสอบว่าเวลาแจ้งเตือนถูกต้อง (อยู่ในอนาคต)
    const now = new Date();
    if (nextAlarmTime <= now) {
      console.log('[ERROR] เวลาแจ้งเตือนไม่ถูกต้อง (อยู่ในอดีต):', nextAlarmTime.toString());
      return null;
    }

    // กำหนดเสียงแจ้งเตือน (แบบปลอดภัย)
    let sound = true; // ใช้เสียงเริ่มต้นของระบบ
    
    // สร้างเนื้อหาของการแจ้งเตือน
    const content = {
      title: alarm.label || 'นาฬิกาปลุก',
      body: alarm.label 
        ? `เวลา ${alarm.hour.toString().padStart(2, '0')}:${alarm.minute.toString().padStart(2, '0')}`
        : `เวลา ${alarm.hour.toString().padStart(2, '0')}:${alarm.minute.toString().padStart(2, '0')} น.`,
      sound: true,
      priority: 'max',
      sticky: true,  // ให้การแจ้งเตือนคงอยู่จนกว่าจะมีการยืนยัน
      data: { 
        alarmId: alarm.id,
        taskType: alarm.taskType || 'none',
        snooze: alarm.snooze || false,
        created: new Date().getTime(),
      },
    };

    // กำหนดค่า trigger สำหรับการแจ้งเตือน
    const trigger = {
      date: nextAlarmTime,
      channelId: Platform.OS === 'android' ? 'alarm-channel' : undefined,
    };

    // ตั้งค่าการแจ้งเตือน
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: content,
      trigger: trigger,
    });

    console.log(`[SUCCESS] ตั้งค่าการแจ้งเตือนสำเร็จ ID: ${notificationId} สำหรับ "${alarm.label || 'นาฬิกาปลุก'}" เวลา: ${nextAlarmTime.toString()}`);
    
    // เริ่มต้นระบบแจ้งเตือน Background ถ้าจำเป็น
    await startBackgroundAlarmCheck();
    
    return notificationId;
  } catch (error) {
    console.error('[ERROR] ไม่สามารถตั้งค่าการแจ้งเตือนได้:', error);
    return null;
  }
}

// ยกเลิกการแจ้งเตือน
export const cancelAlarmNotification = async (notificationId) => {
  if (!notificationId) return;

  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
    console.log(`ยกเลิกการแจ้งเตือน ID: ${notificationId} สำเร็จ`);
    return true;
  } catch (error) {
    console.error("Error canceling notification:", error);
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
    
    // ตั้งการแจ้งเตือนใหม่สำหรับทุกนาฬิกาปลุกที่เปิดใช้งาน
    const notifications = [];
    const updatedAlarms = [];
    
    for (const alarm of activeAlarms) {
      const notificationResult = await scheduleAlarmNotification(alarm);
      if (notificationResult && notificationResult.primaryId) {
        // บันทึก notificationIds
        const updatedAlarm = {
          ...alarm,
          notificationId: notificationResult.primaryId,
          allNotificationIds: notificationResult.allIds || [notificationResult.primaryId]
        };
        
        updatedAlarms.push(updatedAlarm);
        notifications.push({
          id: alarm.id,
          notificationId: notificationResult.primaryId,
          allIds: notificationResult.allIds || [notificationResult.primaryId]
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
    }
  });

  // คืนค่าฟังก์ชันสำหรับยกเลิกการติดตาม
  return () => {
    foregroundSubscription.remove();
    responseSubscription.remove();
    appStateSubscription.remove();
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
        const notifications = scheduledNotifications.filter(
          n => n.content?.data?.alarm?.id === alarm.id
        );
        
        // คำนวณเวลาถัดไปของการปลุก
        const nextAlarmTime = getNextAlarmTime(alarm);
        
        // ถ้าไม่มีการแจ้งเตือนหรือไม่ครบจำนวน หรือเวลาไม่ถูกต้อง
        const notificationMissing = !notifications.length;
        const notificationIdMismatch = alarm.notificationId && !notifications.some(n => n.identifier === alarm.notificationId);
        
        if (notificationMissing || notificationIdMismatch) {
          console.log(`การแจ้งเตือนสำหรับนาฬิกาปลุก ${alarm.id} สูญหายหรือไม่ถูกต้อง กำลังสร้างใหม่...`);
          
          // ตั้งการแจ้งเตือนใหม่
          scheduleAlarmNotification(alarm).then(notificationResult => {
            if (notificationResult && notificationResult.primaryId) {
              alarm.notificationId = notificationResult.primaryId;
              alarm.allNotificationIds = notificationResult.allIds || [notificationResult.primaryId];
              needUpdate = true;
            }
          });
        } else if (nextAlarmTime && alarm.repeatDays && alarm.repeatDays.length > 0) {
          // ตรวจสอบว่าการแจ้งเตือนมีครบทุกวันที่ต้องการปลุกหรือไม่
          const expectedNotificationCount = alarm.repeatDays.length;
          
          if (notifications.length < expectedNotificationCount) {
            console.log(`การแจ้งเตือนสำหรับนาฬิกาปลุก ${alarm.id} ไม่ครบทุกวัน กำลังสร้างใหม่...`);
            
            // ตั้งการแจ้งเตือนใหม่ทั้งหมด
            scheduleAlarmNotification(alarm).then(notificationResult => {
              if (notificationResult && notificationResult.primaryId) {
                alarm.notificationId = notificationResult.primaryId;
                alarm.allNotificationIds = notificationResult.allIds || [notificationResult.primaryId];
                needUpdate = true;
              }
            });
          }
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
    
    // 2. ลงทะเบียน Background Task
    await registerBackgroundTask();
    
    // 3. ตรวจสอบและแก้ไขการแจ้งเตือนที่มีปัญหา
    await checkAndFixAlarmNotifications();
    
    return true;
  } catch (error) {
    console.error('Error initializing notifications:', error);
    return false;
  }
};

// เริ่มต้นการตรวจสอบการแจ้งเตือน background (ทำงานในพื้นหลัง)
export const startBackgroundAlarmCheck = async () => {
  try {
    // ลงทะเบียน background task
    await registerBackgroundTask();
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
      sound: 'default', // ใช้เสียงเริ่มต้นของระบบเพื่อหลีกเลี่ยงปัญหา
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
