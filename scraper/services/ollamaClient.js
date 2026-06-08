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
  const timeout = Number(process.env.OLLAMA_TIMEOUT || 60000);
  const debug =
    String(process.env.OLLAMA_DEBUG_LOG_REQUESTS || "false").toLowerCase() ===
    "true";

  return {
    baseUrl,
    model,
    timeout,
    debug,
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

  if (process.env.OLLAMA_DEBUG_LOG_REQUESTS === "true") {
    console.log("[ollama] POST", url);
    console.log("[ollama] payload:", JSON.stringify(payload).slice(0, 2000));
    console.log("[ollama] timeout:", timeout);
  }

  let response;
  try {
    response = await axios.post(url, payload, { timeout });
  } catch (err) {
    console.error("[ollama] request error:", err.code || err.message);
    if (err.response) {
      console.error("[ollama] response status:", err.response.status);
      try {
        console.error(
          "[ollama] response data:",
          JSON.stringify(err.response.data).slice(0, 2000),
        );
      } catch (e) {}
    }
    throw err;
  }

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
