// Fire-themed and friendly emoji avatars. Kid-friendly.
export const AVATAR_POOL = [
  "🔥",
  "🌋",
  "🐉",
  "🦁",
  "🐺",
  "🦊",
  "🐯",
  "🐲",
  "🦅",
  "🦄",
  "🐰",
  "🐱",
  "🐶",
  "🦖",
  "🐧",
  "🦉",
  "🦝",
  "🐼",
  "🐸",
  "🦋",
  "👹",
  "👻",
  "🤖",
  "🎃",
  "🌶️",
  "⚡",
  "💥",
  "💀",
  "🚀",
  "🍕",
];

export function pickRandomAvatar(taken: string[] = []): string {
  const used = new Set(taken);
  const free = AVATAR_POOL.filter((a) => !used.has(a));
  if (free.length === 0) return AVATAR_POOL[Math.floor(Math.random() * AVATAR_POOL.length)];
  return free[Math.floor(Math.random() * free.length)];
}

export function nextAvatar(current: string | undefined): string {
  if (!current) return AVATAR_POOL[0];
  const i = AVATAR_POOL.indexOf(current);
  return AVATAR_POOL[(i + 1) % AVATAR_POOL.length];
}
