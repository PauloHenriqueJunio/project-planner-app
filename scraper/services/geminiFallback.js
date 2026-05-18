const { GoogleGenerativeAI } = require("@google/generative-ai");
const { generateText, shouldUseOllama } = require("./ollamaClient");

function stripCodeFences(text) {
  return String(text || "")
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();
}

function extractJsonBlock(text) {
  const match = String(text || "").match(/\{[\s\S]*\}/);
  return match ? match[0] : text;
}

function normalizeEtapas(etapas) {
  if (!Array.isArray(etapas)) {
    return [];
  }

  return etapas
    .map((etapa, index) => {
      const titulo = String(etapa?.titulo || etapa?.title || "").trim();
      const subetapas = Array.isArray(etapa?.subetapas)
        ? etapa.subetapas
        : Array.isArray(etapa?.steps)
          ? etapa.steps
          : [];

      if (!titulo) {
        return null;
      }

      return {
        titulo,
        subetapas: subetapas
          .map((item) => String(item || "").trim())
          .filter(Boolean)
          .slice(0, 2),
        id: `${Date.now()}-${index}`,
      };
    })
    .filter(Boolean)
    .slice(0, 5)
    .map(({ id, ...rest }) => rest);
}

function fallbackEtapas(titulo) {
  return [
    {
      titulo: `Planejar ${titulo}`,
      subetapas: [
        `Definir o objetivo de ${titulo}`,
        `Listar recursos para ${titulo}`,
      ],
    },
    {
      titulo: `Estruturar ${titulo}`,
      subetapas: [
        `Organizar etapas principais de ${titulo}`,
        `Separar prioridades e prazos`,
      ],
    },
    {
      titulo: `Executar ${titulo}`,
      subetapas: [
        `Colocar a primeira versão de ${titulo} em prática`,
        `Revisar e ajustar os próximos passos`,
      ],
    },
  ];
}

async function generateEtapasWithGemini(titulo) {
  const apiKey = process.env.GEMINI_API_KEY;
  const prompt = `Gere exatamente um JSON valido com esta estrutura:\n{\n  "etapas": [\n    {\n      "titulo": "...",\n      "subetapas": ["...", "..."]\n    }\n  ]\n}\n\nRegras:\n- Gere de 3 a 5 etapas.\n- Cada etapa deve ter 2 subetapas.\n- Responda somente com JSON, sem markdown, sem explicacoes.\n- O projeto e: "${titulo}".`;

  if (shouldUseOllama()) {
    try {
      const rawText = await generateText(prompt);
      const cleaned = stripCodeFences(extractJsonBlock(rawText));
      const parsed = JSON.parse(cleaned);
      const etapas = normalizeEtapas(parsed?.etapas || parsed);
      return etapas.length > 0 ? etapas : fallbackEtapas(titulo);
    } catch (_error) {
      return fallbackEtapas(titulo);
    }
  }

  if (!apiKey) {
    return fallbackEtapas(titulo);
  }

  const modelName = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: modelName });

  const result = await model.generateContent(prompt);
  const rawText = stripCodeFences(extractJsonBlock(result.response.text()));

  try {
    const parsed = JSON.parse(rawText);
    const etapas = normalizeEtapas(parsed?.etapas || parsed);
    return etapas.length > 0 ? etapas : fallbackEtapas(titulo);
  } catch (_error) {
    return fallbackEtapas(titulo);
  }
}

module.exports = generateEtapasWithGemini;
