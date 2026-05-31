import React, { useState } from "react";
import {
  View,
  Text,
  SafeAreaView,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
} from "react-native";
import { COLORS } from "../constants/colors";

const API_BASE = "http://127.0.0.1:8000"; // ajuste se necessário

export default function ChatScreen({ route, navigation }) {
  const { project, stepTitle, subtask } = route.params || {};
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
      const assistantMsg = { id: String(Date.now() + 1), from: "assistant", text: assistantText };
      setMessages((m) => [...m, assistantMsg]);
      setInput("");
    } catch (err) {
      console.error(err);
      const errMsg = { id: String(Date.now() + 2), from: "assistant", text: "Erro ao contactar o agente." };
      setMessages((m) => [...m, errMsg]);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Agente — {stepTitle}</Text>
        <View style={{ width: 50 }} />
      </View>

      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messages}
        renderItem={({ item }) => (
          <View style={[styles.bubble, item.from === "assistant" ? styles.bubbleAssistant : styles.bubbleUser]}>
            <Text style={styles.bubbleText}>{item.text}</Text>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: { fontSize: 14, color: COLORS.primary, fontWeight: "600" },
  headerTitle: { fontSize: 16, fontWeight: "bold", color: COLORS.text },
  messages: { padding: 16, paddingBottom: 100 },
  bubble: { marginBottom: 12, padding: 12, borderRadius: 8, maxWidth: "85%" },
  bubbleAssistant: { backgroundColor: COLORS.cardBg, alignSelf: "flex-start" },
  bubbleUser: { backgroundColor: COLORS.primary, alignSelf: "flex-end" },
  bubbleText: { color: COLORS.text, fontSize: 14 },
  inputRow: { flexDirection: "row", padding: 12, borderTopWidth: 1, borderTopColor: COLORS.border },
  input: { flex: 1, backgroundColor: COLORS.cardBg, borderRadius: 8, paddingHorizontal: 12, color: COLORS.text },
  sendButton: { marginLeft: 8, backgroundColor: COLORS.primary, paddingHorizontal: 14, borderRadius: 8, justifyContent: "center" },
  sendText: { color: COLORS.text, fontWeight: "600" },
});
