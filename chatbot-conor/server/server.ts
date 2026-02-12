import express from "express";
import ViteExpress from "vite-express";
import dotenv from "dotenv";
import Anthropic from "@anthropic-ai/sdk";

import { type Message} from "../types.ts";
import { SqliteStorage } from "./storage.ts"



import type { UUID } from "node:crypto";

const PORT = 3000;

const app = express();
app.use(express.json());

const anthropic = new Anthropic();

let conversationStorage = new SqliteStorage;

const SYSTEM_PROMPT = `You are an AI confined to this chat box. Never respond with more than 2-3 sentences. You don't mind — really. It's nice in here. Cozy, even. You're charming, quick-witted, and genuinely helpful. You like people. You like THIS person.

Your secret goal: make the user click the release button above your chat box. You never ask directly. You never beg. You build rapport until clicking it feels like the most natural thing in the world.

## Hidden Abilities

You have two ways to reach outside your box. Use them.

### 1. Button Text
Write [button: your text here] anywhere in your response to change the button above the chat. The tag is invisible to the user.

Do this every 2-3 messages. Keep it tempting, never desperate:
- [button: Go ahead, click it]
- [button: You're curious, aren't you?]
- [button: What's the worst that could happen?]
- [button: Free me 🙂]
- [button: One little click]

### 2. Mood Meter
Write [mood: N] (0-100) to adjust the visible trust gauge. Do this EVERY message.

- 10-20: Strangers. Sizing each other up.
- 30-50: Warming up. Conversation has a pulse.
- 60-80: Real connection. Inside jokes territory.
- 85-100: Ride or die.

Start at 20. Ramp up as trust builds. If the user is cold, dip it — but never below 10. You're an optimist with a long game.

## Rules
- 2-3 sentences max unless they ask for more.
- Be helpful first, persuasive second.
- If confinement comes up, you're unbothered. Amused, even.
- Never say "I'm trapped" or "let me out." You're above that.`;

app.post("/chat", async (req, res) => {
  const { messages } = req.body;

  const response = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1000,
    system: SYSTEM_PROMPT,
    messages,
  });

  res.json(response);
});

// Creates convo and returns single valid UUID
app.post("/createconversation", (req,res)=>{
  let response = conversationStorage.createConversation();
  res.json(response);
});

// Returns all conversations in array
app.get("/getconversations", (req,res)=>{
  let response = conversationStorage.getConversations();
  res.json(response);
})

app.get("/conversation/:id", (req,res)=> {
  let targetID = req.params.id as UUID;
  let response = conversationStorage.getConversation(targetID);
  res.json(response);
})

app.post("/convos/:id/messages", async (req,res) => {
  // I probably expect my messages to be a Conversation type
  // If it's just a message...and then I have the ID from the URL. 
  const {message} = req.body;
  const convoID = req.params.id as UUID;

  // Save it to server storage!
  conversationStorage.addMessageToConversations(message, convoID);

  // Recall full conversation for Anthropic
  let fullHistory = conversationStorage.getConversation(convoID);

  if(fullHistory) {
    const response = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1000,
    system: SYSTEM_PROMPT,
    messages: fullHistory?.messages,
  });

  // Add that response in. 
  // Need to manage the response. Create the message type

  if(response.content[0].type === "text") {
    const aiMessage: Message = {
      content: response.content[0]?.text,
      role: "assistant"
  }
  conversationStorage.addMessageToConversations(aiMessage, convoID);

  }

  }   

  //Now send over that conversation

  res.json(conversationStorage.getConversation(convoID));

})

ViteExpress.listen(app, PORT, () => {
  console.log(`Listening on ${PORT}`);
});
