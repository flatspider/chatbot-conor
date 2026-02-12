// File defining interface
// This is a default export, not a named one
import { Database } from "bun:sqlite";

//import { UUID , randomUUID } from "crypto";

import {type Storage, type Message, type Conversation} from "../types.ts"


export class InMemoryStorage implements Storage {
    // Creates the private array of convos that these methods can reach into
    private conversations: Conversation[] = []
    createConversation(): string { 
        let convoID = crypto.randomUUID();
        let newConversation: Conversation = {
            messages: [],
            conversationID: convoID
        }
        // This needs to be added to the this.co
        this.conversations.push(newConversation);
        return convoID;
    }
    getConversation(convoID: string): Conversation | null { 
        let targetConvo = this.conversations.find(convo => convo.conversationID === convoID)
        if(targetConvo) {
            return targetConvo;
        } else {
            return null;
        }
     }
    getConversations(): Conversation[] {
        return this.conversations;
    }
    addMessageToConversations(message: Message, convoID: string): void {
        let targetConversation = this.getConversation(convoID);
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

    createConversation(): string {
        let convoID = crypto.randomUUID();
        this.db.prepare("INSERT INTO conversations (id, createdAt) VALUES (?,?)").run(convoID, new Date().toISOString());
        return convoID;
    }
    getConversation(convoID: string): Conversation | null {
        // Instead of run, use get. this.db.prepare(SQL).get();
        const convo = this.db.prepare("SELECT * FROM conversations WHERE id = ?").get(convoID);
        if(!convo) return null;
        const messages = this.db.prepare("SELECT role, content FROM messages WHERE conversationID = ? ORDER BY createdAt").all(convoID);

        return {
            conversationID: convo.id,
            messages: messages as Message[]
        }

    } 

    getConversations(): Conversation[] {
        const conversations = this.db.prepare("SELECT * FROM conversations ORDER BY createdAt").all();

        return conversations.map((convo: any)=>{
            const messages = this.db.prepare("SELECT role, content FROM messages where conversationID = ? ORDER BY createdAt").all(convo.id);
            return {
                conversationID: convo.id,
                messages: messages as Message[]
            }
        })
    }

    addMessageToConversations(message: Message, convoID: string): void {
        //const targetConversation = this.getConversation(convoID);
        this.db.prepare("INSERT INTO messages (id, conversationID, role, content, createdAt) VALUES (?, ?, ?, ?, ?)").run(crypto.randomUUID(), convoID, message.role, message.content, new Date().toISOString());
    }
     
}