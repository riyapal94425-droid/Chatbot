import { useState } from "react";
import {
  Plus,
  MessageSquare,
  Trash2,
  Pencil,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Settings,
  Sun,
  Moon,
  HelpCircle,
} from "lucide-react";
import ThemeToggle from "./ThemeToggle";

export default function Sidebar({
  conversations,
  activeConversation,
  onSelect,
  onCreate,
  onDelete,
  onRename,
  dark,
  onToggleTheme,
  collapsed,
  onToggleCollapse,
}) {
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState("");

  const startEdit = (conv) => {
    setEditingId(conv.id);
    setEditTitle(conv.title);
  };

  const saveEdit = () => {
    if (editTitle.trim()) {
      onRename(editingId, editTitle.trim());
    }
    setEditingId(null);
  };

  if (collapsed) {
    return (
      <div
        className="h-full w-16 flex flex-col items-center py-4 gap-3 shrink-0"
        style={{
          background: "var(--color-sidebar-bg)",
          borderRight: "1px solid var(--color-border)",
        }}
      >
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center"
          style={{
            background: "linear-gradient(135deg, #7c3aed, #db2777)",
            boxShadow: "0 4px 14px var(--color-glow)",
          }}
          title="meriyaai"
        >
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        <button
          onClick={onToggleCollapse}
          aria-label="Expand sidebar"
          title="Expand sidebar"
          className="icon-btn"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
        <button
          onClick={onCreate}
          aria-label="New Chat"
          title="New Chat"
          className="btn-gradient new-chat-btn w-10 h-10 flex items-center justify-center rounded-xl text-white"
        >
          <Plus className="w-5 h-5" />
        </button>
        <div className="flex-1" />
        <ThemeToggle dark={dark} onToggle={onToggleTheme} />
      </div>
    );
  }

  return (
    <div
      className="app-sidebar h-full flex flex-col w-72 shrink-0"
      style={{
        background: "var(--color-sidebar-bg)",
        borderRight: "1px solid var(--color-border)",
      }}
    >
      {/* Brand header */}
      <div
        className="flex items-center justify-between pl-4 pr-3 pt-4 pb-3"
        style={{ borderBottom: "1px solid var(--color-border)" }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg, #7c3aed, #db2777)",
              boxShadow: "0 4px 16px var(--color-glow)",
            }}
          >
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="font-display font-bold text-gradient text-lg">
            meriyaai
          </span>
        </div>
        <button
          onClick={onToggleCollapse}
          aria-label="Collapse sidebar"
          title="Collapse sidebar"
          className="icon-btn !w-8 !h-8"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>

      {/* New Chat */}
      <div className="px-3 pt-3">
        <button
          onClick={onCreate}
          className="btn-gradient new-chat-btn w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-medium text-white text-sm shadow-lg"
          style={{ boxShadow: "0 8px 22px var(--color-glow)" }}
        >
          <Plus className="w-4 h-4" /> New Chat
        </button>
      </div>

      {/* Conversations */}
      <div className="flex-1 overflow-y-auto px-3 scrollbar-thin">
        <p className="side-label px-2 pt-4 pb-2">Recent</p>
        {conversations.length === 0 && (
          <p
            className="text-sm text-center py-8"
            style={{ color: "var(--color-text-secondary)" }}
          >
            No conversations yet
          </p>
        )}
        <div className="space-y-1">
          {conversations.map((conv) => {
            const active = activeConversation?.id === conv.id;
            return (
              <div
                key={conv.id}
                role="button"
                tabIndex={0}
                aria-current={active ? "true" : undefined}
                className={`side-item group ${
                  active ? "active" : ""
                }`}
                onClick={() => editingId !== conv.id && onSelect(conv)}
                onKeyDown={(e) => {
                  if ((e.key === "Enter" || e.key === " ") && editingId !== conv.id) {
                    e.preventDefault();
                    onSelect(conv);
                  }
                }}
              >
                <MessageSquare className="w-4 h-4 shrink-0 opacity-70" />

                {editingId === conv.id ? (
                  <div className="flex-1 flex items-center gap-1">
                    <input
                      autoFocus
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && saveEdit()}
                      className="flex-1 bg-transparent outline-none text-sm px-1 rounded min-w-0"
                      style={{ color: "inherit" }}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        saveEdit();
                      }}
                      aria-label="Save title"
                      className="p-0.5"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingId(null);
                      }}
                      aria-label="Cancel rename"
                      className="p-0.5"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <>
                    <span className="flex-1 text-sm truncate">{conv.title}</span>
                    <div className="hidden group-hover:flex items-center gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          startEdit(conv);
                        }}
                        aria-label={`Rename ${conv.title}`}
                        title="Rename"
                        className="p-1 rounded-md hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(conv.id);
                        }}
                        aria-label={`Delete ${conv.title}`}
                        title="Delete"
                        className="p-1 rounded-md hover:bg-black/10 dark:hover:bg-white/10 text-red-400 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom area */}
      <div
        className="p-3 space-y-1"
        style={{ borderTop: "1px solid var(--color-border)" }}
      >
        <button type="button" className="side-row" title="Settings (coming soon)" aria-disabled="true">
          <Settings className="w-4 h-4" /> Settings
        </button>
        <button
          type="button"
          className="side-row"
          onClick={onToggleTheme}
          aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
        >
          {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          Appearance
        </button>
        <button type="button" className="side-row" title="Help (coming soon)" aria-disabled="true">
          <HelpCircle className="w-4 h-4" /> Help
        </button>
      </div>
    </div>
  );
}
