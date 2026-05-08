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

const SHORT_BADGE: Record<CardType, string> = {
  wild: "★",
  wild_skip: "⏭",
  wild_skip_two: "×2",
  wild_reverse: "↺",
  wild_draw_two: "+2",
  wild_targeted_draw_two: "🎯",
  wild_draw_four: "+4",
  wild_forced_swap: "⇄",
};

const SIZES = {
  xs: "w-12 h-[68px] text-[9px]",
  sm: "w-14 h-20 text-[10px]",
  md: "w-[76px] h-[108px] text-[11px]",
  lg: "w-24 h-36 text-sm",
};

const ICON_SIZES = {
  xs: "h-5 w-5",
  sm: "h-6 w-6",
  md: "h-8 w-8",
  lg: "h-11 w-11",
};

export function CardView({
  card,
  size = "md",
  onClick,
  selected,
  disabled,
  faceDown,
  highlighted,
}: {
  card?: Card;
  size?: keyof typeof SIZES;
  onClick?: () => void;
  selected?: boolean;
  disabled?: boolean;
  faceDown?: boolean;
  highlighted?: boolean;
}) {
  const sizeCls = SIZES[size];
  const iconCls = ICON_SIZES[size];

  if (faceDown || !card) {
    return (
      <div
        className={`${sizeCls} card-shadow flex items-center justify-center rounded-xl border-2 border-flame-700/60 bg-gradient-to-br from-ember-800 via-ember-700 to-ember-900 ${
          onClick ? "cursor-pointer hover:scale-105 transition" : ""
        } ${highlighted ? "glow-pulse" : ""}`}
        onClick={onClick}
      >
        <Flame className={`${iconCls} text-flame-500/80 animate-flicker`} />
      </div>
    );
  }

  const Icon = ICONS[card.type];
  const grad = CARD_GRADIENTS[card.type];

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`group relative ${sizeCls} card-shadow rounded-xl bg-gradient-to-br ${grad} border-2 lift-on-hover ${
        selected
          ? "-translate-y-3 border-amber-200 ring-4 ring-amber-300/60"
          : "border-amber-100/30"
      } ${disabled ? "" : "cursor-pointer"}`}
    >
      <div className="absolute inset-1 flex flex-col items-center justify-between rounded-lg bg-black/25 p-1.5">
        <div className="flex w-full items-center justify-between text-amber-50/90">
          <span className="font-black leading-none">{SHORT_BADGE[card.type]}</span>
          <Flame className="h-3 w-3 opacity-70" />
        </div>
        <div className="flex flex-col items-center gap-0.5">
          <Icon className={`${iconCls} text-amber-50 drop-shadow-lg`} />
          <span className="text-center font-black uppercase leading-tight tracking-tight text-amber-50">
            {CARD_LABELS[card.type]}
          </span>
        </div>
        <div className="flex w-full rotate-180 items-center justify-between text-amber-50/90">
          <span className="font-black leading-none">{SHORT_BADGE[card.type]}</span>
          <Flame className="h-3 w-3 opacity-70" />
        </div>
      </div>
    </button>
  );
}
