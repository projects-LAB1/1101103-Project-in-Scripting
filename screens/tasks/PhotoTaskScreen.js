// PhotoTaskScreen.js - หน้าถ่ายรูปตามสีที่กำหนดเพื่อปิดนาฬิกาปลุก
import React, { useState, useEffect, useRef } from "react";
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
import { useAlarmSound } from "../../contexts/AlarmSoundContext";

// Define camera types directly to avoid dependency on Camera.Constants
const CAMERA_TYPES = {
  front: 'front',
  back: 'back'
};

const PhotoTaskScreen = ({ route, navigation }) => {
  const { alarm, difficulty, onComplete, soundAlreadyStopped = false } = route.params;
  const [hasPermission, setHasPermission] = useState(null);
  const [camera, setCamera] = useState(null);
  const [targetColor, setTargetColor] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [maxAttempts, setMaxAttempts] = useState(5);
  const [cameraType, setCameraType] = useState(Camera.Constants?.Type?.back || 'back');
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  
  // สร้าง ref เพื่อป้องกันการเรียก onComplete ซ้ำ
  const isCompletedRef = useRef(false);
  
  // ใช้ alarm sound context
  const { isPlaying, stopAlarmSound } = useAlarmSound();
  
  // เตรียมค่า camera type ที่ปลอดภัย
  useEffect(() => {
    // ตรวจสอบว่า Camera.Constants มีอยู่หรือไม่
    if (!Camera.Constants) {
      console.warn("Camera.Constants is not available, using fallback values");
    }
    
    // ไม่ต้องหยุดเสียงเมื่อเปิดหน้านี้
    return () => {
      // ถ้าผู้ใช้ออกจากหน้าโดยไม่เล่นเกมให้จบ ตรวจสอบว่าควรหยุดเสียงหรือไม่
      if (isPlaying && !soundAlreadyStopped) {
        console.log("Stopping alarm sound on PhotoTaskScreen unmount");
        stopAlarmSound();
      } else {
        console.log("Sound was already stopped or not playing in PhotoTaskScreen unmount");
      }
    };
  }, [isPlaying, stopAlarmSound, soundAlreadyStopped]);

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
      try {
        const { status } = await Camera.requestCameraPermissionsAsync();
        setHasPermission(status === "granted");
        
        // Select random target color based on difficulty
        selectRandomColor();
      } catch (err) {
        console.error("Error requesting camera permissions:", err);
        setErrorMessage("ไม่สามารถขอสิทธิ์การใช้กล้อง: " + (err.message || "Unknown error"));
        setHasPermission(false);
      }
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
      const photo = await camera.takePictureAsync({ quality: 0.7 });

      // Resize image for faster processing
      const manipResult = await ImageManipulator.manipulateAsync(
        photo.uri,
        [{ resize: { width: 300 } }],
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
      );

      // ในแอปจริง เราจะวิเคราะห์สีโดยใช้ library การประมวลผลภาพ
      // เช่น react-native-image-colors หรือส่งไปวิเคราะห์ที่เซิร์ฟเวอร์
      
      // จำลองการวิเคราะห์สีโดยใช้อัลกอริทึมตรวจจับสีที่ดีขึ้น
      analyzeImageColors(manipResult.uri, (success) => {
        if (success) {
          // พบสีที่ถูกต้อง
          Alert.alert(
            "สำเร็จ!",
            `คุณถ่ายรูปสี${targetColor.name}ได้ถูกต้อง นาฬิกาปลุกจะถูกปิด`,
            [
              {
                text: "ตกลง",
                onPress: handleComplete
              }
            ]
          );
        } else {
          // สีไม่ถูกต้อง
          setAttempts(attempts + 1);

          if (attempts + 1 >= maxAttempts) {
            // สร้างสีใหม่หลังจากพยายามสูงสุด
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
      });
    } catch (error) {
      console.error("Error taking picture:", error);
      Alert.alert("ข้อผิดพลาด", "ไม่สามารถถ่ายรูปได้ กรุณาลองอีกครั้ง");
      setProcessing(false);
    }
  };

  // วิเคราะห์สีในภาพ
  const analyzeImageColors = (imageUri, callback) => {
    // จำลองการตรวจจับสีด้วยความล่าช้า
    // ในแอปจริง นี่คือที่ที่คุณจะวิเคราะห์ภาพโดยใช้คลังการประมวลผลภาพ
    
    setTimeout(() => {
      // ปรับความน่าจะเป็นของความสำเร็จตามระดับความยาก
      const successProbabilities = {
        easy: 0.8,    // 80% โอกาสสำเร็จในโหมดง่าย
        medium: 0.6,  // 60% โอกาสสำเร็จในโหมดปานกลาง 
        hard: 0.4     // 40% โอกาสสำเร็จในโหมดยาก
      };
      
      // ดึงโอกาสความสำเร็จตามระดับความยาก
      const successProbability = successProbabilities[difficulty] || 0.6;
      
      // จำลองผลการตรวจจับสี
      const success = Math.random() < successProbability;
      
      callback(success);
    }, 1500); // จำลองเวลาการประมวลผล
  };

  // ฟังก์ชันจัดการเมื่อกล้องพร้อมใช้งาน
  const handleCameraReady = () => {
    console.log("Camera is ready");
    setIsCameraReady(true);
  };

  // ฟังก์ชันจัดการข้อผิดพลาดของกล้อง
  const handleCameraError = (error) => {
    console.error("Camera error:", error);
    setErrorMessage(`เกิดข้อผิดพลาดจากกล้อง: ${error.message || "Unknown error"}`);
    setIsCameraReady(false);
  };

  // ฟังก์ชันเรียกใช้เมื่อเกมเสร็จสิ้น
  const handleComplete = () => {
    // ป้องกันการเรียกซ้ำ
    if (isCompletedRef.current) return;
    
    isCompletedRef.current = true;
    
    // ปิดเสียงปลุกเมื่อผู้ใช้ทำภารกิจเสร็จ (ถ้ายังไม่ได้หยุด)
    if (isPlaying && !soundAlreadyStopped) {
      console.log("Stopping alarm sound in PhotoTaskScreen");
      stopAlarmSound();
    } else {
      console.log("Sound was already stopped or not playing in PhotoTaskScreen");
    }
    
    // เรียกใช้ callback onComplete ถ้ามี
    if (typeof onComplete === 'function') {
      console.log('Using onComplete function');
      onComplete('completed');
    } else {
      // ไปที่หน้า AlarmList โดยตรง
      console.log('Navigating to AlarmList directly');
      navigation.reset({
        index: 0,
        routes: [{ name: 'Alarm', params: { screen: 'AlarmList' } }],
      });
    }
  };

  if (errorMessage) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Icon name="alert-circle" size={60} color="#FF3B30" />
          <Text style={styles.errorText}>{errorMessage}</Text>
          <TouchableOpacity
            style={styles.button}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.buttonText}>กลับ</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={styles.loadingText}>กำลังโหลดกล้อง...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Icon name="camera-off" size={60} color="#FF3B30" />
          <Text style={styles.errorText}>ไม่ได้รับอนุญาตให้ใช้กล้อง</Text>
          <TouchableOpacity
            style={styles.button}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.buttonText}>กลับ</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>ถ่ายรูปเพื่อปิดนาฬิกาปลุก</Text>
        <View style={styles.targetColorContainer}>
          <Text style={styles.subtitle}>
            ถ่ายรูปสิ่งของที่มีสี
          </Text>
          <View style={[styles.colorSample, { backgroundColor: targetColor?.hex || '#CCCCCC' }]} />
          <Text style={[styles.colorName, { color: targetColor?.hex || '#FFFFFF' }]}>
            {targetColor?.name || ""}
          </Text>
        </View>
        <Text style={styles.instruction}>
          หาสิ่งของที่มีสีตรงกับสีด้านบน แล้วถ่ายรูปเพื่อปิดเสียงปลุก
        </Text>
      </View>

      <View style={styles.cameraContainer}>
        {/* ใช้ try-catch ในการแสดงกล้อง */}
        {isCameraReady ? null : (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#FFFFFF" />
            <Text style={styles.loadingText}>กำลังเปิดกล้อง...</Text>
          </View>
        )}

        {/* กล้อง */}
        {(() => {
          try {
            return (
              <Camera
                style={styles.camera}
                type={cameraType}
                ref={(ref) => setCamera(ref)}
                onCameraReady={handleCameraReady}
                onMountError={handleCameraError}
              >
                <View style={styles.cameraOverlay}>
                  {/* วงกลมแสดงเป้าหมาย */}
                  <View style={styles.targetCircle} />
                  
                  {/* แสดงวิธีใช้งาน */}
                  <View style={styles.cameraInstructionContainer}>
                    <Text style={styles.cameraInstructionText}>
                      จัดตำแหน่งวัตถุสี{targetColor?.name || ""}ให้อยู่ในวงกลม
                    </Text>
                  </View>
                </View>
              </Camera>
            );
          } catch (err) {
            console.error("Error rendering camera:", err);
            return (
              <View style={[styles.camera, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#1a1a1a' }]}>
                <Icon name="camera-off" size={60} color="#FF3B30" />
                <Text style={{ color: '#FFFFFF', textAlign: 'center', marginTop: 10 }}>
                  ไม่สามารถเปิดกล้องได้
                </Text>
              </View>
            );
          }
        })()}
      </View>

      <View style={styles.footer}>
        <Text style={styles.attemptsText}>
          ความพยายาม: {attempts}/{maxAttempts}
        </Text>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              Alert.alert(
                "ยืนยันการยกเลิก",
                "คุณต้องการยกเลิกการถ่ายรูปและกลับไปหน้าที่แล้วหรือไม่?",
                [
                  {
                    text: "ยกเลิก",
                    style: "cancel",
                  },
                  {
                    text: "ยืนยัน",
                    onPress: () => navigation.goBack(),
                  },
                ]
              );
            }}
          >
            <Text style={styles.buttonText}>กลับ</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.captureButton,
              processing && styles.disabledButton,
              !isCameraReady && styles.disabledButton,
            ]}
            onPress={takePicture}
            disabled={processing || !isCameraReady}
          >
            {processing ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Icon name="camera" size={30} color="#FFFFFF" />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.switchButton}
            onPress={() => {
              if (cameraType === Camera.Constants?.Type?.back || cameraType === 'back') {
                setCameraType(Camera.Constants?.Type?.front || 'front');
              } else {
                setCameraType(Camera.Constants?.Type?.back || 'back');
              }
            }}
          >
            <Icon name="camera-switch" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  header: {
    padding: 20,
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 16,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 18,
    color: "#FFFFFF",
    marginBottom: 8,
    textAlign: "center",
  },
  targetColorContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 15,
  },
  colorSample: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginHorizontal: 10,
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  colorName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  instruction: {
    fontSize: 16,
    color: "#9CA3AF",
    textAlign: "center",
    marginTop: 8,
  },
  cameraContainer: {
    width: "100%",
    height: 400,
    marginVertical: 20,
    borderRadius: 12,
    overflow: "hidden",
    position: "relative",
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },
  targetCircle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 2,
    borderColor: "#FFFFFF",
    borderStyle: "dashed",
  },
  cameraInstructionContainer: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    padding: 10,
    backgroundColor: "rgba(0,0,0,0.7)",
    borderRadius: 10,
  },
  cameraInstructionText: {
    fontSize: 16,
    color: "#FFFFFF",
    textAlign: "center",
  },
  footer: {
    padding: 20,
    alignItems: "center",
  },
  buttonContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
  },
  attemptsText: {
    fontSize: 16,
    color: "#FFFFFF",
    marginBottom: 10,
  },
  backButton: {
    backgroundColor: "#4B5563",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
    marginRight: 20,
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#0A84FF",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 4,
    borderColor: "#FFFFFF",
  },
  switchButton: {
    backgroundColor: "#4B5563",
    padding: 12,
    borderRadius: 25,
    marginLeft: 20,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  disabledButton: {
    opacity: 0.5,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  loadingText: {
    color: "#FFFFFF",
    fontSize: 16,
    marginTop: 10,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: "#FF3B30",
    textAlign: "center",
    marginVertical: 20,
  },
});

export default PhotoTaskScreen;
