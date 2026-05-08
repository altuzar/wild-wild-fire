export type CardType =
  | "wild"
  | "wild_skip"
  | "wild_skip_two"
  | "wild_reverse"
  | "wild_draw_two"
  | "wild_targeted_draw_two"
  | "wild_draw_four"
  | "wild_forced_swap";

export interface Card {
  id: string;
  type: CardType;
}

export type BotDifficulty = "easy" | "medium" | "hard";

export interface Player {
  id: string;
  name: string;
  hand: Card[];
  isReady: boolean;
  saidUno: boolean;
  connected: boolean;
  isBot?: boolean;
  botDifficulty?: BotDifficulty;
  avatar?: string;
}

export interface ChatMessage {
  id: string;
  playerId: string;
  playerName: string;
  avatar?: string;
  text: string;
  isBot?: boolean;
  ts: number;
}

export type GameStatus = "waiting" | "active" | "finished";

export interface PendingAction {
  kind: "targeted_draw_two" | "forced_swap";
  byPlayerId: string;
  cardId: string;
}

export interface Game {
  id: string;
  hostId: string;
  status: GameStatus;
  players: Player[];
  drawPile: Card[];
  discardPile: Card[];
  turnIndex: number;
  direction: 1 | -1;
  pendingAction: PendingAction | null;
  winnerId: string | null;
  log: string[];
  chat: ChatMessage[];
  createdAt: number;
  updatedAt: number;
}

export const CARD_LABELS: Record<CardType, string> = {
  wild: "Wild",
  wild_skip: "Skip",
  wild_skip_two: "Skip 2",
  wild_reverse: "Reverse",
  wild_draw_two: "Draw 2",
  wild_targeted_draw_two: "Targeted +2",
  wild_draw_four: "Draw 4",
  wild_forced_swap: "Forced Swap",
};

export const CARD_GRADIENTS: Record<CardType, string> = {
  wild: "from-rose-500 via-orange-500 to-amber-400",
  wild_skip: "from-red-600 via-rose-500 to-orange-400",
  wild_skip_two: "from-red-700 via-red-500 to-orange-500",
  wild_reverse: "from-fuchsia-600 via-orange-500 to-yellow-400",
  wild_draw_two: "from-orange-600 via-amber-500 to-yellow-300",
  wild_targeted_draw_two: "from-rose-600 via-pink-500 to-amber-400",
  wild_draw_four: "from-red-800 via-orange-600 to-yellow-400",
  wild_forced_swap: "from-purple-700 via-fuchsia-500 to-orange-400",
};
