import express from "express";
import ViteExpress from "vite-express";
import dotenv from "dotenv";
import Anthropic from "@anthropic-ai/sdk";

const PORT = 3000;

const app = express();
app.use(express.json());

const anthropic = new Anthropic();

app.post("/chat", async (req, res) => {
  const { messages } = req.body;

  const response = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1000,
    messages,
  });

  res.json(response);
});

ViteExpress.listen(app, PORT, () => {
  console.log(`Listening on ${PORT}`);
});
