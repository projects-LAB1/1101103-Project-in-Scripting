import * as Notifications from "expo-notifications";
import { Platform, Alert, Linking } from "react-native";

// NOTE: This app uses LOCAL notifications for alarms, which WILL continue to work in Expo Go even in SDK 53+
// Only REMOTE (push) notifications are being removed from Expo Go.

// ตั้งค่าการแจ้งเตือน
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    priority: 'max',
  }),
});

// ขอสิทธิ์การแจ้งเตือน
export const requestNotificationPermissions = async () => {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      console.log("กำลังขอสิทธิ์การแจ้งเตือน...");
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      console.error("ไม่ได้รับสิทธิ์การแจ้งเตือน");
      Alert.alert(
        "สิทธิ์การแจ้งเตือน",
        "แอปต้องการสิทธิ์ในการแจ้งเตือนเพื่อการทำงานของนาฬิกาปลุก กรุณาเปิดการแจ้งเตือนในการตั้งค่าอุปกรณ์",
        [{ text: "ไปที่การตั้งค่า", onPress: openSettings }, { text: "ยกเลิก" }]
      );
      return false;
    }

    // สร้างช่องทางการแจ้งเตือนสำหรับ Android ด้วยการตั้งค่าประสิทธิภาพสูง
    if (Platform.OS === "android") {
      try {
        await Notifications.setNotificationChannelAsync("alarms", {
          name: "Alarms",
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 50, 50, 50],
          sound: true,
          enableVibrate: true,
          enableLights: true,
          lightColor: "#FF0000",
          lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
          audioAttributes: {
            usage: Notifications.AndroidAudioUsage.ALARM,
            contentType: Notifications.AndroidAudioContentType.SONIFICATION,
          },
          bypassDnd: true,
        });
      } catch (error) {
        console.error("Error creating notification channel:", error);
      }
    }

    return true;
  } catch (error) {
    console.error("เกิดข้อผิดพลาดขณะตั้งค่าการแจ้งเตือน:", error);
    return false;
  }
};

// นำทางไปยังการตั้งค่าของแอป
const openSettings = () => {
  if (Platform.OS === "ios") {
    Linking.openURL("app-settings:");
  } else {
    Linking.openSettings();
  }
};

// กำหนดเวลาการแจ้งเตือนการปลุก
export const scheduleAlarm = async (alarm) => {
  const { hour, minute, repeatDays, label } = alarm;

  // ตรวจสอบสิทธิ์การแจ้งเตือนก่อน
  if (!(await requestNotificationPermissions())) {
    return null;
  }

  try {
    // ยกเลิกการแจ้งเตือนเดิม (ถ้ามี)
    if (alarm.notificationId) {
      // ล็อกสำหรับการดีบั๊กเมื่อมีการเรียกใช้จริง
      if (alarm.notificationId.includes("|")) {
        // กรณีเป็น ID แบบรวมสำหรับการปลุกซ้ำ
        const ids = alarm.notificationId.split("|");
        for (const id of ids) {
          await Notifications.cancelScheduledNotificationAsync(id).catch(() => {});
        }
      } else {
        await Notifications.cancelScheduledNotificationAsync(
          alarm.notificationId
        ).catch(() => {});
      }
    }

    // สำหรับการตั้งปลุกแบบไม่ซ้ำ
    if (!repeatDays || repeatDays.length === 0) {
      // คำนวณเวลาการแจ้งเตือนอย่างละเอียด
      const now = new Date();
      const scheduledTime = new Date(now); // ใช้วันที่ปัจจุบันเสมอ
      scheduledTime.setHours(hour);
      scheduledTime.setMinutes(minute);
      scheduledTime.setSeconds(0);
      scheduledTime.setMilliseconds(0);

      // ถ้าเวลาที่ตั้งผ่านไปแล้ว ให้เลื่อนไปวันถัดไป
      if (scheduledTime <= now) {
        scheduledTime.setDate(scheduledTime.getDate() + 1);
      }

      // ตั้งค่าการแจ้งเตือน และกำหนดเวลาที่แน่นอน
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: label || "นาฬิกาปลุก",
          body: `${hour.toString().padStart(2, "0")}:${minute
            .toString()
            .padStart(2, "0")}`,
          sound: true,
          priority: "max", // เพิ่มความสำคัญให้สูงสุด
          vibrate: [0, 50, 50, 50], // ลดเวลาสั่นให้เร็วขึ้น
          data: {
            alarm,
            scheduled: true,
            scheduledTime: scheduledTime.toISOString(),
            priority: "high",
          },
        },
        trigger: {
          date: scheduledTime,
          channelId: "alarms",
        },
      });

      return notificationId;
    }
    // สำหรับการตั้งปลุกซ้ำ
    else {
      const notificationIds = [];

      // แปลงวันในรูปแบบที่ใช้ในแอป (0 = จันทร์, 6 = อาทิตย์) เป็นรูปแบบของ JavaScript (0 = อาทิตย์, 6 = เสาร์)
      const convertToJSDay = (appDay) => (appDay === 6 ? 0 : appDay + 1);

      for (const appDayIndex of repeatDays) {
        const jsDayIndex = convertToJSDay(appDayIndex);
        const now = new Date();
        const alarmTime = new Date(now); // ใช้วันที่ปัจจุบันเสมอ
        alarmTime.setHours(hour, minute, 0, 0);

        // คำนวณจำนวนวันที่ต้องเพิ่มเพื่อไปยังวันถัดไปที่ต้องปลุก
        const nowDay = now.getDay(); // 0-6 (อาทิตย์-เสาร์)
        let daysToAdd = 0;

        if (jsDayIndex === nowDay) {
          // ถ้าวันนี้เป็นวันที่ต้องปลุก
          if (alarmTime <= now) {
            // แต่เวลาปลุกผ่านไปแล้ว ให้ตั้งเป็นสัปดาห์หน้า
            daysToAdd = 7;
          }
        } else {
          // หาจำนวนวันที่ต้องเพิ่มเพื่อไปยังวันถัดไปที่ต้องปลุก
          daysToAdd = (jsDayIndex - nowDay + 7) % 7;
          if (daysToAdd === 0) daysToAdd = 7;
        }

        alarmTime.setDate(now.getDate() + daysToAdd);

        try {
          // ตั้งค่าการแจ้งเตือนแบบรายวัน
          const notificationId = await Notifications.scheduleNotificationAsync({
            content: {
              title: label || "นาฬิกาปลุก",
              body: `${hour.toString().padStart(2, "0")}:${minute
                .toString()
                .padStart(2, "0")}`,
              sound: true,
              priority: "max", // เพิ่มความสำคัญให้สูงสุด
              vibrate: [0, 50, 50, 50], // ลดเวลาสั่นให้เร็วขึ้น
              data: {
                alarm,
                dayIndex: appDayIndex,
                isRecurring: true,
                priority: "high",
              },
            },
            trigger: {
              date: alarmTime,
              weekday: jsDayIndex + 1, // 1-7 (จันทร์-อาทิตย์)
              hour: hour,
              minute: minute,
              second: 0,
              repeats: true,
              channelId: "alarms",
            },
          });

          notificationIds.push(notificationId);
        } catch (error) {
          console.error(
            `Error scheduling notification for day ${jsDayIndex}:`,
            error
          );
        }
      }

      return notificationIds.join("|");
    }
  } catch (error) {
    console.error("Error scheduling alarm:", error);
    return null;
  }
};

// ยกเลิกการแจ้งเตือน
export const cancelAlarm = async (notificationId) => {
  if (!notificationId) return false;

  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
    console.log(`Notification cancelled: ${notificationId}`);
    return true;
  } catch (error) {
    console.error("Error cancelling notification:", error);
    return false;
  }
};

// ทดสอบการแจ้งเตือนแบบทันที
export const triggerTestAlarm = async (alarmData) => {
  try {
    // สร้างข้อมูลทดสอบแบบเร็ว
    const testAlarmData = {
      ...alarmData,
      id: `test-${Date.now()}`,
      notificationId: `test-notification-${Date.now()}`,
      isTest: true,
    };

    // ส่งการแจ้งเตือนทดสอบทันที (แบบไม่มีการหน่วงเวลา)
    await Notifications.scheduleNotificationAsync({
      content: {
        title: testAlarmData.label || "ทดสอบนาฬิกาปลุก",
        body: `${testAlarmData.hour.toString().padStart(2, "0")}:${testAlarmData.minute.toString().padStart(2, "0")}`,
        sound: true,
        priority: "max",
        vibrate: [0, 50, 50, 50],
        data: {
          alarm: testAlarmData,
          isTest: true,
          priority: "high",
        },
      },
      trigger: null, // ไม่มีการหน่วงเวลา ส่งทันที
    });

    return testAlarmData;
  } catch (error) {
    console.error("Error triggering test alarm:", error);
    return null;
  }
};
