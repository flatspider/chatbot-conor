//Define types here so both App.tsx and server.ts have access

export type Message = {
  content: string,
  role: 'user' | 'assistant',
}

export type Conversation = {
    messages: Message[];
    conversationID: string;
}

export interface Storage {
    createConversation: () => Promise<string>;
    getConversation: (conversationID: string) => Promise<Conversation | null>;
    getConversations: () => Promise<Conversation[]>;
    addMessageToConversations: (message: Message, conversationID: string) => Promise<void>;
}