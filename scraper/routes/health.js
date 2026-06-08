const express = require("express");
const axios = require("axios");

const router = express.Router();

router.get("/", async (_req, res) => {
  const baseUrl = String(process.env.OLLAMA_URL || "http://127.0.0.1:11434")
    .trim()
    .replace(/\/$/, "");
  const model = String(process.env.OLLAMA_MODEL || "llama3").trim();

  try {
    const response = await axios.get(`${baseUrl}/api/tags`, { timeout: 5000 });
    const models = Array.isArray(response.data?.models)
      ? response.data.models.map((item) => item?.name).filter(Boolean)
      : [];
    const hasModel = model ? models.includes(model) : models.length > 0;

    return res.json({
      ok: hasModel,
      model: model || null,
      availableModels: models,
    });
  } catch (error) {
    return res.json({
      ok: false,
      reason: "ollama_unreachable",
      error: String(error.message || error),
    });
  }
});

module.exports = router;
