import { useState, useRef } from "react";
import { Send, Square, Paperclip, X, Mic } from "lucide-react";

export default function ChatInput({ onSend, streaming, onStop, disabled }) {
  const [text, setText] = useState("");
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);
  const fileRef = useRef(null);
  const textareaRef = useRef(null);

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert("File too large. Max 10MB.");
      return;
    }

    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result);
        setImageUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }

    setUploading(true);
    try {
      const base64 = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(",")[1]);
        reader.readAsDataURL(file);
      });

      const res = await fetch("/api/upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fileName: file.name,
          fileType: file.type,
          fileBase64: base64,
        }),
      });

      let data;
      try {
        data = await res.json();
      } catch {
        data = {};
      }
      if (data.file) {
        setImageUrl(data.file.file_url);
      } else {
        console.warn("Upload failed, using local preview:", data.error || "no file returned");
      }
    } catch (err) {
      console.warn("Upload failed, using local preview:", err);
    } finally {
      setUploading(false);
    }
  };

  const removeImage = () => {
    setImagePreview(null);
    setImageUrl(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (streaming || disabled) return;

    const trimmed = text.trim();
    if (!trimmed && !imageUrl) return;

    onSend(trimmed, imageUrl);
    setText("");
    removeImage();
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleInput = (e) => {
    setText(e.target.value);
  };

  return (
    <div className="px-4 pb-3 pt-1 relative z-10">
      <div className="max-w-3xl mx-auto">
        {imagePreview && (
          <div className="mb-2 inline-block relative">
            <img
              src={imagePreview}
              alt="Upload preview"
              className="h-20 rounded-xl border"
              style={{ borderColor: "var(--color-border)" }}
            />
            <button
              onClick={removeImage}
              aria-label="Remove attachment"
              className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="composer">
          <input
            type="file"
            ref={fileRef}
            onChange={handleFileSelect}
            accept="image/*,.pdf,.txt"
            className="hidden"
          />

          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading || streaming}
            aria-label="Attach file"
            title="Attach file"
            className="p-2.5 rounded-xl transition-colors shrink-0 disabled:opacity-50 hover:bg-black/5 dark:hover:bg-white/10"
            style={{ color: "var(--color-text-secondary)" }}
          >
            {uploading ? (
              <span
                className="block w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"
                aria-label="Uploading"
              />
            ) : (
              <Paperclip className="w-5 h-5" />
            )}
          </button>

          <textarea
            ref={textareaRef}
            value={text}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder="Message meriyaai..."
            aria-label="Message meriyaai"
            disabled={disabled}
            rows={1}
            className="flex-1 resize-none overflow-hidden px-2 py-2 outline-none bg-transparent text-[0.95rem] leading-relaxed min-w-0 max-h-40"
            style={{
              color: "var(--color-text-primary)",
            }}
          />

          <button
            type="button"
            aria-label="Voice input (coming soon)"
            title="Voice input (coming soon)"
            aria-disabled="true"
            className="p-2.5 rounded-xl transition-colors shrink-0 hidden sm:flex hover:bg-black/5 dark:hover:bg-white/10"
            style={{ color: "var(--color-text-secondary)" }}
          >
            <Mic className="w-5 h-5" />
          </button>

          {streaming ? (
            <button
              type="button"
              onClick={onStop}
              aria-label="Stop generating"
              title="Stop generating"
              className="send-btn shrink-0 text-white"
              style={{
                background: "linear-gradient(120deg, #ef4444, #dc2626)",
                boxShadow: "0 6px 18px rgba(239,68,68,0.35)",
              }}
            >
              <Square className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={disabled || (!text.trim() && !imageUrl)}
              aria-label="Send message"
              title="Send message"
              className="btn-gradient send-btn shrink-0 text-white shadow-lg"
              style={{ boxShadow: "0 8px 22px var(--color-glow)" }}
            >
              <Send className="w-4 h-4" />
            </button>
          )}
        </form>

        <p className="composer-note mt-2">
          meriyaai can make mistakes. Check important information.
        </p>
      </div>
    </div>
  );
}
