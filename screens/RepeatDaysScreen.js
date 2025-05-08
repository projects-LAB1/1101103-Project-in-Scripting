import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const RepeatDaysScreen = ({ route, navigation }) => {
  const { repeatDays, onSave } = route.params;
  const [selectedDays, setSelectedDays] = React.useState(repeatDays);

  const dayNames = ['จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์', 'อาทิตย์'];

  const toggleDay = (dayIndex) => {
    const newSelectedDays = selectedDays.includes(dayIndex)
      ? selectedDays.filter(d => d !== dayIndex)
      : [...selectedDays, dayIndex].sort();
    setSelectedDays(newSelectedDays);
  };

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          onPress={() => {
            onSave(selectedDays);
            navigation.goBack();
          }}
          style={styles.saveButton}
        >
          <Text style={styles.saveButtonText}>บันทึก</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation, selectedDays]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {dayNames.map((day, index) => (
          <TouchableOpacity
            key={index}
            style={styles.dayItem}
            onPress={() => toggleDay(index)}
          >
            <Text style={styles.dayText}>{day}</Text>
            {selectedDays.includes(index) && (
              <MaterialCommunityIcons name="check" size={24} color="#FF9500" />
            )}
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  content: {
    flex: 1,
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    margin: 16,
  },
  dayItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#333333',
  },
  dayText: {
    fontSize: 17,
    color: '#FFFFFF',
  },
  saveButton: {
    marginRight: 16,
  },
  saveButtonText: {
    color: '#FF9500',
    fontSize: 17,
    fontWeight: '600',
  },
});

export default RepeatDaysScreen; 