import { useState } from "react";
import "./App.css";

type Message = {
  role: "user" | "assistant";
  content: string;
};

function App() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);

  const handleSend = async () => {
    // Hit the /chat endpoint with full message history
    // Also feels like the compounded chat should live on the server
    // And lets put in a time management system
    // Also want the tokenizer lab
    if (!input.trim()) return;

    const userMessage: Message = { role: "user", content: input };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");

    const response = await fetch("/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ messages: updatedMessages }),
    });
    const json = await response.json();
    const assistantMessage: Message = {
      role: "assistant",
      content: json.content[0].text,
    };
    setMessages([...updatedMessages, assistantMessage]);
  };

  return (
    <div>
      <h1>ChatBot</h1>
      <div>
        {messages.map((msg, i) => (
          <div key={i}>
            <strong>{msg.role === "user" ? "You" : "Claude"}:</strong>{" "}
            {msg.content}
          </div>
        ))}
      </div>
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleSend()}
        placeholder="Type a message..."
      />
      <button onClick={handleSend}>Send</button>
    </div>
  );
}

export default App;
