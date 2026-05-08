"use client";

import {
  Flame,
  Crown,
  WifiOff,
  AlertCircle,
  CheckCircle2,
  Bot,
  X,
} from "lucide-react";
import type { Player } from "@/lib/types";
import { CardView } from "./CardView";

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
}) {
  const handCount = player.hand.length;
  const showUnoBadge = handCount === 1 && player.saidUno;
  const vulnerable = handCount === 1 && !player.saidUno;

  return (
    <div
      className={`relative flex flex-col items-center gap-2 rounded-2xl border p-3 transition ${
        isCurrent
          ? "border-flame-400 bg-flame-900/40 shadow-[0_0_30px_-5px_rgba(249,115,22,0.6)]"
          : "border-flame-800/40 bg-ember-800/40"
      } ${picking ? "cursor-pointer ring-2 ring-amber-300 hover:bg-amber-900/30" : ""}`}
      onClick={picking ? onPick : undefined}
    >
      <div className="flex items-center gap-1 text-sm font-bold">
        {isHost && <Crown className="h-3.5 w-3.5 text-amber-300" />}
        {player.isBot && <Bot className="h-3.5 w-3.5 text-sky-300" />}
        <span className={isYou ? "text-amber-200" : "text-amber-100"}>
          {player.name}
          {isYou && " (you)"}
        </span>
        {!player.connected && status !== "waiting" && !player.isBot && (
          <WifiOff className="h-3.5 w-3.5 text-red-400" />
        )}
        {onRemove && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="ml-1 rounded-full p-0.5 text-amber-200/60 hover:bg-red-900/40 hover:text-red-300"
            title="Remove"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>

      {status === "waiting" ? (
        <div className="flex items-center gap-1 text-xs">
          {player.isReady ? (
            <>
              <CheckCircle2 className="h-3.5 w-3.5 text-green-400" />
              <span className="text-green-300">Ready</span>
            </>
          ) : (
            <span className="text-amber-200/60">Waiting…</span>
          )}
        </div>
      ) : (
        <>
          <div className="flex flex-wrap justify-center gap-0.5">
            {Array.from({ length: Math.min(handCount, 8) }).map((_, i) => (
              <div key={i} className="-ml-2 first:ml-0">
                <CardView size="sm" faceDown />
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 text-xs">
            <Flame className="h-3.5 w-3.5 text-flame-500" />
            <span className="font-mono">{handCount}</span>
            {showUnoBadge && (
              <span className="rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-black text-ember-900">
                UNO!
              </span>
            )}
            {vulnerable && status === "active" && (
              <AlertCircle className="h-3.5 w-3.5 text-rose-400 animate-pulse" />
            )}
          </div>
          {canChallenge && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onChallenge?.();
              }}
              className="mt-1 rounded-lg bg-rose-700 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-white hover:bg-rose-600"
            >
              Challenge!
            </button>
          )}
        </>
      )}
    </div>
  );
}
