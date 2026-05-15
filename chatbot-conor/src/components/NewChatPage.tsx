import { useEffect } from "react";
import { useNavigate } from "react-router";
import { apiFetch } from "@/lib/visitor";

export const NewChatPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    apiFetch("/createconversation", { method: "POST" })
      .then((res) => res.json())
      .then((conversationId) => {
        navigate(`/chat/${conversationId}`, { replace: true });
      });
  }, []);

  return <div className="text-stone-400 text-sm">Starting new conversation...</div>;
};

export default NewChatPage;
