// Contain and export the ShadCn sidebar here
import { MessageSquare } from "lucide-react";
import {
  Drawer,
  DrawerTrigger,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from "@/components/ui/drawer";

// Need to pass in props. Functions for startNewConversation, setMessages, conversations array?, activeConversationID ()
export const SideBar = () => {
  return (
    <>
      {/* Conversations Drawer */}
      <Drawer direction="left">
        <DrawerTrigger asChild>
          <button className="mt-4 rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-stone-600 hover:bg-stone-100 transition-colors">
            <MessageSquare className="h-4 w-4" />
          </button>
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Conversations</DrawerTitle>
          </DrawerHeader>
          <div className="flex flex-col gap-1 p-4 overflow-y-auto">
            <button
              onClick={async () => {
                await startNewConversation();
                setMessages([]);
              }}
              className="flex items-center gap-2 rounded-lg border border-dashed border-stone-300 px-3 py-2 text-sm text-stone-500 hover:bg-stone-100 transition-colors"
            >
              <Plus className="h-4 w-4" />
              New conversation
            </button>
            {conversations?.map((convo) => (
              <DrawerClose asChild key={convo.conversationID}>
                <button
                  onClick={() => {
                    setActiveConversationID(convo.conversationID);
                    setMessages(convo.messages);
                  }}
                  className={cn(
                    "rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-stone-100",
                    activeConversationID === convo.conversationID
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
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
};

export default SideBar;
