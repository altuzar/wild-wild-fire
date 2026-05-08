"use client";

import {
  doc,
  onSnapshot,
  runTransaction,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { getFirebase } from "./firebase";
import type { Game } from "./types";
import type { GameStore } from "./store";

const COLLECTION = "games";

export const firebaseStore: GameStore = {
  async get(id) {
    const { db } = getFirebase();
    return runTransaction(db, async (tx) => {
      const snap = await tx.get(doc(db, COLLECTION, id));
      return snap.exists() ? (snap.data() as Game) : null;
    });
  },
  async set(id, game) {
    const { db } = getFirebase();
    await setDoc(doc(db, COLLECTION, id), { ...game, _ts: serverTimestamp() });
  },
  subscribe(id, cb) {
    const { db } = getFirebase();
    return onSnapshot(
      doc(db, COLLECTION, id),
      (snap) => cb(snap.exists() ? (snap.data() as Game) : null),
      () => cb(null),
    );
  },
  async transact(id, fn) {
    const { db } = getFirebase();
    return runTransaction(db, async (tx) => {
      const ref = doc(db, COLLECTION, id);
      const snap = await tx.get(ref);
      const current = snap.exists() ? (snap.data() as Game) : null;
      const next = fn(current);
      if (!next) throw new Error("Transaction returned no game");
      next.updatedAt = Date.now();
      tx.set(ref, { ...next, _ts: serverTimestamp() });
      return next;
    });
  },
};
