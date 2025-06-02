import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Alert,
} from 'react-native';
import { Audio } from 'expo-av';
import { Ionicons } from 'react-native-vector-icons';
import { useSoundSelection } from '../contexts/SoundSelectionContext';

const SoundPickerScreen = ({ route, navigation }) => {
  const { selectedSound, selectSound, confirmSelection } = useSoundSelection();
  const [sound, setSound] = useState(null);
  const [playingId, setPlayingId] = useState(null);
  const [selectedId, setSelectedId] = useState(selectedSound?.id || 'default');

  // เสียงที่มีอยู่ในระบบ
  const availableSounds = [
    {
      id: 'default',
      name: 'เสียงเริ่มต้น',
      file: require('../assets/sounds/default-alarm.mp3'),
    },
    {
      id: 'digital',
      name: 'เสียงดิจิทัล',
      file: require('../assets/sounds/digital-alarm.mp3'),
    },
    {
      id: 'rooster',
      name: 'เสียงไก่ขัน',
      file: require('../assets/sounds/rooster-alarm.mp3'),
    }
  ];

  // หยุดเสียงที่กำลังเล่นเมื่อออกจากหน้าจอ
  useEffect(() => {
    return () => {
      if (sound) {
        sound.stopAsync().catch(err => console.log('Error stopping sound:', err));
        sound.unloadAsync().catch(err => console.log('Error unloading sound:', err));
      }
    };
  }, [sound]);

  // ฟังก์ชันเล่นเสียงตัวอย่าง
  const playSound = async (soundId) => {
    try {
      // หยุดเสียงที่กำลังเล่นอยู่ก่อน (ถ้ามี)
      if (sound) {
        await sound.stopAsync();
        await sound.unloadAsync();
        setSound(null);
      }

      // ถ้ากดเสียงเดิมที่กำลังเล่น ให้หยุดเล่น
      if (playingId === soundId) {
        setPlayingId(null);
        return;
      }

      // หาไฟล์เสียงที่ต้องการเล่น
      const soundItem = availableSounds.find(item => item.id === soundId);
      if (!soundItem) return;

      // เล่นเสียงใหม่
      setPlayingId(soundId);
      const { sound: newSound } = await Audio.Sound.createAsync(
        soundItem.file,
        { shouldPlay: true }
      );
      
      setSound(newSound);
      
      // เมื่อเล่นจบให้ reset สถานะ
      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) {
          setPlayingId(null);
        }
      });
    } catch (error) {
      console.error('Error playing sound:', error);
      Alert.alert('ข้อผิดพลาด', 'ไม่สามารถเล่นเสียงได้');
      setPlayingId(null);
    }
  };

  // ฟังก์ชันเลือกเสียง
  const handleSelect = (soundId) => {
    setSelectedId(soundId);
  };

  // ฟังก์ชันบันทึกการเลือก
  const handleSave = () => {
    const selectedSoundItem = availableSounds.find(item => item.id === selectedId);
    if (selectedSoundItem) {
      selectSound({
        id: selectedSoundItem.id,
        name: selectedSoundItem.name,
      });
      confirmSelection();
    }
    navigation.goBack();
  };

  // Render รายการเสียง
  const renderSoundItem = ({ item }) => {
    const isSelected = item.id === selectedId;
    const isPlaying = item.id === playingId;

    return (
      <TouchableOpacity
        style={[styles.soundItem, isSelected && styles.selectedItem]}
        onPress={() => handleSelect(item.id)}
      >
        <View style={styles.soundInfo}>
          <Text style={[styles.soundName, isSelected && styles.selectedText]}>
            {item.name}
          </Text>
        </View>
        
        <View style={styles.actions}>
          {/* Check mark แสดงการเลือก */}
          <TouchableOpacity
            style={styles.selectButton}
            onPress={() => handleSelect(item.id)}
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
            onPress={() => playSound(item.id)}
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

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#0A84FF" />
        </TouchableOpacity>
        <Text style={styles.title}>เลือกเสียงปลุก</Text>
        <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
          <Text style={styles.saveButtonText}>บันทึก</Text>
        </TouchableOpacity>
      </View>
      
      <FlatList
        data={availableSounds}
        renderItem={renderSoundItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  backButton: {
    padding: 5,
  },
  title: {
    fontSize: 18,
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
  list: {
    paddingVertical: 10,
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
});

export default SoundPickerScreen; 