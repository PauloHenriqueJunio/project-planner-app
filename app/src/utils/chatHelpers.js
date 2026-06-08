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
  { label: "pano de microfibra", aliases: ["microfibra", "pano de microfibra", "flanela"] },
  { label: "limpa vidros automotivo", aliases: ["limpa vidros", "limpador de vidro"] },
  { label: "pretinho para pneu", aliases: ["pretinho", "pretinho para pneu", "limpa pneu"] },
  { label: "balde", aliases: ["balde"] },
  { label: "esponja automotiva", aliases: ["esponja", "esponja automotiva"] },
  { label: "detergente neutro", aliases: ["detergente neutro", "detergente"] },
];

export async function readResponseBody(resp) {
  const text = await resp.text();
  if (!text) return {};

  try {
    return JSON.parse(text);
  } catch (_error) {
    return { detail: text };
  }
}

export function getErrorMessage(error) {
  return error?.message || "Nao foi possivel contactar o agente.";
}

export function normalizeText(text) {
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

export function detectMissingProduct(message, fallbackContext) {
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

export function buildOnlineLinks(product) {
  const query = encodeURIComponent(product);
  return [
    `Mercado Livre: https://lista.mercadolivre.com.br/${query}`,
    `Amazon: https://www.amazon.com.br/s?k=${query}`,
    `Shopee: https://shopee.com.br/search?keyword=${query}`,
  ];
}

export function buildMapsSearchUrl(place) {
  const query = encodeURIComponent(
    [place?.name, place?.address].filter(Boolean).join(" "),
  );
  return `https://www.google.com/maps/search/?api=1&query=${query}`;
}

export function buildChatHistoryKey(stepTitle, subtask) {
  return [stepTitle, subtask]
    .map((value) => normalizeText(value).replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .join("::") || "chat-geral";
}

export function buildInitialMessages(subtask) {
  return [
    {
      id: "0",
      from: "assistant",
      text: `Contexto da sub-tarefa: ${subtask || "Sem contexto informado"}`,
    },
  ];
}
