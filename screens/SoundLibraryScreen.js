// SoundLibraryScreen.js - หน้าเลือกเสียงปลุก
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { getFirestore, collection, getDocs, addDoc } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Audio } from "expo-av";
import { Alert, Slider } from "react-native";
import { DocumentPicker } from "expo-document-picker";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

const SoundLibraryScreen = ({ route, navigation }) => {
  const { onSelect, currentSoundId } = route.params || {};
  const [sounds, setSounds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [playingSound, setPlayingSound] = useState(null);
  const [playingSoundId, setPlayingSoundId] = useState(null);
  const [volume, setVolume] = useState(0.8);

  const db = getFirestore();
  const storage = getStorage();

  // Load sounds from Firestore
  useEffect(() => {
    loadSounds();

    // Clean up sound when leaving screen
    return () => {
      if (playingSound) {
        playingSound.stopAsync();
        playingSound.unloadAsync();
      }
    };
  }, []);

  const loadSounds = async () => {
    try {
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
          { id: "default", name: "Default Alarm", url: null },
          { id: "bell", name: "Bell", url: null },
          { id: "digital", name: "Digital", url: null },
          { id: "rooster", name: "Rooster", url: null },
        ];
        setSounds(defaultSounds);
      } else {
        setSounds(soundsList);
      }

      setLoading(false);
    } catch (error) {
      console.error("Error loading sounds:", error);
      Alert.alert("ข้อผิดพลาด", "ไม่สามารถโหลดรายการเสียงปลุกได้");
      setLoading(false);
    }
  };

  // Play sound preview
  const playSound = async (sound) => {
    try {
      // Stop current sound if playing
      if (playingSound) {
        await playingSound.stopAsync();
        await playingSound.unloadAsync();
        setPlayingSound(null);

        // If clicking the same sound, just stop it
        if (playingSoundId === sound.id) {
          setPlayingSoundId(null);
          return;
        }
      }

      // Get sound URL from Firebase Storage or use local asset
      let soundSource;
      if (sound.url) {
        // Get URL from Firebase Storage
        const soundRef = ref(storage, sound.url);
        const url = await getDownloadURL(soundRef);
        soundSource = { uri: url };
      } else {
        // Use local asset based on sound ID
        switch (sound.id) {
          case "default":
            soundSource = require("../assets/sounds/default-alarm.mp3");
            break;
          case "bell":
            soundSource = require("../assets/sounds/bell-alarm.mp3");
            break;
          case "digital":
            soundSource = require("../assets/sounds/digital-alarm.mp3");
            break;
          case "rooster":
            soundSource = require("../assets/sounds/rooster-alarm.mp3");
            break;
          default:
            soundSource = require("../assets/sounds/default-alarm.mp3");
        }
      }

      // Load and play sound
      const { sound: audioSound } = await Audio.Sound.createAsync(soundSource, {
        volume: volume,
      });

      setPlayingSound(audioSound);
      setPlayingSoundId(sound.id);

      // Play sound
      await audioSound.playAsync();

      // Set up listener for when sound finishes playing
      audioSound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) {
          setPlayingSoundId(null);
        }
      });
    } catch (error) {
      console.error("Error playing sound:", error);
      Alert.alert("ข้อผิดพลาด", "ไม่สามารถเล่นเสียงตัวอย่างได้");
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
      };

      const docRef = await addDoc(collection(db, "sounds"), soundData);

      // Add to local state
      setSounds([...sounds, { id: docRef.id, ...soundData }]);

      Alert.alert("สำเร็จ", "อัปโหลดไฟล์เสียงเรียบร้อยแล้ว");
      setLoading(false);
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
