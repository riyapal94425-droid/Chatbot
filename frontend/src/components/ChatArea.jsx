import { useEffect, useRef } from "react";
import { Sparkles, Plus } from "lucide-react";
import MessageBubble from "./MessageBubble";
import ChatInput from "./ChatInput";
import WelcomeScreen from "./WelcomeScreen";

export default function ChatArea({
  messages,
  streaming,
  activeConversation,
  onSend,
  onStop,
  onQuickPrompt,
  onNewChat,
}) {
  const containerRef = useRef(null);

  useEffect(() => {
    const el = containerRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages, streaming, activeConversation?.id]);

  return (
    <div className="flex-1 flex flex-col h-full min-w-0 aurora-bg">
      {/* Header */}
      <header
        className="header-glass flex items-center justify-between px-4 sm:px-5 py-3 shrink-0 relative z-20"
        style={{ borderBottom: "1px solid var(--color-border)" }}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
            style={{
              background: "linear-gradient(135deg, #7c3aed, #db2777)",
              boxShadow: "0 6px 18px var(--color-glow)",
            }}
          >
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span
            className="font-display font-bold text-base truncate"
            style={{ color: "var(--color-text-primary)" }}
          >
            meriyaai
          </span>
        </div>

        {onNewChat && (
          <button
            onClick={onNewChat}
            aria-label="New Chat"
            title="New Chat"
            className="icon-btn shrink-0"
          >
            <Plus className="w-5 h-5" />
          </button>
        )}
      </header>

      {!activeConversation ? (
        <WelcomeScreen onQuickPrompt={onQuickPrompt} />
      ) : (
        <>
          <div
            ref={containerRef}
            className="flex-1 overflow-y-auto scrollbar-thin relative z-10"
          >
            <div className="max-w-3xl mx-auto px-4 py-4">
              {messages.map((m) => (
                <MessageBubble key={m.id} message={m} streaming={streaming} />
              ))}
            </div>
          </div>
          <ChatInput onSend={onSend} streaming={streaming} onStop={onStop} />
        </>
      )}
    </div>
  );
}
