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

    // ถ้าเวลาปลุกผ่านไปแล้ว ให้ตั้งเป็นวันถัดไป
    if (timeDifference <= 0) {
      alarmTime.setDate(alarmTime.getDate() + 1);
      console.log(`เวลาปลุกผ่านไปแล้ว ตั้งเป็นวันถัดไป: ${alarmTime.toString()}`);
    }

    // ตรวจสอบว่าเป็นการปลุกซ้ำหรือไม่
    if (alarm.repeat_days && alarm.repeat_days.length > 0) {
      const today = now.getDay(); // 0 = วันอาทิตย์, 1 = วันจันทร์, ...
      // ปรับให้ 0 = วันจันทร์, 1 = วันอังคาร, ... 6 = วันอาทิตย์ ตามที่เก็บในฐานข้อมูล
      const adjustedToday = today === 0 ? 6 : today - 1;

      console.log(`วันนี้คือวันที่: ${today} (ปรับเป็น ${adjustedToday})`);
      console.log(`วันที่ต้องการปลุกซ้ำ: ${alarm.repeat_days.join(', ')}`);

      // ตรวจสอบว่าวันนี้อยู่ในวันที่ต้องการปลุกซ้ำหรือไม่
      const isTodayRepeatDay = alarm.repeat_days.includes(adjustedToday);
      console.log(`วันนี้อยู่ในวันที่ต้องการปลุกซ้ำหรือไม่: ${isTodayRepeatDay}`);

      // ตรวจสอบว่าเวลาปลุกผ่านไปแล้วหรือไม่
      const isPastAlarmTime = alarmTime <= now;
      console.log(`เวลาปลุกผ่านไปแล้วหรือไม่: ${isPastAlarmTime}`);

      // กรณีที่วันนี้ไม่ได้อยู่ในวันที่ต้องการปลุกซ้ำ หรือ วันนี้อยู่ในวันที่ต้องการปลุกซ้ำแต่เวลาผ่านไปแล้ว
      if (!isTodayRepeatDay || (isTodayRepeatDay && isPastAlarmTime)) {
        // หาวันถัดไปที่ต้องปลุก
        let daysToAdd = 1;
        let nextDay = (adjustedToday + 1) % 7;

        // วนหาวันถัดไปที่ต้องปลุก
        while (!alarm.repeat_days.includes(nextDay)) {
          daysToAdd++;
          nextDay = (nextDay + 1) % 7;
        }

        // ปรับเวลาให้เป็นวันถัดไปที่ต้องปลุก
        alarmTime.setDate(now.getDate() + daysToAdd);
        console.log(`ตั้งปลุกสำหรับวันถัดไป: ${nextDay} (อีก ${daysToAdd} วัน) - ${alarmTime.toString()}`);
      } else {
        console.log(`ตั้งปลุกสำหรับวันนี้ เวลา: ${alarmTime.toString()}`);
      }
    } else {
      // กรณีที่ไม่ได้ตั้งปลุกซ้ำ ให้ตรวจสอบว่าเวลาผ่านไปแล้วหรือไม่
      if (alarmTime <= now) {
        alarmTime.setDate(alarmTime.getDate() + 1);
        console.log(`ไม่ได้ตั้งปลุกซ้ำ และเวลาผ่านไปแล้ว ตั้งเป็นวันถัดไป: ${alarmTime.toString()}`);
      } else {
        console.log(`ไม่ได้ตั้งปลุกซ้ำ และเวลายังไม่ผ่าน ตั้งสำหรับวันนี้: ${alarmTime.toString()}`);
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
    console.log(`เวลาแจ้งเตือนโดยประมาณ: ${new Date(currentTime.getTime() + timeRemaining).toLocaleString()}`);

    // ตรวจสอบเพื่อป้องกันการแจ้งเตือนทันที
    // ถ้าตั้งเวลาแจ้งเตือนใกล้กับเวลาปัจจุบันมากเกินไป (น้อยกว่า 2 นาที)
    // และไม่ใช่การทดสอบตั้งเวลาใกล้ๆ (timeRemaining < 120000 และ !alarm.is_test)
    // ให้เลื่อนเวลาออกไปเป็นวันพรุ่งนี้
    if (timeRemaining < 120000 && !alarm.is_test) {
      console.log("เวลาที่ตั้งใกล้เกินไป ปรับเป็นวันพรุ่งนี้เพื่อป้องกันการแจ้งเตือนทันที");
      alarmTime.setDate(alarmTime.getDate() + 1);
      
      // คำนวณเวลาใหม่
      const newTimeRemaining = alarmTime.getTime() - currentTime.getTime();
      const newMinutesRemaining = Math.floor(newTimeRemaining / 60000);
      const newSecondsRemaining = Math.floor((newTimeRemaining % 60000) / 1000);
      
      console.log(`เวลาใหม่ที่ปรับแล้ว: ${alarmTime.toLocaleString()}`);
      console.log(`เวลาที่ตั้งห่างจากเวลาปัจจุบัน (หลังปรับ): ${newMinutesRemaining} นาที ${newSecondsRemaining} วินาที`);
    }

    // เก็บ timestamp ปัจจุบันเพื่อตรวจสอบว่าเป็นการตั้งค่าใหม่
    const setupTimestamp = new Date().getTime();

    // บันทึกข้อมูลการตั้งค่าลง AsyncStorage เพื่อใช้ในการตรวจสอบภายหลัง
    await AsyncStorage.setItem(`alarm_setup_${alarm.id}`, JSON.stringify({
      setupTime: setupTimestamp,
      scheduledTime: alarmTime.getTime(),
    }));

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
        alarm_id: alarm.id,
        hour: alarm.hour,
        minute: alarm.minute,
        label: alarm.label,
        repeat_days: alarm.repeat_days,
        task_type: alarm.task_type,
        task_difficulty: alarm.task_difficulty,
        is_active: true,
        scheduled_time: alarmTime.getTime(),  
        setup_time: setupTimestamp,
        alarm_type: "scheduled"  // เพิ่มเพื่อระบุชัดเจนว่าเป็นการแจ้งเตือนที่ตั้งเวลาไว้
      },
      autoDismiss: false,
    };

    // ตั้งค่าการแจ้งเตือน - เพิ่ม categoryIdentifier เพื่อระบุว่าเป็นการแจ้งเตือนประเภทไหน
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        ...notificationContent,
        categoryIdentifier: 'alarm' // ระบุประเภทเป็น alarm
      },
      trigger: {
        date: alarmTime,
        channelId: "alarms",
      },
    });

    // แสดงข้อมูลการตั้งนาฬิกาปลุกในคอนโซล
    console.log(`ตั้งนาฬิกาปลุกสำเร็จ ID: ${notificationId}`);
    console.log(`เวลาที่ตั้ง: ${alarmTime.toString()}`);
    
    // คำนวณเวลาที่เหลือจนถึงการแจ้งเตือนอีกครั้ง (ตรวจสอบความถูกต้อง)
    const finalTimeCheck = new Date();
    const finalTimeDiff = alarmTime.getTime() - finalTimeCheck.getTime();
    const finalHoursDiff = Math.floor(finalTimeDiff / (1000 * 60 * 60));
    const finalMinutesDiff = Math.floor((finalTimeDiff % (1000 * 60 * 60)) / (1000 * 60));
    
    console.log(`เวลาที่เหลือจนถึงการแจ้งเตือน: ${finalHoursDiff} ชั่วโมง ${finalMinutesDiff} นาที`);
    console.log(`เวลาแจ้งเตือนโดยประมาณ: ${new Date(finalTimeCheck.getTime() + finalTimeDiff).toLocaleString()}`);
    
    // บันทึก notification ID ไว้ในข้อมูลการแจ้งเตือน
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
    async (notification) => {
      const data = notification.request.content.data;
      console.log("[Foreground Listener] Received notification. Data:", data);
      
      try {
        // --- Revised Listener Logic ---
        if (!data || !data.alarm_id || data.alarm_type !== "scheduled" || !data.setup_time || !data.scheduled_time) {
          console.log("[Foreground Listener] Invalid or incomplete notification data. Skipping.", data);
          return;
        }

        const now = new Date().getTime();
        const setupTimeFromData = data.setup_time;
        const scheduledTimeFromData = data.scheduled_time;

        console.log(`[Foreground Listener] Check: now=${now}, setupTime=${setupTimeFromData}, scheduledTime=${scheduledTimeFromData}`);

        // Check 1: Is the current time near the scheduled time? (Primary check)
        const timeDifferenceFromScheduled = Math.abs(now - scheduledTimeFromData);
        // Using a 60-second window for foreground check to be safe
        const isTimeNearScheduled = timeDifferenceFromScheduled < 60000; 
        console.log(`[Foreground Listener] Check: timeDifferenceFromScheduled=${timeDifferenceFromScheduled}ms, isTimeNearScheduled=${isTimeNearScheduled}`);

        if (!isTimeNearScheduled) {
          console.log("[Foreground Listener] Skipping: Current time is not near scheduled time.");
          return;
        }

        // Check 2: If time is near, was the setup ALSO extremely recent? (Secondary check for echoes)
        const setupAge = now - setupTimeFromData;
        const isSetupExtremelyRecent = setupAge < 5000; // Use a shorter window (5 seconds) to detect echoes
        console.log(`[Foreground Listener] Check: setupAge=${setupAge}ms, isSetupExtremelyRecent=${isSetupExtremelyRecent}`);

        if (isSetupExtremelyRecent) {
           console.log("[Foreground Listener] Skipping: Time is near scheduled, but setup was extremely recent (likely an echo).");
           return;
        }
        // --- End Revised Listener Logic ---
        
        console.log("*** [Foreground Listener] Conditions met! Proceeding with navigation. ***");

        // สร้างข้อมูลนาฬิกาปลุกที่ถูกต้อง
        const alarmData = {
          id: data.alarm_id,
          hour: data.hour,
          minute: data.minute,
          label: data.label || "นาฬิกาปลุก",
          repeat_days: data.repeat_days || [],
          task_type: data.task_type || "normal",
          task_difficulty: data.task_difficulty || "medium",
          is_active: true
        };

        // ถ้าแอปกำลังทำงานอยู่แล้ว ให้นำทางไปยังหน้าปลุกทันที
        if (navigation) {
          console.log("[Foreground Listener] Navigating to AlarmRinging:", alarmData);

          // ใช้ reset แทน navigate
          navigation.reset({
            index: 0,
            routes: [
              { name: 'AlarmRinging', params: { alarm: alarmData } },
            ],
          });
        }
      } catch (error) {
        console.error("[Foreground Listener] Error processing notification:", error);
      }
    }
  );

  // เมื่อผู้ใช้กดที่การแจ้งเตือน
  const responseSubscription =
    Notifications.addNotificationResponseReceivedListener(async (response) => {
      const data = response.notification.request.content.data;
      console.log("[Response Listener] User interacted with notification. Data:", data);

      try {
        // --- Revised Listener Logic ---
        if (!data || !data.alarm_id || data.alarm_type !== "scheduled" || !data.setup_time || !data.scheduled_time) {
          console.log("[Response Listener] Invalid or incomplete notification data. Skipping.", data);
          return;
        }

        const now = new Date().getTime();
        const setupTimeFromData = data.setup_time;
        const scheduledTimeFromData = data.scheduled_time;

        console.log(`[Response Listener] Check: now=${now}, setupTime=${setupTimeFromData}, scheduledTime=${scheduledTimeFromData}`);
        
        // Check 1: Is the interaction time near or slightly past the scheduled time?
        const timeDifferenceFromScheduled = now - scheduledTimeFromData;
        // Allow from 30s before up to 90s after for user interaction delay
        const isTimeNearOrPastScheduled = timeDifferenceFromScheduled > -30000 && timeDifferenceFromScheduled < 90000; 
        console.log(`[Response Listener] Check: timeDifferenceFromScheduled=${timeDifferenceFromScheduled}ms, isTimeNearOrPastScheduled=${isTimeNearOrPastScheduled}`);
        
        if (!isTimeNearOrPastScheduled) {
          console.log("[Response Listener] Skipping: Interaction time is not close enough to scheduled time.");
          return;
        }

        // Check 2: If time is near, was the setup ALSO extremely recent?
        const setupAge = now - setupTimeFromData;
        const isSetupExtremelyRecent = setupAge < 5000; // 5 seconds
        console.log(`[Response Listener] Check: setupAge=${setupAge}ms, isSetupExtremelyRecent=${isSetupExtremelyRecent}`);

        if (isSetupExtremelyRecent) {
          // Even if setup was recent, if the user tapped significantly *after* the scheduled time, allow it.
          if (timeDifferenceFromScheduled > 10000) { // Tapped > 10 seconds after scheduled time
             console.log("[Response Listener] Warning: Setup was recent, but user tapped well after scheduled time. Proceeding.");
          } else {
             console.log("[Response Listener] Skipping: Time is near scheduled, but setup was extremely recent and tap was close to it.");
             return;
          }
        }
        // --- End Revised Listener Logic ---
        
        console.log("*** [Response Listener] Conditions met! Proceeding with navigation. ***");

        // สร้างข้อมูลนาฬิกาปลุกที่ถูกต้อง
        const alarmData = {
          id: data.alarm_id,
          hour: data.hour,
          minute: data.minute,
          label: data.label || "นาฬิกาปลุก",
          repeat_days: data.repeat_days || [],
          task_type: data.task_type || "normal",
          task_difficulty: data.task_difficulty || "medium",
          is_active: true
        };

        // นำทางไปยังหน้าปลุก
        if (navigation) {
          console.log("[Response Listener] Navigating to AlarmRinging:", alarmData);

          // ใช้ reset แทน navigate
          navigation.reset({
            index: 0,
            routes: [
              { name: 'AlarmRinging', params: { alarm: alarmData } },
            ],
          });
        }
      } catch (error) {
        console.error("[Response Listener] Error processing notification response:", error);
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

// เพิ่มฟังก์ชันสำหรับทดสอบนาฬิกาปลุกแบบเวลาจริง
export const scheduleTestAlarmNotification = async (secondsFromNow = 10) => {
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

    // คำนวณเวลาที่จะปลุก (ปัจจุบัน + secondsFromNow วินาที)
    const now = new Date();
    const testAlarmTime = new Date(now.getTime() + (secondsFromNow * 1000));
    
    const hours = testAlarmTime.getHours();
    const minutes = testAlarmTime.getMinutes();
    const seconds = testAlarmTime.getSeconds();
    
    console.log(`กำลังตั้งนาฬิกาปลุกทดสอบสำหรับเวลา: ${hours}:${minutes}:${seconds} (อีก ${secondsFromNow} วินาที)`);

    // สร้าง ID สำหรับการทดสอบ
    const testAlarmId = `test-alarm-${Date.now()}`;
    
    // บันทึกข้อมูลการตั้งค่าลง AsyncStorage โดยตั้งเวลาย้อนหลัง 1 นาที เพื่อให้แน่ใจว่าผ่านการตรวจสอบ
    const setupTime = new Date().getTime() - 60000; // ย้อนเวลาไป 1 นาที
    await AsyncStorage.setItem(`alarm_setup_${testAlarmId}`, JSON.stringify({
      setupTime: setupTime, // ตั้งให้เป็นเวลาเมื่อ 1 นาทีที่แล้ว เพื่อให้ผ่านการตรวจสอบ
      scheduledTime: testAlarmTime.getTime(),
    }));

    // สร้างข้อมูลสำหรับการแจ้งเตือน
    const notificationContent = {
      title: "นาฬิกาปลุกทดสอบ",
      body: `เวลา ${hours}:${minutes}:${seconds}`,
      sound: true,
      priority: Notifications.AndroidNotificationPriority.MAX,
      vibrate: [0, 250, 250, 250],
      data: {
        alarm_id: testAlarmId,
        hour: hours,
        minute: minutes,
        label: "นาฬิกาปลุกทดสอบ",
        repeat_days: [],
        task_type: "normal",
        task_difficulty: "medium",
        is_active: true,
        scheduled_time: testAlarmTime.getTime(),
        setup_time: setupTime, // ตั้งให้เป็นเวลาเมื่อ 1 นาทีที่แล้ว
        alarm_type: "scheduled",
        is_test: true // เพิ่มเพื่อระบุว่าเป็นการทดสอบ
      },
      autoDismiss: false,
    };

    // ตั้งค่าการแจ้งเตือน
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        ...notificationContent,
        categoryIdentifier: 'alarm'
      },
      trigger: {
        date: testAlarmTime,
        channelId: "alarms",
      },
    });

    console.log(`ตั้งนาฬิกาปลุกทดสอบสำเร็จ ID: ${notificationId}`);
    console.log(`การแจ้งเตือนจะทำงานในอีกประมาณ ${secondsFromNow} วินาที`);
    
    return {
      notificationId,
      alarmData: {
        id: testAlarmId,
        hour: hours,
        minute: minutes,
        label: "นาฬิกาปลุกทดสอบ",
        task_type: "normal",
        task_difficulty: "medium",
        is_active: true,
        is_test: true
      }
    };
  } catch (error) {
    console.error("Error scheduling test notification:", error);
    return null;
  }
};
