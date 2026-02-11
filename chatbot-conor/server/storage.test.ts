import {expect, test} from 'vitest';
import {InMemoryStorage} from './storage';

// Test if create conversation adds to the array

let testData = new InMemoryStorage;

test('create a conversation', ()=>{
    testData.createConversation();
    expect(testData.getConversations().length).toBeGreaterThanOrEqual(1);
});

test('add a message', ()=> {

    let convoArray = testData.getConversations();
    let testConvoID = convoArray[0].conversationID;

    // Need a message and convo ID.
    // Have to specify that user is not just an arbitrary string. 
    // You have to lock it in for 
    let testMessage = {
        content: "Hello my first message",
        role: "user" as const,
    }
    testData.addMessageToConversations(testMessage, testConvoID);

    // What am I looking for here? Expects

    let testConvo = testData.getConversation(testConvoID);

    expect(testConvo?.messages.length).toBeGreaterThanOrEqual(1);
})
