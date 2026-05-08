"use client";

import {
  Crown,
  WifiOff,
  AlertCircle,
  CheckCircle2,
  Bot,
  X,
} from "lucide-react";
import type { Player } from "@/lib/types";
import { Avatar } from "./Avatar";

export function PlayerSeat({
  player,
  isHost,
  isYou,
  isCurrent,
  status,
  onChallenge,
  canChallenge,
  onPick,
  picking,
  onRemove,
  shake,
  compact,
}: {
  player: Player;
  isHost: boolean;
  isYou: boolean;
  isCurrent: boolean;
  status: "waiting" | "active" | "finished";
  onChallenge?: () => void;
  canChallenge?: boolean;
  onPick?: () => void;
  picking?: boolean;
  onRemove?: () => void;
  shake?: boolean;
  compact?: boolean;
}) {
  const handCount = player.hand.length;
  const showUnoBadge = handCount === 1 && player.saidUno;
  const vulnerable = handCount === 1 && !player.saidUno;
  const afk = !player.connected && status !== "waiting" && !player.isBot;

  return (
    <div
      className={`relative flex flex-col items-center gap-1 rounded-2xl border p-2 transition ${
        isCurrent
          ? "border-flame-400 bg-flame-900/40 shadow-[0_0_24px_-4px_rgba(249,115,22,0.7)]"
          : "border-flame-800/40 bg-ember-800/40"
      } ${picking ? "cursor-pointer ring-2 ring-amber-300 hover:bg-amber-900/30" : ""} ${
        shake ? "shake" : ""
      }`}
      onClick={picking ? onPick : undefined}
    >
      {onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="absolute -right-1 -top-1 rounded-full bg-red-900/80 p-0.5 text-red-200 hover:bg-red-700"
          title="Remove"
        >
          <X className="h-3 w-3" />
        </button>
      )}

      <Avatar
        emoji={player.avatar}
        size={compact ? "sm" : "md"}
        glow={isCurrent && status === "active"}
      />

      <div className="flex max-w-full items-center gap-1 truncate text-xs font-bold leading-tight">
        {isHost && <Crown className="h-3 w-3 shrink-0 text-amber-300" />}
        {player.isBot && <Bot className="h-3 w-3 shrink-0 text-sky-300" />}
        <span className={`truncate ${isYou ? "text-amber-200" : "text-amber-100"}`}>
          {player.name}
          {isYou && " ★"}
        </span>
      </div>

      {afk && (
        <span
          title="AFK — AI is playing for them"
          className="flex items-center gap-1 rounded-full bg-sky-900/60 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-sky-200"
        >
          <WifiOff className="h-2.5 w-2.5" />
          AI
        </span>
      )}

      {status === "waiting" ? (
        <div className="flex items-center gap-1 text-[11px]">
          {player.isReady ? (
            <>
              <CheckCircle2 className="h-3 w-3 text-green-400" />
              <span className="text-green-300">Ready</span>
            </>
          ) : (
            <span className="text-amber-200/60">…</span>
          )}
        </div>
      ) : (
        <>
          <div className="flex items-center gap-1.5 rounded-full bg-ember-900/80 px-2 py-0.5 text-[11px]">
            <span className="font-mono font-bold">{handCount}</span>
            <span className="text-amber-300/60">cards</span>
            {showUnoBadge && (
              <span className="rounded-full bg-amber-500 px-1.5 py-0.5 text-[9px] font-black text-ember-900">
                UNO!
              </span>
            )}
            {vulnerable && (
              <AlertCircle className="h-3 w-3 animate-pulse text-rose-400" />
            )}
          </div>
          {canChallenge && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onChallenge?.();
              }}
              className="rounded-lg bg-rose-700 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-white transition hover:bg-rose-600 active:scale-95"
            >
              Challenge!
            </button>
          )}
        </>
      )}
    </div>
  );
}
