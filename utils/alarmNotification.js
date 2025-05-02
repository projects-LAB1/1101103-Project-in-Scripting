import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import Constants from 'expo-constants';

// ตั้งค่าการแจ้งเตือนเพื่อให้แสดงผลทันทีเมื่อถึงเวลาปลุก
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    priority: Notifications.AndroidNotificationPriority.MAX,
  }),
});

// ขอสิทธิ์การแจ้งเตือน
export const requestNotificationPermissions = async () => {
  // ตรวจสอบว่าเป็นอุปกรณ์จริงหรือไม่
  if (!Device.isDevice) {
    console.warn('การแจ้งเตือนอาจไม่ทำงานบน simulator หรือ emulator');
    return false;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  
  if (finalStatus !== 'granted') {
    console.warn('ไม่ได้รับสิทธิ์การแจ้งเตือน การปลุกอาจไม่ทำงาน');
    return false;
  }

  // สร้าง notification channels สำหรับ Android (สำคัญมาก)
  if (Platform.OS === 'android') {
    // สร้าง channel สำหรับการปลุก (เสียงดัง ความสำคัญสูงสุด)
    await Notifications.setNotificationChannelAsync('alarms', {
      name: 'การปลุก',
      description: 'แจ้งเตือนสำหรับนาฬิกาปลุก',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250, 250, 250],
      enableVibrate: true,
      sound: 'default', // ใช้ 'default' แทนที่จะเป็น custom เพื่อหลีกเลี่ยง error
      enableLights: true,
      lightColor: '#FF0000',
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      bypassDnd: true, // ข้ามโหมด Do Not Disturb
    });
    
    // สร้าง channel เพิ่มเติมสำหรับการปลุกแบบพิเศษ (ข้ามโหมด silent ได้)
    await Notifications.setNotificationChannelAsync('critical_alarms', {
      name: 'การปลุกแบบสำคัญ',
      description: 'แจ้งเตือนสำหรับนาฬิกาปลุกแบบสำคัญ (ข้ามโหมดเงียบ)',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 500, 500, 500, 500, 500],
      enableVibrate: true,
      sound: 'default', // ใช้ 'default' แทนที่จะเป็น custom เพื่อหลีกเลี่ยง error
      enableLights: true,
      lightColor: '#FF0000',
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      bypassDnd: true, 
    });
  }

  return true;
};

// กำหนดเวลาการแจ้งเตือนนาฬิกาปลุก
export const scheduleAlarm = async (alarm) => {
  try {
    // ขอสิทธิ์การแจ้งเตือนก่อน
    const permissionGranted = await requestNotificationPermissions();
    if (!permissionGranted) {
      console.warn('ไม่สามารถตั้งการปลุกได้เนื่องจากไม่ได้รับสิทธิ์การแจ้งเตือน');
      return null;
    }
    
    const { hour, minute, repeatDays = [], label, soundId } = alarm;
    
    // ยกเลิกการแจ้งเตือนเดิม (ถ้ามี)
    if (alarm.notificationId) {
      await cancelAlarm(alarm.notificationId);
    }

    // คำนวณเวลาการแจ้งเตือนอย่างแม่นยำ
    const now = new Date();
    const scheduledTime = new Date(now);
    scheduledTime.setHours(hour);
    scheduledTime.setMinutes(minute);
    scheduledTime.setSeconds(0);
    scheduledTime.setMilliseconds(0);

    // เตรียม trigger options ตามประเภทการปลุก
    let triggerOptions = {};
    
    // ถ้าเป็นการปลุกแบบซ้ำ
    if (repeatDays && repeatDays.length > 0) {
      if (Platform.OS === 'ios') {
        // iOS สนับสนุนการปลุกซ้ำแบบรายวันโดยตรง
        // แต่เราต้องจัดการทำเองสำหรับการปลุกในวันที่เลือก
        
        // เตรียม identify สำหรับแต่ละวันที่ต้องปลุก
        const notificationIds = [];
        
        // ลูปตั้งค่าการแจ้งเตือนสำหรับแต่ละวันในสัปดาห์ที่ต้องปลุก
        for (const day of repeatDays) {
          // แปลงค่าวันใน repeatDays (0=จันทร์, 6=อาทิตย์) เป็นค่า javascript (0=อาทิตย์, 6=เสาร์)
          const jsWeekday = day === 6 ? 0 : day + 1;
          
          // คำนวณวันถัดไปที่ตรงกับวันในสัปดาห์นี้
          const daysUntilAlarm = (jsWeekday + 7 - now.getDay()) % 7;
          const nextAlarmDate = new Date(now);
          nextAlarmDate.setDate(now.getDate() + (daysUntilAlarm === 0 && (nextAlarmDate.getHours() > hour || 
                                                (nextAlarmDate.getHours() === hour && nextAlarmDate.getMinutes() >= minute)) 
                                                ? 7 : daysUntilAlarm));
          nextAlarmDate.setHours(hour, minute, 0, 0);
          
          // สร้างการแจ้งเตือนสำหรับวันนี้
          const id = await Notifications.scheduleNotificationAsync({
            content: {
              title: label || 'นาฬิกาปลุก',
              body: `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`,
              sound: soundId || 'default',
              priority: 'max',
              vibrate: [0, 250, 250, 250, 250, 250],
              data: { 
                alarm: {
                  ...alarm,
                  timestamp: nextAlarmDate.getTime(),
                  weekday: jsWeekday
                }
              },
            },
            trigger: {
              date: nextAlarmDate,
              repeats: true,
              weekday: jsWeekday + 1, // iOS weekday: 1-7 (1 = Sunday, 7 = Saturday)
            },
          });
          
          notificationIds.push(id);
        }
        
        // คืนค่า ID แรกและเก็บ IDs ทั้งหมดไว้ใน data
        return {
          primaryId: notificationIds[0],
          allIds: notificationIds
        };
      } else {
        // Android - ทำการตั้งค่าแบบซ้ำ
        // Android ไม่สนับสนุนการตั้งค่า weekday หลายวัน
        // เราต้องตั้งการแจ้งเตือนแยกกันสำหรับแต่ละวัน
        
        const notificationIds = [];
        
        // ลูปตั้งค่าการแจ้งเตือนสำหรับแต่ละวันในสัปดาห์ที่ต้องปลุก
        for (const day of repeatDays) {
          // แปลงค่าวันใน repeatDays (0=จันทร์, 6=อาทิตย์) เป็นค่า javascript (0=อาทิตย์, 6=เสาร์)
          const jsWeekday = day === 6 ? 0 : day + 1;
          
          // คำนวณวันถัดไปที่ตรงกับวันในสัปดาห์นี้
          const daysUntilAlarm = (jsWeekday + 7 - now.getDay()) % 7;
          const nextAlarmDate = new Date(now);
          nextAlarmDate.setDate(now.getDate() + (daysUntilAlarm === 0 && (nextAlarmDate.getHours() > hour || 
                                                (nextAlarmDate.getHours() === hour && nextAlarmDate.getMinutes() >= minute)) 
                                                ? 7 : daysUntilAlarm));
          nextAlarmDate.setHours(hour, minute, 0, 0);
          
          // สร้างการแจ้งเตือนสำหรับวันนี้
          const id = await Notifications.scheduleNotificationAsync({
            content: {
              title: label || 'นาฬิกาปลุก',
              body: `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`,
              sound: true,
              priority: 'max',
              vibrate: [0, 250, 250, 250, 250, 250],
              data: { 
                alarm: {
                  ...alarm,
                  timestamp: nextAlarmDate.getTime(),
                  weekday: jsWeekday
                }
              },
              channelId: 'alarms',
            },
            trigger: {
              hour: hour,
              minute: minute,
              second: 0,
              repeats: true,
              weekday: jsWeekday + 1, // Android weekday format
            },
          });
          
          notificationIds.push(id);
        }
        
        // คืนค่า ID แรกและเก็บ IDs ทั้งหมดไว้ใน data
        return {
          primaryId: notificationIds[0],
          allIds: notificationIds
        };
      }
    } else {
      // การปลุกครั้งเดียว (ไม่ซ้ำ)
      
      // ถ้าเวลาที่ตั้งผ่านไปแล้ว ให้เลื่อนไปวันถัดไป
      if (scheduledTime <= now) {
        scheduledTime.setDate(scheduledTime.getDate() + 1);
        console.log(`เวลาปลุกผ่านไปแล้ว ตั้งเป็นวันถัดไป: ${scheduledTime.toString()}`);
      }
      
      // ตั้งค่าการแจ้งเตือนสำหรับการปลุกครั้งเดียว
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: label || 'นาฬิกาปลุก',
          body: `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`,
          sound: soundId || true,
          priority: 'max',
          vibrate: [0, 250, 250, 250, 250, 250],
          data: { 
            alarm: {
              ...alarm,
              timestamp: scheduledTime.getTime()
            }
          },
          channelId: Platform.OS === 'android' ? 'alarms' : undefined,
        },
        trigger: {
          date: scheduledTime,
          channelId: Platform.OS === 'android' ? 'alarms' : undefined,
        },
      });

      console.log(`ตั้งนาฬิกาปลุก ID: ${notificationId} สำหรับเวลา: ${scheduledTime.toString()}`);
      return { primaryId: notificationId, allIds: [notificationId] };
    }
  } catch (error) {
    console.error('เกิดข้อผิดพลาดในการตั้งนาฬิกาปลุก:', error);
    return null;
  }
};

// ยกเลิกการแจ้งเตือน
export const cancelAlarm = async (notificationIdOrIds) => {
  try {
    if (!notificationIdOrIds) return;

    // ตรวจสอบว่าเป็น array หรือค่าเดียว
    if (Array.isArray(notificationIdOrIds)) {
      // ยกเลิกทุกการแจ้งเตือนใน array
      for (const id of notificationIdOrIds) {
        if (id) await Notifications.cancelScheduledNotificationAsync(id);
      }
    } else if (typeof notificationIdOrIds === 'object' && notificationIdOrIds.allIds) {
      // กรณีที่เป็น object ที่มี allIds
      for (const id of notificationIdOrIds.allIds) {
        if (id) await Notifications.cancelScheduledNotificationAsync(id);
      }
    } else {
      // ยกเลิกการแจ้งเตือนเดี่ยว
      await Notifications.cancelScheduledNotificationAsync(notificationIdOrIds);
    }
    
    console.log('ยกเลิกการแจ้งเตือนเรียบร้อย');
  } catch (error) {
    console.error('เกิดข้อผิดพลาดในการยกเลิกการแจ้งเตือน:', error);
  }
};

// ตรวจสอบการแจ้งเตือนที่มีอยู่
export const getScheduledNotifications = async () => {
  try {
    return await Notifications.getAllScheduledNotificationsAsync();
  } catch (error) {
    console.error('เกิดข้อผิดพลาดในการดึงการแจ้งเตือนที่มีอยู่:', error);
    return [];
  }
};

// ตรวจสอบสถานะการอนุญาตการแจ้งเตือน
export const checkNotificationPermissions = async () => {
  const { status } = await Notifications.getPermissionsAsync();
  return status === 'granted';
};

// ตั้งตัวฟังการแจ้งเตือน
export const setupNotificationListeners = (onNotificationReceived) => {
  // ติดตามเมื่อได้รับการแจ้งเตือนขณะแอปทำงาน
  const foregroundSubscription = Notifications.addNotificationReceivedListener(
    (notification) => {
      console.log('ได้รับการแจ้งเตือนในขณะแอปทำงาน:', notification.request.content.data);
      if (onNotificationReceived) {
        onNotificationReceived(notification);
      }
    }
  );

  // ติดตามเมื่อผู้ใช้กดที่การแจ้งเตือน
  const responseSubscription = Notifications.addNotificationResponseReceivedListener(
    (response) => {
      console.log('ผู้ใช้กดที่การแจ้งเตือน:', response.notification.request.content.data);
      if (onNotificationReceived) {
        onNotificationReceived(response.notification, true);
      }
    }
  );

  // คืนค่าฟังก์ชันยกเลิกการติดตาม
  return () => {
    foregroundSubscription.remove();
    responseSubscription.remove();
  };
};