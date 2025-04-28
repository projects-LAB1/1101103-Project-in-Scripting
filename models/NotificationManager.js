// NotificationManager.js - จัดการการแจ้งเตือนแบบพุชในแอปพลิเคชัน
import * as Notifications from "expo-notifications";
import { Platform, Alert } from "react-native";
import Constants from "expo-constants";
import { supabase } from '../supabase.config';
import AsyncStorage from "@react-native-async-storage/async-storage";

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

// ตั้งค่าการแจ้งเตือนเมื่อแอปทำงานในพื้นหลัง
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// ขอสิทธิ์การแจ้งเตือน
export const registerForPushNotificationsAsync = async () => {
  let token;

  // ตรวจสอบว่าเป็นอุปกรณ์จริงหรือไม่ (ไม่ใช่ simulator)
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("alarms", {
      name: "Alarm Notifications",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
      sound: "default",
    });
  }

  // ขอสิทธิ์การแจ้งเตือน
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  // ถ้ายังไม่ได้รับสิทธิ์ ให้ขอสิทธิ์
  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  // ถ้าไม่ได้รับสิทธิ์ ให้แจ้งเตือนผู้ใช้
  if (finalStatus !== "granted") {
    console.log("ไม่ได้รับสิทธิ์การแจ้งเตือน!");
    return null;
  }

  // ดึง token สำหรับการแจ้งเตือน
  try {
    let projectId = Constants.expoConfig?.extra?.eas?.projectId;
    if (!projectId) {
      projectId = "c3b68283-9f4b-4fa7-9389-d76b1e5dc6e2"; // ใช้ค่าจาก app.json โดยตรง
    }

    // ตรวจสอบว่า projectId เป็น UUID ที่ถูกต้องหรือไม่
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(projectId)) {
      projectId = "c3b68283-9f4b-4fa7-9389-d76b1e5dc6e2";
    }

    token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
  } catch (error) {
    console.error("Error getting push token:", error);
    return null;
  }

  return token;
};

// บันทึก token ลงใน Supabase
export const savePushToken = async (userId, token) => {
  if (!userId || !token) return;

  try {
    const { error } = await supabase
      .from('profiles')
      .update({
        push_token: token,
        device_info: {
          platform: Platform.OS,
          version: Platform.Version,
          last_updated: new Date(),
        }
      })
      .eq('id', userId);

    if (error) throw error;
    console.log("บันทึก Push Token สำเร็จ");
  } catch (error) {
    console.error("Error saving push token:", error);
  }
};

// ตั้งเวลาการแจ้งเตือนสำหรับนาฬิกาปลุก
export const scheduleAlarmNotification = async (alarm) => {
  if (!alarm) return null;

  try {
    // ตรวจสอบสิทธิ์การแจ้งเตือนก่อน
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== "granted") {
      console.log("ไม่ได้รับสิทธิ์การแจ้งเตือน กำลังขอสิทธิ์...");
      const { status: newStatus } = await Notifications.requestPermissionsAsync();
      if (newStatus !== "granted") {
        console.error("ไม่ได้รับสิทธิ์การแจ้งเตือน ไม่สามารถตั้งนาฬิกาปลุกได้");
        return null;
      }
    }

    // คำนวณเวลาที่จะปลุกให้ถูกต้อง
    const now = new Date();
    const alarmTime = new Date();

    // ตั้งค่าเวลาให้ตรงกับที่ผู้ใช้กำหนด
    alarmTime.setHours(parseInt(alarm.hour), parseInt(alarm.minute), 0, 0);

    console.log(`กำลังตั้งนาฬิกาปลุกสำหรับเวลา: ${alarm.hour}:${alarm.minute}`);
    console.log(`เวลาปัจจุบัน: ${now.toLocaleTimeString()}`);
    console.log(`เวลาที่ตั้ง: ${alarmTime.toLocaleTimeString()}`);

    // คำนวณความแตกต่างของเวลาในหน่วยมิลลิวินาที
    const timeDifference = alarmTime.getTime() - now.getTime();
    const minutesDiff = timeDifference / 60000; // แปลงเป็นนาที
    console.log(`ความแตกต่างของเวลา: ${timeDifference} มิลลิวินาที (${minutesDiff.toFixed(2)} นาที)`);

    // ถ้าเวลาปลุกผ่านไปแล้ว หรือใกล้เกินไป (น้อยกว่า 5 วินาที) ให้ตั้งเป็นวันถัดไป
    if (timeDifference < 5000) { // น้อยกว่า 5 วินาที
      alarmTime.setDate(alarmTime.getDate() + 1);
      console.log(`เวลาปลุกผ่านไปแล้วหรือใกล้เกินไป ตั้งเป็นวันถัดไป: ${alarmTime.toString()}`);
    }

    // ตรวจสอบว่าเป็นการปลุกซ้ำหรือไม่
    if (alarm.repeat_days && alarm.repeat_days.length > 0) {
      const today = now.getDay(); // 0 = วันอาทิตย์, 1 = วันจันทร์, ...
      // ปรับให้ 0 = วันจันทร์, 1 = วันอังคาร, ... 6 = วันอาทิตย์ ตามที่เก็บในฐานข้อมูล
      const adjustedToday = today === 0 ? 6 : today - 1;

      console.log(`วันนี้คือวันที่: ${today} (ปรับเป็น ${adjustedToday})`);
      console.log(`วันที่ต้องการปลุกซ้ำ: ${alarm.repeat_days.join(', ')}`);

      // ถ้าวันนี้ไม่ได้อยู่ในวันที่ต้องการปลุกซ้ำ ให้หาวันถัดไปที่ต้องปลุก
      if (!alarm.repeat_days.includes(adjustedToday)) {
        let daysToAdd = 1;
        let nextDay = (adjustedToday + 1) % 7;

        while (!alarm.repeat_days.includes(nextDay)) {
          daysToAdd++;
          nextDay = (nextDay + 1) % 7;
        }

        alarmTime.setDate(now.getDate() + daysToAdd);
        console.log(`วันนี้ไม่ได้อยู่ในวันที่ต้องการปลุกซ้ำ เลื่อนไป ${daysToAdd} วัน: ${alarmTime.toString()}`);
      } else {
        // ถ้าวันนี้อยู่ในวันที่ต้องการปลุกซ้ำ แต่เวลาผ่านไปแล้ว
        if (alarmTime <= now) {
          // หาวันถัดไปที่ต้องปลุก
          let daysToAdd = 1;
          let nextDay = (adjustedToday + 1) % 7;

          while (!alarm.repeat_days.includes(nextDay)) {
            daysToAdd++;
            nextDay = (nextDay + 1) % 7;
          }

          alarmTime.setDate(now.getDate() + daysToAdd);
          console.log(`วันนี้อยู่ในวันที่ต้องการปลุกซ้ำ แต่เวลาผ่านไปแล้ว เลื่อนไป ${daysToAdd} วัน: ${alarmTime.toString()}`);
        } else {
          console.log(`วันนี้อยู่ในวันที่ต้องการปลุกซ้ำ และเวลายังไม่ผ่าน: ${alarmTime.toString()}`);
        }
      }
    }

    // ยกเลิกการแจ้งเตือนเดิม (ถ้ามี)
    if (alarm.notification_id) {
      await Notifications.cancelScheduledNotificationAsync(alarm.notification_id);
    }

    // ตั้งค่าการแจ้งเตือนใหม่
    console.log(`กำลังตั้งการแจ้งเตือนสำหรับเวลา: ${alarmTime.toLocaleString()}`);

    // ตรวจสอบว่าเวลาที่ตั้งไว้ห่างจากเวลาปัจจุบันเท่าไร
    const currentTime = new Date();
    const timeRemaining = alarmTime.getTime() - currentTime.getTime();
    const minutesRemaining = Math.floor(timeRemaining / 60000);
    const secondsRemaining = Math.floor((timeRemaining % 60000) / 1000);

    console.log(`เวลาที่ตั้งห่างจากเวลาปัจจุบัน: ${minutesRemaining} นาที ${secondsRemaining} วินาที`);

    // สร้างข้อมูลสำหรับการแจ้งเตือน
    const notificationContent = {
      title: alarm.label || "นาฬิกาปลุก",
      body: `${alarm.hour.toString().padStart(2, "0")}:${alarm.minute
        .toString()
        .padStart(2, "0")}`,
      sound: true,
      priority: Notifications.AndroidNotificationPriority.MAX,
      vibrate: [0, 250, 250, 250],
      data: {
        alarm,
        id: alarm.id,
        hour: alarm.hour,
        minute: alarm.minute,
        label: alarm.label,
        repeat_days: alarm.repeat_days,
        task_type: alarm.task_type,
        task_difficulty: alarm.task_difficulty,
        is_active: true
      },
      autoDismiss: false,
    };

    // ตั้งค่าการแจ้งเตือน
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: notificationContent,
      trigger: {
        date: alarmTime,
        channelId: "alarms",
      },
    });

    // แสดงข้อมูลการตั้งนาฬิกาปลุกในคอนโซล
    console.log(`ตั้งนาฬิกาปลุกสำเร็จ ID: ${notificationId}`);
    console.log(`เวลาที่ตั้ง: ${alarmTime.toString()}`);
    console.log(`ข้อมูลนาฬิกาปลุก: ${JSON.stringify({
      id: alarm.id,
      hour: alarm.hour,
      minute: alarm.minute,
      label: alarm.label || "นาฬิกาปลุก",
      repeat_days: alarm.repeat_days,
      task_type: alarm.task_type,
      is_active: true
    })}`);

    // ไม่ต้องแสดง Alert เพื่อไม่ให้รบกวนผู้ใช้
    return notificationId;
  } catch (error) {
    console.error("Error scheduling notification:", error);
    return null;
  }
};

// ยกเลิกการแจ้งเตือน
export const cancelAlarmNotification = async (notificationId) => {
  if (!notificationId) return;

  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch (error) {
    console.error("Error canceling notification:", error);
  }
};

// ตั้งค่าการจัดการเมื่อได้รับการแจ้งเตือน
export const setupNotificationListeners = (navigation) => {
  // เมื่อได้รับการแจ้งเตือนและแอปกำลังทำงาน
  const foregroundSubscription = Notifications.addNotificationReceivedListener(
    (notification) => {
      const data = notification.request.content.data;
      console.log("ได้รับการแจ้งเตือนในขณะที่แอปทำงาน:", data);

      // สร้างข้อมูลนาฬิกาปลุกที่ถูกต้อง
      const alarmData = {
        id: data.id,
        hour: data.hour,
        minute: data.minute,
        label: data.label || "นาฬิกาปลุก",
        repeat_days: data.repeat_days || [],
        task_type: data.task_type || "normal",
        task_difficulty: data.task_difficulty || "medium",
        is_active: true,
        ...data.alarm // รวมข้อมูลเพิ่มเติมจาก alarm ถ้ามี
      };

      // ถ้าแอปกำลังทำงานอยู่แล้ว ให้นำทางไปยังหน้าปลุกทันที
      if (navigation) {
        console.log("นำทางไปยังหน้าปลุก:", alarmData);

        // ใช้ reset แทน navigate เพื่อให้แน่ใจว่าหน้าจอจะแสดงเต็มหน้าจอและไม่มีหน้าจออื่นซ้อนทับ
        navigation.reset({
          index: 0,
          routes: [
            { name: 'AlarmRinging', params: { alarm: alarmData } },
          ],
        });
      }
    }
  );

  // เมื่อผู้ใช้กดที่การแจ้งเตือน
  const responseSubscription =
    Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data;
      console.log("ผู้ใช้กดที่การแจ้งเตือน:", data);

      // สร้างข้อมูลนาฬิกาปลุกที่ถูกต้อง
      const alarmData = {
        id: data.id,
        hour: data.hour,
        minute: data.minute,
        label: data.label || "นาฬิกาปลุก",
        repeat_days: data.repeat_days || [],
        task_type: data.task_type || "normal",
        task_difficulty: data.task_difficulty || "medium",
        is_active: true,
        ...data.alarm // รวมข้อมูลเพิ่มเติมจาก alarm ถ้ามี
      };

      // นำทางไปยังหน้าปลุก
      if (navigation) {
        console.log("ผู้ใช้กดที่การแจ้งเตือน - นำทางไปยังหน้าปลุก:", alarmData);

        // ใช้ reset แทน navigate เพื่อให้แน่ใจว่าหน้าจอจะแสดงเต็มหน้าจอและไม่มีหน้าจออื่นซ้อนทับ
        navigation.reset({
          index: 0,
          routes: [
            { name: 'AlarmRinging', params: { alarm: alarmData } },
          ],
        });
      }
    });

  // คืนค่าฟังก์ชันสำหรับยกเลิกการติดตาม
  return () => {
    foregroundSubscription.remove();
    responseSubscription.remove();
  };
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
