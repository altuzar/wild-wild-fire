"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Flame,
  ArrowRight,
  ArrowLeft,
  Trophy,
  Home,
  Hand as HandIcon,
} from "lucide-react";
import type { Card, Game } from "@/lib/types";
import { CARD_LABELS } from "@/lib/types";
import { requiresTarget } from "@/lib/cards";
import {
  challengeUno,
  drawCard,
  playCard,
  resetToLobby,
  sayUno,
} from "@/lib/actions";
import { CardView } from "./CardView";
import { PlayerSeat } from "./PlayerSeat";
import { Chat } from "./Chat";
import { Confetti } from "./Confetti";

const TOAST_TYPES = new Set([
  "wild_skip",
  "wild_skip_two",
  "wild_reverse",
  "wild_draw_two",
  "wild_targeted_draw_two",
  "wild_draw_four",
  "wild_forced_swap",
]);

const TOAST_EMOJI: Record<string, string> = {
  wild_skip: "⏭️",
  wild_skip_two: "⏭️⏭️",
  wild_reverse: "🔄",
  wild_draw_two: "💥",
  wild_targeted_draw_two: "🎯",
  wild_draw_four: "💀",
  wild_forced_swap: "🔀",
};

export function GameBoard({ game, youId }: { game: Game; youId: string }) {
  const youIdx = game.players.findIndex((p) => p.id === youId);
  const you = game.players[youIdx];
  const isYourTurn = game.turnIndex === youIdx && game.status === "active";
  const topCard = game.discardPile[game.discardPile.length - 1];

  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [picking, setPicking] = useState<Card | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Toast for action cards
  const [toast, setToast] = useState<{ key: number; type: string; name: string } | null>(null);
  const lastDiscardLenRef = useRef<number>(game.discardPile.length);

  // Shake state for hand-size growth (you got hit)
  const [shake, setShake] = useState(false);
  const lastHandLenRef = useRef<number>(you?.hand.length ?? 0);

  useEffect(() => {
    const prevLen = lastDiscardLenRef.current;
    const curLen = game.discardPile.length;
    if (curLen > prevLen && topCard && TOAST_TYPES.has(topCard.type)) {
      const playerName =
        game.players[
          (game.turnIndex - game.direction + game.players.length * 2) %
            game.players.length
        ]?.name ?? "Someone";
      setToast({ key: Date.now(), type: topCard.type, name: playerName });
    }
    lastDiscardLenRef.current = curLen;
  }, [game.discardPile.length, topCard, game.players, game.turnIndex, game.direction]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 1700);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    const prevLen = lastHandLenRef.current;
    const curLen = you?.hand.length ?? 0;
    if (curLen > prevLen + 1) {
      setShake(true);
      const t = setTimeout(() => setShake(false), 600);
      return () => clearTimeout(t);
    }
    lastHandLenRef.current = curLen;
  }, [you?.hand.length]);

  useEffect(() => {
    if (!isYourTurn) {
      setSelectedCardId(null);
      setPicking(null);
    }
  }, [isYourTurn]);
  useEffect(() => {
    if (selectedCardId && !you?.hand.some((c) => c.id === selectedCardId)) {
      setSelectedCardId(null);
    }
  }, [you?.hand, selectedCardId]);

  const wrap = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await fn();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    }
    setBusy(false);
  };

  const handlePlay = (card: Card) => {
    if (!isYourTurn || busy) return;
    if (requiresTarget(card.type)) {
      setSelectedCardId(card.id);
      setPicking(card);
      return;
    }
    setSelectedCardId(card.id);
    wrap(() => playCard(game.id, youId, card.id));
  };

  const handlePick = (targetId: string) => {
    if (!picking) return;
    const card = picking;
    setPicking(null);
    wrap(() => playCard(game.id, youId, card.id, { targetId }));
  };

  const handleDraw = () => {
    if (!isYourTurn || busy) return;
    wrap(() => drawCard(game.id, youId));
  };

  const handleSayUno = () => wrap(() => sayUno(game.id, youId));

  const handleChallenge = (targetId: string) =>
    wrap(() => challengeUno(game.id, youId, targetId));

  const handleNewRound = () => wrap(() => resetToLobby(game.id, youId));

  const otherPlayers = useMemo(() => {
    const out = [];
    const n = game.players.length;
    for (let i = 1; i < n; i++) {
      const idx = ((youIdx + i * game.direction) % n + n) % n;
      out.push({ player: game.players[idx], idx });
    }
    return out;
  }, [game.players, game.direction, youIdx]);

  const winner = game.winnerId
    ? game.players.find((p) => p.id === game.winnerId)
    : null;
  const isHost = game.hostId === youId;
  const youWon = winner?.id === youId;

  const canSayUno = you && you.hand.length === 2 && !you.saidUno;

  return (
    <div className="relative flex min-h-screen flex-col">
      <div className="ember-bg" />

      {/* Top header */}
      <header className="relative z-10 flex items-center justify-between border-b border-flame-800/40 bg-ember-900/70 px-3 py-2 backdrop-blur sm:px-4 sm:py-3">
        <div className="flex items-center gap-2">
          <Flame className="h-5 w-5 text-flame-500 animate-flicker" />
          <span className="font-mono text-xs tracking-widest text-amber-100 sm:text-sm">
            {game.id}
          </span>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-amber-200/70 sm:gap-3 sm:text-xs">
          <span className="flex items-center gap-1">
            {game.direction === 1 ? (
              <ArrowRight className="h-3.5 w-3.5" />
            ) : (
              <ArrowLeft className="h-3.5 w-3.5" />
            )}
            <span className="hidden sm:inline">
              {game.direction === 1 ? "Clockwise" : "Reversed"}
            </span>
          </span>
          <span className="opacity-50">·</span>
          <span>{game.drawPile.length} 🂠</span>
        </div>
      </header>

      {/* Other players */}
      <section className="relative z-10 grid grid-cols-3 gap-1.5 px-2 py-2 sm:grid-cols-4 sm:gap-2 sm:px-4 md:grid-cols-5 lg:grid-cols-6">
        {otherPlayers.map(({ player, idx }) => {
          const canChallenge =
            game.status === "active" &&
            player.hand.length === 1 &&
            !player.saidUno;
          return (
            <PlayerSeat
              key={player.id}
              player={player}
              isHost={player.id === game.hostId}
              isYou={false}
              isCurrent={idx === game.turnIndex}
              status={game.status}
              canChallenge={canChallenge}
              onChallenge={() => handleChallenge(player.id)}
              picking={!!picking && player.id !== youId}
              onPick={() => handlePick(player.id)}
              compact
            />
          );
        })}
      </section>

      {/* Center: piles */}
      <section className="relative z-10 flex flex-1 flex-col items-center justify-center gap-3 px-3 py-2 sm:gap-4">
        {picking && (
          <div className="rounded-2xl border-2 border-amber-300 bg-amber-900/40 px-4 py-2 text-center text-amber-100 shadow-lg">
            <p className="text-sm font-bold">
              🎯 Pick a target for {CARD_LABELS[picking.type]}
            </p>
            <button
              onClick={() => setPicking(null)}
              className="mt-0.5 text-[11px] underline opacity-70"
            >
              cancel
            </button>
          </div>
        )}

        <div className="flex items-end gap-4 sm:gap-6">
          <div className="flex flex-col items-center gap-1">
            <button
              onClick={handleDraw}
              disabled={!isYourTurn || busy}
              className={`relative ${isYourTurn ? "active:scale-95" : ""}`}
              title={isYourTurn ? "Draw a card" : ""}
            >
              <CardView size="md" faceDown highlighted={isYourTurn} />
              {isYourTurn && (
                <span className="absolute -top-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-flame-500 px-2 py-0.5 text-[9px] font-black uppercase text-ember-900">
                  Draw
                </span>
              )}
            </button>
            <span className="text-[10px] text-amber-300/60 sm:text-xs">
              {game.drawPile.length}
            </span>
          </div>
          <div className="flex flex-col items-center gap-1">
            {topCard ? (
              <div key={topCard.id} className="card-pop">
                <CardView card={topCard} size="md" disabled />
              </div>
            ) : (
              <div className="h-[108px] w-[76px] rounded-xl border-2 border-dashed border-flame-700/40" />
            )}
            <span className="text-[10px] text-amber-300/60 sm:text-xs">
              discard
            </span>
          </div>
        </div>

        {game.status === "active" && (
          <div className="text-center">
            {isYourTurn ? (
              <p className="animate-flicker text-base font-black uppercase tracking-widest text-flame-400 sm:text-lg">
                🔥 Your turn 🔥
              </p>
            ) : (
              <p className="text-xs uppercase tracking-widest text-amber-200/70 sm:text-sm">
                {game.players[game.turnIndex]?.avatar}{" "}
                {game.players[game.turnIndex]?.name}'s turn
              </p>
            )}
          </div>
        )}

        {game.status === "finished" && winner && (
          <div className="flex flex-col items-center gap-2 rounded-2xl border-2 border-amber-300 bg-amber-900/40 p-4 shadow-2xl sm:p-6">
            <Trophy className="h-10 w-10 text-amber-300" />
            <p className="text-xl font-black uppercase tracking-wider text-amber-100 sm:text-2xl">
              {winner.avatar} {winner.name} wins!
            </p>
            <p className="text-xs text-amber-200/70">
              {youWon ? "🎉 That's YOU! 🎉" : "Better luck next round."}
            </p>
            {isHost && (
              <button
                onClick={handleNewRound}
                disabled={busy}
                className="mt-1 rounded-xl bg-flame-600 px-5 py-2 text-sm font-bold text-amber-50 hover:bg-flame-500 active:scale-95"
              >
                <Home className="mr-1 inline h-4 w-4" />
                Back to lobby
              </button>
            )}
          </div>
        )}
      </section>

      {/* Action card toast */}
      {toast && (
        <div
          key={toast.key}
          className="banner-slam pointer-events-none fixed left-1/2 top-1/2 z-30 -translate-x-1/2 -translate-y-1/2"
        >
          <div className="rounded-2xl border-4 border-amber-300 bg-flame-700/95 px-6 py-4 text-center shadow-2xl">
            <div className="text-4xl sm:text-5xl">{TOAST_EMOJI[toast.type]}</div>
            <div className="text-base font-black uppercase tracking-widest text-amber-50 sm:text-lg">
              {CARD_LABELS[toast.type as keyof typeof CARD_LABELS]}!
            </div>
          </div>
        </div>
      )}

      {/* Confetti when someone wins */}
      {game.status === "finished" && <Confetti count={42} />}

      {/* Your hand */}
      <section
        className={`sticky bottom-0 z-20 border-t border-flame-800/40 bg-ember-900/90 px-2 pb-2 pt-2 backdrop-blur sm:px-4 sm:pt-3 ${shake ? "shake" : ""}`}
      >
        {you && (
          <>
            <div className="mb-1.5 flex items-center justify-between gap-2 px-1">
              <div className="flex min-w-0 items-center gap-2 text-[11px] text-amber-200/80 sm:text-xs">
                <span className="text-base sm:text-lg">{you.avatar}</span>
                <HandIcon className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">
                  <span className="font-bold text-amber-100">{you.name}</span>
                  <span className="opacity-70"> · {you.hand.length} cards</span>
                </span>
                {you.hand.length === 1 && you.saidUno && (
                  <span className="rounded-full bg-amber-500 px-2 py-0.5 text-[9px] font-black text-ember-900">
                    UNO!
                  </span>
                )}
              </div>
              {canSayUno && (
                <button
                  onClick={handleSayUno}
                  disabled={busy}
                  className="rounded-full bg-gradient-to-r from-amber-400 to-flame-500 px-4 py-1.5 text-sm font-black uppercase tracking-widest text-ember-900 shadow-lg transition hover:brightness-110 active:scale-95 sm:text-base"
                >
                  UNO!
                </button>
              )}
            </div>
            <div className="scrollbar-thin -mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1 sm:gap-2">
              {you.hand.map((card) => (
                <div key={card.id} className="shrink-0">
                  <CardView
                    card={card}
                    size="md"
                    selected={selectedCardId === card.id}
                    disabled={!isYourTurn || busy}
                    onClick={() => handlePlay(card)}
                  />
                </div>
              ))}
              {you.hand.length === 0 && (
                <p className="px-4 py-6 text-sm text-amber-200/50">
                  You're empty-handed. 🎉
                </p>
              )}
            </div>
          </>
        )}

        {error && (
          <p className="mt-1.5 rounded-lg bg-red-900/50 p-1.5 text-[11px] text-red-200">
            {error}
          </p>
        )}
      </section>

      <Chat
        roomId={game.id}
        youId={youId}
        messages={game.chat ?? []}
        defaultOpen={false}
      />
    </div>
  );
}
