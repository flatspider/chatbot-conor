import { expect, test, describe } from 'vitest';
import { SqliteStorage } from './storage';
import { type Message } from '../types';

describe('createConversation', () => {
    test('adds a conversation to storage', () => {
        const storage = new SqliteStorage();
        storage.createConversation();
        expect(storage.getConversations()).toHaveLength(1);
    });

    test('returns a UUID', () => {
        const storage = new SqliteStorage();
        const id = storage.createConversation();
        expect(typeof id).toBe('string');
        expect(id).toHaveLength(36); // UUID format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
    });

    test('creates conversations with unique IDs', () => {
        const storage = new SqliteStorage();
        const id1 = storage.createConversation();
        const id2 = storage.createConversation();
        expect(id1).not.toBe(id2);
    });

    test('new conversation starts with empty messages', () => {
        const storage = new SqliteStorage();
        const id = storage.createConversation();
        const convo = storage.getConversation(id);
        expect(convo?.messages).toEqual([]);
    });
});

describe('getConversation', () => {
    test('returns the conversation matching the ID', () => {
        const storage = new SqliteStorage();
        const id = storage.createConversation();
        const convo = storage.getConversation(id);
        expect(convo).not.toBeNull();
        expect(convo?.conversationID).toBe(id);
    });

    test('returns null for a nonexistent ID', () => {
        const storage = new SqliteStorage();
        expect(storage.getConversation(crypto.randomUUID())).toBeNull();
    });
});

describe('getConversations', () => {
    test('returns empty array when no conversations exist', () => {
        const storage = new SqliteStorage();
        expect(storage.getConversations()).toEqual([]);
    });

    test('returns all created conversations', () => {
        const storage = new SqliteStorage();
        storage.createConversation();
        storage.createConversation();
        storage.createConversation();
        expect(storage.getConversations()).toHaveLength(3);
    });
});

describe('addMessageToConversations', () => {
    test('adds a message to the correct conversation', () => {
        const storage = new SqliteStorage();
        const id = storage.createConversation();
        const msg: Message = { content: "hello", role: "user" };

        storage.addMessageToConversations(msg, id);

        const convo = storage.getConversation(id);
        expect(convo?.messages).toHaveLength(1);
        expect(convo?.messages[0].content).toBe("hello");
        expect(convo?.messages[0].role).toBe("user");
    });

    test('adds multiple messages in order', () => {
        const storage = new SqliteStorage();
        const id = storage.createConversation();

        storage.addMessageToConversations({ content: "hi", role: "user" }, id);
        storage.addMessageToConversations({ content: "hello!", role: "assistant" }, id);

        const convo = storage.getConversation(id);
        expect(convo?.messages).toHaveLength(2);
        expect(convo?.messages[0].role).toBe("user");
        expect(convo?.messages[1].role).toBe("assistant");
    });

    test('does not add message to other conversations', () => {
        const storage = new SqliteStorage();
        const id1 = storage.createConversation();
        const id2 = storage.createConversation();

        storage.addMessageToConversations({ content: "hi", role: "user" }, id1);

        expect(storage.getConversation(id1)?.messages).toHaveLength(1);
        expect(storage.getConversation(id2)?.messages).toHaveLength(0);
    });

    test('silently does nothing for a nonexistent conversation ID', () => {
        const storage = new SqliteStorage();
        const fakeID = crypto.randomUUID();
        // Should not throw
        storage.addMessageToConversations({ content: "hi", role: "user" }, fakeID);
        expect(storage.getConversations()).toHaveLength(0);
    });
});
