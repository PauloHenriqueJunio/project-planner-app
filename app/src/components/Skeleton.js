import React from "react";
import { View, StyleSheet } from "react-native";
import { COLORS } from "../constants/colors";

export default function Skeleton({ height = 16, width = "100%", style }) {
  return <View style={[styles.box, { height, width }, style]} />;
}

const styles = StyleSheet.create({
  box: {
    backgroundColor: COLORS.border,
    borderRadius: 6,
    marginBottom: 8,
  },
});
