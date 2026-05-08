"use client";

import { useEffect, useState } from "react";

const PIECES = ["🔥", "🎉", "✨", "💥", "🌟", "⚡", "🎊", "🪅"];

export function Confetti({ count = 36 }: { count?: number }) {
  const [pieces, setPieces] = useState<
    { left: string; delay: string; duration: string; emoji: string; rotate: string }[]
  >([]);

  useEffect(() => {
    setPieces(
      Array.from({ length: count }).map(() => ({
        left: `${Math.random() * 100}%`,
        delay: `${Math.random() * 0.6}s`,
        duration: `${2 + Math.random() * 2.5}s`,
        emoji: PIECES[Math.floor(Math.random() * PIECES.length)],
        rotate: `${Math.random() * 360}deg`,
      })),
    );
  }, [count]);

  return (
    <div className="confetti" aria-hidden>
      {pieces.map((p, i) => (
        <span
          key={i}
          style={{
            left: p.left,
            animationDelay: p.delay,
            animationDuration: p.duration,
            transform: `rotate(${p.rotate})`,
          }}
        >
          {p.emoji}
        </span>
      ))}
    </div>
  );
}
