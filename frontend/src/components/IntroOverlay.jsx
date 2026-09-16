import { useEffect, useRef, useState } from "react";
import { Sparkles } from "lucide-react";
import ParticleField from "./ParticleField";

const EXIT_AT = 3050;
const EXIT_MS = 750;

export default function IntroOverlay({ onDone }) {
  const [exiting, setExiting] = useState(false);
  const centerRef = useRef(null);
  const textRef = useRef(null);
  const doneRef = useRef(onDone);
  doneRef.current = onDone;

  useEffect(() => {
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const t1 = setTimeout(() => setExiting(true), EXIT_AT);
    const t2 = setTimeout(() => doneRef.current(), EXIT_AT + EXIT_MS);

    let raf = 0;
    const cur = { x: 0, y: 0 };
    const tgt = { x: 0, y: 0 };

    const onMove = (e) => {
      tgt.x = (e.clientX / window.innerWidth) * 2 - 1;
      tgt.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    const loop = () => {
      cur.x += (tgt.x - cur.x) * 0.06;
      cur.y += (tgt.y - cur.y) * 0.06;
      if (centerRef.current) {
        centerRef.current.style.transform = `translate3d(${(
          cur.x * 10
        ).toFixed(2)}px, ${(cur.y * 8).toFixed(2)}px, 0)`;
      }
      if (textRef.current) {
        textRef.current.style.transform = `translate3d(${(
          cur.x * -5
        ).toFixed(2)}px, ${(cur.y * -4).toFixed(2)}px, 0)`;
      }
      raf = requestAnimationFrame(loop);
    };

    let listening = false;
    if (!reduced && window.matchMedia("(pointer: fine)").matches) {
      window.addEventListener("pointermove", onMove, { passive: true });
      raf = requestAnimationFrame(loop);
      listening = true;
    }

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      cancelAnimationFrame(raf);
      if (listening) window.removeEventListener("pointermove", onMove);
    };
  }, []);

  return (
    <div
      className={`intro-overlay${exiting ? " is-exiting" : ""}`}
      style={{ pointerEvents: exiting ? "none" : "auto" }}
    >
      <ParticleField className="intro-particles" />

      <div className="bg-blob blob-a" aria-hidden="true" />
      <div className="bg-blob blob-b" aria-hidden="true" />
      <div className="bg-blob blob-c" aria-hidden="true" />
      <div className="bg-blob blob-d" aria-hidden="true" />

      <div ref={centerRef} className="intro-center">
        <div className="relative flex items-center justify-center">
          <span className="energy-pulse p-a" aria-hidden="true" />
          <span className="energy-pulse p-b" aria-hidden="true" />

          <span className="orbit o-a" aria-hidden="true">
            <i />
          </span>
          <span className="orbit o-b" aria-hidden="true">
            <i />
          </span>
          <span className="drift-in d-a" aria-hidden="true" />
          <span className="drift-in d-b" aria-hidden="true" />

          <div className="intro-ring-wrap">
            <div className="intro-ring brand-ring" />
          </div>

          <div className="intro-logo">
            <Sparkles className="w-11 h-11 text-white" strokeWidth={2.2} />
          </div>

          <span className="sparkle s-a" aria-hidden="true">
            ✦
          </span>
          <span className="sparkle s-b" aria-hidden="true">
            ✦
          </span>
        </div>
      </div>

      <div ref={textRef} className="intro-text text-center flex flex-col items-center">
        <div className="intro-wordmark shimmer-text font-display">meriyaai</div>
        <div className="intro-welcome mt-4 text-gradient font-display">
          Welcome to meriyaai
        </div>
        <div className="intro-sub text-sm mt-2">
          Your creative AI companion — ask, create, imagine.
        </div>
        <div className="init-bar" aria-hidden="true">
          <span />
        </div>
      </div>
    </div>
  );
}
