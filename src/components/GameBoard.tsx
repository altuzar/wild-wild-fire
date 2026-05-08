"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Flame,
  RotateCcw,
  ArrowRight,
  ArrowLeft,
  Trophy,
  Home,
  Hand as HandIcon,
} from "lucide-react";
import type { Card, Game } from "@/lib/types";
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

export function GameBoard({ game, youId }: { game: Game; youId: string }) {
  const youIdx = game.players.findIndex((p) => p.id === youId);
  const you = game.players[youIdx];
  const isYourTurn = game.turnIndex === youIdx && game.status === "active";
  const topCard = game.discardPile[game.discardPile.length - 1];

  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [picking, setPicking] = useState<Card | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedCard = useMemo(
    () => you?.hand.find((c) => c.id === selectedCardId) ?? null,
    [you, selectedCardId],
  );

  // Reset selection if it's not your turn or the card is gone
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

  // Order other players around the table starting from the seat after yours,
  // following play direction.
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

  const canSayUno = you && you.hand.length === 2 && !you.saidUno;

  return (
    <div className="relative flex min-h-screen flex-col">
      {/* Top header */}
      <header className="flex items-center justify-between border-b border-flame-800/40 bg-ember-900/60 px-4 py-3 backdrop-blur">
        <div className="flex items-center gap-2">
          <Flame className="h-5 w-5 text-flame-500 animate-flicker" />
          <span className="font-mono text-sm tracking-widest text-amber-100">
            {game.id}
          </span>
        </div>
        <div className="flex items-center gap-3 text-xs text-amber-200/70">
          <span className="flex items-center gap-1">
            {game.direction === 1 ? (
              <ArrowRight className="h-4 w-4" />
            ) : (
              <ArrowLeft className="h-4 w-4" />
            )}
            {game.direction === 1 ? "Clockwise" : "Reversed"}
          </span>
          <span>·</span>
          <span>{game.drawPile.length} in deck</span>
        </div>
      </header>

      {/* Other players */}
      <section className="grid grid-cols-2 gap-3 p-4 md:grid-cols-3 lg:grid-cols-4">
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
            />
          );
        })}
      </section>

      {/* Center: piles + status */}
      <section className="flex flex-1 flex-col items-center justify-center gap-6 p-4">
        {picking && (
          <div className="rounded-2xl border-2 border-amber-300 bg-amber-900/30 px-6 py-3 text-center text-amber-100">
            <p className="font-bold">Pick a target for {picking.type.replace(/_/g, " ")}</p>
            <button
              onClick={() => setPicking(null)}
              className="mt-1 text-xs underline opacity-70"
            >
              cancel
            </button>
          </div>
        )}

        <div className="flex items-end gap-8">
          <div className="flex flex-col items-center gap-2">
            <button
              onClick={handleDraw}
              disabled={!isYourTurn || busy}
              className={`relative ${isYourTurn ? "hover:scale-105" : ""}`}
              title={isYourTurn ? "Draw a card" : ""}
            >
              <CardView size="lg" faceDown />
              {isYourTurn && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-flame-500 px-2 py-0.5 text-[10px] font-black uppercase text-ember-900">
                  Draw
                </span>
              )}
            </button>
            <span className="text-xs text-amber-300/60">{game.drawPile.length}</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            {topCard ? (
              <div className="animate-deal">
                <CardView card={topCard} size="lg" disabled />
              </div>
            ) : (
              <div className="h-36 w-24 rounded-xl border-2 border-dashed border-flame-700/40" />
            )}
            <span className="text-xs text-amber-300/60">discard</span>
          </div>
        </div>

        {game.status === "active" && (
          <div className="text-center">
            {isYourTurn ? (
              <p className="text-lg font-black uppercase tracking-widest text-flame-400 animate-flicker">
                Your turn
              </p>
            ) : (
              <p className="text-sm uppercase tracking-widest text-amber-200/70">
                {game.players[game.turnIndex]?.name}'s turn
              </p>
            )}
          </div>
        )}

        {game.status === "finished" && winner && (
          <div className="flex flex-col items-center gap-3 rounded-2xl border-2 border-amber-300 bg-amber-900/30 p-6">
            <Trophy className="h-10 w-10 text-amber-300" />
            <p className="text-2xl font-black uppercase tracking-wider text-amber-100">
              {winner.name} wins!
            </p>
            {isHost && (
              <button
                onClick={handleNewRound}
                disabled={busy}
                className="rounded-xl bg-flame-600 px-5 py-2 font-bold text-amber-50 hover:bg-flame-500"
              >
                <Home className="mr-1 inline h-4 w-4" />
                Back to lobby
              </button>
            )}
          </div>
        )}
      </section>

      {/* Your hand */}
      <section className="sticky bottom-0 border-t border-flame-800/40 bg-ember-900/80 px-4 pb-6 pt-3 backdrop-blur">
        {you && (
          <>
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-amber-200/70">
                <HandIcon className="h-4 w-4" />
                <span>{you.name} (you) — {you.hand.length} cards</span>
                {you.hand.length === 1 && you.saidUno && (
                  <span className="rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-black text-ember-900">
                    UNO!
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {canSayUno && (
                  <button
                    onClick={handleSayUno}
                    disabled={busy}
                    className="rounded-full bg-gradient-to-r from-amber-400 to-flame-500 px-4 py-1.5 text-sm font-black uppercase tracking-widest text-ember-900 shadow-lg hover:brightness-110"
                  >
                    UNO!
                  </button>
                )}
              </div>
            </div>
            <div className="scrollbar-thin -mx-2 flex gap-2 overflow-x-auto px-2 pb-2">
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
                  You're empty-handed.
                </p>
              )}
            </div>
          </>
        )}

        {error && (
          <p className="mt-2 rounded-lg bg-red-900/50 p-2 text-xs text-red-200">
            {error}
          </p>
        )}
      </section>

      {/* Log */}
      <aside className="pointer-events-none fixed bottom-32 right-4 hidden w-64 lg:block">
        <div className="scrollbar-thin pointer-events-auto max-h-64 overflow-y-auto rounded-2xl border border-flame-800/40 bg-ember-900/80 p-3 text-xs text-amber-100/80 backdrop-blur">
          {game.log.slice(-12).map((line, i) => (
            <p key={i} className="py-0.5">
              {line}
            </p>
          ))}
        </div>
      </aside>
    </div>
  );
}
