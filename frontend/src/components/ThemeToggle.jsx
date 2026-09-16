import { Sun, Moon } from "lucide-react";

export default function ThemeToggle({ dark, onToggle }) {
  return (
    <button
      onClick={onToggle}
      className="p-2 rounded-xl transition-all hover:scale-105"
      style={{
        color: "var(--color-text-secondary)",
        background: "var(--color-bg-tertiary)",
        border: "1px solid var(--color-border)",
      }}
      title={dark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {dark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
    </button>
  );
}
