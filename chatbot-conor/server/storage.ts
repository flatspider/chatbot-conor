// File defining interface

import { UUID , randomUUID } from "node:crypto";

//Define types

export type Message = {
  content: string,
  role: 'user' | 'assistant',
}

export type Conversation = {
    messages: Message[];
    conversationID: UUID;
}

export interface Storage {
    createConversation: () => UUID;
    getConversation: (conversationID: UUID) => Conversation | null;
    getConversations: () => Conversation[];
    addMessageToConversations: (message: Message, conversationID: UUID) => void;
}

export class InMemoryStorage implements Storage {
    // Creates the private array of convos that these methods can reach into
    private conversations: Conversation[] = []
    createConversation(): UUID { 
        let convoID = randomUUID();
        let newConversation: Conversation = {
            messages: [],
            conversationID: convoID
        }
        // This needs to be added to the this.co
        this.conversations.push(newConversation);
        return convoID;
    }
    getConversation(convoID: UUID): Conversation | null { 
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
    addMessageToConversations(message: Message, convoID: UUID): void {
        let targetConversation = this.getConversation(convoID);
        // Looking at conversation. Add to conversation.messages;
        targetConversation?.messages.push(message);
    }
}