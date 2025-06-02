// NotificationManager.js - จัดการการแจ้งเตือนแบบพุชในแอปพลิเคชัน
import * as Notifications from "expo-notifications";
import { Platform, Alert } from "react-native";
import Constants from "expo-constants";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Device from "expo-device";

// Add warning about expo-notifications in Expo Go
// This addresses the warning about push notifications being removed from Expo Go in SDK 53
const notificationsWarning = () => {
  if (__DEV__) {
    // Suppress the built-in warning by providing our own controlled warning
    // This helps prevent duplicate warnings in the console
    console.warn(
      "Note: Remote push notifications functionality provided by expo-notifications will be removed from Expo Go in SDK 53. " +
        "Local notifications (like alarms) will continue to work in Expo Go. " +
        "For full notification support, use a development build instead. " +
        "Learn more at https://docs.expo.dev/develop/development-builds/introduction/"
    );

    // Add additional guidance for developers with more detailed steps
    console.log(
      "Developer Guide: To resolve this warning permanently:\n" +
        "1. Install EAS CLI: npm install -g eas-cli\n" +
        "2. Configure your project: eas build:configure\n" +
        "3. Create a development build: eas build --profile development --platform all\n" +
        "The app will continue to function in Expo Go for now as you're using local notifications for alarms."
    );
  }
};

// Helper function to check if app is using only local notifications (which will continue to work in Expo Go)
const isUsingOnlyLocalNotifications = () => {
  // If you're not using Expo Push Notification Service or any other push notification service,
  // you're likely only using local notifications
  return true; // Set to true for this app since we're only using local notifications for alarms
};

// Call the warning function once when the module is imported, but only if needed
if (!isUsingOnlyLocalNotifications()) {
  notificationsWarning();
} else {
  console.log(
    "INFO: This app only uses local notifications for alarms, which will continue to work in Expo Go even in SDK 53+. " +
      "The SDK 53 warning only affects apps that use remote push notifications."
  );
}

// ปรับปรุงการตั้งค่าการแจ้งเตือนเมื่อแอปทำงานในพื้นหลัง
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    priority: Notifications.AndroidNotificationPriority.MAX,
    // เพิ่มตัวเลือกสำหรับการแจ้งเตือนบน Android
    android: {
      sound: true,
      vibrate: [0, 250, 250, 250],
      priority: "max",
      sticky: true, // แจ้งเตือนจะคงอยู่จนกว่าผู้ใช้จะปฏิบัติ
      color: "#FF231F7C",
    },
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

  // ในสภาพแวดล้อม Expo Go ให้ข้าม token และใช้เฉพาะการแจ้งเตือนภายในเครื่อง
  if (Constants.appOwnership === 'expo') {
    console.log('INFO: Using local notifications only in Expo Go environment');
    return null;
  }

  // ดึง token สำหรับการแจ้งเตือน (เฉพาะ development build)
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

    await AsyncStorage.setItem(
      `@device_info_${userId}`,
      JSON.stringify(deviceInfo)
    );
    console.log("บันทึก Push Token สำเร็จ");
  } catch (error) {
    console.error("Error saving push token:", error);
  }
};

// ตั้งเวลาการแจ้งเตือนสำหรับนาฬิกาปลุก - ปรับปรุงความแม่นยำและแสดงผลเต็มจอสำหรับ Android
export const scheduleAlarmNotification = async (alarm) => {
  try {
    // ตรวจสอบข้อมูลนำเข้า
    if (!alarm) {
      console.error("Cannot schedule notification: No alarm data provided");
      return null;
    }

    // ตรวจสอบและขอสิทธิ์การแจ้งเตือนก่อน
    const hasPermission = await checkNotificationPermissions();
    if (!hasPermission) {
      console.error("ไม่ได้รับอนุญาตให้แจ้งเตือน");
      return null;
    }

    // ใช้ Date.now() เพื่อความแม่นยำสูงสุดในการรับเวลาปัจจุบัน
    const now = new Date();
    const currentTimeMillis = Date.now();

    // กำหนดเวลาปลุกอย่างแม่นยำด้วย milliseconds = 0
    const alarmTime = new Date();
    alarmTime.setHours(alarm.hour, alarm.minute, 0, 0);

    let triggerAtMillis = alarmTime.getTime();

    // ถ้าเวลาผ่านไปแล้ว ให้ตั้งเป็นวันถัดไป
    if (
      triggerAtMillis <= currentTimeMillis &&
      (!alarm.repeatDays || alarm.repeatDays.length === 0)
    ) {
      triggerAtMillis += 86400000;
      alarmTime.setTime(triggerAtMillis);
      console.log(
        "เวลาปลุกผ่านไปแล้ว ตั้งเป็นวันถัดไป:",
        alarmTime.toLocaleString(),
        `(${triggerAtMillis})`
      );
    }

    // ตรวจสอบความต่างของเวลาเป็นมิลลิวินาที
    const diffMillis = triggerAtMillis - currentTimeMillis;
    const diffSeconds = Math.floor(diffMillis / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);

    console.log(
      `🕒 จะปลุกใน ${diffHours} ชั่วโมง ${diffMinutes % 60} นาที ${
        diffSeconds % 60
      } วินาที (${diffMillis} ms)`,
      `\nเวลาปัจจุบัน: ${now.toLocaleTimeString()} (${currentTimeMillis})`,
      `\nเวลาที่จะปลุก: ${alarmTime.toLocaleTimeString()} (${triggerAtMillis})`
    );

    // สร้างข้อมูลที่ละเอียดเพื่อช่วยในการแก้ปัญหา
    const detailedAlarmData = {
      ...alarm,
      id: alarm.id || `alarm-${Date.now()}`,
      isTriggered: true,
      scheduledTime: alarmTime.toISOString(),
      exactTimeMillis: triggerAtMillis,
      deviceInfo: {
        manufacturer: Device.manufacturer,
        brand: Device.brand,
        modelName: Device.modelName,
        osVersion: Device.osVersion,
        platformApiLevel: Device.platformApiLevel,
      },
    };

    // สร้างเนื้อหาการแจ้งเตือนที่มีรายละเอียดมากขึ้น
    const notificationContent = {
      title: alarm.label || "Alarm",
      body: `It's ${alarm.hour.toString().padStart(2, "0")}:${alarm.minute
        .toString()
        .padStart(2, "0")}`,
      sound: true,
      priority: "high",
      vibrate: [0, 250, 250, 250],
      data: {
        alarm: detailedAlarmData,
        screenToOpen: "AlarmRinging",
        createdAt: now.toISOString(),
        exactCreatedAtMillis: currentTimeMillis,
        isFullscreenAlarm: true, // แฟล็กเพื่อระบุว่าควรแสดงเต็มจอ
      },
    };

    // ตัวเลือกเพิ่มเติมสำหรับ Android - เพิ่มความแม่นยำและการแสดงผลเต็มจอ
    if (Platform.OS === "android") {
      // สร้าง channelId เฉพาะสำหรับการแจ้งเตือนแบบเต็มจอ
      const channelId = "alarm_fullscreen";

      // สร้าง notification channel แบบเต็มจอสำหรับการปลุก
      await Notifications.setNotificationChannelAsync(channelId, {
        name: "Fullscreen Alarm",
        importance: Notifications.AndroidImportance.HIGH,
        sound: alarm.soundId || "default", // สามารถระบุไฟล์เสียงเฉพาะได้
        vibrationPattern: [0, 250, 250, 250, 250, 250],
        enableVibrate: true,
        enableLights: true,
        lightColor: "#FF0000",
        lockscreenVisibility:
          Notifications.AndroidNotificationVisibility.PUBLIC,
        bypassDnd: true, // ข้ามโหมด Do Not Disturb
        showBadge: true,
      });

      Object.assign(notificationContent, {
        android: {
          channelId: channelId,
          priority: "max",
          sticky: true,
          sound: alarm.soundId || true,
          vibrate: alarm.vibrate ? [0, 250, 250, 250, 250, 250] : null,
          // สำคัญ: ใช้ fullScreenIntent เพื่อให้แสดงผลเต็มจอแม้ว่าจอจะถูกล็อก
          fullScreenIntent: true,
          // เพิ่ม flag เพื่อให้แสดงผลเต็มจอ
          importance: "high",
          priority: "high",
          color: "#FF231F7C",
          visibility: "public",
          // ตั้งค่าเพิ่มเติมเพื่อความแม่นยำและการแสดงผลที่ดีขึ้น
          showWhen: true,
          usesChronometer: true,
          showTimestamp: true,
          timeoutAfter: 300000, // 5 นาที
          ongoing: true, // ไม่สามารถปัดทิ้งได้ง่าย
          autoCancel: false,
          // ใช้ category และ alarm flags เพื่อเพิ่มความสำคัญ
          category: "alarm",
          flags: ["insistent", "ongoing", "no-clear"],
          // แสดงปุ่มในการแจ้งเตือน
          actions: [
            {
              title: "ปิดเสียงปลุก",
              icon: "ic_launcher",
              buttonType: "cancel",
              identifier: "STOP_ALARM",
            },
            {
              title: "เลื่อนปลุก",
              icon: "ic_launcher",
              buttonType: "default",
              identifier: "SNOOZE_ALARM",
            },
          ],
          // เพิ่ม foregroundServiceType เพื่อให้แอปทำงานเบื้องหลัง
          foregroundServiceType: ["mediaPlayback", "dataSync"],
        },
      });
    }

    let notificationId;
    const isRepeating = alarm.repeatDays && alarm.repeatDays.length > 0;

    if (isRepeating) {
      console.log(`กำลังตั้งปลุกซ้ำสำหรับ ${alarm.repeatDays.length} วัน`);
      const notificationIds = [];

      for (const day of alarm.repeatDays) {
        const weekday = day + 1; // แปลงจาก 0-6 เป็น 1-7

        try {
          const id = await Notifications.scheduleNotificationAsync({
            content: {
              ...notificationContent,
              data: {
                ...notificationContent.data,
                weekdayRepeat: weekday,
              },
            },
            trigger: {
              hour: alarm.hour,
              minute: alarm.minute,
              second: 0,
              repeats: true,
              weekday,
            },
          });

          console.log(
            `✅ ตั้งปลุกสำหรับวัน ${day} (weekday ${weekday}) สำเร็จ, ID: ${id}`
          );
          notificationIds.push(id);
        } catch (dayError) {
          console.error(`❌ ไม่สามารถตั้งปลุกซ้ำสำหรับวัน ${day}:`, dayError);
        }
      }

      notificationId = notificationIds.join("|");
      console.log(
        `🔔 ได้รับ ${notificationIds.length} notification IDs: ${notificationId}`
      );
    } else {
      // สำหรับการปลุกครั้งเดียว
      if (diffMillis <= 5000) {
        console.warn("⚠️ เวลาปลุกใกล้เกินไป กำลังปรับเวลา...");
        alarmTime.setTime(currentTimeMillis + 60000);
        triggerAtMillis = alarmTime.getTime();
        console.log(
          `🕒 เวลาที่ปรับแล้ว: ${alarmTime.toLocaleString()} (${triggerAtMillis})`
        );
      }

      notificationId = await Notifications.scheduleNotificationAsync({
        content: notificationContent,
        trigger: alarmTime,
      });

      console.log(
        `✅ ตั้งปลุกครั้งเดียวสำเร็จ ID: ${notificationId} เวลา: ${alarmTime.toLocaleString()}`
      );
    }

    // บันทึกข้อมูลที่ละเอียดยิ่งขึ้นเพื่อการวิเคราะห์หากมีปัญหา
    try {
      const alarmNotifications =
        JSON.parse(await AsyncStorage.getItem("@alarm_notifications")) || {};

      alarmNotifications[alarm.id] = {
        notificationId,
        alarmId: alarm.id,
        hour: alarm.hour,
        minute: alarm.minute,
        scheduledTime: alarmTime.toISOString(),
        exactTimeMillis: triggerAtMillis,
        deviceTime: now.toISOString(),
        deviceTimeMillis: currentTimeMillis,
        diffMillis: diffMillis,
        isRepeating: isRepeating,
        repeatDays: alarm.repeatDays || [],
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        createdAt: now.toISOString(),
        isFullscreenEnabled: true, // บันทึกว่าใช้โหมดเต็มจอ
        deviceModel: Device.modelName || "Unknown device",
        androidApiLevel: Device.platformApiLevel || "Unknown API level",
      };

      await AsyncStorage.setItem(
        "@alarm_notifications",
        JSON.stringify(alarmNotifications)
      );

      await AsyncStorage.setItem(
        `@alarm_exact_time_${alarm.id}`,
        JSON.stringify({
          scheduledAt: currentTimeMillis,
          targetTime: triggerAtMillis,
          diffMs: diffMillis,
        })
      );
    } catch (storageError) {
      console.warn(
        "ไม่สามารถบันทึกข้อมูลการแจ้งเตือนลง AsyncStorage:",
        storageError
      );
    }

    return notificationId;
  } catch (error) {
    console.error("Error scheduling alarm notification:", error);
    return null;
  }
};

// ยกเลิกการแจ้งเตือน
export const cancelAlarmNotification = async (notificationId) => {
  if (!notificationId) return;

  try {
    // ตรวจสอบว่าเป็น ID แบบรวม (สำหรับการปลุกซ้ำ) หรือไม่
    if (notificationId.includes("|")) {
      const ids = notificationId.split("|");
      for (const id of ids) {
        await Notifications.cancelScheduledNotificationAsync(id).catch((err) =>
          console.log(`Error canceling notification ${id}:`, err)
        );
      }
      console.log(`ยกเลิกการแจ้งเตือน ${ids.length} รายการ`);
    } else {
      await Notifications.cancelScheduledNotificationAsync(
        notificationId
      ).catch((err) => console.log("Error canceling notification:", err));
      console.log(`ยกเลิกการแจ้งเตือน ID: ${notificationId}`);
    }

    // ลบข้อมูลการแจ้งเตือนจาก AsyncStorage
    try {
      const alarmNotifications =
        JSON.parse(await AsyncStorage.getItem("@alarm_notifications")) || {};
      // หา alarmId จาก notificationId
      const alarmId = Object.keys(alarmNotifications).find(
        (key) => alarmNotifications[key].notificationId === notificationId
      );

      if (alarmId) {
        delete alarmNotifications[alarmId];
        await AsyncStorage.setItem(
          "@alarm_notifications",
          JSON.stringify(alarmNotifications)
        );
      }
    } catch (storageError) {
      console.warn(
        "ไม่สามารถลบข้อมูลการแจ้งเตือนจาก AsyncStorage:",
        storageError
      );
    }
  } catch (error) {
    console.error("Error canceling notification:", error);
  }
};

// ปรับปรุงตั้งค่าการจัดการเมื่อได้รับการแจ้งเตือน สำหรับการแสดงผลเต็มจอ
export const setupNotificationListeners = (navigation) => {
  // เมื่อได้รับการแจ้งเตือนและแอปกำลังทำงาน
  const foregroundSubscription = Notifications.addNotificationReceivedListener(
    (notification) => {
      try {
        const alarmData = notification.request.content.data.alarm;
        console.log("ได้รับการแจ้งเตือนในขณะที่แอปทำงาน:", alarmData);

        if (!alarmData) {
          console.warn("ไม่พบข้อมูลการปลุกในการแจ้งเตือน");
          return;
        }

        // จัดการกับการแจ้งเตือนเต็มจอ
        const isFullscreenAlarm =
          notification.request.content.data.isFullscreenAlarm;

        // ตรวจสอบว่ามีข้อมูลการปลุกและวัตถุ navigation หรือไม่
        if (alarmData && navigation) {
          console.log(
            `กำลังนำทางไปยังหน้า AlarmRinging (เต็มจอ: ${isFullscreenAlarm})`
          );

          // ใช้วิธีการที่เหมาะสมสำหรับนำทางไปยังหน้าจอปลุก
          requestAnimationFrame(() => {
            // ใช้ reset เพื่อนำทางไปยังหน้า AlarmRinging แทนการใช้ navigate ธรรมดา
            // ทำให้ผู้ใช้ไม่สามารถกดปุ่ม back เพื่อกลับไปหน้าก่อนหน้า
            navigation.reset({
              index: 0,
              routes: [
                {
                  name: "Alarm",
                  params: {
                    screen: "AlarmRinging",
                    params: {
                      alarm: alarmData,
                      isFullscreen: true, // ส่งพารามิเตอร์ว่าเป็นการแสดงผลเต็มจอ
                      fromNotification: true,
                    },
                  },
                },
              ],
            });
          });
        } else {
          console.warn("ไม่สามารถนำทางไปยังหน้า AlarmRinging ได้:", {
            hasAlarmData: !!alarmData,
            hasNavigation: !!navigation,
          });
        }
      } catch (error) {
        console.error("เกิดข้อผิดพลาดในการจัดการการแจ้งเตือน:", error);
      }
    }
  );

  // เมื่อผู้ใช้กดที่การแจ้งเตือน
  const responseSubscription =
    Notifications.addNotificationResponseReceivedListener((response) => {
      try {
        const alarmData = response.notification.request.content.data.alarm;
        console.log("ผู้ใช้กดที่การแจ้งเตือน:", alarmData);

        // ดึงการกระทำที่ผู้ใช้เลือก (เช่น หยุดปลุก หรือ เลื่อนปลุก)
        const actionId = response.actionIdentifier;
        console.log("ผู้ใช้เลือกการกระทำ:", actionId);

        // จัดการกับการกระทำ
        if (actionId === "STOP_ALARM") {
          // จัดการกับการหยุดปลุก
          console.log("ผู้ใช้เลือกหยุดการปลุก");
          // อาจใช้ AsyncStorage เพื่อบันทึกการตั้งค่า
          AsyncStorage.setItem("@last_alarm_action", "stop");
        } else if (actionId === "SNOOZE_ALARM") {
          // จัดการกับการเลื่อนปลุก
          console.log("ผู้ใช้เลือกเลื่อนการปลุก");
          AsyncStorage.setItem("@last_alarm_action", "snooze");
        }

        // ถ้าไม่มีข้อมูลการปลุก
        if (!alarmData) {
          console.warn("ไม่พบข้อมูลการปลุกในการแจ้งเตือนที่ผู้ใช้กด");
          return;
        }

        // นำทางไปยังหน้าปลุก
        if (navigation) {
          console.log(
            "กำลังนำทางไปยังหน้า AlarmRinging จากการกดที่การแจ้งเตือน"
          );

          // สร้างการหน่วงเวลาเล็กน้อยเพื่อให้แน่ใจว่าการนำทางทำงานได้ถูกต้อง
          setTimeout(() => {
            // ใช้ reset เพื่อนำทางไปยังหน้า AlarmRinging แทนการใช้ navigate ธรรมดา
            navigation.reset({
              index: 0,
              routes: [
                {
                  name: "Alarm",
                  params: {
                    screen: "AlarmRinging",
                    params: {
                      alarm: alarmData,
                      isFullscreen: true,
                      fromNotification: true,
                      actionId: actionId, // ส่งการกระทำที่ผู้ใช้เลือก
                    },
                  },
                },
              ],
            });
          }, 100);
        } else {
          console.warn(
            "ไม่สามารถนำทางไปยังหน้า AlarmRinging ได้ เนื่องจากไม่มี navigation"
          );
        }
      } catch (error) {
        console.error("เกิดข้อผิดพลาดในการจัดการการกดแจ้งเตือน:", error);
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

// เพิ่มฟังก์ชันใหม่เพื่อตรวจสอบความแม่นยำของนาฬิกาปลุก
export const checkAlarmAccuracy = async (alarmId) => {
  try {
    if (!alarmId) return null;

    // ดึงข้อมูลเวลาที่บันทึกไว้
    const exactTimeData = await AsyncStorage.getItem(
      `@alarm_exact_time_${alarmId}`
    );
    if (!exactTimeData) return null;

    const { scheduledAt, targetTime } = JSON.parse(exactTimeData);
    const now = Date.now();

    // คำนวณความคลาดเคลื่อน
    const expectedTimeToRun = targetTime - scheduledAt; // เวลาที่ควรจะทำงาน (ms)
    const actualTimeToRun = now - scheduledAt; // เวลาที่ทำงานจริง (ms)
    const deviation = actualTimeToRun - expectedTimeToRun; // ความคลาดเคลื่อน (ms)

    // แสดงข้อมูลความแม่นยำ
    console.log(`
      📊 รายงานความแม่นยำของนาฬิกาปลุก (${alarmId}):
      ⏱️ เวลาที่ตั้งไว้: ${new Date(targetTime).toLocaleString()}
      ⏱️ เวลาที่ทำงานจริง: ${new Date(now).toLocaleString()}
      ⏱️ ความคลาดเคลื่อน: ${deviation} มิลลิวินาที (${deviation / 1000} วินาที)
    `);

    return {
      targetTime,
      actualTime: now,
      deviation,
      scheduledAt,
    };
  } catch (error) {
    console.error("Error checking alarm accuracy:", error);
    return null;
  }
};
