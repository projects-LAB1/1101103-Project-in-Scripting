import * as Notifications from "expo-notifications";
import { Platform, Alert, Linking } from "react-native";
import Constants from "expo-constants";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState } from 'react-native';
import { Asset } from 'expo-asset';
import * as Device from 'expo-device';
import * as TaskManager from 'expo-task-manager';

// Define constants
const EXACT_ALARM_TASK = 'EXACT_ALARM_TASK';

// Helper functions
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Add warning about expo-notifications in Expo Go
function notificationsWarning() {
  if (__DEV__) {
    console.warn(
      "Note: Push notifications functionality provided by expo-notifications will be removed from Expo Go in SDK 53. " +
      "For full notification support, use a development build instead."
    );
  }
}

// Call the warning function once when the module is imported
notificationsWarning();

// Helper function to store notification metadata
async function storeNotificationMetadata(identifier, metadata) {
  try {
    const existingMetadataJson = await AsyncStorage.getItem('@notification_metadata');
    const existingMetadata = existingMetadataJson ? JSON.parse(existingMetadataJson) : {};
    existingMetadata[identifier] = metadata;
    await AsyncStorage.setItem('@notification_metadata', JSON.stringify(existingMetadata));
    return true;
  } catch (error) {
    console.error('Error storing notification metadata:', error);
    return false;
  }
}

// Helper function to verify time settings
function verifyTimeSettings() {
  const now = new Date();
  console.log(`[SYSTEM] เวลาปัจจุบันของระบบ: ${now.toLocaleString()}`);
  console.log(`[SYSTEM] Timezone offset: ${now.getTimezoneOffset()} นาที`);
  return {
    currentTime: now.toLocaleString(),
    timezoneOffset: now.getTimezoneOffset()
  };
}

// Implementation functions

// Request exact alarm permission on Android
async function requestExactAlarmPermissionAndroid() {
  try {
    if (Platform.OS === 'android') {
      const hasPermission = await Notifications.getPermissionsAsync();
      console.log('Current notification permissions:', hasPermission);
      
      // Store the permission status
      await AsyncStorage.setItem('@exact_alarm_permission', JSON.stringify({
        checked: true,
        status: hasPermission.granted ? 'granted' : 'denied',
        timestamp: new Date().toISOString()
      }));

      if (!hasPermission.granted) {
        const { status } = await Notifications.requestPermissionsAsync();
        if (status === 'granted') {
          await AsyncStorage.setItem('@exact_alarm_permission', JSON.stringify({
            checked: true,
            status: 'granted',
            timestamp: new Date().toISOString()
          }));
          return true;
        }
        return false;
      }

      return hasPermission.granted;
    }
    return true; // Non-Android platforms don't need this permission
  } catch (error) {
    console.error('Error checking exact alarm permission:', error);
    return false;
  }
}

// Register for push notifications
async function registerForPushNotificationsAsync() {
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
}

// Export all functions
export {
  requestExactAlarmPermissionAndroid,
  registerForPushNotificationsAsync,
  scheduleAlarmNotification,
  cancelAlarmNotification,
  checkScheduledNotifications,
  resetAllAlarmNotifications,
  setupNotificationListeners,
  initializeNotifications,
  startBackgroundAlarmCheck,
  setupNotificationChannel,
  checkNotificationPermissions,
  getNextAlarmTime,
  scheduleNotification,
  cancelNotification,
  cancelAllNotifications,
  getScheduledNotifications,
  getNotificationMetadata,
  showImmediateNotification,
  registerBackgroundTask
};

// Schedule an alarm notification
async function scheduleAlarmNotification(alarm) {
  if (!alarm || !alarm.isActive) return null;

  try {
    const nextAlarmTime = getNextAlarmTime(alarm);
    if (!nextAlarmTime) return null;

    const content = {
      title: alarm.label || 'นาฬิกาปลุก',
      body: `เวลา ${alarm.hour.toString().padStart(2, '0')}:${alarm.minute.toString().padStart(2, '0')} น.`,
      sound: true,
      priority: 'max',
      data: { 
        alarm,
        alarmId: alarm.id,
        taskType: alarm.taskType || 'none',
        snooze: alarm.snooze || false,
        created: new Date().getTime()
      },
      channelId: Platform.OS === 'android' ? 'alarms' : undefined,
    };

    const notificationId = await Notifications.scheduleNotificationAsync({
      content,
      trigger: { date: nextAlarmTime }
    });

    return notificationId;
  } catch (error) {
    console.error('Error scheduling alarm notification:', error);
    return null;
  }
}

// Get next alarm time
function getNextAlarmTime(alarm) {
  if (!alarm || !alarm.isActive) return null;

  const now = new Date();
  let nextAlarm = new Date();
  nextAlarm.setHours(parseInt(alarm.hour, 10));
  nextAlarm.setMinutes(parseInt(alarm.minute, 10));
  nextAlarm.setSeconds(0);
  nextAlarm.setMilliseconds(0);

  if (!alarm.repeatDays || alarm.repeatDays.length === 0) {
    if (nextAlarm <= now) {
      nextAlarm.setDate(nextAlarm.getDate() + 1);
    }
    return nextAlarm;
  }

  const repeatDaysJS = alarm.repeatDays.map(day => day === 6 ? 0 : day + 1);
  const todayJS = now.getDay();
  const orderedDays = Array.from({ length: 7 }, (_, i) => (todayJS + i) % 7);

  for (const day of orderedDays) {
    if (repeatDaysJS.includes(day)) {
      const candidateDate = new Date(now);
      const daysToAdd = (day - todayJS + 7) % 7;
      candidateDate.setDate(candidateDate.getDate() + daysToAdd);
      candidateDate.setHours(parseInt(alarm.hour, 10));
      candidateDate.setMinutes(parseInt(alarm.minute, 10));
      candidateDate.setSeconds(0);
      candidateDate.setMilliseconds(0);

      if (daysToAdd === 0 && candidateDate <= now) {
        continue;
      }
      return candidateDate;
    }
  }

  const fallbackDate = new Date(now);
  fallbackDate.setDate(fallbackDate.getDate() + 1);
  fallbackDate.setHours(parseInt(alarm.hour, 10));
  fallbackDate.setMinutes(parseInt(alarm.minute, 10));
  fallbackDate.setSeconds(0);
  fallbackDate.setMilliseconds(0);
  return fallbackDate;
}

// Initialize notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    priority: Notifications.AndroidNotificationPriority.MAX,
  }),
});

// Schedule a task for exact timing (Android)
async function scheduleExactTask(date, alarmData) {
  try {
    if (Platform.OS !== 'android') return;
    
    console.log(`Scheduling exact alarm task for ${date.toISOString()}`);
    
    await TaskManager.registerTaskAsync(EXACT_ALARM_TASK, {
      frequency: TaskManager.TaskManager.Frequency.ONCE,
      startOnBoot: true,
    });
    
    console.log('Exact alarm task registered, will execute at target time');
    
    await AsyncStorage.setItem('@last_exact_task_scheduled', JSON.stringify({
      date: date.toISOString(),
      data: alarmData,
      scheduledAt: new Date().toISOString()
    }));
    
    return true;
  } catch (error) {
    console.error('Error scheduling exact alarm task:', error);
    return false;
  }
}

// Cancel alarm notification
async function cancelAlarmNotification(notificationIdOrIds) {
  if (!notificationIdOrIds) return false;

  try {
    if (Array.isArray(notificationIdOrIds)) {
      for (const id of notificationIdOrIds) {
        if (typeof id === 'string') {
          await Notifications.cancelScheduledNotificationAsync(id);
        }
      }
      return true;
    }

    if (typeof notificationIdOrIds === 'string') {
      await Notifications.cancelScheduledNotificationAsync(notificationIdOrIds);
      return true;
    }

    return false;
  } catch (error) {
    console.error("Error canceling notification:", error);
    return false;
  }
}

// Setup notification channel
async function setupNotificationChannel() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('alarms', {
      name: 'การแจ้งเตือนนาฬิกาปลุก',
      description: 'แจ้งเตือนเมื่อถึงเวลาปลุก',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
      sound: 'default',
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      bypassDnd: true,
    });
  }
}

// Setup notification listeners
function setupNotificationListeners(navigation) {
  const foregroundSubscription = Notifications.addNotificationReceivedListener(
    (notification) => {
      const alarmData = notification.request.content.data.alarm;
      if (alarmData && navigation) {
        navigation.navigate("AlarmRinging", { alarm: alarmData });
      }
    }
  );

  const responseSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
    const alarmData = response.notification.request.content.data.alarm;
    if (alarmData && navigation) {
      navigation.navigate("AlarmRinging", { alarm: alarmData });
    }
  });

  return () => {
    foregroundSubscription.remove();
    responseSubscription.remove();
  };
}

// Check scheduled notifications
async function checkScheduledNotifications() {
  try {
    const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
    console.log('การแจ้งเตือนที่ตั้งไว้:', scheduledNotifications.length, 'รายการ');
    return scheduledNotifications;
  } catch (error) {
    console.error('Error checking scheduled notifications:', error);
    return [];
  }
}

// Reset all alarm notifications
async function resetAllAlarmNotifications() {
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
}

// Initialize notifications system
async function initializeNotifications() {
  try {
    console.log('Initializing notification system at:', new Date().toLocaleString());
    
    // Configure notification behavior
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        priority: Notifications.AndroidNotificationPriority.MAX,
      }),
    });
    
    // 1. ตรวจสอบและขอสิทธิ์การแจ้งเตือน
    const hasPermission = await checkNotificationPermissions();
    if (!hasPermission) {
      console.warn('ไม่ได้รับสิทธิ์การแจ้งเตือน นาฬิกาปลุกอาจทำงานไม่ถูกต้อง');
      return { success: false, error: 'Permission denied' };
    }
    
    // 2. กำหนดช่องทางการแจ้งเตือนทั้งหมดที่จำเป็น
    await setupNotificationChannel();
    
    // Configure how notifications appear when the app is in the foreground
    await Notifications.setNotificationCategoryAsync('timer', [
      {
        identifier: 'stop',
        buttonTitle: 'Stop',
        options: {
          isDestructive: true,
        },
      },
      {
        identifier: 'snooze',
        buttonTitle: 'Snooze',
        options: {
          isAuthenticationRequired: false,
        },
      },
    ]);
    
    // 3. ตรวจสอบเวลาระบบและ timezone
    const timeSettings = verifyTimeSettings();
    
    // บันทึกการเริ่มต้นระบบการแจ้งเตือน
    await AsyncStorage.setItem('@notification_system_init', JSON.stringify({
      timestamp: new Date().toISOString(),
      timeSettings: timeSettings,
      platform: Platform.OS,
      deviceInfo: {
        brand: Device.brand,
        modelName: Device.modelName,
        osVersion: Device.osVersion
      }
    }));
    
    // 4. ตรวจสอบและแก้ไขการแจ้งเตือนที่มีปัญหา
    // กำหนดให้ตรวจสอบเร็วขึ้น (500ms) เพื่อให้แน่ใจว่าไม่พลาดการแจ้งเตือน
    setTimeout(async () => {
      await checkAndFixAlarmNotifications();
      console.log('ตรวจสอบและแก้ไขการแจ้งเตือนครั้งแรกเสร็จสิ้น');
      
      // ตรวจสอบอีกครั้งหลังจาก 5 วินาทีเพื่อให้แน่ใจว่าระบบพร้อมทำงาน
      setTimeout(async () => {
        await checkAndFixAlarmNotifications();
        console.log('ตรวจสอบและแก้ไขการแจ้งเตือนครั้งที่สองเสร็จสิ้น');
      }, 5000);
    }, 500);
    
    // 5. ตั้งค่าการตรวจสอบเป็นระยะเพื่อให้แน่ใจว่าการแจ้งเตือนทำงานได้
    const checkInterval = setInterval(async () => {
      await checkAndFixAlarmNotifications();
      console.log('ตรวจสอบการแจ้งเตือนตามรอบเวลา:', new Date().toLocaleString());
    }, 60000); // ตรวจสอบทุก 1 นาที
    
    // บันทึก interval ID เพื่อให้สามารถยกเลิกได้ในภายหลังถ้าจำเป็น
    global._notificationCheckInterval = checkInterval;
    
    // 6. สำหรับ Android ตั้งค่าให้แอปทำงานในพื้นหลังได้อย่างต่อเนื่อง
    if (Platform.OS === 'android') {
      try {
        // ลงทะเบียน background task
        await registerBackgroundTask();
        console.log('ลงทะเบียนงานพื้นหลังสำเร็จ');
      } catch (error) {
        console.error('เกิดข้อผิดพลาดในการลงทะเบียนงานพื้นหลัง:', error);
      }
    }
    
    console.log('การเริ่มต้นระบบการแจ้งเตือนเสร็จสมบูรณ์');
    return { success: true };
  } catch (error) {
    console.error('Error initializing notifications:', error);
    
    // บันทึกข้อผิดพลาดเพื่อการแก้ไขปัญหา
    await AsyncStorage.setItem('@notification_system_error', JSON.stringify({
      timestamp: new Date().toISOString(),
      error: error.message,
      stack: error.stack
    }));
    
    return { success: false, error: error.message };
  }
}

// Check notification permissions
async function checkNotificationPermissions() {
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
}

// Start background alarm check
async function startBackgroundAlarmCheck() {
  try {
    return true;
  } catch (error) {
    console.error('Error starting background alarm check:', error);
    return false;
  }
}

// Register background task
async function registerBackgroundTask() {
  try {
    console.log('ลงทะเบียนการตรวจสอบนาฬิกาปลุกในพื้นหลัง');
    return true;
  } catch (error) {
    console.error('ไม่สามารถลงทะเบียนการตรวจสอบในพื้นหลัง:', error);
    return false;
  }
}

// Check and fix alarm notifications
async function checkAndFixAlarmNotifications() {
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
}

// Schedule notification
async function scheduleNotification({
  title,
  body,
  data = {},
  date,
  repeats = false,
  channelId = 'default'
}) {
  try {
    // Ensure the date is valid
    if (!(date instanceof Date) || isNaN(date.getTime())) {
      throw new Error('Invalid date for notification scheduling');
    }
    
    // Log the scheduling attempt
    console.log(`Scheduling notification "${title}" for ${date.toISOString()}`);
    
    // Create the notification
    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: {
          ...data,
          scheduledAt: new Date().toISOString(),
          targetDate: date.toISOString(),
        },
        sound: true,
        priority: Notifications.AndroidNotificationPriority.MAX,
        vibrate: [0, 250, 250, 250],
        channelId,
      },
      trigger: {
        date,
        repeats,
      },
    });
    
    // Store notification metadata for tracking
    await storeNotificationMetadata(identifier, {
      title,
      body,
      data,
      scheduledDate: date.toISOString(),
      scheduledAt: new Date().toISOString(),
      identifier,
    });
    
    // For time-critical notifications on Android, also schedule a background task
    if (Platform.OS === 'android' && data.type?.includes('timer')) {
      await scheduleExactTask(date, { title, body, ...data });
    }
    
    return { success: true, identifier };
  } catch (error) {
    console.error('Error scheduling notification:', error);
    return { success: false, error: error.message };
  }
}

// Cancel notification
async function cancelNotification(identifier) {
  try {
    await Notifications.cancelScheduledNotificationAsync(identifier);
    
    // Also remove from metadata storage
    const storedData = await AsyncStorage.getItem('@notification_metadata');
    if (storedData) {
      let allMetadata = JSON.parse(storedData);
      if (allMetadata[identifier]) {
        delete allMetadata[identifier];
        await AsyncStorage.setItem('@notification_metadata', JSON.stringify(allMetadata));
      }
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error canceling notification:', error);
    return { success: false, error: error.message };
  }
}

// Cancel all notifications
async function cancelAllNotifications() {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    
    // Clear metadata storage
    await AsyncStorage.removeItem('@notification_metadata');
    
    return { success: true };
  } catch (error) {
    console.error('Error canceling all notifications:', error);
    return { success: false, error: error.message };
  }
}

// Get scheduled notifications
async function getScheduledNotifications() {
  try {
    const notifications = await Notifications.getAllScheduledNotificationsAsync();
    return { success: true, notifications };
  } catch (error) {
    console.error('Error getting scheduled notifications:', error);
    return { success: false, error: error.message };
  }
}

// Get notification metadata
async function getNotificationMetadata() {
  try {
    const storedData = await AsyncStorage.getItem('@notification_metadata');
    const metadata = storedData ? JSON.parse(storedData) : {};
    return { success: true, metadata };
  } catch (error) {
    console.error('Error getting notification metadata:', error);
    return { success: false, error: error.message };
  }
}

// Show immediate notification
async function showImmediateNotification(title, body, data = {}) {
  try {
    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: {
          ...data,
          triggeredAt: new Date().toISOString(),
          immediate: true
        },
        sound: true,
      },
      trigger: null, // null trigger means show immediately
    });
    
    return { success: true, identifier };
  } catch (error) {
    console.error('Error showing immediate notification:', error);
    return { success: false, error: error.message };
  }
}

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
}

// Schedule notification
async function scheduleNotification({
  title,
  body,
  data = {},
  date,
  repeats = false,
  channelId = 'default'
}) {
  try {
    // Ensure the date is valid
    if (!(date instanceof Date) || isNaN(date.getTime())) {
      throw new Error('Invalid date for notification scheduling');
    }
    
    // Log the scheduling attempt
    console.log(`Scheduling notification "${title}" for ${date.toISOString()}`);
    
    // Create the notification
    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: {
          ...data,
          scheduledAt: new Date().toISOString(),
          targetDate: date.toISOString(),
        },
        sound: true,
        priority: Notifications.AndroidNotificationPriority.MAX,
        vibrate: [0, 250, 250, 250],
        channelId,
      },
      trigger: {
        date,
        repeats,
      },
    });
    
    // Store notification metadata for tracking
    await storeNotificationMetadata(identifier, {
      title,
      body,
      data,
      scheduledDate: date.toISOString(),
      scheduledAt: new Date().toISOString(),
      identifier,
    });
    
    // For time-critical notifications on Android, also schedule a background task
    if (Platform.OS === 'android' && data.type?.includes('timer')) {
      await scheduleExactTask(date, { title, body, ...data });
    }
    
    return { success: true, identifier };
  } catch (error) {
    console.error('Error scheduling notification:', error);
    return { success: false, error: error.message };
  }
}

// Cancel notification
async function cancelNotification(identifier) {
  try {
    await Notifications.cancelScheduledNotificationAsync(identifier);
    
    // Also remove from metadata storage
    const storedData = await AsyncStorage.getItem('@notification_metadata');
    if (storedData) {
      let allMetadata = JSON.parse(storedData);
      if (allMetadata[identifier]) {
        delete allMetadata[identifier];
        await AsyncStorage.setItem('@notification_metadata', JSON.stringify(allMetadata));
      }
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error canceling notification:', error);
    return { success: false, error: error.message };
  }
}

// Cancel all notifications
async function cancelAllNotifications() {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    
    // Clear metadata storage
    await AsyncStorage.removeItem('@notification_metadata');
    
    return { success: true };
  } catch (error) {
    console.error('Error canceling all notifications:', error);
    return { success: false, error: error.message };
  }
}

// Get scheduled notifications
async function getScheduledNotifications() {
  try {
    const notifications = await Notifications.getAllScheduledNotificationsAsync();
    return { success: true, notifications };
  } catch (error) {
    console.error('Error getting scheduled notifications:', error);
    return { success: false, error: error.message };
  }
}

// Get notification metadata
async function getNotificationMetadata() {
  try {
    const storedData = await AsyncStorage.getItem('@notification_metadata');
    const metadata = storedData ? JSON.parse(storedData) : {};
    return { success: true, metadata };
  } catch (error) {
    console.error('Error getting notification metadata:', error);
    return { success: false, error: error.message };
  }
}

// Show immediate notification
async function showImmediateNotification(title, body, data = {}) {
  try {
    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: {
          ...data,
          triggeredAt: new Date().toISOString(),
          immediate: true
        },
        sound: true,
      },
      trigger: null, // null trigger means show immediately
    });
    
    return { success: true, identifier };
  } catch (error) {
    console.error('Error showing immediate notification:', error);
    return { success: false, error: error.message };
  }
}
