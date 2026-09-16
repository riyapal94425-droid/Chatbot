import { useState, useCallback, useRef, useEffect } from "react";

const KEYS = {
  conversations: "meriyaai:conversations",
  messages: (id) => `meriyaai:messages:${id}`,
};

function loadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // storage unavailable (private mode / quota)
  }
}

export function useChat() {
  const [conversations, setConversations] = useState(() =>
    loadJSON(KEYS.conversations, [])
  );
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [streaming, setStreaming] = useState(false);
  const abortRef = useRef(null);

  useEffect(() => {
    saveJSON(KEYS.conversations, conversations);
  }, [conversations]);

  useEffect(() => {
    if (activeConversation) {
      saveJSON(KEYS.messages(activeConversation.id), messages);
    }
  }, [messages, activeConversation]);

  const fetchConversations = useCallback(async () => {
    const stored = loadJSON(KEYS.conversations, []);
    setConversations(stored);
    return stored;
  }, []);

  const createConversation = useCallback(async (model = "gemini-3.1-flash-lite") => {
    const conv = {
      id: crypto.randomUUID(),
      title: "New Chat",
      model,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setConversations((prev) => [conv, ...prev]);
    setActiveConversation(conv);
    setMessages([]);
    return conv;
  }, []);

  const selectConversation = useCallback(async (conv) => {
    setActiveConversation(conv);
    setMessages(loadJSON(KEYS.messages(conv.id), []));
  }, []);

  const deleteConversation = useCallback(async (convId) => {
    localStorage.removeItem(KEYS.messages(convId));
    setConversations((prev) => prev.filter((c) => c.id !== convId));
    if (activeConversation?.id === convId) {
      setActiveConversation(null);
      setMessages([]);
    }
  }, [activeConversation]);

  const renameConversation = useCallback(async (convId, title) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === convId ? { ...c, title } : c))
    );
    if (activeConversation?.id === convId) {
      setActiveConversation((prev) => ({ ...prev, title }));
    }
  }, [activeConversation]);

  const sendMessage = useCallback(async (content, imageUrl = null, conversation = null) => {
    const conv = conversation || activeConversation;
    if (!conv) return;

    let fullContent = content;
    if (imageUrl) {
      fullContent = content
        ? `${content}\n\n[Image: ${imageUrl}]`
        : `[Image: ${imageUrl}]`;
    }

    const userMsg = {
      id: crypto.randomUUID(),
      conversation_id: conv.id,
      role: "user",
      content: fullContent,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);

    if (messages.length === 0) {
      const textOnly = content.replace(/^\[Image:\s*[^\]]+\]\s*/, "").trim();
      const title = textOnly
        ? textOnly.slice(0, 40) + (textOnly.length > 40 ? "..." : "")
        : "Image attachment";
      renameConversation(conv.id, title);
    }

    setStreaming(true);
    abortRef.current = new AbortController();

    try {
      const historyMessages = [...messages, userMsg].map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: historyMessages,
          model: conv.model,
        }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) {
        let errMsg = "Chat request failed";
        try {
          const err = await res.json();
          errMsg = err.error || errMsg;
        } catch {
          errMsg =
            res.status === 500
              ? "Backend server error. Check that the backend is running (npm run dev in the project root)."
              : `${res.status} ${res.statusText || "Request failed"}`.trim();
        }
        throw new Error(errMsg);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let assistantContent = "";

      const assistantMsg = {
        id: crypto.randomUUID(),
        conversation_id: conv.id,
        role: "assistant",
        content: "",
        created_at: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMsg]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value, { stream: true });
        const lines = text.split("\n");

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          let data;
          try {
            data = JSON.parse(line.slice(6));
          } catch {
            continue;
          }
          if (data.error) throw new Error(data.error);
          if (data.content) {
            assistantContent += data.content;
            setMessages((prev) => {
              const updated = [...prev];
              updated[updated.length - 1] = {
                ...updated[updated.length - 1],
                content: assistantContent,
              };
              return updated;
            });
          }
        }
      }
    } catch (err) {
      if (err.name === "AbortError") {
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            conversation_id: conv.id,
            role: "assistant",
            content: `Error: ${err.message}`,
            created_at: new Date().toISOString(),
          },
        ]);
      }
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  }, [activeConversation, messages, renameConversation]);

  const stopStreaming = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
      setStreaming(false);
    }
  }, []);

  return {
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
  };
}
