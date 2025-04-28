// SoundLibraryScreen.js - หน้าเลือกเสียงปลุก
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StatusBar,
  Vibration,
} from "react-native";
import { supabase } from "../supabase.config";
// import { Audio } from "expo-av"; // ปิดการใช้งานชั่วคราวเนื่องจากมีปัญหา
import Slider from "@react-native-community/slider";
import { DocumentPicker } from "expo-document-picker";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { UserAuth } from "../models/UserAuth";

const SoundLibraryScreen = ({ route, navigation }) => {
  const { onSelect, currentSoundId } = route.params || {};
  const [sounds, setSounds] = useState([]);
  const [loading, setLoading] = useState(true);
  // const [playingSound, setPlayingSound] = useState(null); // ปิดการใช้งานชั่วคราว
  const [playingSoundId, setPlayingSoundId] = useState(null);
  const [volume, setVolume] = useState(0.8);
  const { user } = UserAuth();

  useEffect(() => {
    loadSounds();

    return () => {
      // ปิดการใช้งานการหยุดเสียงชั่วคราว
      // if (playingSound) {
      //   playingSound.stopAsync();
      //   playingSound.unloadAsync();
      // }

      // หยุดการสั่นเมื่อออกจากหน้าจอ
      Vibration.cancel();
    };
  }, []);

  const loadSounds = async () => {
    try {
      // Get sounds from Supabase
      const { data: customSounds, error } = await supabase
        .from('sounds')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;

      // Combine default sounds with custom sounds
      const defaultSounds = [
        { id: "default", name: "Default Alarm", url: null },
        { id: "bell", name: "Bell", url: null },
        { id: "digital", name: "Digital", url: null },
        { id: "rooster", name: "Rooster", url: null },
      ];

      setSounds([...defaultSounds, ...(customSounds || [])]);
      setLoading(false);
    } catch (error) {
      console.error("Error loading sounds:", error);
      Alert.alert("ข้อผิดพลาด", "ไม่สามารถโหลดรายการเสียงปลุกได้");
      setLoading(false);
    }
  };

  const playSound = async (sound) => {
    try {
      console.log("กำลังเล่นเสียงตัวอย่าง...");

      // ใช้การสั่นแทนเสียงชั่วคราว
      if (playingSoundId === sound.id) {
        // ถ้ากดเสียงเดิมซ้ำ ให้หยุดการสั่น
        Vibration.cancel();
        setPlayingSoundId(null);
        return;
      }

      // หยุดการสั่นที่กำลังทำงานอยู่ (ถ้ามี)
      Vibration.cancel();

      // สั่นเป็นเวลาสั้นๆ เพื่อแสดงว่ากำลังเล่นเสียง
      Vibration.vibrate(500);

      // แสดงสถานะว่ากำลังเล่นเสียง
      setPlayingSoundId(sound.id);

      // จำลองการเล่นเสียงเสร็จสิ้นหลังจาก 2 วินาที
      setTimeout(() => {
        setPlayingSoundId(null);
      }, 2000);

      /* ปิดการทำงานของโค้ดเดิมที่มีปัญหา
      // หยุดเสียงที่กำลังเล่นอยู่ (ถ้ามี)
      if (playingSound) {
        await playingSound.stopAsync();
        await playingSound.unloadAsync();
        setPlayingSound(null);

        // ถ้ากดเสียงเดิมซ้ำ ให้หยุดเล่นและออกจากฟังก์ชัน
        if (playingSoundId === sound.id) {
          setPlayingSoundId(null);
          return;
        }
      }

      // ใช้เสียงเริ่มต้นเพียงเสียงเดียวเพื่อลดความซับซ้อน
      const soundSource = require("../assets/sounds/default-alarm.mp3");

      // สร้างและเล่นเสียงด้วยระดับเสียงที่กำหนด
      const { sound: audioSound } = await Audio.Sound.createAsync(
        soundSource,
        { volume: volume },
        (status) => {
          console.log('Sound status update:', status);
          if (status.didJustFinish) {
            setPlayingSoundId(null);
          }
          if (status.error) {
            console.error('Sound playback error:', status.error);
          }
        }
      );

      setPlayingSound(audioSound);
      setPlayingSoundId(sound.id);

      // เล่นเสียง
      await audioSound.playAsync();
      */

      console.log("ใช้การสั่นแทนเสียงตัวอย่าง");
    } catch (error) {
      console.error("Error in playSound:", error);
      Alert.alert("ข้อมูลแจ้ง", "ไม่สามารถเล่นเสียงตัวอย่างได้");
    }
  };

  const uploadSound = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "audio/*",
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const file = result.assets[0];
      const fileName = file.name;

      if (file.size > 5 * 1024 * 1024) {
        Alert.alert("ไฟล์ใหญ่เกินไป", "ไฟล์เสียงต้องมีขนาดไม่เกิน 5MB");
        return;
      }

      setLoading(true);

      // Upload to Supabase Storage
      const fileExt = fileName.split('.').pop();
      const filePath = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase
        .storage
        .from('sounds')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Add to Supabase database
      const { error: dbError } = await supabase
        .from('sounds')
        .insert([
          {
            name: fileName.replace(/\.[^/.]+$/, ""),
            url: filePath,
            user_id: user.id,
            created_at: new Date(),
          }
        ]);

      if (dbError) throw dbError;

      Alert.alert("สำเร็จ", "อัปโหลดไฟล์เสียงเรียบร้อยแล้ว");
      loadSounds();
    } catch (error) {
      console.error("Error uploading sound:", error);
      Alert.alert("ข้อผิดพลาด", "ไม่สามารถอัปโหลดไฟล์เสียงได้");
      setLoading(false);
    }
  };

  // Select sound and return to previous screen
  const selectSound = (sound) => {
    if (onSelect) {
      onSelect(sound);
      // ใช้ navigation.goBack() เพื่อให้แน่ใจว่ากลับไปยังหน้าก่อนหน้าได้อย่างถูกต้อง
      navigation.goBack();
    }
  };

  // Render sound item
  const renderSoundItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.soundItem,
        currentSoundId === item.id && styles.selectedSoundItem,
      ]}
      onPress={() => selectSound(item)}
    >
      <View style={styles.soundInfo}>
        <Text style={styles.soundName}>{item.name}</Text>
        {item.url && <Text style={styles.customLabel}>Custom</Text>}
      </View>

      <TouchableOpacity
        style={styles.playButton}
        onPress={() => playSound(item)}
      >
        <Icon
          name={playingSoundId === item.id ? "stop" : "play"}
          size={24}
          color="#4F46E5"
        />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="#12111D"
        translucent={false}
      />
      {/* Volume Slider */}
      <View style={styles.volumeContainer}>
        <Text style={styles.volumeLabel}>ระดับเสียง</Text>
        <Slider
          style={styles.volumeSlider}
          minimumValue={0}
          maximumValue={1}
          value={volume}
          onValueChange={setVolume}
          minimumTrackTintColor="#4F46E5"
          maximumTrackTintColor="#D1D5DB"
          thumbTintColor="#4F46E5"
        />
        <View style={styles.volumeValues}>
          <Text style={styles.volumeText}>0%</Text>
          <Text style={styles.volumeText}>100%</Text>
        </View>
      </View>

      {/* Sound List */}
      {loading ? (
        <ActivityIndicator size="large" color="#4F46E5" style={styles.loader} />
      ) : (
        <FlatList
          data={sounds}
          renderItem={renderSoundItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.soundList}
        />
      )}

      {/* Upload Button */}
      <TouchableOpacity style={styles.uploadButton} onPress={uploadSound}>
        <Icon name="upload" size={20} color="white" />
        <Text style={styles.uploadButtonText}>อัปโหลดเสียงใหม่</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
    padding: 20,
  },
  volumeContainer: {
    backgroundColor: "white",
    borderRadius: 15,
    padding: 15,
    marginBottom: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  volumeLabel: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 10,
    color: "#374151",
  },
  volumeSlider: {
    height: 40,
  },
  volumeValues: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  volumeText: {
    color: "#6B7280",
    fontSize: 12,
  },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  soundList: {
    paddingBottom: 80,
  },
  soundItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 15,
    padding: 15,
    marginBottom: 10,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  selectedSoundItem: {
    borderWidth: 2,
    borderColor: "#4F46E5",
  },
  soundInfo: {
    flex: 1,
  },
  soundName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#111827",
  },
  customLabel: {
    fontSize: 12,
    color: "#4F46E5",
    marginTop: 4,
  },
  playButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
  },
  uploadButton: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: "#4F46E5",
    borderRadius: 10,
    padding: 15,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  uploadButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 10,
  },
});

export default SoundLibraryScreen;
