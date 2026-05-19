const express = require("express");

const generateEtapasWithAI = require("../services/aiEtapas");

const router = express.Router();

function buildFallbackEtapas(titulo) {
  return [
    {
      titulo: `Planejar ${titulo}`,
      subetapas: [
        `Definir o objetivo de ${titulo}`,
        `Listar recursos para ${titulo}`,
      ],
    },
    {
      titulo: `Estudar fundamentos de ${titulo}`,
      subetapas: [
        `Pesquisar conceitos essenciais de ${titulo}`,
        `Organizar material de apoio`,
      ],
    },
    {
      titulo: `Executar ${titulo}`,
      subetapas: [
        `Aplicar o que foi estudado em ${titulo}`,
        `Revisar próximos passos`,
      ],
    },
  ];
}

router.post("/", async (request, response) => {
  const { titulo, categoria } = request.body || {};
  console.log("[scrape] Recebido /scrape -> body:", request.body);
  const providedCategory =
    typeof categoria === "string" ? categoria.trim() : "";

  if (!titulo || !providedCategory) {
    return response.status(400).json({
      erro: "Campos obrigatórios ausentes. Envie titulo e categoria.",
    });
  }

  try {
    console.log("[scrape] gerando etapas via IA...");

    // Wrap the AI call with a hard timeout so we never hang indefinitely
    const withTimeout = (promise, ms, onTimeout) =>
      Promise.race([
        promise,
        new Promise((resolve) => setTimeout(() => resolve(onTimeout()), ms)),
      ]);

    const callTimeout = Number(process.env.SCRAPER_AI_TIMEOUT || 60000);

    const etapas = await withTimeout(
      generateEtapasWithAI(titulo, providedCategory),
      callTimeout,
      () => {
        console.warn("[scrape] AI generation timed out -> using fallback");
        return buildFallbackEtapas(titulo);
      },
    );

    const safeEtapas =
      Array.isArray(etapas) && etapas.length > 0
        ? etapas
        : buildFallbackEtapas(titulo);

    console.log("[scrape] retornando etapas (count):", safeEtapas.length);
    return response.json({ etapas: safeEtapas });
  } catch (error) {
    console.error(
      "[scrape] erro ao gerar etapas:",
      error && error.message ? error.message : error,
    );
    return response.json({ etapas: buildFallbackEtapas(titulo) });
  }
});

module.exports = router;
