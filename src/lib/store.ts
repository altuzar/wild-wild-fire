"use client";

import type { Game } from "./types";

export interface GameStore {
  get(id: string): Promise<Game | null>;
  set(id: string, game: Game): Promise<void>;
  subscribe(
    id: string,
    cb: (game: Game | null) => void,
  ): () => void;
  transact(
    id: string,
    fn: (current: Game | null) => Game | null,
  ): Promise<Game>;
}

export function isFirebaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  );
}

export type Mode = "firebase" | "local";

export function currentMode(): Mode {
  return isFirebaseConfigured() ? "firebase" : "local";
}

let _store: GameStore | null = null;

export function getStore(): GameStore {
  if (_store) return _store;
  if (currentMode() === "firebase") {
    // dynamic require so local-mode users don't need a working firebase config
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { firebaseStore } = require("./firebaseStore") as typeof import("./firebaseStore");
    _store = firebaseStore;
  } else {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { localStore } = require("./localStore") as typeof import("./localStore");
    _store = localStore;
  }
  return _store!;
}
