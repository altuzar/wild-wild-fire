import { buildDeck, shuffle } from "./cards";
import type { Card, Game, Player } from "./types";

export const STARTING_HAND_SIZE = 7;

export function createInitialGame(opts: {
  id: string;
  hostId: string;
  hostName: string;
}): Game {
  const now = Date.now();
  return {
    id: opts.id,
    hostId: opts.hostId,
    status: "waiting",
    players: [
      {
        id: opts.hostId,
        name: opts.hostName,
        hand: [],
        isReady: false,
        saidUno: false,
        connected: true,
      },
    ],
    drawPile: [],
    discardPile: [],
    turnIndex: 0,
    direction: 1,
    pendingAction: null,
    winnerId: null,
    log: [`${opts.hostName} created the room`],
    createdAt: now,
    updatedAt: now,
  };
}

export function startGame(game: Game): Game {
  if (game.players.length < 2) {
    throw new Error("Need at least 2 players to start");
  }
  const deck = shuffle(buildDeck(), `s${Date.now()}`);
  const players = game.players.map((p) => ({
    ...p,
    hand: [] as Card[],
    saidUno: false,
    isReady: true,
  }));

  // Deal 7 to each
  for (let r = 0; r < STARTING_HAND_SIZE; r++) {
    for (const p of players) {
      const c = deck.pop();
      if (c) p.hand.push(c);
    }
  }

  // First discard: keep drawing until we get a plain wild (so no first-turn action chaos)
  let firstDiscard: Card | undefined;
  const buried: Card[] = [];
  while (deck.length) {
    const c = deck.pop()!;
    if (c.type === "wild") {
      firstDiscard = c;
      break;
    }
    buried.push(c);
  }
  if (!firstDiscard) {
    // extreme edge case — just take any
    firstDiscard = buried.pop();
  }
  // Reshuffle the buried action cards back into draw pile
  const drawPile = shuffle([...deck, ...buried], `r${Date.now()}`);

  const startTurn = Math.floor(Math.random() * players.length);

  return {
    ...game,
    status: "active",
    players,
    drawPile,
    discardPile: firstDiscard ? [firstDiscard] : [],
    turnIndex: startTurn,
    direction: 1,
    pendingAction: null,
    winnerId: null,
    log: [...game.log, `Game started — ${players[startTurn].name} goes first`],
    updatedAt: Date.now(),
  };
}

/**
 * Compute the next turnIndex.
 * @param skipCount how many additional players to skip (0 = normal advance)
 */
export function nextTurn(
  turnIndex: number,
  direction: 1 | -1,
  playerCount: number,
  skipCount = 0,
): number {
  const step = 1 + skipCount;
  const raw = turnIndex + step * direction;
  return ((raw % playerCount) + playerCount) % playerCount;
}

export function drawCards(
  drawPile: Card[],
  discardPile: Card[],
  count: number,
): { drawPile: Card[]; discardPile: Card[]; drawn: Card[] } {
  let pile = drawPile.slice();
  let discard = discardPile.slice();
  const drawn: Card[] = [];

  for (let i = 0; i < count; i++) {
    if (pile.length === 0) {
      // Reshuffle: keep the top of discard, shuffle the rest into draw pile
      if (discard.length <= 1) break;
      const top = discard[discard.length - 1];
      const rest = discard.slice(0, -1);
      pile = shuffle(rest, `re${Date.now()}-${i}`);
      discard = [top];
    }
    const c = pile.pop();
    if (c) drawn.push(c);
  }

  return { drawPile: pile, discardPile: discard, drawn };
}

export function indexOfPlayer(players: Player[], id: string): number {
  return players.findIndex((p) => p.id === id);
}
