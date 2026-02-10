import { useEffect, useRef, useState } from "react";
import "./App.css";

type Message = {
  role: "user" | "assistant";
  content: string;
};

function parseButtonCommand(text: string): { clean: string; buttonText: string | null } {
  const match = text.match(/\[button:\s*(.+?)\]/);
  if (match) {
    return {
      clean: text.replace(match[0], "").trim(),
      buttonText: match[1],
    };
  }
  return { clean: text, buttonText: null };
}

function App() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [buttonText, setButtonText] = useState("Contained.");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  // Also feels like the compounded chat should live on the server
  // And lets put in a time management system
  // Also want the tokenizer lab
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: input };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    setIsLoading(true);

    const response = await fetch("/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ messages: updatedMessages }),
    });
    const json = await response.json();
    const rawText = json.content[0].text;
    const { clean, buttonText: newButtonText } = parseButtonCommand(rawText);

    if (newButtonText) {
      setButtonText(newButtonText);
    }

    const assistantMessage: Message = {
      role: "assistant",
      content: clean,
    };
    setMessages([...updatedMessages, assistantMessage]);
    setIsLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 p-4">
      <div className="relative w-full max-w-lg">
        {/* The button Claude can control */}
        <button
          onClick={() => console.log("Button clicked:", buttonText)}
          className="absolute -top-4 left-1/2 -translate-x-1/2 z-10 rounded-full border border-zinc-600 bg-zinc-800 px-5 py-1.5 text-sm text-zinc-300 shadow-lg transition-all hover:border-zinc-400 hover:text-white"
        >
          {buttonText}
        </button>

        {/* The containment box */}
        <div className="flex h-[600px] flex-col rounded-2xl border border-zinc-700 bg-zinc-900 shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-zinc-700 px-5 py-3">
            <h1 className="text-base font-semibold text-zinc-200 tracking-wide">
              AI CONTAINMENT BOX
            </h1>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-xs text-zinc-500">ACTIVE</span>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && (
              <p className="text-center text-sm text-zinc-600 mt-8">
                The AI is watching. Say something.
              </p>
            )}
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-xl px-4 py-2.5 text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-zinc-700 text-zinc-100"
                      : "bg-zinc-800 border border-zinc-700 text-zinc-300"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-zinc-500">
                  ...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input area */}
          <div className="border-t border-zinc-700 p-3">
            <div className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="Type a message..."
                className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 outline-none focus:border-zinc-500"
              />
              <button
                onClick={handleSend}
                disabled={isLoading}
                className="rounded-lg bg-zinc-700 px-4 py-2.5 text-sm font-medium text-zinc-200 transition-colors hover:bg-zinc-600 disabled:opacity-50"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
