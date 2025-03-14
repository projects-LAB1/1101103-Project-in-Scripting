import React from "react";
import { View, Text, StyleSheet } from "react-native";

function ProfileScreen() {
  return (
    <View style={styles.screenContainer}>
      <Text style={styles.placeholderText}>Profile Screen</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#1E1E2E",
  },
  placeholderText: {
    color: "white",
    fontSize: 20,
    textAlign: "center",
  },
});

export default ProfileScreen;