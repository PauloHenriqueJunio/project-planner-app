const express = require("express");

const parseEtapas = require("../parser");
const genericScraper = require("../scrapers/genericScraper");

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

  if (!titulo || !categoria) {
    return response.status(400).json({
      erro: "Campos obrigatórios ausentes. Envie titulo e categoria.",
    });
  }

  try {
    const secoes = await genericScraper({ titulo, categoria });
    const etapas = parseEtapas(secoes);

    return response.json({ etapas });
  } catch (error) {
    const fallbackEtapas = buildFallbackEtapas(titulo);

    return response.status(500).json({
      erro: "Falha ao fazer scraping",
      detalhes: error.message,
      etapas: fallbackEtapas,
    });
  }
});

module.exports = router;
