"use client";

import { useState } from "react";
import {
  Copy,
  Check,
  Play,
  Edit3,
  Bot,
  Sparkles,
  Brain,
  Skull,
  Shuffle,
} from "lucide-react";
import type { BotDifficulty, Game } from "@/lib/types";
import {
  addBot,
  cycleAvatar,
  removeBot,
  setName,
  setReady,
  startGame,
} from "@/lib/actions";
import { PlayerSeat } from "./PlayerSeat";
import { Avatar } from "./Avatar";
import { Chat } from "./Chat";

export function Lobby({ game, youId }: { game: Game; youId: string }) {
  const you = game.players.find((p) => p.id === youId);
  const isHost = game.hostId === youId;
  const allReady = game.players.length >= 2 && game.players.every((p) => p.isReady);
  const [copied, setCopied] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draftName, setDraftName] = useState(you?.name ?? "");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const url = typeof window !== "undefined" ? window.location.href : "";

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  };

  const wrap = async (fn: () => Promise<void>) => {
    setBusy(true);
    setErr(null);
    try {
      await fn();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : String(e));
    }
    setBusy(false);
  };

  const toggleReady = () => you && wrap(() => setReady(game.id, youId, !you.isReady));
  const saveName = () =>
    wrap(async () => {
      await setName(game.id, youId, draftName);
      setEditing(false);
    });
  const start = () => wrap(() => startGame(game.id, youId));
  const handleAddBot = (d: BotDifficulty) => wrap(() => addBot(game.id, youId, d));
  const handleRemoveBot = (botId: string) =>
    wrap(() => removeBot(game.id, youId, botId));
  const handleCycleAvatar = () => wrap(() => cycleAvatar(game.id, youId));

  return (
    <>
      <div className="ember-bg" />
      <div className="relative z-10 mx-auto flex max-w-4xl flex-col gap-5 p-4 pb-20 sm:gap-6 sm:p-6">
        <header className="flex flex-col items-center gap-2">
          <h2 className="text-[10px] uppercase tracking-[0.3em] text-amber-300/70 sm:text-xs">
            Room
          </h2>
          <div className="flex items-center gap-3">
            <span className="font-mono text-2xl font-black tracking-[0.3em] text-amber-100 sm:text-3xl">
              {game.id}
            </span>
            <button
              onClick={copy}
              className="rounded-lg bg-flame-700/60 p-2 text-amber-50 hover:bg-flame-600"
              title="Copy invite link"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>
          <p className="text-center text-[11px] text-amber-300/50 sm:text-xs">
            Share this code or the URL with your friends.
          </p>
        </header>

        <section>
          <h3 className="mb-2 text-xs uppercase tracking-widest text-amber-200/70 sm:text-sm">
            Players ({game.players.length}/8)
          </h3>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 md:grid-cols-4">
            {game.players.map((p) => (
              <PlayerSeat
                key={p.id}
                player={p}
                isHost={p.id === game.hostId}
                isYou={p.id === youId}
                isCurrent={false}
                status="waiting"
                onRemove={
                  isHost && p.isBot ? () => handleRemoveBot(p.id) : undefined
                }
              />
            ))}
          </div>

          {isHost && game.players.length < 8 && (
            <div className="mt-3 rounded-xl border border-flame-700/30 bg-ember-900/40 p-3">
              <div className="mb-2 flex items-center gap-2 text-[11px] uppercase tracking-widest text-amber-200/60 sm:text-xs">
                <Bot className="h-3.5 w-3.5" /> Add an AI player
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleAddBot("easy")}
                  disabled={busy}
                  className="flex items-center gap-1.5 rounded-lg bg-emerald-700/60 px-3 py-1.5 text-sm font-bold text-emerald-100 transition hover:bg-emerald-700 active:scale-95"
                >
                  <Sparkles className="h-4 w-4" /> Easy
                </button>
                <button
                  onClick={() => handleAddBot("medium")}
                  disabled={busy}
                  className="flex items-center gap-1.5 rounded-lg bg-amber-700/60 px-3 py-1.5 text-sm font-bold text-amber-100 transition hover:bg-amber-700 active:scale-95"
                >
                  <Brain className="h-4 w-4" /> Medium
                </button>
                <button
                  onClick={() => handleAddBot("hard")}
                  disabled={busy}
                  className="flex items-center gap-1.5 rounded-lg bg-rose-800/70 px-3 py-1.5 text-sm font-bold text-rose-100 transition hover:bg-rose-700 active:scale-95"
                >
                  <Skull className="h-4 w-4" /> Hard
                </button>
              </div>
              <p className="mt-2 text-[10px] text-amber-200/50 sm:text-[11px]">
                🟢 Easy plays randomly · 🟡 Medium prefers strong cards · 🔴 Hard
                targets whoever's closest to winning.
              </p>
            </div>
          )}
        </section>

        {you && (
          <section className="rounded-2xl border border-flame-700/40 bg-ember-800/40 p-4 sm:p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <Avatar
                  emoji={you.avatar}
                  size="lg"
                  onClick={handleCycleAvatar}
                  title="Click to change avatar"
                />
                <div>
                  <span className="text-[10px] uppercase tracking-widest text-amber-200/60">
                    You are
                  </span>
                  {editing ? (
                    <div className="mt-1 flex gap-2">
                      <input
                        value={draftName}
                        onChange={(e) =>
                          setDraftName(e.target.value.slice(0, 20))
                        }
                        className="rounded-lg border border-flame-700/40 bg-ember-900 px-3 py-1 text-amber-100"
                      />
                      <button
                        onClick={saveName}
                        disabled={busy}
                        className="rounded-lg bg-flame-600 px-3 py-1 text-sm font-bold text-amber-50 hover:bg-flame-500"
                      >
                        Save
                      </button>
                    </div>
                  ) : (
                    <div className="mt-1 flex items-center gap-2 text-xl font-bold text-amber-100 sm:text-2xl">
                      {you.name}
                      <button
                        onClick={() => {
                          setDraftName(you.name);
                          setEditing(true);
                        }}
                        className="rounded-lg p-1 hover:bg-amber-100/10"
                        title="Edit name"
                      >
                        <Edit3 className="h-4 w-4 text-amber-300/70" />
                      </button>
                      <button
                        onClick={handleCycleAvatar}
                        className="rounded-lg p-1 hover:bg-amber-100/10"
                        title="Change avatar"
                      >
                        <Shuffle className="h-4 w-4 text-amber-300/70" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <button
                onClick={toggleReady}
                disabled={busy}
                className={`rounded-xl px-4 py-2.5 text-sm font-bold uppercase tracking-wider transition active:scale-95 sm:px-5 sm:py-3 sm:text-base ${
                  you.isReady
                    ? "bg-green-700 text-green-100 hover:bg-green-600"
                    : "bg-amber-100/10 text-amber-200 hover:bg-amber-100/20"
                }`}
              >
                {you.isReady ? "Ready ✓" : "Ready up"}
              </button>
            </div>

            {isHost && (
              <button
                onClick={start}
                disabled={busy || !allReady}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-flame-600 to-rose-600 py-3 text-base font-black uppercase tracking-wider text-amber-50 transition hover:brightness-110 active:scale-[0.98] disabled:brightness-50 sm:py-4 sm:text-lg"
              >
                <Play className="h-5 w-5" />
                {allReady
                  ? "Light it up 🔥"
                  : game.players.length < 2
                    ? "Need 2+ players"
                    : "Waiting for ready"}
              </button>
            )}
          </section>
        )}

        {err && (
          <p className="rounded-lg bg-red-900/50 p-3 text-sm text-red-200">{err}</p>
        )}
      </div>

      <Chat
        roomId={game.id}
        youId={youId}
        messages={game.chat ?? []}
        defaultOpen={false}
      />
    </>
  );
}
