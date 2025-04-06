// NotificationManager.js - จัดการการแจ้งเตือนแบบพุชในแอปพลิเคชัน
import * as Notifications from "expo-notifications";
import { Platform, Alert } from "react-native";
import Constants from "expo-constants";
import { getFirestore, doc, updateDoc } from "firebase/firestore";

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
    // ใช้ projectId จาก app.json ผ่าน Constants
    // ตรวจสอบว่ามี Constants.manifest หรือไม่
    let projectId;

    if (Constants.manifest) {
      // ใช้ projectId จาก Constants.manifest
      projectId = Constants.manifest?.extra?.eas?.projectId;
    } else if (Constants.expoConfig) {
      // ใช้ projectId จาก Constants.expoConfig (สำหรับ Expo SDK 46+)
      projectId = Constants.expoConfig?.extra?.eas?.projectId;
    }

    // ถ้าไม่พบ projectId ให้ใช้ค่าจาก app.json ที่กำหนดไว้แล้ว
    if (!projectId) {
      projectId = "c3b68283-9f4b-4fa7-9389-d76b1e5dc6e2"; // ใช้ค่าจาก app.json โดยตรง
    }

    console.log("Using projectId:", projectId);

    // ตรวจสอบว่า projectId เป็น UUID ที่ถูกต้องหรือไม่
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(projectId)) {
      console.warn(
        "projectId ไม่ใช่รูปแบบ UUID ที่ถูกต้อง กำลังใช้ค่า UUID จาก app.json"
      );
      // ใช้ค่า UUID จาก app.json โดยตรง
      projectId = "c3b68283-9f4b-4fa7-9389-d76b1e5dc6e2";
      try {
        // ใช้ projectId ที่เป็น UUID
        token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
      } catch (tokenError) {
        console.error(
          "Error getting push token with UUID projectId:",
          tokenError
        );
        // ลองใช้วิธีเริ่มต้นถ้าวิธีแรกล้มเหลว
        try {
          token = (await Notifications.getExpoPushTokenAsync()).data;
        } catch (fallbackError) {
          console.error("Error getting fallback push token:", fallbackError);
          return null;
        }
      }
    } else {
      try {
        token = (
          await Notifications.getExpoPushTokenAsync({
            projectId: projectId,
          })
        ).data;
      } catch (tokenError) {
        console.error("Error getting push token with projectId:", tokenError);
        // ลองใช้วิธีเริ่มต้นถ้าวิธีแรกล้มเหลว
        try {
          token = (await Notifications.getExpoPushTokenAsync()).data;
        } catch (fallbackError) {
          console.error("Error getting fallback push token:", fallbackError);
          return null;
        }
      }
    }
  } catch (error) {
    console.error("Error getting push token:", error);
    // ถ้าไม่สามารถรับ token ได้ ให้ส่งค่า null กลับไป
    return null;
  }

  return token;
};

// บันทึก token ลงใน Firestore
export const savePushToken = async (userId, token) => {
  if (!userId || !token) return;

  try {
    const db = getFirestore();
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, {
      pushToken: token,
      deviceInfo: {
        platform: Platform.OS,
        version: Platform.Version,
        lastUpdated: new Date(),
      },
    });
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
      const { status: newStatus } =
        await Notifications.requestPermissionsAsync();
      if (newStatus !== "granted") {
        console.error("ไม่ได้รับสิทธิ์การแจ้งเตือน ไม่สามารถตั้งนาฬิกาปลุกได้");
        return null;
      }
    }

    // คำนวณเวลาที่จะปลุก
    const now = new Date();
    const alarmTime = new Date();
    alarmTime.setHours(alarm.hour, alarm.minute, 0);

    // ถ้าเวลาปลุกผ่านไปแล้ว ให้ตั้งเป็นวันถัดไป
    if (alarmTime <= now) {
      alarmTime.setDate(alarmTime.getDate() + 1);
    }

    // ตรวจสอบว่าเป็นการปลุกซ้ำหรือไม่
    if (alarm.repeatDays && alarm.repeatDays.length > 0) {
      // ถ้าเป็นการปลุกซ้ำ ให้ตรวจสอบว่าวันนี้ต้องปลุกหรือไม่
      const today = now.getDay();
      // ปรับ index เพื่อให้ตรงกับ repeatDays (0 = จันทร์, 6 = อาทิตย์)
      const adjustedToday = today === 0 ? 6 : today - 1;

      if (!alarm.repeatDays.includes(adjustedToday)) {
        // หาวันถัดไปที่ต้องปลุก
        let daysToAdd = 1;
        let nextDay = (adjustedToday + 1) % 7;

        while (!alarm.repeatDays.includes(nextDay)) {
          daysToAdd++;
          nextDay = (nextDay + 1) % 7;
        }

        alarmTime.setDate(now.getDate() + daysToAdd);
      }
    }

    // ยกเลิกการแจ้งเตือนเดิม (ถ้ามี)
    if (alarm.notificationId) {
      await Notifications.cancelScheduledNotificationAsync(
        alarm.notificationId
      );
    }

    // ตั้งค่าการแจ้งเตือนใหม่ด้วยการกำหนดค่าที่เหมาะสม
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: alarm.label || "นาฬิกาปลุก",
        body: `${alarm.hour.toString().padStart(2, "0")}:${alarm.minute
          .toString()
          .padStart(2, "0")}`,
        sound: true,
        priority: Notifications.AndroidNotificationPriority.MAX,
        vibrate: [0, 250, 250, 250],
        data: { alarm },
        autoDismiss: false, // ไม่ให้การแจ้งเตือนหายไปเอง
      },
      trigger: {
        date: alarmTime,
        channelId: "alarms",
      },
    });

    console.log(
      `ตั้งนาฬิกาปลุกสำเร็จ ID: ${notificationId}, เวลา: ${alarmTime.toString()}`
    );
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
