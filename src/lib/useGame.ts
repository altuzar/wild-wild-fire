"use client";

import { useEffect, useState } from "react";
import type { Game } from "./types";
import { getStore } from "./store";

export function useGame(roomId: string | null) {
  const [game, setGame] = useState<Game | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!roomId) return;
    setLoading(true);
    let firstResolved = false;
    try {
      const unsub = getStore().subscribe(roomId, (g) => {
        if (!firstResolved) {
          firstResolved = true;
          setLoading(false);
          if (!g) setError("Room not found");
        }
        if (g) {
          setError(null);
          setGame(g);
        } else {
          setGame(null);
        }
      });
      return () => unsub();
    } catch (e: unknown) {
      setLoading(false);
      setError(e instanceof Error ? e.message : String(e));
    }
  }, [roomId]);

  return { game, error, loading };
}
