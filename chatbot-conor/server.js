import express from "express";
import ViteExpress from "vite-express";
import dotenv from "dotenv";
import Anthropic from "@anthropic-ai/sdk";

const PORT = 3000;

const app = express();
app.use(express.json());

// This backend should be fetching to anthropic and pushing data to frontend

app.get("/message", (req, res) => {
  res.json({
    message: "hello from backend",
    secret: process.env.ANTHROPIC_SECRET_KEY,
  });
});

app.post("/hello", async (req, res) => {
  //Take in the message from the request
  const message = req.body.message;
  //Build out the fetch to anthropics endpoint
  console.log(message);
  let response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "anthropic-version": "2023-06-01",
      "x-api-key": process.env.ANTHROPIC_SECRET_KEY,
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1000,
      messages: [
        {
          role: "user",
          content: message,
        },
      ],
    }),
  });
  let anthropic_response = await response.json();
  res.json(anthropic_response);
});

app.post("/chat", async (req, res) => {
  const message = req.body.message;
  const anthropic = new Anthropic();

  const msg = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1000,
    messages: [
      {
        role: "user",
        content: message,
      },
    ],
  });
  let anthropic_response = await msg;

  res.json(anthropic_response);
});

ViteExpress.listen(app, PORT, () => {
  console.log(`Listening on ${PORT}`);
});
