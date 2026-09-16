const express = require("express");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const router = express.Router();

const MODEL_FALLBACKS = {
  "gemini-flash-latest": ["gemini-3.5-flash", "gemini-3.1-flash-lite"],
  "gemini-3.5-flash": ["gemini-flash-latest", "gemini-3.1-flash-lite"],
  "gemini-3.1-flash-lite": ["gemini-3.5-flash", "gemini-flash-latest"],
};

const WORKING_MODELS = ["gemini-3.1-flash-lite", "gemini-3.5-flash", "gemini-flash-latest"];
const HANGING_MODELS = new Set(["gemini-flash-lite-latest", "gemini-3-flash-preview"]);
const MODEL_TIMEOUT_MS = 30000;

router.post("/", async (req, res) => {
  const { messages, model = "gemini-3.1-flash-lite" } = req.body || {};

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "Messages array is required" });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "GEMINI_API_KEY not configured in .env" });
  }

  const genAI = new GoogleGenerativeAI(apiKey);

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");

  const candidates = [...new Set([model, ...WORKING_MODELS, ...(MODEL_FALLBACKS[model] || [])])].filter(
    (m) => !HANGING_MODELS.has(m)
  );

  const contents = (Array.isArray(messages) ? messages : []).map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  let aborted = false;
  res.on("close", () => {
    if (!res.writableEnded) {
      aborted = true;
    }
  });

  for (const candidate of candidates) {
    if (aborted) return;

    try {
      const genModel = genAI.getGenerativeModel({ model: candidate });
      const result = await genModel.generateContentStream(
        { contents },
        { signal: AbortSignal.timeout(MODEL_TIMEOUT_MS) }
      );

      for await (const chunk of result.stream) {
        if (aborted) return;
        const text = chunk.text();
        if (text) {
          res.write(`data: ${JSON.stringify({ content: text })}\n\n`);
        }
      }

      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
      return;
    } catch (err) {
      const message = err.message || "";
      const shouldRetry =
        err.status === 429 ||
        err.status === 404 ||
        err.status === 503 ||
        err.name === "TimeoutError" ||
        /quota|rate limit|not found|429|404|503|RESOURCE_EXHAUSTED|abort|timeout/i.test(message);

      if (!shouldRetry) {
        console.error("Gemini error:", message);
        if (!res.headersSent) {
          return res.status(500).json({ error: message });
        }
        res.write(`data: ${JSON.stringify({ error: message })}\n\n`);
        res.end();
        return;
      }
      console.warn(`Model ${candidate} failed, trying next...`);
    }
  }

  if (!res.writableEnded && !res.destroyed) {
    if (!res.headersSent) {
      res.status(500).json({
        error:
          "All Gemini models failed to respond. You are likely hitting the free-tier rate limit, or your Gemini API key is out of quota. Wait a minute and try again, or check your key/quota at https://aistudio.google.com/apikey.",
      });
    } else {
      res.write(`data: ${JSON.stringify({ error: "All Gemini models failed. Rate limit reached — wait a minute and try again." })}\n\n`);
      res.end();
    }
  }
});

module.exports = router;
