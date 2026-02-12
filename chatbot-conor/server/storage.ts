// File defining interface


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