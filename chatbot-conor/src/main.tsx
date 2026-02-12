import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router";
import "./index.css";
import App from "./App.tsx";
import { ChatPage } from "./components/ChatPage.tsx";
import { LoginPage } from "./components/LoginPage.tsx";
import { NewChatPage } from "./components/NewChatPage.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route element={<App />}>
          <Route path="/" element={<LoginPage />} />
          <Route path="/new" element={<NewChatPage />} />
          <Route path="/chat/:chatID" element={<ChatPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </StrictMode>,
);
