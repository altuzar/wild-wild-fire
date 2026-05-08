"use client";

import { useEffect, useRef } from "react";
import type { Game } from "./types";
import {
  decideBotPlay,
  isAutoPlayed,
  maybeBotChatLine,
  shouldBotChallenge,
  shouldBotSayUno,
} from "./bots";
import { challengeUno, drawCard, playCard, sayUno, sendChat } from "./actions";

/**
 * Pick the player who should drive auto-play (bots + disconnected humans).
 * Lowest-id connected human wins. Falls back to host if no humans connected
 * (to keep things moving if a host with bots is the only one left).
 */
function findDriverId(game: Game): string | null {
  const connectedHumans = game.players
    .filter((p) => !p.isBot && p.connected)
    .map((p) => p.id)
    .sort();
  if (connectedHumans.length) return connectedHumans[0];
  // If literally no humans are connected, no one drives — game freezes
  // until someone reconnects. (We don't want bots playing to a winner alone.)
  return null;
}

/**
 * Drives auto-played turns and bot challenges. Runs in every viewer's tab,
 * but only the elected driver actually executes — keeps writes serialized.
 */
export function useBotDriver(game: Game | null, viewerId: string | null) {
  const lastActionRef = useRef<string | null>(null);

  useEffect(() => {
    if (!game || !viewerId) return;
    if (game.status !== "active") return;

    const driverId = findDriverId(game);
    if (driverId !== viewerId) return;

    const current = game.players[game.turnIndex];

    // Auto-play turn? (real bot OR disconnected human)
    if (current && isAutoPlayed(current) && current.hand.length > 0) {
      const turnKey = `turn:${game.id}:${game.turnIndex}:${game.discardPile.length}:${current.hand.length}:${current.connected ? 1 : 0}`;
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
          // Maybe drop a one-emoji trash-talk line (real bots only)
          const line = maybeBotChatLine(current);
          if (line) {
            sendChat(game.id, current.id, line).catch(() => {});
          }
        } catch {
          // Stale snapshot — next render retries
        }
      }, delay);
      return () => clearTimeout(timer);
    }

    // Bot challenges of sleeping opponents
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
