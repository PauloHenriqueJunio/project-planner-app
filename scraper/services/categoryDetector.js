const { GoogleGenerativeAI } = require("@google/generative-ai");
const { generateText, shouldUseOllama } = require("./ollamaClient");

const VALID_CATEGORIES = [
  "Aprendizado de Habilidade",
  "TCC / Pesquisa Acadêmica",
  "Desenvolvimento de Software",
  "Empreendedorismo",
];

function normalizeCategory(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/["'`.,:;!?]/g, "")
    .replace(/\s+/g, " ");
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getModelCandidates() {
  const explicitModel = String(process.env.GEMINI_MODEL || "").trim();

  if (explicitModel) {
    return [explicitModel];
  }

  return ["gemini-2.5-flash"];
}

function shouldRetry(error) {
  const status = error?.status || error?.response?.status;
  return status === 503;
}

async function detectCategory(titulo) {
  const fallback = "Aprendizado de Habilidade";
  const apiKey = process.env.GEMINI_API_KEY;

  console.log(`[categoryDetector] detectCategory() chamado para: "${titulo}"`);

  const prompt = `Classifique o projeto "${titulo}" em exatamente uma dessas categorias: "Aprendizado de Habilidade", "TCC / Pesquisa Acadêmica", "Desenvolvimento de Software", "Empreendedorismo". Responda apenas o nome da categoria exato, sem pontuação, sem explicação e sem nenhum texto adicional.`;

  if (shouldUseOllama()) {
    try {
      console.log("[categoryDetector] usando Ollama local");
      const text = await generateText(prompt);
      const normalizedText = normalizeCategory(text);

      const matchedCategory = VALID_CATEGORIES.find(
        (category) => normalizeCategory(category) === normalizedText,
      );

      if (matchedCategory) {
        return matchedCategory;
      }
    } catch (error) {
      console.warn(
        "[categoryDetector] Ollama falhou, seguindo para heuristica local:",
        error.message || error,
      );
    }
  }

  if (!apiKey) {
    return fallback;
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);

    const MODEL_CANDIDATES = getModelCandidates();

    let lastError = null;

    for (const modelName of MODEL_CANDIDATES) {
      const model = genAI.getGenerativeModel({ model: modelName });
      console.log(`[categoryDetector] tentando modelo: ${modelName}`);

      const attempts = 3;

      for (let attempt = 1; attempt <= attempts; attempt += 1) {
        try {
          const result = await model.generateContent(prompt);
          const text = result.response.text().trim();
          const normalizedText = normalizeCategory(text);

          const matchedCategory = VALID_CATEGORIES.find(
            (category) => normalizeCategory(category) === normalizedText,
          );

          console.log(
            `[categoryDetector] modelo ${modelName} respondeu: "${text}" -> normalizada: "${normalizedText}" -> match: "${matchedCategory || fallback}"`,
          );

          return matchedCategory || fallback;
        } catch (err) {
          lastError = err;
          console.warn(
            `[categoryDetector] modelo ${modelName} falhou (tentativa ${attempt}/${attempts}): ${err.message || err}`,
          );

          const status = err?.status || err?.response?.status;

          if (status === 429) {
            console.log(
              "[categoryDetector] cota Gemini esgotada, pulando direto para heurística local",
            );
            break;
          }

          if (attempt < attempts && shouldRetry(err)) {
            const delayMs = 500 * attempt;
            console.log(
              `[categoryDetector] aguardando ${delayMs}ms para tentar novamente`,
            );
            await sleep(delayMs);
            continue;
          }

          break;
        }
      }
    }

    // Se todos os modelos falharem, log e usar heurística local simples
    console.error(
      "[categoryDetector] todos os modelos remotos falharam:",
      lastError,
    );
    console.log("[categoryDetector] usando heurística local como fallback");

    // Heurística baseada em palavras-chave no título
    const t = titulo.toLowerCase();
    if (/(tcc|pesquisa|monografia|artigo)/i.test(t))
      return "TCC / Pesquisa Acadêmica";
    if (/(site|website|web|desenvolv|app|aplicativo|sistema)/i.test(t))
      return "Desenvolvimento de Software";
    if (/(empresa|empreendedor|negócio|startup|vender|comércio)/i.test(t))
      return "Empreendedorismo";

    return fallback;
  } catch (_error) {
    console.error("[categoryDetector] erro inesperado:", _error);
    return fallback;
  }
}

module.exports = { detectCategory };
