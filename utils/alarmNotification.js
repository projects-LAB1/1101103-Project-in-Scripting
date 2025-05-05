import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// ตั้งค่าการแจ้งเตือน
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// ขอสิทธิ์การแจ้งเตือน
export const requestNotificationPermissions = async () => {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  
  if (finalStatus !== 'granted') {
    return false;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('alarms', {
      name: 'Alarms',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      sound: true,
    });
  }

  return true;
};

// กำหนดเวลาการแจ้งเตือน
export const scheduleAlarm = async (alarm) => {
  const { hour, minute, repeatDays, label } = alarm;
  
  // ยกเลิกการแจ้งเตือนเดิม (ถ้ามี)
  if (alarm.notificationId) {
    await Notifications.cancelScheduledNotificationAsync(alarm.notificationId);
  }

  // คำนวณเวลาการแจ้งเตือน
  const now = new Date();
  const scheduledTime = new Date(now);
  scheduledTime.setHours(hour);
  scheduledTime.setMinutes(minute);
  scheduledTime.setSeconds(0);

  // ถ้าเวลาที่ตั้งผ่านไปแล้ว ให้เลื่อนไปวันถัดไป
  if (scheduledTime <= now) {
    scheduledTime.setDate(scheduledTime.getDate() + 1);
  }

  // ตั้งค่าการแจ้งเตือน
  const notificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title: label || 'นาฬิกาปลุก',
      body: `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`,
      sound: true,
      priority: 'high',
      vibrate: [0, 250, 250, 250],
    },
    trigger: repeatDays.length > 0
      ? {
          hour: hour,
          minute: minute,
          repeats: true,
          weekday: repeatDays.length > 0 ? repeatDays : undefined,
        }
      : {
          date: scheduledTime,
        },
  });

  return notificationId;
};

// ยกเลิกการแจ้งเตือน
export const cancelAlarm = async (notificationId) => {
  if (notificationId) {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  }
};

// ทดสอบการแจ้งเตือนแบบทันที
export const triggerTestAlarm = async (alarm) => {
  const { hour, minute, label, soundId, snooze } = alarm;
  
  // ตั้งค่าเวลาในรูปแบบ 00:00
  const formattedTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  
  // เตรียมข้อมูลสำหรับส่งไปยังหน้า AlarmRingingScreen
  const testAlarmData = {
    ...alarm,
    id: 'test-alarm-' + Date.now(),
    label: label || 'ทดสอบการปลุก',
    hour: hour,
    minute: minute,
    isTest: true,
    volume: 80, // ระดับเสียงเริ่มต้น
  };
  
  // ใช้ Notification เพื่อแสดงผลเมื่อแอพอยู่ในพื้นหลัง
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'ทดสอบการปลุก' + (label ? `: ${label}` : ''),
      body: `เวลา ${formattedTime} (ทดสอบการแจ้งเตือน)`,
      sound: true,
      priority: 'high',
      vibrate: [0, 250, 250, 250],
      data: { alarm: testAlarmData },
    },
    trigger: null, // null trigger means show immediately
  });
  
  // ใช้สำหรับการนำทางไปยังหน้า AlarmRingingScreen โดยตรง
  return testAlarmData;
}; 