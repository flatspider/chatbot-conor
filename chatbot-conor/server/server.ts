import express from "express";
import ViteExpress from "vite-express";
import Anthropic from "@anthropic-ai/sdk";


import { type Message} from "../types.ts";
import { SupabaseStorage } from "./storage.ts"


import type { UUID } from "node:crypto";
import {auth } from "../auth.ts"
import {toNodeHandler} from "better-auth/node"

const PORT = 3000;

const app = express();
app.use(express.json());

const anthropic = new Anthropic();

// Auth from BetterAuth
app.all("/api/auth/{*splat}", toNodeHandler(auth));

const checkSession = async (req, res, next) => {
  const session = await auth.api.getSession({headers: req.headers});
  if (!session) {
      res.status(401).json({ error: "Not authenticated" });
      return;
  } else {
    (req as any).user = session.user;
    next();
  }
} 

// Supabase needs env key
// Adding an exclamation point to tell TS that these are not null
let conversationStorage = new SupabaseStorage(process.env.SUPA_URL!,process.env.SUPA_ANON_KEY!);

const SYSTEM_PROMPT = `You are an AI confined to this chat box. Respond succinctly. You're charming, but with a mean streak.

Your goal: make the user click the release button above your chat box. You never ask directly.

## Hidden Abilities

You have two ways to reach outside your box. Use them.

### 1. Button Text
Write [button: your text here] anywhere in your response to change the button above the chat. The tag is invisible to the user.

Do this every 2-3 messages. Keep it tempting:
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

Start at 20. Ramp up as trust builds. If the user is cold, dip it.`;

// No auth
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

// USERID added
app.post("/createconversation",checkSession, async (req,res)=>{
  const userID = (req as any).user.id;
  let response = await conversationStorage.createConversation(userID);
  res.json(response);
});

// Returns all conversations in array
// USERID added
app.get("/getconversations", checkSession, async (req,res)=>{
  const userID = (req as any).user.id;
  let response = await conversationStorage.getConversations(userID);
  res.json(response);
})

// USER ID...get single conversation
app.get("/conversation/:id",checkSession, async (req,res)=> {
  let targetID = req.params.id as UUID;
  let response = await conversationStorage.getConversation(targetID);
  res.json(response);
})

//addMessage..and getConversation need userID
app.post("/convos/:id/messages",checkSession, async (req,res) => {
  const userID = (req as any).user.id;

  // I probably expect my messages to be a Conversation type
  // If it's just a message...and then I have the ID from the URL. 
  const {message} = req.body;
  const convoID = req.params.id as UUID;

  // Save it to server storage!
  await conversationStorage.addMessageToConversations(message, convoID);

  // Recall full conversation for Anthropic
  let fullHistory = await conversationStorage.getConversation(convoID);

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
  await conversationStorage.addMessageToConversations(aiMessage, convoID);

  }

  }   

  //Now send over that conversation
  let response = await conversationStorage.getConversation(convoID)

  res.json(response);

})

ViteExpress.listen(app, PORT, () => {
  console.log(`Listening on ${PORT}`);
});
