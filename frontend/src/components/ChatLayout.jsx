import { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import ChatArea from "./ChatArea";
import IntroOverlay from "./IntroOverlay";
import { useChat } from "../hooks/useChat";
import { useTheme } from "../hooks/useTheme";

export default function ChatLayout() {
  const { dark, toggle: toggleTheme } = useTheme();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [introDone, setIntroDone] = useState(false);
  const {
    conversations,
    activeConversation,
    messages,
    streaming,
    fetchConversations,
    createConversation,
    selectConversation,
    deleteConversation,
    renameConversation,
    sendMessage,
    stopStreaming,
  } = useChat();

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  useEffect(() => {
    if (window.matchMedia("(max-width: 768px)").matches) {
      setSidebarCollapsed(true);
    }
  }, []);

  const handleQuickPrompt = async (prompt) => {
    const conv = await createConversation();
    await sendMessage(prompt, null, conv);
  };

  return (
    <>
      {!introDone && <IntroOverlay onDone={() => setIntroDone(true)} />}
      <div
        className="h-screen flex overflow-hidden relative"
        style={{ background: "var(--color-bg-primary)" }}
      >
        <Sidebar
          conversations={conversations}
          activeConversation={activeConversation}
          onSelect={selectConversation}
          onCreate={() => createConversation()}
          onDelete={deleteConversation}
          onRename={renameConversation}
          dark={dark}
          onToggleTheme={toggleTheme}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
        <ChatArea
          messages={messages}
          streaming={streaming}
          activeConversation={activeConversation}
          onSend={sendMessage}
          onStop={stopStreaming}
          onQuickPrompt={handleQuickPrompt}
          onNewChat={() => createConversation()}
        />
      </div>
    </>
  );
}
