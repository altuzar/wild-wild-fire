"use client";

import { useEffect, useState } from "react";
import { currentMode } from "./store";

export interface SimpleUser {
  uid: string;
}

const NAME_KEY = "wwf:name";
const LOCAL_UID_KEY = "wwf:localUid"; // sessionStorage so each tab is its own player

function genLocalUid() {
  return "local-" + Math.random().toString(36).slice(2, 10);
}

export function getOrCreateLocalUid(): string {
  if (typeof window === "undefined") return "ssr";
  let uid = sessionStorage.getItem(LOCAL_UID_KEY);
  if (!uid) {
    uid = genLocalUid();
    sessionStorage.setItem(LOCAL_UID_KEY, uid);
  }
  return uid;
}

export function useAuth() {
  const [user, setUser] = useState<SimpleUser | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        if (currentMode() === "local") {
          if (!cancelled) setUser({ uid: getOrCreateLocalUid() });
          return;
        }
        // Firebase mode — anon auth
        const { ensureAnonAuth } = await import("./firebase");
        const u = await ensureAnonAuth();
        if (!cancelled) setUser({ uid: u.uid });
      } catch (e: unknown) {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      }
    }

    init();
    return () => {
      cancelled = true;
    };
  }, []);

  return { user, error };
}

export function loadName(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(NAME_KEY) ?? "";
}

export function saveName(name: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(NAME_KEY, name);
}
