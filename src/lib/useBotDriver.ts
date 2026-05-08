"use client";

import { useEffect, useRef } from "react";
import type { Game } from "./types";
import {
  decideBotPlay,
  shouldBotChallenge,
  shouldBotSayUno,
} from "./bots";
import { challengeUno, drawCard, playCard, sayUno } from "./actions";

/**
 * Drives bot turns and bot challenges. Only the host runs this so we don't
 * race multiple clients firing the same bot move.
 */
export function useBotDriver(game: Game | null, viewerId: string | null) {
  const lastActionRef = useRef<string | null>(null);

  useEffect(() => {
    if (!game || !viewerId) return;
    if (game.hostId !== viewerId) return;
    if (game.status !== "active") return;

    const current = game.players[game.turnIndex];

    // Bot turn?
    if (current?.isBot && current.hand.length > 0) {
      const turnKey = `turn:${game.id}:${game.turnIndex}:${game.discardPile.length}:${current.hand.length}`;
      if (lastActionRef.current === turnKey) return;
      lastActionRef.current = turnKey;

      const delay = 700 + Math.random() * 1100;
      const timer = setTimeout(async () => {
        try {
          if (shouldBotSayUno(current)) {
            await sayUno(game.id, current.id);
          }
          const move = decideBotPlay(game, current);
          await playCard(game.id, current.id, move.cardId, {
            targetId: move.targetId,
          });
        } catch {
          // Likely a stale game snapshot — next render will retry
        }
      }, delay);
      return () => clearTimeout(timer);
    }

    // Otherwise — any bot want to challenge a sleeping opponent?
    for (const bot of game.players) {
      if (!bot.isBot) continue;
      for (const target of game.players) {
        if (target.id === bot.id) continue;
        if (shouldBotChallenge(bot, target)) {
          const challengeKey = `chal:${game.id}:${bot.id}:${target.id}:${game.discardPile.length}`;
          if (lastActionRef.current === challengeKey) continue;
          lastActionRef.current = challengeKey;
          const timer = setTimeout(() => {
            challengeUno(game.id, bot.id, target.id).catch(() => {});
          }, 600 + Math.random() * 800);
          return () => clearTimeout(timer);
        }
      }
    }
  }, [game, viewerId]);
}
