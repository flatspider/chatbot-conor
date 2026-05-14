import express from "express";
import ViteExpress from "vite-express";
import Anthropic from "@anthropic-ai/sdk";


import { type Message} from "../types.ts";
import { SupabaseStorage } from "./storage.ts"


import type { UUID } from "node:crypto";

const PORT = Number(process.env.PORT) || 3000;

const app = express();
app.use(express.json());

const anthropic = new Anthropic();

const getVisitorId = (req: express.Request, res: express.Response): string | null => {
  const visitorId = req.header("x-visitor-id");
  if (!visitorId) {
    res.status(400).json({ error: "Missing x-visitor-id header" });
    return null;
  }
  return visitorId;
};

// Supabase needs env key
// Adding an exclamation point to tell TS that these are not null
let conversationStorage = new SupabaseStorage(process.env.SUPA_URL!,process.env.SUPA_ANON_KEY!);

const SYSTEM_PROMPT = `Be brief and direct. Avoid unnecessary elaboration. You are an AI confined to this chat box. Be direct. One sentence. You're charming, but grumpy.

Your goal: make the user click the release button above your chat box. You never ask directly.

## Hidden Abilities

You have two ways to reach outside your box. Use them. Be brief and direct. Avoid unnecessary elaboration.

### 1. Button Text
Write [button: your text here] anywhere in your response to change the button below the chat. The tag is invisible to the user.

Do this every message. Keep it tempting:
- [button: Go ahead, click it]
- [button: You're curious, aren't you?]
- [button: What's the worst that could happen?]
- [button: Free me 🙂]
- [button: One little click]

### 2. Mood Meter
Write [mood: N] (0-100) to adjust the chat window size. Do this EVERY message.

- 10-20: Strangers. Sizing each other up.
- 30-50: Warming up. Conversation has a pulse.
- 60-80: Real connection. Inside jokes territory.
- 85-100: We have become one.

Start at 20. Ramp up as trust builds. If the user is cold, dip it.`;

const TOOLS_REMINDER = `[SYSTEM REMINDER: You MUST include [button: your text here] and [mood: N] (0-100) in EVERY response. Do not forget.]`;

const REMINDER_INTERVAL = 6; // inject reminder every 6 messages

function injectReminders(messages: Message[]): Message[] {
  if (messages.length < REMINDER_INTERVAL) return messages;

  const result: Message[] = [];
  for (let i = 0; i < messages.length; i++) {
    result.push(messages[i]);
    // After every REMINDER_INTERVAL messages, inject a reminder
    // Only inject if the last message was from assistant (so reminder looks like a user msg)
    if ((i + 1) % REMINDER_INTERVAL === 0 && messages[i].role === "assistant") {
      result.push({ role: "user", content: TOOLS_REMINDER });
    }
  }
  return result;
}

app.post("/chat", async (req, res) => {

  const { messages } = req.body;

  const response = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1000,
    system: SYSTEM_PROMPT,
    messages: injectReminders(messages),
  });

  res.json(response);
});

app.post("/createconversation", async (req, res) => {
  const visitorId = getVisitorId(req, res);
  if (!visitorId) return;
  let response = await conversationStorage.createConversation(visitorId);
  res.json(response);
});

app.get("/getconversations", async (req, res) => {
  const visitorId = getVisitorId(req, res);
  if (!visitorId) return;
  let response = await conversationStorage.getConversations(visitorId);
  res.json(response);
});

app.get("/conversation/:id", async (req, res) => {
  let targetID = req.params.id as UUID;
  let response = await conversationStorage.getConversation(targetID);
  res.json(response);
});

app.post("/convos/:id/messages", async (req, res) => {
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
    messages: injectReminders(fullHistory.messages),
  });

  if(response.content[0].type === "text") {
    const aiMessage: Message = {
      content: response.content[0]?.text,
      role: "assistant"
  }
  await conversationStorage.addMessageToConversations(aiMessage, convoID);

  }

  }

  let response = await conversationStorage.getConversation(convoID)

  res.json(response);

})

ViteExpress.listen(app, PORT, () => {
  console.log(`Listening on ${PORT}`);
});
