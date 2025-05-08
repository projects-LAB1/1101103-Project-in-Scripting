// PhotoTaskScreen.js - หน้าถ่ายรูปตามสีที่กำหนดเพื่อปิดนาฬิกาปลุก
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Camera } from "expo-camera";
import * as ImageManipulator from "expo-image-manipulator";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

const PhotoTaskScreen = ({ route, navigation }) => {
  const { alarm, difficulty, onComplete } = route.params;
  const [hasPermission, setHasPermission] = useState(null);
  const [camera, setCamera] = useState(null);
  const [targetColor, setTargetColor] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [maxAttempts, setMaxAttempts] = useState(5);

  // Colors for different difficulties
  const easyColors = [
    { name: "แดง", hex: "#FF0000", rgb: [255, 0, 0], threshold: 80 },
    { name: "เขียว", hex: "#00FF00", rgb: [0, 255, 0], threshold: 80 },
    { name: "น้ำเงิน", hex: "#0000FF", rgb: [0, 0, 255], threshold: 80 },
    { name: "เหลือง", hex: "#FFFF00", rgb: [255, 255, 0], threshold: 80 },
  ];

  const mediumColors = [
    ...easyColors,
    { name: "ส้ม", hex: "#FFA500", rgb: [255, 165, 0], threshold: 60 },
    { name: "ม่วง", hex: "#800080", rgb: [128, 0, 128], threshold: 60 },
    { name: "ชมพู", hex: "#FFC0CB", rgb: [255, 192, 203], threshold: 60 },
  ];

  const hardColors = [
    ...mediumColors,
    { name: "เทา", hex: "#808080", rgb: [128, 128, 128], threshold: 40 },
    { name: "น้ำตาล", hex: "#A52A2A", rgb: [165, 42, 42], threshold: 40 },
    { name: "ฟ้า", hex: "#87CEEB", rgb: [135, 206, 235], threshold: 40 },
  ];

  // Request camera permission
  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === "granted");

      // Select random target color based on difficulty
      selectRandomColor();
    })();
  }, []);

  // Select random color based on difficulty
  const selectRandomColor = () => {
    let colorSet;

    switch (difficulty) {
      case "easy":
        colorSet = easyColors;
        break;
      case "medium":
        colorSet = mediumColors;
        break;
      case "hard":
        colorSet = hardColors;
        break;
      default:
        colorSet = mediumColors;
    }

    const randomIndex = Math.floor(Math.random() * colorSet.length);
    setTargetColor(colorSet[randomIndex]);
  };

  // Take photo and analyze color
  const takePicture = async () => {
    if (!camera || !targetColor) return;

    setProcessing(true);

    try {
      // Take photo
      const photo = await camera.takePictureAsync({ quality: 0.5 });

      // Resize image for faster processing
      const manipResult = await ImageManipulator.manipulateAsync(
        photo.uri,
        [{ resize: { width: 300 } }],
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
      );

      // Analyze dominant color (simplified version)
      // In a real app, you would use a more sophisticated color analysis library
      // or send the image to a server for processing
      setTimeout(() => {
        // Simulate color analysis
        const success =
          Math.random() <
          (difficulty === "easy" ? 0.7 : difficulty === "medium" ? 0.5 : 0.3);

        if (success) {
          // Correct color found
          Alert.alert(
            "สำเร็จ!",
            `คุณถ่ายรูปสี${targetColor.name}ได้ถูกต้อง นาฬิกาปลุกจะถูกปิด`
          );

          // Call onComplete callback to dismiss alarm
          if (onComplete) {
            onComplete("completed");
          }
          navigation.goBack();
        } else {
          // Wrong color
          setAttempts(attempts + 1);

          if (attempts + 1 >= maxAttempts) {
            // Generate new color after max attempts
            setAttempts(0);
            selectRandomColor();
            Alert.alert(
              "ไม่พบสีที่ต้องการ",
              `คุณพยายามหลายครั้งแล้ว สีเป้าหมายถูกเปลี่ยนเป็นสี${targetColor.name}`
            );
          } else {
            Alert.alert(
              "ไม่พบสีที่ต้องการ",
              `ลองถ่ายรูปสี${targetColor.name}อีกครั้ง เหลืออีก ${
                maxAttempts - attempts - 1
              } ครั้ง`
            );
          }
        }

        setProcessing(false);
      }, 1500); // Simulate processing time
    } catch (error) {
      console.error("Error taking picture:", error);
      Alert.alert("ข้อผิดพลาด", "ไม่สามารถถ่ายรูปได้ กรุณาลองอีกครั้ง");
      setProcessing(false);
    }
  };

  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>ไม่ได้รับอนุญาตให้ใช้กล้อง</Text>
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.buttonText}>กลับ</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>ถ่ายรูปเพื่อปิดนาฬิกาปลุก</Text>
        <Text style={styles.subtitle}>
          ถ่ายรูปสิ่งของที่มีสี{targetColor?.name || ""} เพื่อปิดเสียงปลุก
        </Text>
      </View>

      <View style={styles.cameraContainer}>
        <Camera
          style={styles.camera}
          ref={(ref) => setCamera(ref)}
          type={Camera.Constants.Type.back}
        />
      </View>

      <View style={styles.colorContainer}>
        <Text style={styles.colorLabel}>สีเป้าหมาย:</Text>
        <View
          style={[
            styles.colorSample,
            { backgroundColor: targetColor?.hex || "#CCCCCC" },
          ]}
        />
        <Text style={styles.colorName}>{targetColor?.name || ""}</Text>
      </View>

      <View style={styles.controlsContainer}>
        <TouchableOpacity
          style={[styles.captureButton, processing && styles.disabledButton]}
          onPress={takePicture}
          disabled={processing}
        >
          {processing ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Icon name="camera" size={30} color="white" />
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.attemptsContainer}>
        <Text style={styles.attemptsText}>
          ความพยายาม: {attempts}/{maxAttempts}
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  header: {
    padding: 20,
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#4F46E5",
    marginBottom: 10,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
  },
  cameraContainer: {
    flex: 1,
    overflow: "hidden",
    borderRadius: 20,
    margin: 20,
  },
  camera: {
    flex: 1,
  },
  colorContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 15,
    backgroundColor: "white",
    borderRadius: 15,
    margin: 20,
    marginTop: 0,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  colorLabel: {
    fontSize: 16,
    fontWeight: "500",
    marginRight: 10,
  },
  colorSample: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  colorName: {
    fontSize: 16,
    fontWeight: "bold",
  },
  controlsContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  captureButton: {
    backgroundColor: "#4F46E5",
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: "center",
    alignItems: "center",
  },
  disabledButton: {
    backgroundColor: "#9CA3AF",
  },
  attemptsContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  attemptsText: {
    fontSize: 16,
    color: "#6B7280",
  },
  errorText: {
    fontSize: 18,
    color: "#EF4444",
    textAlign: "center",
    margin: 20,
  },
  button: {
    backgroundColor: "#4F46E5",
    borderRadius: 10,
    padding: 15,
    alignItems: "center",
    margin: 20,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default PhotoTaskScreen;
