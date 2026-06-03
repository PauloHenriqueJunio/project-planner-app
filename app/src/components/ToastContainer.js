import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { COLORS } from "../constants/colors";
import { useToast } from "../context/ToastContext";

export default function ToastContainer() {
  const { toast } = useToast();
  if (!toast) return null;

  return (
    <View pointerEvents="none" style={styles.wrapper}>
      <View style={styles.box}>
        <Text style={styles.text}>{toast.message}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    top: 40,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 9999,
  },
  box: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 6,
  },
  text: { color: COLORS.text, fontWeight: "600" },
});
