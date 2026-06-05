import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { COLORS, UI } from "../constants/colors";

export default function CardCompact({ title, subtitle, onPress, right }) {
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.82}
    >
      <View style={styles.content}>
        <Text numberOfLines={1} style={styles.title}>
          {title}
        </Text>
        {subtitle ? (
          <Text numberOfLines={2} style={styles.subtitle}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      <View style={styles.right}>{right ?? <Text style={styles.chev}>{">"}</Text>}</View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    padding: UI.spacing.md,
    backgroundColor: COLORS.cardBg,
    borderRadius: UI.radius.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 10,
    ...UI.shadow,
  },
  content: { flex: 1 },
  title: {
    fontSize: 15,
    fontWeight: "800",
    color: COLORS.text,
    marginBottom: 4,
  },
  subtitle: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 18 },
  right: { width: 24, alignItems: "flex-end" },
  chev: { fontSize: 18, color: COLORS.primary, fontWeight: "800" },
});
