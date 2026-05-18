const axios = require("axios");

function shouldUseOllama() {
  return (
    String(process.env.USE_OLLAMA || "")
      .trim()
      .toLowerCase() === "true" ||
    Boolean(process.env.OLLAMA_URL) ||
    Boolean(process.env.OLLAMA_MODEL)
  );
}

function getOllamaConfig() {
  const baseUrl = String(process.env.OLLAMA_URL || "http://localhost:11434")
    .trim()
    .replace(/\/$/, "");
  const model = String(process.env.OLLAMA_MODEL || "llama3").trim();
  const timeout = Number(process.env.OLLAMA_TIMEOUT || 20000);

  return {
    baseUrl,
    model,
    timeout,
  };
}

async function generateText(prompt, options = {}) {
  if (!shouldUseOllama()) {
    return null;
  }

  const { baseUrl, model, timeout } = getOllamaConfig();

  if (!model) {
    return null;
  }

  const url = `${baseUrl}/api/generate`;
  const payload = {
    model,
    prompt,
    stream: false,
    ...options,
  };

  const response = await axios.post(url, payload, { timeout });
  const data = response?.data || {};

  if (typeof data.response === "string") {
    return data.response.trim();
  }

  if (typeof data.message?.content === "string") {
    return data.message.content.trim();
  }

  return null;
}

module.exports = {
  generateText,
  shouldUseOllama,
};
