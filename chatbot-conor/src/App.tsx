import { useEffect, useState } from "react";

import { Outlet } from "react-router";
import { SideBar } from "./components/SideBar";

import { type Conversation } from "../types";
import "./App.css";

function App() {
  // Remains in App
  const [conversations, setConversations] = useState<Conversation[] | null>(
    null,
  );
  const [_error, setError] = useState(null);

  // On render, fetch all conversations from GET /getconversations endpoint
  useEffect(() => {
    // Establish a conversation on page load
    // startNewConversation();

    fetch("/getconversations")
      .then((response) => {
        if (!response.ok) {
          throw new Error(`No conversations`);
        } else {
          return response.json();
        }
      })
      .then((json) => {
        setConversations(json);
        console.log("convers", json);
      })
      .catch((err) => {
        setError(err);
      });
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-amber-50 p-4">
      <div className="relative w-full max-w-lg">
        {/* Bottom controls: mood meter + release button */}
        <div className="flex items-start justify-between mt-4 px-2">
          {/* Conversations Drawer */}
          <SideBar conversations={conversations} />
          <Outlet />
        </div>
      </div>
    </div>
  );
}

export default App;
