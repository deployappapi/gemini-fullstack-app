import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

if (!process.env.GEMINI_API_KEY) {
  console.error("CRITICAL ERROR: GEMINI_API_KEY is missing from environment variables!");
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function generateWithFallback(prompt) {
  // Active, high-availability models supported on the free tier
  const models = [
    "gemini-4-hydrogen",
    "gemini-3.5-flash-lite",
    "gemini-3.6-flash",
    "gemini-3.8-flash",
  ];

  let lastError;

  for (const model of models) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: prompt,
        });
        return { reply: response.text, modelUsed: model };
      } catch (err) {
        lastError = err;
        console.warn(`Model ${model} failed (attempt ${attempt}): ${err.message}`);

        // Wait 1.5s before retrying the same model once, then move to the next model
        if (attempt === 1) {
          await sleep(1500);
        }
      }
    }
  }

  throw lastError;
}

app.get("/", (req, res) => {
  res.json({
    status: "Backend is running",
    version: "v3",
    apiKeyConfigured: Boolean(process.env.GEMINI_API_KEY),
  });
});

app.post("/api/chat", async (req, res) => {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        error: "Server misconfiguration: GEMINI_API_KEY is missing on the backend.",
      });
    }

    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required." });
    }

    const { reply, modelUsed } = await generateWithFallback(prompt);
    res.json({ reply, modelUsed });
  } catch (error) {
    console.error("All Gemini models failed:", error);
    res.status(error.status || 503).json({
      error: error.message || "All Gemini models are currently busy. Please try again.",
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
