import type { Card, CardType } from "./types";

// 112 cards total. Heavier on basic actions, lighter on the spicy ones.
export const DECK_COMPOSITION: Record<CardType, number> = {
  wild: 18,
  wild_skip: 18,
  wild_skip_two: 8,
  wild_reverse: 18,
  wild_draw_two: 18,
  wild_targeted_draw_two: 8,
  wild_draw_four: 16,
  wild_forced_swap: 8,
};

export function buildDeck(): Card[] {
  const deck: Card[] = [];
  let n = 0;
  (Object.keys(DECK_COMPOSITION) as CardType[]).forEach((type) => {
    const count = DECK_COMPOSITION[type];
    for (let i = 0; i < count; i++) {
      deck.push({ id: `${type}-${n++}`, type });
    }
  });
  return deck;
}

// Fisher-Yates with a fresh id namespace each shuffle to keep ids unique
// across reshuffles within a game.
export function shuffle<T>(arr: T[], salt = ""): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  if (salt) {
    return a.map((c, i) => {
      const card = c as unknown as Card;
      return { ...card, id: `${card.type}-${salt}-${i}` } as unknown as T;
    });
  }
  return a;
}

export function isActionCard(type: CardType): boolean {
  return type !== "wild";
}

export function requiresTarget(type: CardType): boolean {
  return type === "wild_targeted_draw_two" || type === "wild_forced_swap";
}

export const TOTAL_DECK_SIZE = Object.values(DECK_COMPOSITION).reduce(
  (a, b) => a + b,
  0,
);
