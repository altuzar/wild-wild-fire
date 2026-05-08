"use client";

import {
  Flame,
  SkipForward,
  RotateCcw,
  Plus,
  Crosshair,
  Repeat2,
} from "lucide-react";
import type { Card, CardType } from "@/lib/types";
import { CARD_GRADIENTS, CARD_LABELS } from "@/lib/types";

const ICONS: Record<CardType, React.ComponentType<{ className?: string }>> = {
  wild: Flame,
  wild_skip: SkipForward,
  wild_skip_two: SkipForward,
  wild_reverse: RotateCcw,
  wild_draw_two: Plus,
  wild_targeted_draw_two: Crosshair,
  wild_draw_four: Plus,
  wild_forced_swap: Repeat2,
};

const SIZES = {
  sm: "w-14 h-20 text-[10px]",
  md: "w-20 h-28 text-xs",
  lg: "w-24 h-36 text-sm",
};

export function CardView({
  card,
  size = "md",
  onClick,
  selected,
  disabled,
  faceDown,
}: {
  card?: Card;
  size?: keyof typeof SIZES;
  onClick?: () => void;
  selected?: boolean;
  disabled?: boolean;
  faceDown?: boolean;
}) {
  const sizeCls = SIZES[size];

  if (faceDown || !card) {
    return (
      <div
        className={`${sizeCls} card-shadow flex items-center justify-center rounded-xl border border-flame-700/60 bg-gradient-to-br from-ember-800 via-ember-700 to-ember-900 ${onClick ? "cursor-pointer hover:scale-105 transition" : ""}`}
        onClick={onClick}
      >
        <Flame className="h-1/3 w-1/3 text-flame-500/80 animate-flicker" />
      </div>
    );
  }

  const Icon = ICONS[card.type];
  const grad = CARD_GRADIENTS[card.type];

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`group relative ${sizeCls} card-shadow rounded-xl bg-gradient-to-br ${grad} border-2 transition ${
        selected
          ? "-translate-y-3 border-amber-200 ring-4 ring-amber-300/60"
          : "border-amber-100/30 hover:-translate-y-1"
      } ${disabled ? "" : "cursor-pointer"}`}
    >
      <div className="absolute inset-1 flex flex-col items-center justify-between rounded-lg bg-black/20 p-2">
        <div className="flex w-full items-center justify-between">
          <Icon className="h-3 w-3 text-amber-50" />
          <Flame className="h-3 w-3 text-amber-50/70" />
        </div>
        <div className="flex flex-col items-center gap-1">
          <Icon className={`text-amber-50 drop-shadow-lg ${size === "lg" ? "h-10 w-10" : size === "md" ? "h-8 w-8" : "h-6 w-6"}`} />
          <span className="text-center font-black uppercase tracking-tight text-amber-50">
            {CARD_LABELS[card.type]}
          </span>
        </div>
        <div className="flex w-full items-center justify-between rotate-180">
          <Icon className="h-3 w-3 text-amber-50" />
          <Flame className="h-3 w-3 text-amber-50/70" />
        </div>
      </div>
    </button>
  );
}
