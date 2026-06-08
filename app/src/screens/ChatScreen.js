import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Linking,
  Modal,
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

const PRODUCT_HINTS = [
  {
    label: "shampoo automotivo",
    aliases: [
      "shampoo automotivo",
      "xampu automotivo",
      "shampoo de carro",
      "xampu de carro",
    ],
  },
  { label: "cera automotiva", aliases: ["cera automotiva", "cera de carro"] },
  {
    label: "pano de microfibra",
    aliases: ["microfibra", "pano de microfibra", "flanela"],
  },
  { label: "limpa vidros automotivo", aliases: ["limpa vidros", "limpador de vidro"] },
  { label: "pretinho para pneu", aliases: ["pretinho", "pretinho para pneu", "limpa pneu"] },
  { label: "balde", aliases: ["balde"] },
  { label: "esponja automotiva", aliases: ["esponja", "esponja automotiva"] },
  { label: "detergente neutro", aliases: ["detergente neutro", "detergente"] },
];

function normalizeText(text) {
  return String(text || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function cleanProductName(value) {
  return String(value || "")
    .replace(/\b(esse|essa|este|esta|o|a|um|uma)\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function findProductHint(text) {
  const normalized = normalizeText(text);
  const found = PRODUCT_HINTS.find((hint) =>
    hint.aliases.some((alias) => normalized.includes(normalizeText(alias))),
  );
  return found?.label || "";
}

function detectMissingProduct(message, fallbackContext) {
  const normalized = normalizeText(message);
  const hasMissingIntent = [
    "nao tenho",
    "nao possuo",
    "estou sem",
    "to sem",
    "falta",
    "preciso comprar",
    "nao encontrei",
  ].some((term) => normalized.includes(term));

  if (!hasMissingIntent) return null;

  const hintedProduct = findProductHint(message);
  if (hintedProduct) return hintedProduct;

  const directMatch = normalized.match(
    /(?:nao tenho|nao possuo|estou sem|to sem|falta|preciso comprar|nao encontrei)\s+(?:um|uma|o|a|esse|essa|este|esta)?\s*([^.,;!?]+)/,
  );
  const directProduct = cleanProductName(directMatch?.[1]);
  if (directProduct && !["produto", "item", "material", "isso"].includes(directProduct)) {
    return directProduct;
  }

  return findProductHint(fallbackContext) || "produto necessario";
}

function buildOnlineLinks(product) {
  const query = encodeURIComponent(product);
  return [
    `Mercado Livre: https://lista.mercadolivre.com.br/${query}`,
    `Amazon: https://www.amazon.com.br/s?k=${query}`,
    `Shopee: https://shopee.com.br/search?keyword=${query}`,
  ];
}

function buildMapsSearchUrl(place) {
  const query = encodeURIComponent(
    [place?.name, place?.address].filter(Boolean).join(" "),
  );
  return `https://www.google.com/maps/search/?api=1&query=${query}`;
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
  const [purchasePrompt, setPurchasePrompt] = useState(null);
  const [isFindingPlaces, setIsFindingPlaces] = useState(false);

  const addAssistantMessage = (text) => {
    setMessages((m) => [
      ...m,
      {
        id: String(Date.now() + Math.random()),
        from: "assistant",
        text,
      },
    ]);
  };

  const addPlacesMessage = (product, places) => {
    setMessages((m) => [
      ...m,
      {
        id: String(Date.now() + Math.random()),
        from: "assistant",
        type: "places",
        product,
        places,
        text: places.length
          ? `Encontrei ${places.length} lugar(es) para comprar ${product}.`
          : `Nao encontrei lojas proximas para ${product}.`,
      },
    ]);
  };

  const sendMessage = async () => {
    const messageText = input.trim();
    if (!messageText || isSending) return;

    const userMsg = { id: String(Date.now()), from: "user", text: messageText };
    const history = [...messages, userMsg];
    const missingProduct = detectMissingProduct(messageText, `${subtask} ${stepTitle}`);
    setMessages(history);
    setInput("");
    setIsSending(true);
    if (missingProduct) {
      setPurchasePrompt({ product: missingProduct });
    }

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

  const goHome = () => {
    navigation.reset({ index: 0, routes: [{ name: "Dashboard" }] });
  };

  const suggestOnlinePurchase = (product) => {
    setPurchasePrompt(null);
    addAssistantMessage(
      [
        `Sem problema. Voce pode comprar "${product}" online nestes links de busca:`,
        ...buildOnlineLinks(product),
      ].join("\n"),
    );
  };

  const fetchNearbyPlaces = async (product, latitude, longitude) => {
    const response = await fetch(`${API_BASE}/places/nearby`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        product,
        lat: latitude,
        lng: longitude,
        radius_meters: 5000,
        max_results: 5,
      }),
    });
    const data = await readResponseBody(response);
    if (!response.ok) {
      const detail = data.detail || data.error || `HTTP ${response.status}`;
      throw new Error(String(detail));
    }
    return Array.isArray(data.places) ? data.places : [];
  };

  const openNearbyStores = (product) => {
    const geolocation = globalThis.navigator?.geolocation;
    if (!geolocation) {
      suggestOnlinePurchase(product);
      return;
    }

    setIsFindingPlaces(true);
    geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords || {};
        try {
          const places = await fetchNearbyPlaces(product, latitude, longitude);
          setPurchasePrompt(null);
          if (places.length) {
            addPlacesMessage(product, places);
          } else {
            suggestOnlinePurchase(product);
          }
        } catch (error) {
          addAssistantMessage(
            `Nao consegui buscar lojas proximas agora: ${getErrorMessage(error)}`,
          );
          suggestOnlinePurchase(product);
        } finally {
          setIsFindingPlaces(false);
        }
      },
      () => {
        setIsFindingPlaces(false);
        suggestOnlinePurchase(product);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
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
            item.type === "places" && styles.bubblePlaces,
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
          {item.type === "places" && Array.isArray(item.places) && (
            <View style={styles.placesList}>
              {item.places.map((place) => (
                <View key={place.id || place.mapsUrl || place.name} style={styles.placeCard}>
                  <View style={styles.placeHeader}>
                    <Text style={styles.placeName}>{place.name}</Text>
                    {place.rating ? (
                      <Text style={styles.placeRating}>{place.rating} / 5</Text>
                    ) : null}
                  </View>
                  {!!place.address && (
                    <Text style={styles.placeAddress}>{place.address}</Text>
                  )}
                  {!!(place.mapsUrl || place.name || place.address) && (
                    <TouchableOpacity
                      style={styles.placeButton}
                      onPress={() => Linking.openURL(place.mapsUrl || buildMapsSearchUrl(place))}
                    >
                      <Text style={styles.placeButtonText}>Abrir no Maps</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.header, isCompact && styles.headerCompact]}>
        {!isCompact && (
          <TouchableOpacity
            style={styles.headerTextButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButton}>Voltar</Text>
          </TouchableOpacity>
        )}
        <Text
          style={[styles.headerTitle, isCompact && styles.headerTitleCompact]}
          numberOfLines={1}
        >
          IA · {stepTitle}
        </Text>
        {!isCompact && (
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.headerGhostButton} onPress={goHome}>
              <Text style={styles.headerGhostButtonText}>HOME</Text>
            </TouchableOpacity>
          </View>
        )}
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

        {isCompact && (
          <View style={styles.mobileNavBar}>
            <TouchableOpacity
              style={styles.mobileNavButton}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.mobileNavButtonText}>Voltar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.mobileNavButton} onPress={goHome}>
              <Text style={styles.mobileNavButtonText}>HOME</Text>
            </TouchableOpacity>
          </View>
        )}

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
      <Modal
        transparent
        visible={Boolean(purchasePrompt)}
        animationType="fade"
        onRequestClose={() => setPurchasePrompt(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.purchaseCard}>
            <Text style={styles.purchaseTitle}>Localizar produto</Text>
            <Text style={styles.purchaseText}>
              Parece que voce precisa de {purchasePrompt?.product}. Quer usar sua
              localizacao para procurar lojas proximas?
            </Text>
            <View style={styles.purchaseActions}>
              <TouchableOpacity
                style={[
                  styles.purchasePrimary,
                  isFindingPlaces && styles.purchaseButtonDisabled,
                ]}
                onPress={() => openNearbyStores(purchasePrompt?.product)}
                disabled={isFindingPlaces}
              >
                <Text style={styles.purchasePrimaryText}>
                  {isFindingPlaces ? "Buscando..." : "Lojas proximas"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.purchaseSecondary}
                onPress={() => suggestOnlinePurchase(purchasePrompt?.product)}
              >
                <Text style={styles.purchaseSecondaryText}>Comprar online</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={styles.purchaseDismiss}
              onPress={() => setPurchasePrompt(null)}
            >
              <Text style={styles.purchaseDismissText}>Agora nao</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    justifyContent: "center",
  },
  headerTextButton: {
    width: 92,
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
  headerActions: {
    width: 92,
    alignItems: "flex-end",
  },
  headerGhostButton: {
    height: 36,
    paddingHorizontal: UI.spacing.md,
    borderRadius: UI.radius.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surfaceElevated,
    alignItems: "center",
    justifyContent: "center",
  },
  headerGhostButtonText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: "900",
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
  bubblePlaces: {
    width: "100%",
    maxWidth: 620,
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
  placesList: {
    gap: UI.spacing.sm,
    marginTop: UI.spacing.md,
  },
  placeCard: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: UI.radius.md,
    padding: UI.spacing.md,
  },
  placeHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: UI.spacing.sm,
    marginBottom: 6,
  },
  placeName: {
    flex: 1,
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "900",
    lineHeight: 19,
  },
  placeRating: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: "900",
  },
  placeAddress: {
    color: COLORS.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: UI.spacing.sm,
  },
  placeButton: {
    minHeight: 38,
    borderRadius: UI.radius.md,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: UI.spacing.md,
  },
  placeButtonText: {
    color: COLORS.background,
    fontSize: 13,
    fontWeight: "900",
  },
  mobileNavBar: {
    flexDirection: "row",
    gap: UI.spacing.sm,
    paddingHorizontal: UI.spacing.md,
    paddingVertical: UI.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  mobileNavButton: {
    flex: 1,
    minHeight: 40,
    borderRadius: UI.radius.md,
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
  },
  mobileNavButtonText: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: "900",
  },
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(2, 6, 23, 0.72)",
    alignItems: "center",
    justifyContent: "center",
    padding: UI.spacing.lg,
  },
  purchaseCard: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: COLORS.surface,
    borderRadius: UI.radius.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: UI.spacing.xl,
    ...UI.shadow,
  },
  purchaseTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: "900",
    marginBottom: UI.spacing.sm,
  },
  purchaseText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: UI.spacing.lg,
  },
  purchaseActions: {
    flexDirection: "row",
    gap: UI.spacing.sm,
  },
  purchasePrimary: {
    flex: 1,
    minHeight: 46,
    borderRadius: UI.radius.md,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  purchaseButtonDisabled: {
    opacity: 0.6,
  },
  purchasePrimaryText: {
    color: COLORS.background,
    fontSize: 13,
    fontWeight: "900",
  },
  purchaseSecondary: {
    flex: 1,
    minHeight: 46,
    borderRadius: UI.radius.md,
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
  },
  purchaseSecondaryText: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: "900",
  },
  purchaseDismiss: {
    alignSelf: "center",
    paddingHorizontal: UI.spacing.md,
    paddingVertical: UI.spacing.md,
    marginTop: UI.spacing.sm,
  },
  purchaseDismissText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: "800",
  },
});
