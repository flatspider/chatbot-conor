import { useState } from "react";
import "./App.css";

function App() {
  const [message, setMessage] = useState<string>("");
  const [conversation, setConversation] = useState<string>("");

  const handleClick = async () => {
    // Hit the /hello endpoint with message
    // Also feels like the compounded chat should live on the server
    // And lets put in a time management system
    // Also want the tokenizer lab
    console.log(message);
    const response = await fetch("/chat", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message }),
    });
    const json = await response.json();
    setConversation(json.content[0].text);
  };
  return (
    <>
      <div>
        <h1>ChatBot</h1>
        <input
          value={message}
          onChange={(e) => {
            setMessage(e.target.value);
          }}
        ></input>
        <button onClick={handleClick} className="send-button">
          Send!
        </button>
      </div>
      <textarea value={conversation}></textarea>
    </>
  );
}

export default App;
