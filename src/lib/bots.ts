import { requiresTarget } from "./cards";
import { pickRandomAvatar } from "./avatars";
import type { BotDifficulty, Card, CardType, Game, Player } from "./types";

const BOT_NAMES = [
  "Ember",
  "Cinder",
  "Ash",
  "Blaze",
  "Pyre",
  "Smoke",
  "Flare",
  "Forge",
  "Spark",
  "Coal",
  "Soot",
  "Tinder",
];

const DIFF_LABEL: Record<BotDifficulty, string> = {
  easy: "easy",
  medium: "med",
  hard: "hard",
};

export function pickBotName(taken: string[]): string {
  const used = new Set(taken.map((n) => n.toLowerCase()));
  const free = BOT_NAMES.filter(
    (n) => ![...used].some((u) => u.startsWith(n.toLowerCase())),
  );
  if (free.length) return free[Math.floor(Math.random() * free.length)];
  return `Bot${Math.floor(Math.random() * 999)}`;
}

export function isAutoPlayed(player: Player): boolean {
  return Boolean(player.isBot) || !player.connected;
}

export function effectiveDifficulty(player: Player): BotDifficulty {
  if (player.botDifficulty) return player.botDifficulty;
  // Disconnected humans get medium-skill AI takeover
  return "medium";
}

export function makeBot(difficulty: BotDifficulty, name: string): Player {
  return {
    id: `bot-${Math.random().toString(36).slice(2, 10)}`,
    name: `${name} (${DIFF_LABEL[difficulty]})`,
    hand: [],
    isReady: true,
    saidUno: false,
    connected: true,
    isBot: true,
    botDifficulty: difficulty,
    avatar: pickRandomAvatar(),
  };
}

const BOT_REACTIONS: Record<BotDifficulty, string[]> = {
  easy: ["🤣", "😅", "🎲", "🤷", "🙃", "😬", "✨"],
  medium: ["🔥", "😎", "💪", "🎯", "🤔", "🎲", "👀"],
  hard: ["💀", "😈", "🐍", "⚡", "🔥", "🎯", "💯", "🥶"],
};

export function maybeBotChatLine(bot: Player): string | null {
  if (!bot.isBot) return null;
  const diff = bot.botDifficulty ?? "easy";
  const chance = diff === "hard" ? 0.18 : diff === "medium" ? 0.12 : 0.06;
  if (Math.random() > chance) return null;
  const pool = BOT_REACTIONS[diff];
  return pool[Math.floor(Math.random() * pool.length)];
}

export interface BotPlay {
  cardId: string;
  targetId?: string;
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function leaderIdExcluding(game: Game, excludeId: string): string | null {
  const others = game.players.filter((p) => p.id !== excludeId);
  if (!others.length) return null;
  return others.reduce(
    (min, p) => (p.hand.length < min.hand.length ? p : min),
    others[0],
  ).id;
}

interface ScoreCtx {
  selfHand: number;
  minOpponentHand: number;
}

function scoreCard(type: CardType, ctx: ScoreCtx): number {
  // Higher = play first
  switch (type) {
    case "wild_draw_four":
      return 9;
    case "wild_forced_swap":
      // Only good if I have more cards than the smallest opponent
      return ctx.selfHand > ctx.minOpponentHand + 1 ? 8 : -1;
    case "wild_skip_two":
      return 7;
    case "wild_draw_two":
      return 6;
    case "wild_targeted_draw_two":
      return 5;
    case "wild_skip":
      return 4;
    case "wild_reverse":
      return 3;
    case "wild":
      return 1;
  }
}

export function decideBotPlay(game: Game, bot: Player): BotPlay {
  const diff: BotDifficulty = effectiveDifficulty(bot);
  const opponents = game.players.filter((p) => p.id !== bot.id);
  const minOpp = Math.min(...opponents.map((p) => p.hand.length));
  const ctx: ScoreCtx = { selfHand: bot.hand.length, minOpponentHand: minOpp };

  // Easy: random card, random target
  if (diff === "easy") {
    const card = pickRandom(bot.hand);
    const move: BotPlay = { cardId: card.id };
    if (requiresTarget(card.type)) {
      move.targetId = pickRandom(opponents).id;
    }
    return move;
  }

  // Medium / hard: rank cards
  const ranked: { card: Card; score: number }[] = bot.hand
    .map((c) => ({ card: c, score: scoreCard(c.type, ctx) }))
    .sort((a, b) => b.score - a.score);

  // Pick the highest-scoring card; for medium, add a little noise
  let chosen = ranked[0].card;
  if (diff === "medium" && ranked.length > 1 && Math.random() < 0.25) {
    chosen = ranked[1].card;
  }

  // Don't play forced swap if it would hurt us
  if (chosen.type === "wild_forced_swap" && bot.hand.length <= minOpp + 1) {
    const fallback = ranked.find((r) => r.card.type !== "wild_forced_swap");
    if (fallback) chosen = fallback.card;
  }

  const move: BotPlay = { cardId: chosen.id };
  if (requiresTarget(chosen.type)) {
    if (diff === "hard") {
      move.targetId = leaderIdExcluding(game, bot.id) ?? opponents[0].id;
    } else {
      // medium — leader half the time, random otherwise
      move.targetId =
        Math.random() < 0.6
          ? (leaderIdExcluding(game, bot.id) ?? opponents[0].id)
          : pickRandom(opponents).id;
    }
  }
  return move;
}

export function shouldBotSayUno(bot: Player): boolean {
  if (bot.hand.length !== 2) return false;
  if (bot.saidUno) return false;
  const diff: BotDifficulty = effectiveDifficulty(bot);
  if (diff === "easy") return Math.random() < 0.35;
  return true; // medium + hard always say UNO before playing
}

export function shouldBotChallenge(
  challenger: Player,
  target: Player,
): boolean {
  // Only true bots auto-challenge — AFK humans don't (would be rude)
  if (!challenger.isBot) return false;
  if (target.hand.length !== 1 || target.saidUno) return false;
  if (challenger.id === target.id) return false;
  const diff: BotDifficulty = effectiveDifficulty(challenger);
  if (diff === "easy") return false;
  if (diff === "medium") return Math.random() < 0.5;
  return true; // hard always
}
