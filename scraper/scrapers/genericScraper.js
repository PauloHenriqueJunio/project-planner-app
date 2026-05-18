const axios = require("axios");
const { chromium } = require("playwright");

const WIKIPEDIA_REST_BASE =
  "https://en.wikipedia.org/api/rest_v1/page/sections";

function normalizeCategory(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function extractUnique(values) {
  const resultados = [];

  values.forEach((item) => {
    const texto = typeof item === "string" ? item.trim() : "";
    if (texto && !resultados.includes(texto)) {
      resultados.push(texto);
    }
  });

  return resultados;
}

async function scrapeWikipediaSections(titulo) {
  // Estrategia 1: Wikipedia REST API (JSON limpo, sem browser).
  const encodedTitle = encodeURIComponent(String(titulo).trim());
  const url = `${WIKIPEDIA_REST_BASE}/${encodedTitle}`;

  const response = await axios.get(url, { timeout: 15000 });
  const items = Array.isArray(response.data?.items) ? response.data.items : [];
  const titles = items.map((item) => item?.title).filter(Boolean);

  return extractUnique(titles);
}

async function scrapeSebraeHeadings() {
  // Estrategia 2: Playwright + Chromium (HTML dinamico).
  let browser;

  try {
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    await page.goto("https://sebrae.com.br", {
      waitUntil: "networkidle",
      timeout: 30000,
    });

    const titles = await page.$$eval("h2, h3", (elements) =>
      elements
        .map((element) => element.textContent?.replace(/\s+/g, " ").trim())
        .filter(Boolean),
    );

    return extractUnique(titles);
  } catch (error) {
    return [];
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

async function genericScraper({ titulo, categoria }) {
  const normalizedCategory = normalizeCategory(categoria);

  const wikipediaCategories = [
    "aprendizado de habilidade",
    "tcc / pesquisa acadêmica",
    "desenvolvimento de software",
  ];

  if (wikipediaCategories.includes(normalizedCategory)) {
    return scrapeWikipediaSections(titulo);
  }

  if (normalizedCategory === "empreendedorismo") {
    return scrapeSebraeHeadings();
  }

  return [];
}

module.exports = genericScraper;
