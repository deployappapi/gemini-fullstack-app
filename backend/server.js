import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// 1. Check if the API key is actually loaded when the server starts
if (!process.env.GEMINI_API_KEY) {
  console.error("CRITICAL ERROR: GEMINI_API_KEY is missing from environment variables!");
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

app.get("/", (req, res) => {
  res.json({
    status: "Backend is running",
    apiKeyConfigured: Boolean(process.env.GEMINI_API_KEY),
  });
});

app.post("/api/chat", async (req, res) => {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ 
        error: "Server misconfiguration: GEMINI_API_KEY is missing on the backend." 
      });
    }

    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required." });
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    res.json({ reply: response.text });
  } catch (error) {
    console.error("Gemini API Error:", error);
    // Return Google's exact error message to the frontend
    res.status(500).json({ 
      error: error.message || "Failed to generate response from Gemini." 
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});