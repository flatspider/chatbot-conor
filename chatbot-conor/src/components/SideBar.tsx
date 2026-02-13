// Contain and export the ShadCn sidebar here
import { type Conversation } from "../../types";
import { MessageSquare, Plus, LogOutIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate, useParams } from "react-router";
import { authClient } from "@/lib/auth-client";
import {
  Drawer,
  DrawerTrigger,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from "@/components/ui/drawer";

// Need to pass in props. Functions for startNewConversation, setMessages, conversations array?, activeConversationID ()
export const SideBar = (props: { conversations: Conversation[] | null }) => {
  const navigate = useNavigate();
  const { chatID } = useParams();

  const handleLogout = async () => {
    // Send password and email to
    // Returns a promise object
    const response = await authClient.signOut();
    if (response.error) {
      alert("Logout Failed");
    } else {
      navigate("/");
    }
  };

  return (
    <>
      {/* Conversations Drawer */}
      <Drawer direction="left">
        <DrawerTrigger asChild>
          <button className="flex items-center gap-2 rounded-xl bg-amber-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-amber-700 [writing-mode:vertical-lr]">
            <MessageSquare className="h-4 w-4" />
            conversations
          </button>
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Conversations</DrawerTitle>
          </DrawerHeader>
          <div className="flex flex-col gap-1 p-4 overflow-y-auto">
            <DrawerClose asChild>
              <button
                onClick={async () => {
                  navigate("/new");
                }}
                className="flex items-center gap-2 rounded-lg border border-dashed border-stone-300 px-3 py-2 text-sm text-stone-500 hover:bg-stone-100 transition-colors cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                New conversation
              </button>
            </DrawerClose>
            {props.conversations?.map((convo) => (
              <DrawerClose asChild key={convo.conversationID}>
                <button
                  onClick={() => {
                    navigate(`/chat/${convo.conversationID}`);
                  }}
                  className={cn(
                    "rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-stone-100",
                    chatID === convo.conversationID
                      ? "bg-amber-100 text-amber-800"
                      : "text-stone-600",
                  )}
                >
                  {convo.messages.length > 0
                    ? convo.messages[0].content.slice(0, 40) + "..."
                    : "Empty conversation"}
                </button>
              </DrawerClose>
            ))}
            <DrawerClose asChild>
              <button
                onClick={handleLogout}
                className="w-full rounded-lg px-3 py-2 text-sm text-stone-600 hover:bg-red-100 hover:text-red-700 transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-center gap-2">
                  LOG OUT <LogOutIcon className="h-4 w-4" />
                </div>
              </button>
            </DrawerClose>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
};

export default SideBar;
