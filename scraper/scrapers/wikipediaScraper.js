const axios = require("axios");

const WIKIPEDIA_SOURCES = [
  {
    apiBase: "https://pt.wikipedia.org/w/api.php",
    restBase: "https://pt.wikipedia.org/api/rest_v1/page/sections",
  },
  {
    apiBase: "https://en.wikipedia.org/w/api.php",
    restBase: "https://en.wikipedia.org/api/rest_v1/page/sections",
  },
];

function normalizeSearchText(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractUnique(values) {
  const results = [];

  values.forEach((item) => {
    const text = typeof item === "string" ? item.trim() : "";
    if (text && !results.includes(text)) {
      results.push(text);
    }
  });

  return results;
}

function buildSearchQueries(title) {
  const normalized = normalizeSearchText(title);
  const stopWords = new Set([
    "criar",
    "crie",
    "criacao",
    "criação",
    "fazer",
    "faça",
    "montar",
    "desenvolver",
    "desenvolvimento",
    "construir",
    "meu",
    "minha",
    "um",
    "uma",
    "o",
    "a",
    "de",
    "do",
    "da",
    "dos",
    "das",
    "para",
    "pra",
    "em",
    "no",
    "na",
    "nos",
    "nas",
  ]);

  const tokens = normalized
    .split(" ")
    .filter(Boolean)
    .filter((token) => !stopWords.has(token));

  const queries = [];
  if (normalized) queries.push(normalized);
  if (tokens.length > 0) queries.push(tokens.join(" "));

  return [...new Set(queries.filter(Boolean))].slice(0, 2);
}

function scoreCandidate(originalTitle, candidateTitle) {
  const originalTokens = new Set(
    normalizeSearchText(originalTitle).split(" ").filter(Boolean),
  );
  const candidateTokens = normalizeSearchText(candidateTitle)
    .split(" ")
    .filter(Boolean);

  let score = 0;
  for (const token of candidateTokens) {
    if (originalTokens.has(token)) score += 2;
  }

  const originalJoined = normalizeSearchText(originalTitle).replace(/\s+/g, "");
  const candidateJoined = normalizeSearchText(candidateTitle).replace(
    /\s+/g,
    "",
  );
  if (
    candidateJoined.includes(originalJoined) ||
    originalJoined.includes(candidateJoined)
  ) {
    score += 3;
  }

  if (candidateTokens.length <= 1 && originalTokens.size > 1) {
    score -= 2;
  }

  return score;
}

async function scrapeWikipediaSections(titulo) {
  const originalTitle = String(titulo || "").trim();
  const headers = {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    Accept: "application/json",
    "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
  };

  console.log(`[wikipediaScraper] search: ${originalTitle}`);

  let bestResult = null;
  const queries = buildSearchQueries(originalTitle);

  for (const source of WIKIPEDIA_SOURCES) {
    for (const query of queries) {
      const searchUrl = `${source.apiBase}?action=query&list=search&srsearch=${encodeURIComponent(
        query,
      )}&srlimit=5&format=json`;

      try {
        console.log(`[wikipediaScraper] search request: ${searchUrl}`);
        const searchRes = await axios.get(searchUrl, {
          timeout: 10000,
          headers,
        });

        const results = Array.isArray(searchRes.data?.query?.search)
          ? searchRes.data.query.search
          : [];

        for (const result of results) {
          const title = result?.title;
          if (!title) continue;

          const score = scoreCandidate(originalTitle, title);
          console.log(`[wikipediaScraper] candidate "${title}" score=${score}`);

          if (score >= 3 && (!bestResult || score > bestResult.score)) {
            bestResult = {
              title,
              score,
              restBase: source.restBase,
              source: source.apiBase,
            };
          }
        }
      } catch (error) {
        console.warn(
          `[wikipediaScraper] search failed on ${source.apiBase}:`,
          error.message || error,
        );
      }
    }
  }

  if (!bestResult) {
    console.log("[wikipediaScraper] no strong candidate found");
    return [];
  }

  const sectionsUrl = `${bestResult.restBase}/${encodeURIComponent(
    bestResult.title,
  )}`;

  try {
    console.log(`[wikipediaScraper] sections request: ${sectionsUrl}`);
    const response = await axios.get(sectionsUrl, {
      timeout: 15000,
      headers,
    });

    const items = Array.isArray(response.data?.items)
      ? response.data.items
      : [];
    const titles = items.map((item) => item?.title).filter(Boolean);

    console.log(
      `[wikipediaScraper] returned ${titles.length} sections for ${bestResult.title}`,
    );
    return extractUnique(titles);
  } catch (error) {
    console.error("[wikipediaScraper] scrape erro:", error.message || error);
    return [];
  }
}

module.exports = scrapeWikipediaSections;
