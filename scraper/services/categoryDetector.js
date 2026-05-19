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

async function detectCategory(titulo) {
  const fallback = "Aprendizado de Habilidade";

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

  // Heurística baseada em palavras-chave no título
  const t = titulo.toLowerCase();
  if (/(tcc|pesquisa|monografia|artigo)/i.test(t))
    return "TCC / Pesquisa Acadêmica";
  if (/(site|website|web|desenvolv|app|aplicativo|sistema)/i.test(t))
    return "Desenvolvimento de Software";
  if (/(empresa|empreendedor|negócio|startup|vender|comércio)/i.test(t))
    return "Empreendedorismo";

  return fallback;
}

module.exports = { detectCategory };
