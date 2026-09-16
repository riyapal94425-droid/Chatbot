import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Copy, Check, User, Sparkles } from "lucide-react";
import { useState } from "react";

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="p-1 rounded hover:bg-black/5 transition-colors"
      title="Copy"
      style={{ color: "var(--color-text-secondary)" }}
    >
      {copied ? (
        <Check className="w-3.5 h-3.5 text-green-500" />
      ) : (
        <Copy className="w-3.5 h-3.5" />
      )}
    </button>
  );
}

function BotAvatar() {
  return (
    <div
      className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-1"
      style={{
        background: "linear-gradient(135deg, #7c3aed, #db2777)",
        boxShadow: "0 6px 16px var(--color-glow)",
      }}
    >
      <Sparkles className="w-4 h-4 text-white" />
    </div>
  );
}

function UserAvatar() {
  return (
    <div
      className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-1"
      style={{ background: "var(--color-bg-tertiary)" }}
    >
      <User className="w-4 h-4" style={{ color: "var(--color-text-secondary)" }} />
    </div>
  );
}

function TypingBubble() {
  return (
    <div className="flex gap-3 justify-start mb-3 msg-in">
      <BotAvatar />
      <div
        className="rounded-2xl rounded-bl-md px-4 py-3"
        style={{
          background: "var(--color-bot-msg)",
          border: "1px solid var(--color-border)",
        }}
      >
        <div className="flex items-center gap-1.5">
          <span className="typing-dot" />
          <span className="typing-dot" />
          <span className="typing-dot" />
        </div>
      </div>
    </div>
  );
}

function extractImage(content) {
  const text = String(content || "");
  const match = text.match(/\[Image:\s*([^\]]+)\]\s*$/);
  if (!match) return null;
  return {
    url: match[1],
    text: text.slice(0, match.index).trimEnd(),
  };
}

export default function MessageBubble({ message, streaming }) {
  const isUser = message.role === "user";
  const image = extractImage(message.content);

  if (!isUser && !message.content) {
    if (streaming) return <TypingBubble />;
    return null;
  }

  return (
    <div className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"} mb-4 msg-in`}>
      {!isUser && <BotAvatar />}

      <div
        className={`max-w-[78%] px-4 py-3.5 ${
          isUser
            ? "rounded-[18px] rounded-br-md"
            : "rounded-[18px] rounded-bl-md msg-card"
        }`}
        style={
          isUser
            ? {
                background: "linear-gradient(135deg, #6d28d9, #7c3aed)",
                color: "#ffffff",
                boxShadow: "0 4px 14px var(--color-glow)",
              }
            : {
                background: "var(--color-bot-msg)",
                color: "var(--color-bot-msg-text)",
                border: "1px solid var(--color-border)",
                boxShadow: "0 4px 18px rgba(0,0,0,0.06)",
              }
        }
      >
        {isUser ? (
          <>
            {image && (
              <img
                src={image.url}
                alt="Attachment"
                className="max-w-full max-h-72 rounded-xl mb-2 border"
                style={{ borderColor: "rgba(255,255,255,0.35)" }}
              />
            )}
            <p className="whitespace-pre-wrap break-words text-[16px] leading-relaxed">
              {image ? image.text : message.content}
            </p>
          </>
        ) : (
          <div className="markdown-content">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                code({ node, inline, className, children, ...props }) {
                  const match = /language-(\w+)/.exec(className || "");
                  const codeString = String(children).replace(/\n$/, "");

                  if (!inline && match) {
                    return (
                      <div className="relative group">
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                          <CopyButton text={codeString} />
                        </div>
                        <SyntaxHighlighter
                          style={oneDark}
                          language={match[1]}
                          PreTag="div"
                          customStyle={{
                            margin: 0,
                            borderRadius: "10px",
                            fontSize: "0.85rem",
                          }}
                          {...props}
                        >
                          {codeString}
                        </SyntaxHighlighter>
                      </div>
                    );
                  }

                  return (
                    <code className={className} {...props}>
                      {children}
                    </code>
                  );
                },
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        )}

        <div
          className={`flex items-center gap-2 mt-2 text-xs ${
            isUser ? "justify-end" : ""
          }`}
          style={{ color: isUser ? "rgba(255,255,255,0.75)" : "var(--color-text-secondary)" }}
        >
          <span>
            {new Date(message.created_at).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
          {!isUser && <CopyButton text={message.content} />}
        </div>
      </div>

      {isUser && <UserAvatar />}
    </div>
  );
}
