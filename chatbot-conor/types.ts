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
    createConversation: () => string;
    getConversation: (conversationID: string) => Conversation | null;
    getConversations: () => Conversation[];
    addMessageToConversations: (message: Message, conversationID: string) => void;
}