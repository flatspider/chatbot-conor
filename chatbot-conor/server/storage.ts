// File defining interface
// This is a default export, not a named one
import Database from "better-sqlite3";


//import { UUID , randomUUID } from "crypto";

//Define types

export type Message = {
  content: string,
  role: 'user' | 'assistant',
}

export type Conversation = {
    messages: Message[];
    conversationID: string;
}

export interface Storage {
    createConversation: () => string;
    getConversation: (conversationID: string) => Conversation | null;
    getConversations: () => Conversation[];
    addMessageToConversations: (message: Message, conversationID: string) => void;
}

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
    constructor() {
        this.db = new Database("chat-history.db");
        this.db.pragma("journal_mode = WAL");
        this.db.prepare("CREATE TABLE IF NOT EXISTS conversations (id TEXT PRIMARY KEY, createdAt TEXT)").run();
        this.db.prepare(`CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        conversationId TEXT,
        role TEXT,
        content TEXT,
        createdAt TEXT,
        FOREIGN KEY (conversationId) REFERENCES conversations(id))`).run()
    }

    createConversation(): string {
        let convoID = crypto.randomUUID();
        this.db.prepare("INSERT INTO conversations (id, createdAt) VALUES (?,?)").run(convoID, new Date().toISOString());
        return convoID;
    }
    getConversation(convoID: string): Conversation {
        // Instead of run, use get. this.db.prepare(SQL).get();
        const convo = this.db.prepare("SELECT * FROM conversations WHERE id = ?").get(convoID);
        const messages = this.db.prepare("SELECT * FROM messages WHERE conversationId = ? ORDER BY createdAt").all(convoID);

        return {
            conversationID: convo.id,
            messages: messages as Message[]
        }

    } 

    getConversations(): Conversation[] {
        const conversations = this.db.prepare("SELECT * FROM conversations ORDER BY createdAt").all();

        return conversations.map((convo: any)=>{
            const messages = this.db.prepare("SELECT * FROM messages where conversationID = ? ORDER BY createdAt").all(convo.id);
            return {
                conversationID: convo.id,
                messages: messages as Message[];
            }
        })
    }
     
}