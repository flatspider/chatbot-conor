import express from "express";
import ViteExpress from "vite-express";
import dotenv from "dotenv";

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

ViteExpress.listen(app, PORT, () => {
  console.log(`Listening on ${PORT}`);
});
