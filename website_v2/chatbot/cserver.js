import express from "express";
import cors from "cors";
import OpenAI from "openai";
import dotenv from "dotenv";

// Load environment variables FIRST
dotenv.config();

console.log("Loaded OPENAI_API_KEY:", process.env.OPENAI_API_KEY ? "✅ Found" : "❌ Missing");

const PORT = process.env.PORT || 3001; // ✅ use port 3001

const app = express();
app.use(cors());
app.use(express.json());
//const { OpenAI } = require("openai");
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: "https://api.poe.com/v1", // Poe endpoint
});

app.post("/chat", async (req, res) => {
  const userMessage = req.body.message;
  try {
    const chat = await client.chat.completions.create({
      model: "Bot_chart1234",
      messages: [
        { role: "system", content: "You are a helpful chatbot." },
        { role: "user", content: userMessage },
      ],
    });
    res.json({ reply: chat.choices[0].message.content });
  } catch (error) {
    console.error("Chatbot error:", error);
    res.status(500).json({ error: "Chatbot failed." });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Chatbot server running at http://localhost:${PORT}`);
});

console.log(chat.choices[0].message.content);

