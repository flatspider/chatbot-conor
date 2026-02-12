// File defining interface
// This is a default export, not a named one
import { Database } from "bun:sqlite";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

//import { UUID , randomUUID } from "crypto";

import {type Storage, type Message, type Conversation} from "../types.ts"


export class InMemoryStorage implements Storage {
    // Creates the private array of convos that these methods can reach into
    private conversations: Conversation[] = []
    async createConversation(): Promise<string> {
        let convoID = crypto.randomUUID();
        let newConversation: Conversation = {
            messages: [],
            conversationID: convoID
        }
        // This needs to be added to the this.co
        this.conversations.push(newConversation);
        return convoID;
    }
    async getConversation(convoID: string): Promise<Conversation | null> {
        let targetConvo = this.conversations.find(convo => convo.conversationID === convoID)
        if(targetConvo) {
            return targetConvo;
        } else {
            return null;
        }
     }
    async getConversations(): Promise<Conversation[]> {
        return this.conversations;
    }
    async addMessageToConversations(message: Message, convoID: string): Promise<void> {
        let targetConversation = await this.getConversation(convoID);
        // Looking at conversation. Add to conversation.messages;
        targetConversation?.messages.push(message);
    }
}

export class SqliteStorage implements Storage {
    private db: Database.Database;

    // The constructor builds out the database
    // This.db.prepare("INJECT SQL COMMANDS").run() to run sql on the database
    constructor(dbPath: string = "chat-history.db") {
        this.db = new Database(dbPath);
        // Bun uses a slightly different way to turn on WAL
        this.db.exec("PRAGMA journal_mode = WAL");
        //this.db.pragma("journal_mode = WAL");
        this.db.prepare("CREATE TABLE IF NOT EXISTS conversations (id TEXT PRIMARY KEY, createdAt TEXT)").run();
        this.db.prepare(`CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        conversationID TEXT,
        role TEXT,
        content TEXT,
        createdAt TEXT,
        FOREIGN KEY (conversationID) REFERENCES conversations(id))`).run()
    }

    async createConversation(): Promise<string> {
        let convoID = crypto.randomUUID();
        this.db.prepare("INSERT INTO conversations (id, createdAt) VALUES (?,?)").run(convoID, new Date().toISOString());
        return convoID;
    }
    async getConversation(convoID: string): Promise<Conversation | null> {
        // Instead of run, use get. this.db.prepare(SQL).get();
        const convo = this.db.prepare("SELECT * FROM conversations WHERE id = ?").get(convoID);
        if(!convo) return null;
        const messages = this.db.prepare("SELECT role, content FROM messages WHERE conversationID = ? ORDER BY createdAt").all(convoID);

        return {
            conversationID: convo.id,
            messages: messages as Message[]
        }

    }

    async getConversations(): Promise<Conversation[]> {
        const conversations = this.db.prepare("SELECT * FROM conversations ORDER BY createdAt").all();

        return conversations.map((convo: any)=>{
            const messages = this.db.prepare("SELECT role, content FROM messages where conversationID = ? ORDER BY createdAt").all(convo.id);
            return {
                conversationID: convo.id,
                messages: messages as Message[]
            }
        })
    }

    async addMessageToConversations(message: Message, convoID: string): Promise<void> {
        //const targetConversation = this.getConversation(convoID);
        this.db.prepare("INSERT INTO messages (id, conversationID, role, content, createdAt) VALUES (?, ?, ?, ?, ?)").run(crypto.randomUUID(), convoID, message.role, message.content, new Date().toISOString());
    }

}

export class SupabaseStorage implements Storage {
    private supabase: SupabaseClient;

    constructor(supabaseUrl: string, supabaseAnonKey: string) {
        this.supabase = createClient(supabaseUrl, supabaseAnonKey);
    }

    async createConversation(): Promise<string> {
        const convoID = crypto.randomUUID();
        const { error } = await this.supabase
            .from("conversations")
            .insert({ id: convoID });

        if (error) throw new Error(`Failed to create conversation: ${error.message}`);
        return convoID;
    }

    async getConversation(convoID: string): Promise<Conversation | null> {
        const { data: convo, error: convoError } = await this.supabase
            .from("conversations")
            .select("*")
            .eq("id", convoID)
            .single();

        if (convoError || !convo) return null;

        const { data: messages, error: msgError } = await this.supabase
            .from("messages")
            .select("role, content")
            .eq("conversation_id", convoID)
            .order("created_at", { ascending: true });

        if (msgError) throw new Error(`Failed to get messages: ${msgError.message}`);

        return {
            conversationID: convo.id,
            messages: (messages ?? []) as Message[]
        };
    }

    async getConversations(): Promise<Conversation[]> {
        const { data: conversations, error: convoError } = await this.supabase
            .from("conversations")
            .select("*")
            .order("created_at", { ascending: true });

        if (convoError) throw new Error(`Failed to get conversations: ${convoError.message}`);

        const results: Conversation[] = [];
        for (const convo of conversations ?? []) {
            const { data: messages } = await this.supabase
                .from("messages")
                .select("role, content")
                .eq("conversation_id", convo.id)
                .order("created_at", { ascending: true });

            results.push({
                conversationID: convo.id,
                messages: (messages ?? []) as Message[]
            });
        }

        return results;
    }

    async addMessageToConversations(message: Message, convoID: string): Promise<void> {
        const { error } = await this.supabase
            .from("messages")
            .insert({
                id: crypto.randomUUID(),
                conversation_id: convoID,
                role: message.role,
                content: message.content,
            });

        if (error) throw new Error(`Failed to add message: ${error.message}`);
    }
}