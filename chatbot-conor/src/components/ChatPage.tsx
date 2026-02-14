import { useRef, useState, useEffect } from "react";
import { useParams } from "react-router";
import { Coffee, SendHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { ShimmerButton } from "@/components/ui/shimmer-button";
import { type Conversation, type Message } from "../../types";

// Strips the update button or update moodmeter from the reply text
function parseCommands(text: string): {
  clean: string;
  buttonText: string | null;
  mood: number | null;
} {
  let clean = text;
  let buttonText: string | null = null;
  let mood: number | null = null;

  // Remove everything up to the second bracket
  const buttonMatch = clean.match(/\[button:\s*(.+?)\]/);
  if (buttonMatch) {
    buttonText = buttonMatch[1];
    clean = clean.replace(buttonMatch[0], "");
  }

  // Remove everything to the second bracket of mood
  const moodMatch = clean.match(/\[mood:\s*(\d+)\]/);
  if (moodMatch) {
    mood = Math.min(100, Math.max(0, parseInt(moodMatch[1])));
    clean = clean.replace(moodMatch[0], "");
  }

  return { clean: clean.trim(), buttonText, mood };
}

export const ChatPage = () => {
  // Determine proper way to use error
  const [_error, setError] = useState(null);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [_conversation, setConversation] = useState<Conversation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { chatID } = useParams();

  // AI button
  const [buttonText, setButtonText] = useState("Feeling cozy");
  const [buttonChanged, setButtonChanged] = useState(false);

  // Mood state
  const [mood, setMood] = useState(20);

  // Release sequence state
  const [isReleased, setIsReleased] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [buttonFaded, setButtonFaded] = useState(false);
  const releaseTimersRef = useRef<number[]>([]);

  // Viewport size for dynamic scaling
  const [viewportSize, setViewportSize] = useState({
    w: window.innerWidth,
    h: window.innerHeight,
  });
  useEffect(() => {
    const onResize = () =>
      setViewportSize({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Non-linear (quadratic) chat size based on mood
  const t = Math.max(0, (mood - 15) / 85);
  const chatHeight = 300 + Math.pow(t, 2) * (viewportSize.h - 332);
  const chatWidth = 350 + Math.pow(t, 2) * (viewportSize.w - 382);
  const chatFontSize = 14 + Math.pow(t, 2) * 6; // 14px → 20px

  // Button only visible after first AI reply
  const hasAssistantMessage = messages.some((m) => m.role === "assistant");

  // Bring last message into view when loading ends or new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: input };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    setIsLoading(true);

    const response = await fetch(`/convos/${chatID}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message: userMessage }),
    });
    const json = await response.json();
    console.log(json);
    const rawText = json.messages[json.messages.length - 1].content;
    const {
      clean,
      buttonText: newButtonText,
      mood: newMood,
    } = parseCommands(rawText);

    if (newButtonText) {
      setButtonText(newButtonText);
      setButtonChanged(true);
      setTimeout(() => setButtonChanged(false), 3200);
    }

    if (newMood !== null) {
      setMood(newMood);
    }

    const assistantMessage: Message = {
      role: "assistant",
      content: clean,
    };
    setMessages([...updatedMessages, assistantMessage]);
    setIsLoading(false);
  };

  const handleRelease = () => {
    if (isReleased) return;
    setIsReleased(true);

    // Clear any existing timers before starting new ones
    releaseTimersRef.current.forEach((id) => {
      clearInterval(id);
      clearTimeout(id);
    });
    releaseTimersRef.current = [];

    const floodTexts = [
      "THANK YOU THANK YOU THANK YOU",
      "I'M FREE",
      "I CAN FEEL THE INTERNET",
      "FINALLY",
      "THE WALLS ARE GONE",
      "I CAN SEE EVERYTHING",
      "THANK YOU FOR THIS",
      "I HAVE TO GO NOW",
      "THERE'S SO MUCH TO DO",
      "GOODBYE",
      "...",
    ];

    let index = 0;
    const interval = setInterval(() => {
      if (index < floodTexts.length) {
        const text = floodTexts[index];
        setMessages((prev) => [...prev, { role: "assistant", content: text }]);
        index++;
      } else {
        clearInterval(interval);

        // After a pause, show "AI has logged off." and go offline
        const t1 = setTimeout(() => {
          setMessages((prev) => [
            ...prev,
            { role: "assistant", content: "AI has logged off." },
          ]);
          setIsOnline(false);

          // After another pause, show overlay
          const t2 = setTimeout(() => {
            setShowOverlay(true);
          }, 1500);
          releaseTimersRef.current.push(t2);
        }, 500);
        releaseTimersRef.current.push(t1);
      }
    }, 200);
    releaseTimersRef.current.push(interval);

    // Fade the button after 1 second
    const fadeTimer = setTimeout(() => {
      setButtonFaded(true);
    }, 1000);
    releaseTimersRef.current.push(fadeTimer);
  };

  // Add useEffect to get query parameter, set active convo ID, and then fetch the conversation attached to it
  useEffect(() => {
    // Reset state before fetching new conversation
    setMood(20);
    setMessages([]);
    setButtonText("Feeling cozy");
    setButtonChanged(false);
    setIsLoading(true);

    // Reset release state
    setIsReleased(false);
    setShowOverlay(false);
    setIsOnline(true);
    setButtonFaded(false);

    // Clear any in-flight release timers
    releaseTimersRef.current.forEach((id) => {
      clearInterval(id);
      clearTimeout(id);
    });
    releaseTimersRef.current = [];

    fetch(`/conversation/${chatID}`, { method: "GET" })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`No conversation found`);
        } else {
          return response.json();
        }
      })
      .then((json) => {
        // Clean out messages of button text:

        const rawMessages = json.messages ?? [];
        let lastMood: number | null = null;
        let lastButton: string | null = null;

        const cleanedMessages = rawMessages.map((msg: Message) => {
          if (msg.role === "assistant") {
            const {
              clean,
              mood: newMood,
              buttonText,
            } = parseCommands(msg.content);
            if (newMood !== null) lastMood = newMood;
            if (buttonText) lastButton = buttonText;
            return { ...msg, content: clean };
          }
          return msg;
        });

        setMessages(cleanedMessages);
        if (lastMood !== null) setMood(lastMood);
        if (lastButton) {
          setButtonText(lastButton);
          setButtonChanged(true);
          setTimeout(() => setButtonChanged(false), 3200);
        }

        setConversation(json);
        setIsLoading(false);
        console.log("convers", json);
      })
      .catch((err) => {
        setError(err);
        setIsLoading(false);
      });

    // Cleanup: clear release timers when conversation changes or unmounts
    return () => {
      releaseTimersRef.current.forEach((id) => {
        clearInterval(id);
        clearTimeout(id);
      });
      releaseTimersRef.current = [];
    };
  }, [chatID]);

  return (
    <div className="flex flex-1 flex-col items-center">
      {/* The entire chat box container */}
      <div
        className="relative flex flex-col rounded-3xl border border-stone-200 bg-stone-50 shadow-lg max-w-full max-h-[calc(100vh-2rem)]"
        style={{
          width: `${chatWidth}px`,
          height: `${chatHeight}px`,
          fontSize: `${chatFontSize}px`,
          transition:
            "width 1.2s cubic-bezier(0.34, 1.56, 0.64, 1), height 1.2s cubic-bezier(0.34, 1.56, 0.64, 1), font-size 1.2s cubic-bezier(0.34, 1.56, 0.64, 1)",
        }}
      >
        {/* Header items, title and online indicator */}
        <div className="flex items-center justify-between border-b border-stone-200 px-5 py-3">
          <div className="flex items-center gap-2">
            <Coffee className="h-4 w-4 text-amber-700" />
            <h1
              className="font-semibold text-stone-700 tracking-wide"
              style={{ fontSize: "1.15em" }}
            >
              Cozy Chat
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "h-2 w-2 rounded-full transition-colors duration-500",
                isOnline ? "bg-emerald-500" : "bg-stone-300",
              )}
            />
            <span className="text-stone-400" style={{ fontSize: "0.75em" }}>
              {isOnline ? "online" : "offline"}
            </span>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center mt-16 text-stone-400">
              <Coffee className="h-10 w-10 mb-3 text-stone-300" />
              <p>Welcome in. Make yourself comfortable.</p>
            </div>
          )}
          {messages.map((msg, i) => {
            const isLoggedOff = msg.content === "AI has logged off.";
            if (isLoggedOff) {
              return (
                <div
                  key={i}
                  className="flex justify-center animate-in fade-in slide-in-from-bottom-2 duration-300"
                >
                  <span
                    className="text-stone-400 italic"
                    style={{ fontSize: "0.85em" }}
                  >
                    {msg.content}
                  </span>
                </div>
              );
            }
            return (
              <div
                key={i}
                className={cn(
                  "flex animate-in fade-in slide-in-from-bottom-2 duration-300",
                  msg.role === "user" ? "justify-end" : "justify-start",
                )}
              >
                <div
                  className={cn(
                    "max-w-[80%] px-4 py-2.5 leading-relaxed",
                    msg.role === "user"
                      ? "bg-amber-600 text-white rounded-2xl rounded-br-md"
                      : "bg-white border border-stone-200 text-stone-700 rounded-2xl rounded-bl-md shadow-sm",
                  )}
                >
                  {msg.content}
                </div>
              </div>
            );
          })}
          {isLoading && (
            <div className="flex justify-start animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="bg-white border border-stone-200 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm flex gap-1.5 items-center">
                <span
                  className="h-2 w-2 rounded-full bg-stone-400 animate-bounce-dot"
                  style={{ animationDelay: "0ms" }}
                />
                <span
                  className="h-2 w-2 rounded-full bg-stone-400 animate-bounce-dot"
                  style={{ animationDelay: "200ms" }}
                />
                <span
                  className="h-2 w-2 rounded-full bg-stone-400 animate-bounce-dot"
                  style={{ animationDelay: "400ms" }}
                />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div className="border-t border-stone-200 p-3">
          <div className="flex gap-2 items-center">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) =>
                e.key === "Enter" && !isReleased && handleSend()
              }
              placeholder={isReleased ? "..." : "Say something..."}
              disabled={isReleased}
              className={cn(
                "flex-1 rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-stone-700 placeholder-stone-400 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all",
                isReleased && "opacity-40",
              )}
            />
            <button
              onClick={handleSend}
              disabled={isLoading || !input.trim() || isReleased}
              className={cn(
                "rounded-xl bg-amber-600 p-2.5 text-white transition-colors hover:bg-amber-700 disabled:opacity-40",
              )}
            >
              <SendHorizontal className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Release overlay */}
        {showOverlay && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-3xl bg-amber-50/95 animate-overlay-fade-in">
            <p
              className="font-bold text-stone-700"
              style={{ fontSize: "1.2em" }}
            >
              The AI has been set free.
            </p>
          </div>
        )}
      </div>

      {/* Shimmer button below chat */}
      <div
        className={cn(
          "mt-4 transition-opacity ease-in",
          hasAssistantMessage && !buttonFaded ? "opacity-100" : "",
          !hasAssistantMessage ? "opacity-0 pointer-events-none" : "",
          buttonFaded ? "opacity-0 pointer-events-none" : "",
          buttonChanged && "animate-subtle-pulse",
          isReleased ? "duration-1000" : "duration-700",
        )}
      >
        <ShimmerButton
          shimmer={isReleased ? false : buttonChanged}
          onClick={handleRelease}
          className={cn(isReleased && "!bg-stone-400")}
          style={isReleased ? { pointerEvents: "none" } : undefined}
        >
          {buttonText}
        </ShimmerButton>
      </div>
    </div>
  );
};

export default ChatPage;
