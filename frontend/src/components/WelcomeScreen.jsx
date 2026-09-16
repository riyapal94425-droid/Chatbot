import {
  Sparkles,
  Mail,
  Lightbulb,
  PenLine,
  Calendar,
  ChevronRight,
} from "lucide-react";

const SUGGESTIONS = [
  {
    icon: Mail,
    label: "Draft a thoughtful email",
    desc: "Professional, friendly, or persuasive",
    prompt: "Help me draft a thoughtful, friendly email to a colleague.",
  },
  {
    icon: Lightbulb,
    label: "Explain a concept simply",
    desc: "Complex ideas made clear",
    prompt: "Explain a complex concept in simple, easy-to-understand terms.",
  },
  {
    icon: PenLine,
    label: "Write a story idea",
    desc: "Fresh plots with an unexpected twist",
    prompt: "Give me a fresh, creative story idea with a twist.",
  },
  {
    icon: Calendar,
    label: "Plan my day",
    desc: "A balanced, realistic schedule",
    prompt: "Help me plan a productive, balanced day.",
  },
];

const CHIPS = [
  "Summarize this",
  "Brainstorm ideas",
  "Help me learn",
  "Write something",
  "Plan my day",
];

export default function WelcomeScreen({ onQuickPrompt }) {
  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin relative z-10">
      <div className="max-w-2xl mx-auto px-6 pt-14 pb-10 flex flex-col items-center">
        <div
          className="relative flex items-center justify-center mb-7 rise-in"
          style={{ animationDelay: "0.02s" }}
        >
          <span className="hero-halo" aria-hidden="true" />
          <div
            className="w-20 h-20 rounded-3xl flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg, #7c3aed, #db2777, #f59e0b)",
              boxShadow: "0 18px 50px var(--color-glow)",
              animation: "logo-breathe 3s ease-in-out infinite",
            }}
          >
            <Sparkles className="w-9 h-9 text-white" strokeWidth={2.2} />
          </div>
        </div>

        <h1
          className="font-display font-extrabold text-4xl sm:text-5xl text-center rise-in"
          style={{ animationDelay: "0.08s" }}
        >
          <span className="shimmer-text">Welcome to meriyaai</span>
        </h1>
        <p
          className="mt-4 text-center max-w-[700px] leading-relaxed rise-in"
          style={{
            color: "var(--color-text-secondary)",
            animationDelay: "0.16s",
          }}
        >
          Ask anything, create anything. Your imagination, amplified by AI —
          built for ideas, writing, and everyday magic.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full mt-10">
          {SUGGESTIONS.map(({ icon: Icon, label, desc, prompt }, i) => (
            <button
              key={label}
              onClick={() => onQuickPrompt(prompt)}
              className="welcome-card group flex items-center gap-3.5 px-4 py-4 rounded-2xl text-left rise-in"
              style={{
                color: "var(--color-text-primary)",
                animationDelay: `${0.26 + i * 0.08}s`,
              }}
            >
              <span
                className="card-icon w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{
                  background: "var(--color-bg-tertiary)",
                  color: "var(--color-accent)",
                }}
              >
                <Icon className="w-5 h-5" />
              </span>
              <span className="flex-1 min-w-0">
                <span className="block text-sm font-medium">{label}</span>
                <span className="card-desc block truncate">{desc}</span>
              </span>
              <ChevronRight className="card-chevron w-4 h-4 shrink-0" />
            </button>
          ))}
        </div>

        <div
          className="w-full mt-12 flex flex-col items-center gap-4 rise-in"
          style={{ animationDelay: "0.58s" }}
        >
          <span className="try-label max-w-sm">Try asking</span>
          <div className="flex flex-wrap justify-center gap-2">
            {CHIPS.map((chip) => (
              <button key={chip} className="chip" onClick={() => onQuickPrompt(chip)}>
                {chip}
              </button>
            ))}
          </div>
        </div>

        <p
          className="mt-10 text-xs text-center rise-in"
          style={{
            color: "var(--color-text-secondary)",
            animationDelay: "0.68s",
          }}
        >
          Choose a prompt, type a message, or attach a file to begin.
        </p>
      </div>
    </div>
  );
}
