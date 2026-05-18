const express = require("express");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const router = express.Router();

router.get("/", async (_req, res) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.json({ ok: false, reason: "missing_api_key" });
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const MODEL_CANDIDATES = [
    "gemini-1.5-flash-latest",
    "gemini-1.5-flash",
    "gemini-pro",
    "gemini-1.5",
  ];

  const results = [];

  for (const m of MODEL_CANDIDATES) {
    try {
      const model = genAI.getGenerativeModel({ model: m });
      // tentativa mínima: gerar uma palavra curta
      await model.generateContent("ping");
      results.push({ model: m, ok: true });
      return res.json({ ok: true, model: m, details: results });
    } catch (err) {
      results.push({ model: m, ok: false, error: String(err.message || err) });
    }
  }

  return res.json({
    ok: false,
    reason: "no_model_available",
    details: results,
  });
});

module.exports = router;
