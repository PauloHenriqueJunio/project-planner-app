const axios = require("axios");
const cheerio = require("cheerio");

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

function buildQuery(titulo, categoria) {
  const title = String(titulo || "").trim();
  const normalizedCategory = normalizeCategory(categoria);

  if (normalizedCategory === "desenvolvimento de software") {
    return `${title} roadmap desenvolvimento web frontend backend`;
  }

  if (normalizedCategory === "empreendedorismo") {
    return `${title} empreendedorismo plano de negocios`;
  }

  return `${title} guia etapas roadmap`;
}

async function scrapeDuckDuckGo(query) {
  const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;

  console.log(`[genericScraper] DuckDuckGo request: ${url}`);

  const response = await axios.get(url, {
    timeout: 15000,
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
    },
  });

  const $ = cheerio.load(response.data);
  const sections = [];

  $("a.result__a, h2.result__title a").each((_, element) => {
    const title = $(element).text().replace(/\s+/g, " ").trim();
    const snippet = $(element)
      .closest(".result")
      .find(".result__snippet")
      .text()
      .replace(/\s+/g, " ")
      .trim();

    if (title) {
      sections.push(title);
    }

    if (snippet) {
      sections.push(snippet);
    }
  });

  return extractUnique(sections).slice(0, 10);
}

async function genericScraper({ titulo, categoria }) {
  const normalizedCategory = normalizeCategory(categoria);
  const query = buildQuery(titulo, normalizedCategory);

  console.log(
    `[genericScraper] solicitacao para titulo="${titulo}", categoria="${categoria}" -> normalizada="${normalizedCategory}"`,
  );
  console.log(`[genericScraper] DuckDuckGo query: ${query}`);

  try {
    return await scrapeDuckDuckGo(query);
  } catch (error) {
    console.error(
      "[genericScraper] DuckDuckGo scrape erro:",
      error.message || error,
    );
    return [];
  }
}

module.exports = genericScraper;
