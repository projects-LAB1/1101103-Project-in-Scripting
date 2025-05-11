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
  SafeAreaView,
} from "react-native";
import { collection, getDocs, addDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "../firebase/config";
import { Audio } from "expo-av";
import Slider from "@react-native-community/slider";
import * as DocumentPicker from "expo-document-picker";
import { Ionicons, MaterialCommunityIcons } from "react-native-vector-icons";

const SoundLibraryScreen = ({ route, navigation }) => {
  const { selectedSound, onSelectSound } = route.params || {};
  const [sound, setSound] = useState(null);
  const [playing, setPlaying] = useState(null);
  const [selectedId, setSelectedId] = useState(selectedSound?.id || 'default');
  const [sounds, setSounds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [volume, setVolume] = useState(0.8);

  // Load sounds from Firestore
  useEffect(() => {
    loadSounds();

    // Clean up sound when leaving screen
    return () => {
      if (sound) {
        sound.stopAsync().catch(err => console.log('Error stopping sound:', err));
        sound.unloadAsync().catch(err => console.log('Error unloading sound:', err));
      }
    };
  }, []);

  const loadSounds = async () => {
    try {
      // Create default sounds list since we don't have an actual Firebase connection
      const defaultSounds = [
        { id: "default", name: "Default Alarm", url: null, icon: 'alarm' },
        { id: "bell", name: "Bell", url: null, icon: 'bell' },
        { id: "digital", name: "Digital", url: null, icon: 'alarm-outline' },
        { id: "rooster", name: "Rooster", url: null, icon: 'bird' },
      ];
      
      setSounds(defaultSounds);
      setLoading(false);
      
      /* 
      // Actual Firebase implementation - commented out until Firebase is properly set up
      // Get sounds from Firestore
      const soundsRef = collection(db, "sounds");
      const snapshot = await getDocs(soundsRef);

      const soundsList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Add default sounds if none exist
      if (soundsList.length === 0) {
        const defaultSounds = [
          { id: "default", name: "Default Alarm", url: null, icon: 'alarm' },
          { id: "bell", name: "Bell", url: null, icon: 'bell' },
          { id: "digital", name: "Digital", url: null, icon: 'alarm-outline' },
          { id: "rooster", name: "Rooster", url: null, icon: 'bird' },
        ];
        setSounds(defaultSounds);
      } else {
        setSounds(soundsList);
      }

      setLoading(false);
      */
    } catch (error) {
      console.error("Error loading sounds:", error);
      Alert.alert("ข้อผิดพลาด", "ไม่สามารถโหลดรายการเสียงปลุกได้");
      
      // Fallback to default sounds on error
      const defaultSounds = [
        { id: "default", name: "Default Alarm", url: null, icon: 'alarm' },
        { id: "bell", name: "Bell", url: null, icon: 'bell' },
        { id: "digital", name: "Digital", url: null, icon: 'alarm-outline' },
        { id: "rooster", name: "Rooster", url: null, icon: 'bird' },
      ];
      setSounds(defaultSounds);
      setLoading(false);
    }
  };

  // Play sound preview
  const playSound = async (soundItem) => {
    try {
      // Stop current sound if playing
      if (sound) {
        await sound.stopAsync();
        await sound.unloadAsync();
        setSound(null);
      }

      // Play new sound
      setPlaying(soundItem.id);
      const { sound: newSound } = await Audio.Sound.createAsync(
        soundItem.path,
        { shouldPlay: true }
      );
      
      setSound(newSound);
      
      // Set up listener for when sound finishes playing
      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) {
          setPlaying(null);
        }
      });
    } catch (error) {
      console.error("Error playing sound:", error);
      Alert.alert("ข้อผิดพลาด", "ไม่สามารถเล่นเสียงตัวอย่างได้");
      setPlaying(null);
    }
  };

  // Upload custom sound
  const uploadSound = async () => {
    try {
      // Pick audio file
      const result = await DocumentPicker.getDocumentAsync({
        type: "audio/*",
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const file = result.assets[0];
      const fileName = file.name;

      // Check file size (limit to 5MB)
      if (file.size > 5 * 1024 * 1024) {
        Alert.alert("ไฟล์ใหญ่เกินไป", "ไฟล์เสียงต้องมีขนาดไม่เกิน 5MB");
        return;
      }

      setLoading(true);

      // Mock implementation for demo purposes
      const soundData = {
        id: `custom_${Date.now()}`,
        name: fileName.replace(/\.[^/.]+$/, ""), // Remove file extension
        url: file.uri, // Use local URI for demo
        createdAt: new Date(),
        icon: 'custom'
      };

      // Add to local state
      setSounds([...sounds, soundData]);

      Alert.alert("สำเร็จ", "อัปโหลดไฟล์เสียงเรียบร้อยแล้ว");
      setLoading(false);
      
      /*
      // Actual Firebase upload implementation - commented out until Firebase is properly set up
      // Upload to Firebase Storage
      const response = await fetch(file.uri);
      const blob = await response.blob();

      const storageRef = ref(storage, `sounds/${Date.now()}_${fileName}`);
      await uploadBytes(storageRef, blob);

      // Get download URL
      const downloadURL = await getDownloadURL(storageRef);

      // Add to Firestore
      const soundData = {
        name: fileName.replace(/\.[^/.]+$/, ""), // Remove file extension
        url: downloadURL,
        createdAt: new Date(),
        icon: 'custom'
      };

      const docRef = await addDoc(collection(db, "sounds"), soundData);

      // Add to local state
      setSounds([...sounds, { id: docRef.id, ...soundData }]);

      Alert.alert("สำเร็จ", "อัปโหลดไฟล์เสียงเรียบร้อยแล้ว");
      setLoading(false);
      */
    } catch (error) {
      console.error("Error uploading sound:", error);
      Alert.alert("ข้อผิดพลาด", "ไม่สามารถอัปโหลดไฟล์เสียงได้");
      setLoading(false);
    }
  };

  // Select sound and return to previous screen
  const selectSound = (item) => {
    setSelectedId(item.id);
    
    // หากมีฟังก์ชัน callback
    if (onSelectSound) {
      onSelectSound(item);
    }
  };

  // Render sound item
  const renderSoundItem = ({ item }) => {
    const isSelected = item.id === selectedId;
    const isPlaying = item.id === playing;

    return (
      <TouchableOpacity
        style={[styles.soundItem, isSelected && styles.selectedItem]}
        onPress={() => selectSound(item)}
      >
        <View style={styles.soundInfo}>
          <MaterialCommunityIcons
            name={item.icon}
            size={24}
            color={isSelected ? "#0A84FF" : "#999999"}
          />
          <Text style={[styles.soundName, isSelected && styles.selectedText]}>
            {item.name}
          </Text>
        </View>
        
        <View style={styles.actions}>
          {/* เลือกเสียง */}
          <TouchableOpacity
            style={[styles.selectButton, isSelected && styles.selectedButton]}
            onPress={() => selectSound(item)}
          >
            {isSelected ? (
              <Ionicons name="checkmark-circle" size={24} color="#0A84FF" />
            ) : (
              <Ionicons name="radio-button-off" size={24} color="#666666" />
            )}
          </TouchableOpacity>
          
          {/* ปุ่มเล่นเสียง */}
          <TouchableOpacity
            style={styles.playButton}
            onPress={() => playSound(item)}
          >
            <Ionicons
              name={isPlaying ? "pause" : "play"}
              size={22}
              color="#FFFFFF"
            />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  // ฟังก์ชันบันทึกการเลือก
  const handleSave = () => {
    const selectedSound = sounds.find(item => item.id === selectedId);
    if (selectedSound && onSelectSound) {
      onSelectSound(selectedSound);
    }
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
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
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}

      {/* Upload Button */}
      <TouchableOpacity style={styles.uploadButton} onPress={uploadSound}>
        <Text style={styles.uploadButtonText}>อัปโหลดเสียงใหม่</Text>
      </TouchableOpacity>

      <View style={styles.footer}>
        <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
          <Text style={styles.saveButtonText}>เสร็จสิ้น</Text>
        </TouchableOpacity>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  saveButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
  },
  saveButtonText: {
    color: '#0A84FF',
    fontSize: 16,
    fontWeight: '600',
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#1C1C1E',
  },
  selectedItem: {
    backgroundColor: '#1C1C1E',
    borderLeftWidth: 3,
    borderLeftColor: '#0A84FF',
  },
  soundInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  soundName: {
    marginLeft: 15,
    fontSize: 16,
    color: '#FFFFFF',
  },
  selectedText: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectButton: {
    marginRight: 15,
  },
  selectedButton: {
    opacity: 1,
  },
  playButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#0A84FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#333333',
    marginLeft: 15,
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
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#333333',
  },
});

export default SoundLibraryScreen;
