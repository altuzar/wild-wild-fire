"use client";

import type { Game } from "./types";
import type { GameStore } from "./store";

const KEY_PREFIX = "wwf:room:";
const CHANNEL_PREFIX = "wwf:room:";

function key(id: string) {
  return KEY_PREFIX + id;
}

function readGame(id: string): Game | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(key(id));
    return raw ? (JSON.parse(raw) as Game) : null;
  } catch {
    return null;
  }
}

function writeGame(id: string, game: Game) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key(id), JSON.stringify(game));
  // Notify other tabs
  try {
    const ch = new BroadcastChannel(CHANNEL_PREFIX + id);
    ch.postMessage({ kind: "update", at: Date.now() });
    ch.close();
  } catch {
    // Older browsers without BroadcastChannel — storage event will still fire
  }
}

export const localStore: GameStore = {
  async get(id) {
    return readGame(id);
  },
  async set(id, game) {
    writeGame(id, game);
  },
  subscribe(id, cb) {
    if (typeof window === "undefined") return () => {};

    // Initial emit
    cb(readGame(id));

    const onStorage = (e: StorageEvent) => {
      if (e.key === key(id)) cb(readGame(id));
    };
    window.addEventListener("storage", onStorage);

    let ch: BroadcastChannel | null = null;
    try {
      ch = new BroadcastChannel(CHANNEL_PREFIX + id);
      ch.onmessage = () => cb(readGame(id));
    } catch {
      // ignore
    }

    return () => {
      window.removeEventListener("storage", onStorage);
      ch?.close();
    };
  },
  async transact(id, fn) {
    // Local single-machine "transaction" — read latest, mutate, write.
    // BroadcastChannel/storage events keep other tabs in sync.
    const current = readGame(id);
    const next = fn(current);
    if (!next) throw new Error("Transaction returned no game");
    next.updatedAt = Date.now();
    writeGame(id, next);
    return next;
  },
};
