"use client";

const SIZE_CLS = {
  xs: "h-6 w-6 text-base",
  sm: "h-8 w-8 text-lg",
  md: "h-10 w-10 text-xl",
  lg: "h-14 w-14 text-3xl",
  xl: "h-20 w-20 text-5xl",
};

export function Avatar({
  emoji,
  size = "md",
  glow,
  onClick,
  title,
}: {
  emoji?: string;
  size?: keyof typeof SIZE_CLS;
  glow?: boolean;
  onClick?: () => void;
  title?: string;
}) {
  const cls = SIZE_CLS[size];
  return (
    <button
      onClick={onClick}
      title={title}
      disabled={!onClick}
      className={`${cls} flex shrink-0 items-center justify-center rounded-full border-2 ${
        glow
          ? "border-flame-400 bg-flame-900/60 glow-pulse"
          : "border-flame-700/40 bg-ember-800/70"
      } leading-none ${onClick ? "cursor-pointer hover:scale-110 transition" : ""}`}
    >
      <span aria-hidden>{emoji ?? "🔥"}</span>
    </button>
  );
}
