"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Flame } from "lucide-react";
import { useAuth, loadName } from "@/lib/useAuth";
import { useGame } from "@/lib/useGame";
import { useBotDriver } from "@/lib/useBotDriver";
import { joinRoom, leaveRoom } from "@/lib/actions";
import { Lobby } from "@/components/Lobby";
import { GameBoard } from "@/components/GameBoard";

export default function GameRoomPage({
  params,
}: {
  params: { roomId: string };
}) {
  const roomId = params.roomId.toUpperCase();
  const { user, error: authError } = useAuth();
  const { game, error: gameError, loading } = useGame(roomId);
  const [joinError, setJoinError] = useState<string | null>(null);
  const joinedRef = useRef(false);

  // Auto-join the room when auth + game are ready
  useEffect(() => {
    if (!user || !game || joinedRef.current) return;
    const already = game.players.some((p) => p.id === user.uid);
    const name = loadName() || `Player-${user.uid.slice(0, 4)}`;
    joinedRef.current = true;
    if (!already) {
      joinRoom(roomId, user.uid, name).catch((e) =>
        setJoinError(e instanceof Error ? e.message : String(e)),
      );
    }
  }, [user, game, roomId]);

  useBotDriver(game, user?.uid ?? null);

  // Mark disconnected on unmount
  useEffect(() => {
    if (!user) return;
    const handler = () => {
      leaveRoom(roomId, user.uid).catch(() => {});
    };
    window.addEventListener("beforeunload", handler);
    return () => {
      window.removeEventListener("beforeunload", handler);
    };
  }, [user, roomId]);

  if (loading || !user) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-amber-200/70">
          <Flame className="h-10 w-10 animate-flicker text-flame-500" />
          <p>Lighting up…</p>
        </div>
      </main>
    );
  }

  if (gameError || !game) {
    return (
      <main className="flex min-h-screen items-center justify-center p-6">
        <div className="max-w-sm rounded-2xl border border-red-700/40 bg-red-900/30 p-6 text-center">
          <p className="mb-3 font-bold text-red-200">
            {gameError ?? "Couldn't load room"}
          </p>
          <Link
            href="/"
            className="rounded-lg bg-flame-600 px-4 py-2 text-sm font-bold text-amber-50 hover:bg-flame-500"
          >
            Back home
          </Link>
        </div>
      </main>
    );
  }

  if (authError) {
    return (
      <main className="flex min-h-screen items-center justify-center p-6">
        <p className="text-red-200">{authError}</p>
      </main>
    );
  }

  return (
    <>
      {joinError && (
        <p className="bg-red-900/60 p-2 text-center text-sm text-red-200">
          {joinError}
        </p>
      )}
      {game.status === "waiting" ? (
        <Lobby game={game} youId={user.uid} />
      ) : (
        <GameBoard game={game} youId={user.uid} />
      )}
    </>
  );
}
