import React, { useState } from "react";
import {
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { COLORS, UI } from "../constants/colors";
import { API_BASE } from "../constants/config";

export default function ChatScreen({ route, navigation }) {
  const { stepTitle, subtask } = route.params || {};
  const [messages, setMessages] = useState([
    { id: "0", from: "assistant", text: `Contexto da sub-tarefa: ${subtask}` },
  ]);
  const [input, setInput] = useState("");

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMsg = { id: String(Date.now()), from: "user", text: input };
    setMessages((m) => [...m, userMsg]);

    try {
      const resp = await fetch(`${API_BASE}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subtask, message: input, history: messages }),
      });
      const data = await resp.json();
      const assistantText = data.response || "(sem resposta)";
      const assistantMsg = {
        id: String(Date.now() + 1),
        from: "assistant",
        text: assistantText,
      };
      setMessages((m) => [...m, assistantMsg]);
      setInput("");
    } catch (err) {
      console.error(err);
      setMessages((m) => [
        ...m,
        {
          id: String(Date.now() + 2),
          from: "assistant",
          text: "Erro ao contactar o agente.",
        },
      ]);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          IA · {stepTitle}
        </Text>
        <View style={{ width: 50 }} />
      </View>

      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messages}
        renderItem={({ item }) => (
          <View
            style={[
              styles.bubble,
              item.from === "assistant"
                ? styles.bubbleAssistant
                : styles.bubbleUser,
            ]}
          >
            <Text
              style={[
                styles.bubbleText,
                item.from === "user" && styles.bubbleTextUser,
              ]}
            >
              {item.text}
            </Text>
          </View>
        )}
      />

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Digite sua pergunta..."
          placeholderTextColor={COLORS.textSecondary}
        />
        <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
          <Text style={styles.sendText}>Enviar</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: UI.spacing.lg,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: { fontSize: 14, color: COLORS.primary, fontWeight: "700" },
  headerTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.text,
    flex: 1,
    textAlign: "center",
  },
  messages: { padding: UI.spacing.lg, paddingBottom: 100 },
  bubble: {
    marginBottom: UI.spacing.md,
    padding: UI.spacing.md,
    borderRadius: UI.radius.lg,
    maxWidth: "86%",
    borderWidth: 1,
  },
  bubbleAssistant: {
    backgroundColor: COLORS.cardBg,
    borderColor: COLORS.border,
    alignSelf: "flex-start",
  },
  bubbleUser: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
    alignSelf: "flex-end",
  },
  bubbleText: { color: COLORS.text, fontSize: 14, lineHeight: 20 },
  bubbleTextUser: { color: COLORS.background, fontWeight: "600" },
  inputRow: {
    flexDirection: "row",
    padding: UI.spacing.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.background,
    gap: UI.spacing.sm,
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.cardBg,
    borderRadius: UI.radius.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: UI.spacing.md,
    color: COLORS.text,
  },
  sendButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: UI.spacing.lg,
    borderRadius: UI.radius.md,
    justifyContent: "center",
  },
  sendText: { color: COLORS.background, fontWeight: "800" },
});
