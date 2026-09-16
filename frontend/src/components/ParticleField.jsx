import { useEffect, useRef } from "react";

const PALETTE = ["167,139,250", "244,114,182", "251,191,36", "147,197,253"];

export default function ParticleField({
  className = "",
  density = 11000,
  maxParticles = 60,
  linkDist = 110,
}) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    let raf = 0;
    let w = 0;
    let h = 0;
    let parts = [];
    const ptr = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5 };

    const seed = () => {
      const count = Math.min(maxParticles, Math.round((w * h) / density));
      parts = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.16,
        vy: (Math.random() - 0.5) * 0.16,
        r: 0.8 + Math.random() * 1.6,
        z: 0.35 + Math.random() * 0.65,
        c: PALETTE[(Math.random() * PALETTE.length) | 0],
        tw: Math.random() * Math.PI * 2,
        ts: 0.4 + Math.random() * 1.1,
        a: 0.22 + Math.random() * 0.42,
      }));
    };

    const draw = (t) => {
      ctx.clearRect(0, 0, w, h);
      const px = ptr.x - 0.5;
      const py = ptr.y - 0.5;

      ctx.lineWidth = 1;
      for (let i = 0; i < parts.length; i++) {
        const p = parts[i];
        const x = p.x + px * 24 * p.z;
        const y = p.y + py * 24 * p.z;
        for (let j = i + 1; j < parts.length; j++) {
          const q = parts[j];
          const dx = x - (q.x + px * 24 * q.z);
          const dy = y - (q.y + py * 24 * q.z);
          const d2 = dx * dx + dy * dy;
          if (d2 < linkDist * linkDist) {
            const al = (1 - Math.sqrt(d2) / linkDist) * 0.09;
            ctx.strokeStyle = `rgba(167,139,250,${al.toFixed(3)})`;
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(q.x + px * 24 * q.z, q.y + py * 24 * q.z);
            ctx.stroke();
          }
        }
      }

      for (const p of parts) {
        const tw = reduced ? 0.8 : 0.55 + 0.45 * Math.sin(t * p.ts + p.tw);
        ctx.beginPath();
        ctx.fillStyle = `rgba(${p.c},${(p.a * tw).toFixed(3)})`;
        ctx.arc(p.x + px * 24 * p.z, p.y + py * 24 * p.z, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const tick = (now) => {
      for (const p of parts) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < -12) p.x = w + 12;
        else if (p.x > w + 12) p.x = -12;
        if (p.y < -12) p.y = h + 12;
        else if (p.y > h + 12) p.y = -12;
      }
      ptr.x += (ptr.tx - ptr.x) * 0.05;
      ptr.y += (ptr.ty - ptr.y) * 0.05;
      draw(now * 0.001);
      raf = requestAnimationFrame(tick);
    };

    const onMove = (e) => {
      ptr.tx = e.clientX / window.innerWidth;
      ptr.ty = e.clientY / window.innerHeight;
    };

    resize();
    function resize() {
      const rect = canvas.getBoundingClientRect();
      w = Math.max(1, rect.width);
      h = Math.max(1, rect.height);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seed();
      if (reduced) draw(1);
    }

    window.addEventListener("resize", resize);
    if (!reduced) {
      raf = requestAnimationFrame(tick);
      if (window.matchMedia("(pointer: fine)").matches) {
        window.addEventListener("pointermove", onMove, { passive: true });
      }
    }

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
    };
  }, [density, maxParticles, linkDist]);

  return <canvas ref={canvasRef} className={className} aria-hidden="true" />;
}
