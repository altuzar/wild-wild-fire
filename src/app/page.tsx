"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Flame, Plus, LogIn } from "lucide-react";
import { useAuth, loadName, saveName } from "@/lib/useAuth";
import { createRoom } from "@/lib/actions";
import { currentMode } from "@/lib/store";

export default function HomePage() {
  const router = useRouter();
  const { user, error: authError } = useAuth();
  const [name, setName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [mode, setMode] = useState<"firebase" | "local" | null>(null);

  useEffect(() => {
    setName(loadName());
    setMode(currentMode());
  }, []);

  const handleCreate = async () => {
    if (!user) return;
    if (!name.trim()) {
      setError("Pick a name first");
      return;
    }
    setBusy(true);
    setError(null);
    saveName(name.trim());
    try {
      const id = await createRoom({ hostId: user.uid, hostName: name.trim() });
      router.push(`/game/${id}`);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
      setBusy(false);
    }
  };

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Pick a name first");
      return;
    }
    const id = joinCode.trim().toUpperCase();
    if (!id) {
      setError("Enter a room code");
      return;
    }
    saveName(name.trim());
    router.push(`/game/${id}`);
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center gap-10 p-8">
      {mode === "local" && (
        <div className="rounded-xl border border-amber-500/40 bg-amber-900/30 px-4 py-2 text-center text-xs text-amber-200">
          <strong className="text-amber-100">Local mode</strong> — no Firebase
          configured. Multi-tab on this machine only. Open another tab and join
          with the room code to play yourself.
        </div>
      )}
      <div className="flex flex-col items-center gap-3">
        <div className="flex items-center gap-3">
          <Flame className="h-12 w-12 text-flame-500 animate-flicker" />
          <h1 className="fire-text text-5xl font-black tracking-tight md:text-6xl">
            Wild Wild Fire
          </h1>
          <Flame className="h-12 w-12 text-flame-500 animate-flicker" />
        </div>
        <p className="max-w-md text-center text-sm text-amber-100/70">
          Multiplayer Uno All Wild. Every card is a wild. Every move could burn
          everything down.
        </p>
      </div>

      <div className="w-full max-w-md rounded-3xl border border-flame-700/50 bg-ember-800/60 p-6 shadow-[0_0_60px_-20px_rgba(249,115,22,0.45)] backdrop-blur">
        <label className="mb-1 block text-xs uppercase tracking-widest text-amber-300/70">
          Your name
        </label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value.slice(0, 20))}
          placeholder="Pyromancer"
          className="mb-5 w-full rounded-xl border border-flame-700/40 bg-ember-900/70 px-4 py-3 text-lg outline-none focus:border-flame-500"
        />

        <button
          onClick={handleCreate}
          disabled={busy || !user}
          className="mb-4 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-flame-600 to-rose-600 py-3 font-bold text-amber-50 transition hover:brightness-110 disabled:brightness-50"
        >
          <Plus className="h-5 w-5" />
          {busy ? "Lighting up…" : "Create new room"}
        </button>

        <div className="my-4 flex items-center gap-3 text-xs uppercase tracking-widest text-amber-300/40">
          <span className="h-px flex-1 bg-flame-700/40" />
          or join
          <span className="h-px flex-1 bg-flame-700/40" />
        </div>

        <form onSubmit={handleJoin} className="flex gap-2">
          <input
            value={joinCode}
            onChange={(e) =>
              setJoinCode(e.target.value.toUpperCase().slice(0, 6))
            }
            placeholder="ROOM CODE"
            className="flex-1 rounded-xl border border-flame-700/40 bg-ember-900/70 px-4 py-3 text-center font-mono text-lg tracking-[0.3em] outline-none focus:border-flame-500"
          />
          <button
            type="submit"
            className="rounded-xl bg-amber-100/10 px-4 text-amber-100 transition hover:bg-amber-100/20"
          >
            <LogIn className="h-5 w-5" />
          </button>
        </form>

        {error && (
          <p className="mt-4 rounded-lg bg-red-900/50 p-3 text-sm text-red-200">
            {error}
          </p>
        )}
        {authError && (
          <p className="mt-4 rounded-lg bg-red-900/50 p-3 text-xs text-red-200">
            Auth: {authError}. Make sure Anonymous sign-in is enabled in
            Firebase.
          </p>
        )}
      </div>

      <p className="text-xs text-amber-300/40">
        {user ? `auth ✓ ${user.uid.slice(0, 6)}` : "connecting…"}
      </p>
    </main>
  );
}
