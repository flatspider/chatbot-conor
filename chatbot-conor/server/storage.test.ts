import {expect, test} from 'vitest';
import {InMemoryStorage, type Message} from './storage';

// Test if create conversation adds to the array

let testData = new InMemoryStorage;

test('create a conversation', ()=>{
    testData.createConversation();
    expect(testData.getConversations().length).toBeGreaterThanOrEqual(1);

    testData.createConversation();
    let convoArray = testData.getConversations();

    expect(convoArray[0].conversationID !== convoArray[1].conversationID);
});

test('add a message', ()=> {

    let convoArray = testData.getConversations();
    let testConvoID = convoArray[0].conversationID;

    // Need a message and convo ID.
    // Have to specify that user is not just an arbitrary string. 
    // You have to lock it in for TypeScript. Either role: "user" as const,
    // Or setting the message as a const. 
    const testMessage: Message = {
        content: "Hello my first message",
        role: "user",
    }
    testData.addMessageToConversations(testMessage, testConvoID);

    // What am I looking for here? Expects

    let testConvo = testData.getConversation(testConvoID);

    expect(testConvo?.messages.length).toBeGreaterThanOrEqual(1);
})

test('check null response', () => {
    expect(testData.getConversation(crypto.randomUUID())).toBe(null);
})
