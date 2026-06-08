import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { COLORS, UI } from "../constants/colors";
import { API_BASE } from "../constants/config";

async function readResponseBody(resp) {
  const text = await resp.text();
  if (!text) return {};

  try {
    return JSON.parse(text);
  } catch (_error) {
    return { detail: text };
  }
}

function getErrorMessage(error) {
  if (error?.message) return error.message;
  return "Não foi possível contactar o agente.";
}

export default function ChatScreen({ route, navigation }) {
  const { stepTitle, subtask } = route.params || {};
  const { height, width } = useWindowDimensions();
  const isCompact = width < 480 || height < 720;
  const scrollRef = React.useRef(null);
  const Shell = Platform.OS === "web" ? View : KeyboardAvoidingView;
  const [messages, setMessages] = useState([
    { id: "0", from: "assistant", text: `Contexto da sub-tarefa: ${subtask}` },
  ]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);

  const sendMessage = async () => {
    const messageText = input.trim();
    if (!messageText || isSending) return;

    const userMsg = { id: String(Date.now()), from: "user", text: messageText };
    const history = [...messages, userMsg];
    setMessages(history);
    setInput("");
    setIsSending(true);

    try {
      const resp = await fetch(`${API_BASE}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subtask, message: messageText, history }),
      });

      const data = await readResponseBody(resp);
      if (!resp.ok) {
        const detail = data.detail || data.error || `HTTP ${resp.status}`;
        throw new Error(String(detail));
      }

      const assistantText = data.response;
      if (!assistantText) {
        throw new Error("A API respondeu, mas não retornou texto.");
      }

      const assistantMsg = {
        id: String(Date.now() + 1),
        from: "assistant",
        text: assistantText,
      };
      setMessages((m) => [...m, assistantMsg]);
    } catch (err) {
      console.error(err);
      setMessages((m) => [
        ...m,
        {
          id: String(Date.now() + 2),
          from: "assistant",
          text: `Erro ao contactar o agente: ${getErrorMessage(err)}`,
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  React.useEffect(() => {
    const timer = setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 80);

    return () => clearTimeout(timer);
  }, [messages.length]);

  const renderMessage = (item) => {
    const isUser = item.from === "user";

    return (
      <View
        style={[
          styles.messageRow,
          isCompact && styles.messageRowCompact,
          isUser && styles.messageRowUser,
        ]}
      >
        <View
          style={[
            styles.avatar,
            isCompact && styles.avatarCompact,
            isUser ? styles.avatarUser : styles.avatarAssistant,
          ]}
        >
          <Text style={[styles.avatarText, isCompact && styles.avatarTextCompact]}>
            {isUser ? "EU" : "IA"}
          </Text>
        </View>
        <View
          style={[
            styles.bubble,
            isCompact && styles.bubbleCompact,
            isUser ? styles.bubbleUser : styles.bubbleAssistant,
          ]}
        >
          <Text
            style={[
              styles.bubbleLabel,
              isCompact && styles.bubbleLabelCompact,
              isUser && styles.bubbleLabelUser,
            ]}
          >
            {isUser ? "Voce" : "Assistente"}
          </Text>
          <Text
            style={[
              styles.bubbleText,
              isCompact && styles.bubbleTextCompact,
              isUser && styles.bubbleTextUser,
            ]}
          >
            {item.text}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.header, isCompact && styles.headerCompact]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>Voltar</Text>
        </TouchableOpacity>
        <Text
          style={[styles.headerTitle, isCompact && styles.headerTitleCompact]}
          numberOfLines={1}
        >
          IA · {stepTitle}
        </Text>
        <View style={{ width: 50 }} />
      </View>

      <Shell
        style={styles.chatShell}
        {...(Platform.OS === "web"
          ? {}
          : { behavior: Platform.OS === "ios" ? "padding" : "height" })}
      >
        <View style={[styles.contextPanel, isCompact && styles.contextPanelCompact]}>
          {!isCompact && <Text style={styles.contextLabel}>Sub-tarefa</Text>}
          <Text
            style={[styles.contextTitle, isCompact && styles.contextTitleCompact]}
            numberOfLines={isCompact ? 1 : 2}
          >
            {subtask || "Sem contexto informado"}
          </Text>
        </View>

        <ScrollView
          ref={scrollRef}
          style={[
            styles.messageList,
            Platform.OS === "web" && styles.messageListWeb,
          ]}
          contentContainerStyle={[
            styles.messages,
            isCompact && styles.messagesCompact,
          ]}
          keyboardShouldPersistTaps="handled"
          nestedScrollEnabled
          showsVerticalScrollIndicator
          scrollEventThrottle={16}
        >
          {messages.map((item) => (
            <React.Fragment key={item.id}>{renderMessage(item)}</React.Fragment>
          ))}
        </ScrollView>

        <View style={[styles.inputBar, isCompact && styles.inputBarCompact]}>
          <View style={[styles.inputBox, isCompact && styles.inputBoxCompact]}>
            <TextInput
              style={[styles.input, isCompact && styles.inputCompact]}
              value={input}
              onChangeText={setInput}
              placeholder="Pergunte como executar esta sub-tarefa..."
              placeholderTextColor={COLORS.textSecondary}
              returnKeyType="send"
              blurOnSubmit={false}
              onSubmitEditing={sendMessage}
              multiline={Platform.OS !== "web"}
            />
          </View>
          <TouchableOpacity
            style={[
              styles.sendButton,
              isCompact && styles.sendButtonCompact,
              (!input.trim() || isSending) && styles.sendButtonDisabled,
            ]}
            onPress={sendMessage}
            disabled={!input.trim() || isSending}
          >
            <Text style={styles.sendText}>
              {isSending ? "..." : isCompact ? "OK" : "Enviar"}
            </Text>
          </TouchableOpacity>
        </View>
      </Shell>
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
  headerCompact: {
    paddingHorizontal: UI.spacing.md,
    paddingVertical: 10,
  },
  backButton: { fontSize: 14, color: COLORS.primary, fontWeight: "700" },
  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.text,
    flex: 1,
    textAlign: "center",
  },
  headerTitleCompact: {
    fontSize: 15,
  },
  chatShell: {
    flex: 1,
    minHeight: 0,
  },
  contextPanel: {
    marginHorizontal: UI.spacing.lg,
    marginTop: UI.spacing.lg,
    marginBottom: UI.spacing.md,
    padding: UI.spacing.lg,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: UI.radius.lg,
    ...UI.shadow,
  },
  contextPanelCompact: {
    marginHorizontal: UI.spacing.md,
    marginTop: UI.spacing.sm,
    marginBottom: UI.spacing.xs,
    paddingHorizontal: UI.spacing.md,
    paddingVertical: 9,
    borderRadius: UI.radius.md,
  },
  contextLabel: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: "800",
    marginBottom: 6,
    textTransform: "uppercase",
  },
  contextTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "800",
    lineHeight: 22,
  },
  contextTitleCompact: {
    fontSize: 13,
    lineHeight: 18,
  },
  messageList: {
    flex: 1,
    minHeight: 0,
  },
  messageListWeb: {
    overflowY: "auto",
    overscrollBehavior: "contain",
    touchAction: "pan-y",
    WebkitOverflowScrolling: "touch",
  },
  messages: {
    paddingHorizontal: UI.spacing.lg,
    paddingTop: UI.spacing.sm,
    paddingBottom: UI.spacing.xl,
    flexGrow: 1,
  },
  messagesCompact: {
    paddingHorizontal: UI.spacing.md,
    paddingTop: UI.spacing.xs,
    paddingBottom: UI.spacing.md,
  },
  messageRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: UI.spacing.sm,
    marginBottom: UI.spacing.lg,
  },
  messageRowCompact: {
    gap: UI.spacing.xs,
    marginBottom: UI.spacing.md,
  },
  messageRowUser: {
    flexDirection: "row-reverse",
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  avatarCompact: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  avatarAssistant: {
    backgroundColor: COLORS.surfaceElevated,
    borderColor: COLORS.border,
  },
  avatarUser: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  avatarText: {
    color: COLORS.text,
    fontSize: 11,
    fontWeight: "900",
  },
  avatarTextCompact: {
    fontSize: 9,
  },
  bubble: {
    paddingHorizontal: UI.spacing.lg,
    paddingVertical: UI.spacing.md,
    borderRadius: UI.radius.lg,
    maxWidth: "88%",
    borderWidth: 1,
  },
  bubbleCompact: {
    paddingHorizontal: UI.spacing.md,
    paddingVertical: UI.spacing.sm,
    maxWidth: "86%",
    borderRadius: UI.radius.md,
  },
  bubbleAssistant: {
    backgroundColor: COLORS.cardBg,
    borderColor: COLORS.border,
  },
  bubbleUser: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  bubbleLabel: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: "800",
    marginBottom: 6,
    textTransform: "uppercase",
  },
  bubbleLabelCompact: {
    fontSize: 10,
    marginBottom: 4,
  },
  bubbleLabelUser: {
    color: COLORS.background,
    opacity: 0.78,
  },
  bubbleText: { color: COLORS.text, fontSize: 16, lineHeight: 24 },
  bubbleTextCompact: { fontSize: 14, lineHeight: 20 },
  bubbleTextUser: { color: COLORS.background, fontWeight: "600" },
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: UI.spacing.lg,
    paddingVertical: UI.spacing.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.surface,
    gap: UI.spacing.md,
  },
  inputBarCompact: {
    paddingHorizontal: UI.spacing.md,
    paddingVertical: UI.spacing.sm,
    gap: UI.spacing.sm,
  },
  inputBox: {
    flex: 1,
    minHeight: 56,
    maxHeight: 120,
    backgroundColor: COLORS.cardBg,
    borderRadius: UI.radius.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: "center",
  },
  inputBoxCompact: {
    minHeight: 44,
    maxHeight: 82,
    borderRadius: UI.radius.md,
  },
  input: {
    flex: 1,
    minHeight: 54,
    paddingHorizontal: UI.spacing.lg,
    paddingVertical: 14,
    color: COLORS.text,
    fontSize: 16,
    lineHeight: 22,
  },
  inputCompact: {
    minHeight: 42,
    paddingHorizontal: UI.spacing.md,
    paddingVertical: 9,
    fontSize: 14,
    lineHeight: 19,
  },
  sendButton: {
    minHeight: 56,
    backgroundColor: COLORS.primary,
    paddingHorizontal: UI.spacing.xl,
    borderRadius: UI.radius.lg,
    justifyContent: "center",
    alignItems: "center",
  },
  sendButtonCompact: {
    minHeight: 44,
    paddingHorizontal: UI.spacing.md,
    borderRadius: UI.radius.md,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendText: { color: COLORS.background, fontWeight: "900", fontSize: 14 },
});
