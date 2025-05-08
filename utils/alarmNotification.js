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
  }),
});

// ขอสิทธิ์การแจ้งเตือน
export const requestNotificationPermissions = async () => {
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

  // สร้างช่องทางการแจ้งเตือนสำหรับ Android
  if (Platform.OS === "android") {
    try {
      await Notifications.setNotificationChannelAsync("alarms", {
        name: "Alarms",
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        sound: true,
        enableVibrate: true,
        enableLights: true,
        lightColor: "#FF0000",
      });
      console.log('สร้างช่องทางการแจ้งเตือน "alarms" สำหรับ Android สำเร็จ');
    } catch (error) {
      console.error("Error creating notification channel:", error);
    }
  }

  console.log("ได้รับสิทธิ์การแจ้งเตือนแล้ว");
  return true;
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

  console.log(`เริ่มการตั้งนาฬิกาปลุกสำหรับ ${hour}:${minute}`);
  console.log(`ข้อมูลนาฬิกาปลุก:`, JSON.stringify(alarm));

  // ตรวจสอบสิทธิ์การแจ้งเตือนก่อน
  if (!(await requestNotificationPermissions())) {
    console.error("ไม่ได้รับสิทธิ์การแจ้งเตือน ไม่สามารถตั้งนาฬิกาปลุกได้");
    return null;
  }

  try {
    // ยกเลิกการแจ้งเตือนเดิม (ถ้ามี)
    if (alarm.notificationId) {
      if (alarm.notificationId.includes("|")) {
        // กรณีเป็น ID แบบรวมสำหรับการปลุกซ้ำ
        const ids = alarm.notificationId.split("|");
        for (const id of ids) {
          await Notifications.cancelScheduledNotificationAsync(id).catch(
            (err) => console.log(`Error canceling notification ${id}:`, err)
          );
        }
      } else {
        await Notifications.cancelScheduledNotificationAsync(
          alarm.notificationId
        ).catch((err) =>
          console.log(`Error canceling previous notification:`, err)
        );
      }
    }

    // สำหรับการตั้งปลุกแบบไม่ซ้ำ
    if (!repeatDays || repeatDays.length === 0) {
      // คำนวณเวลาการแจ้งเตือนอย่างละเอียด
      const now = new Date();
      console.log(`เวลาปัจจุบัน: ${now.toLocaleString()}`);

      const scheduledTime = new Date(now); // ใช้วันที่ปัจจุบันเสมอ
      scheduledTime.setHours(hour);
      scheduledTime.setMinutes(minute);
      scheduledTime.setSeconds(0);
      scheduledTime.setMilliseconds(0);

      // เพิ่ม log สำหรับ timezone และเวลาจริง
      console.log("now:", now.toString(), now.toISOString(), now.getTime());
      console.log(
        "scheduledTime:",
        scheduledTime.toString(),
        scheduledTime.toISOString(),
        scheduledTime.getTime()
      );
      console.log("diff ms:", scheduledTime.getTime() - now.getTime());

      console.log(`เวลาตั้งปลุกเริ่มต้น: ${scheduledTime.toLocaleString()}`);

      // ถ้าเวลาที่ตั้งผ่านไปแล้ว ให้เลื่อนไปวันถัดไป
      if (scheduledTime <= now) {
        scheduledTime.setDate(scheduledTime.getDate() + 1);
        console.log(
          `เวลาที่ตั้งผ่านไปแล้ว เลื่อนไปวันถัดไป: ${scheduledTime.toLocaleString()}`
        );
      }

      const diffMs = scheduledTime.getTime() - now.getTime();
      const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
      const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

      console.log(`จะปลุกใน ${diffHrs} ชั่วโมง ${diffMins} นาที จากนี้`);
      console.log(
        `กำลังตั้งนาฬิกาปลุกสำหรับ: ${scheduledTime.toLocaleString()}`
      );

      // ตั้งค่าการแจ้งเตือน และกำหนดเวลาที่แน่นอน
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: label || "นาฬิกาปลุก",
          body: `${hour.toString().padStart(2, "0")}:${minute
            .toString()
            .padStart(2, "0")}`,
          sound: true,
          priority: "high",
          vibrate: [0, 250, 250, 250],
          data: {
            alarm,
            scheduled: true,
            scheduledTime: scheduledTime.toISOString(),
          },
        },
        trigger: {
          date: scheduledTime,
          channelId: "alarms",
        },
      });

      console.log(
        `ตั้งนาฬิกาปลุกสำเร็จ ID: ${notificationId}, เวลา: ${scheduledTime.toString()}`
      );
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

        const dayNames = [
          "อาทิตย์",
          "จันทร์",
          "อังคาร",
          "พุธ",
          "พฤหัสบดี",
          "ศุกร์",
          "เสาร์",
        ];
        console.log(
          `กำลังตั้งนาฬิกาปลุกแบบซ้ำสำหรับวัน ${
            dayNames[jsDayIndex]
          }: ${alarmTime.toLocaleString()}`
        );

        try {
          // ตั้งค่าการแจ้งเตือนแบบรายวัน
          const notificationId = await Notifications.scheduleNotificationAsync({
            content: {
              title: label || "นาฬิกาปลุก",
              body: `${hour.toString().padStart(2, "0")}:${minute
                .toString()
                .padStart(2, "0")}`,
              sound: true,
              priority: "high",
              vibrate: [0, 250, 250, 250],
              data: {
                alarm,
                dayIndex: appDayIndex,
                isRecurring: true,
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
          console.log(
            `ตั้งนาฬิกาปลุกแบบซ้ำสำเร็จ ID: ${notificationId}, วัน: ${dayNames[jsDayIndex]}`
          );
        } catch (error) {
          console.error(
            `Error scheduling notification for day ${jsDayIndex}:`,
            error
          );
        }
      }

      // รวม IDs ทั้งหมดเป็นสตริงเดียว
      const combinedId = notificationIds.join("|");
      return combinedId;
    }
  } catch (error) {
    console.error("Error scheduling alarm:", error);
    Alert.alert(
      "ข้อผิดพลาด",
      "ไม่สามารถตั้งนาฬิกาปลุกได้ กรุณาลองใหม่อีกครั้ง",
      [{ text: "ตกลง" }]
    );
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
    // Create a new object with all the alarm data plus test-specific properties
    const testAlarmData = {
      ...alarmData,
      id: `test-${Date.now()}`,
      notificationId: `test-notification-${Date.now()}`,
      isTest: true,
    };

    // Log that we're testing an alarm
    console.log("Triggering test alarm with data:", testAlarmData);

    // For test alarms, we don't actually schedule a notification
    // Just return the data that would be used when an alarm triggers
    return testAlarmData;
  } catch (error) {
    console.error("Error triggering test alarm:", error);
    throw error;
  }
};
