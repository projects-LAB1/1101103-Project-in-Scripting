import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";

function HomeScreen({ navigation }) {
  return (
    <View style={styles.screenContainer}>
      {/* Alarm List */}
      <View style={styles.alarmList}>
        {[1, 2, 3].map((item, index) => (
          <View key={index} style={styles.alarmItem}>
            <View style={styles.alarmInfo}>
              <Text style={styles.alarmTime}>06:00</Text>
              <Text style={styles.alarmDays}>Every day | ตื่นเช้าทุกวัน</Text>
            </View>
            <View style={styles.switchContainer}>
              <View style={styles.switchOn}></View>
            </View>
          </View>
        ))}
      </View>
      
      {/* Add Button */}
      <View style={styles.addButtonContainer}>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => navigation.navigate('AlarmSetupScreen')}
        >
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  alarmList: {
    flex: 1,
    paddingTop: 10,
  },
  alarmItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#2D2D3F",
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
  },
  alarmInfo: {
    flex: 1,
  },
  alarmTime: {
    color: "white",
    fontSize: 24,
    fontWeight: "bold",
  },
  alarmDays: {
    color: "#8F8F9F",
    fontSize: 14,
    marginTop: 4,
  },
  switchContainer: {
    width: 40,
    height: 20,
    backgroundColor: "#4080FF",
    borderRadius: 10,
    justifyContent: "center",
    paddingHorizontal: 2,
  },
  switchOn: {
    width: 16,
    height: 16,
    backgroundColor: "white",
    borderRadius: 8,
    alignSelf: "flex-end",
  },
  addButtonContainer: {
    position: "absolute",
    bottom: 20,
    alignSelf: "center",
  },
  addButton: {
    width: 50,
    height: 50,
    backgroundColor: "#4080FF",
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
  },
  addButtonText: {
    color: "white",
    fontSize: 30,
    fontWeight: "bold",
  },
});

export default HomeScreen;