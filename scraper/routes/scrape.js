const express = require("express");

const parseEtapas = require("../parser");
const genericScraper = require("../scrapers/genericScraper");
const wikipediaScraper = require("../scrapers/wikipediaScraper");
const { detectCategory } = require("../services/categoryDetector");

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

function normalizeCategory(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

async function getEtapasFromScraper({ titulo, categoria }) {
  const normalizedCategory = normalizeCategory(categoria);

  switch (normalizedCategory) {
    case "tcc/pesquisa acadêmica":
    case "tcc / pesquisa acadêmica":
    case "tcc":
    case "pesquisa acadêmica":
      return wikipediaScraper(titulo);

    case "desenvolvimento de software":
    default:
      return genericScraper({ titulo, categoria });
  }
}

router.post("/", async (request, response) => {
  const { titulo, categoria } = request.body || {};
  console.log("[scrape] Recebido /scrape -> body:", request.body);
  const providedCategory =
    typeof categoria === "string" ? categoria.trim() : "";

  if (!titulo) {
    return response.status(400).json({
      erro: "Campo obrigatório ausente. Envie titulo.",
    });
  }

  try {
    const categoriaDetectada =
      providedCategory ||
      (await (async () => {
        console.log(
          "[scrape] providedCategory vazio, chamando detectCategory()...",
        );
        const detected = await detectCategory(titulo);
        console.log("[scrape] detectCategory retornou:", detected);
        return detected;
      })());

    let etapas = [];

    try {
      const secoes = await getEtapasFromScraper({
        titulo,
        categoria: categoriaDetectada,
      });

      console.log(
        "[scrape] secoes retornadas:",
        Array.isArray(secoes) ? `${secoes.length} entradas` : typeof secoes,
      );

      etapas = parseEtapas(secoes);
    } catch (scraperError) {
      console.warn(
        "[scrape] scraper falhou:",
        scraperError.message || scraperError,
      );
    }

    if (!Array.isArray(etapas) || etapas.length === 0) {
      console.log(
        "[scrape] scraper vazio, usando fallback local sem Gemini...",
      );
      etapas = buildFallbackEtapas(titulo);
    }

    if (!Array.isArray(etapas) || etapas.length === 0) {
      etapas = buildFallbackEtapas(titulo);
    }

    return response.json({ etapas });
  } catch (error) {
    return response.json({ etapas: buildFallbackEtapas(titulo) });
  }
});

module.exports = router;
