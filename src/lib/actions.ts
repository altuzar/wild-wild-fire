"use client";

import type { BotDifficulty, Game } from "./types";
import { makeBot, pickBotName } from "./bots";
import {
  STARTING_HAND_SIZE,
  createInitialGame,
  drawCards,
  indexOfPlayer,
  nextTurn,
  startGame as startGameState,
} from "./gameLogic";
import { requiresTarget } from "./cards";
import { getStore } from "./store";

export function newRoomId(): string {
  // 6 chars, easy to share, no ambiguous 0/O/I/1
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 6; i++) {
    s += chars[Math.floor(Math.random() * chars.length)];
  }
  return s;
}

export async function createRoom(opts: {
  hostId: string;
  hostName: string;
}): Promise<string> {
  const id = newRoomId();
  const game = createInitialGame({ id, hostId: opts.hostId, hostName: opts.hostName });
  await getStore().set(id, game);
  return id;
}

function logPush(game: Game, line: string) {
  game.log.push(line);
  if (game.log.length > 60) game.log.splice(0, game.log.length - 60);
}

export async function joinRoom(roomId: string, playerId: string, playerName: string) {
  await getStore().transact(roomId, (current) => {
    if (!current) throw new Error("Room not found");
    const game = clone(current);
    if (game.status !== "waiting") {
      const existing = game.players.find((p) => p.id === playerId);
      if (!existing) throw new Error("Game already started");
      existing.connected = true;
      return game;
    }
    if (game.players.length >= 8) throw new Error("Room is full");
    if (!game.players.find((p) => p.id === playerId)) {
      game.players.push({
        id: playerId,
        name: playerName || "Player",
        hand: [],
        isReady: false,
        saidUno: false,
        connected: true,
      });
      logPush(game, `${playerName} joined`);
    }
    return game;
  });
}

export async function addBot(
  roomId: string,
  hostId: string,
  difficulty: BotDifficulty,
) {
  await getStore().transact(roomId, (current) => {
    if (!current) throw new Error("Room not found");
    const game = clone(current);
    if (game.hostId !== hostId) throw new Error("Only host can add bots");
    if (game.status !== "waiting") throw new Error("Can't add bots mid-game");
    if (game.players.length >= 8) throw new Error("Room is full");
    const name = pickBotName(game.players.map((p) => p.name));
    const bot = makeBot(difficulty, name);
    game.players.push(bot);
    logPush(game, `${bot.name} joined`);
    return game;
  });
}

export async function removeBot(roomId: string, hostId: string, botId: string) {
  await getStore().transact(roomId, (current) => {
    if (!current) throw new Error("Room not found");
    const game = clone(current);
    if (game.hostId !== hostId) throw new Error("Only host can remove bots");
    if (game.status !== "waiting") throw new Error("Can't remove bots mid-game");
    const idx = game.players.findIndex((p) => p.id === botId && p.isBot);
    if (idx < 0) throw new Error("Bot not found");
    const removed = game.players[idx];
    game.players.splice(idx, 1);
    logPush(game, `${removed.name} left`);
    return game;
  });
}

export async function setReady(roomId: string, playerId: string, ready: boolean) {
  await getStore().transact(roomId, (current) => {
    if (!current) throw new Error("Room not found");
    const game = clone(current);
    const p = game.players.find((p) => p.id === playerId);
    if (!p) throw new Error("Not in this room");
    p.isReady = ready;
    return game;
  });
}

export async function setName(roomId: string, playerId: string, name: string) {
  await getStore().transact(roomId, (current) => {
    if (!current) throw new Error("Room not found");
    const game = clone(current);
    const p = game.players.find((p) => p.id === playerId);
    if (!p) throw new Error("Not in this room");
    p.name = name.slice(0, 20) || "Player";
    return game;
  });
}

export async function startGame(roomId: string, hostId: string) {
  await getStore().transact(roomId, (current) => {
    if (!current) throw new Error("Room not found");
    if (current.hostId !== hostId) throw new Error("Only host can start");
    if (current.players.length < 2) throw new Error("Need at least 2 players");
    if (!current.players.every((p) => p.isReady)) {
      throw new Error("All players must be ready");
    }
    return startGameState(clone(current));
  });
}

export async function leaveRoom(roomId: string, playerId: string) {
  await getStore().transact(roomId, (current) => {
    if (!current) throw new Error("Room not found");
    const game = clone(current);
    const idx = indexOfPlayer(game.players, playerId);
    if (idx < 0) return game;
    const p = game.players[idx];
    if (game.status === "waiting") {
      game.players.splice(idx, 1);
      logPush(game, `${p.name} left`);
      if (game.hostId === playerId && game.players.length) {
        game.hostId = game.players[0].id;
      }
    } else {
      p.connected = false;
      logPush(game, `${p.name} disconnected`);
    }
    return game;
  });
}

export interface PlayOptions {
  targetId?: string;
}

export async function playCard(
  roomId: string,
  playerId: string,
  cardId: string,
  opts: PlayOptions = {},
) {
  await getStore().transact(roomId, (current) => {
    if (!current) throw new Error("Room not found");
    const game = clone(current);
    if (game.status !== "active") throw new Error("Game not active");
    const idx = indexOfPlayer(game.players, playerId);
    if (idx < 0) throw new Error("Not in this room");
    if (idx !== game.turnIndex) throw new Error("Not your turn");

    const player = game.players[idx];
    const cardIdx = player.hand.findIndex((c) => c.id === cardId);
    if (cardIdx < 0) throw new Error("Card not in hand");
    const card = player.hand[cardIdx];

    if (requiresTarget(card.type) && !opts.targetId) {
      throw new Error("This card requires a target");
    }
    if (opts.targetId && opts.targetId === playerId) {
      throw new Error("Pick someone other than yourself");
    }

    player.hand.splice(cardIdx, 1);
    game.discardPile.push(card);

    if (player.hand.length !== 1) player.saidUno = false;

    if (player.hand.length === 0) {
      game.status = "finished";
      game.winnerId = player.id;
      logPush(game, `${player.name} won!`);
      return game;
    }

    let skip = 0;
    let logLine = `${player.name} played ${prettyCard(card.type)}`;

    switch (card.type) {
      case "wild":
        break;
      case "wild_skip":
        skip = 1;
        break;
      case "wild_skip_two":
        skip = 2;
        break;
      case "wild_reverse":
        game.direction = (game.direction * -1) as 1 | -1;
        if (game.players.length === 2) skip = 1;
        break;
      case "wild_draw_two": {
        const victimIdx = nextTurn(game.turnIndex, game.direction, game.players.length, 0);
        const victim = game.players[victimIdx];
        const { drawPile, discardPile, drawn } = drawCards(
          game.drawPile,
          game.discardPile,
          2,
        );
        game.drawPile = drawPile;
        game.discardPile = discardPile;
        victim.hand.push(...drawn);
        if (victim.hand.length !== 1) victim.saidUno = false;
        skip = 1;
        logLine += ` → ${victim.name} draws 2 + skip`;
        break;
      }
      case "wild_targeted_draw_two": {
        const target = game.players.find((p) => p.id === opts.targetId);
        if (!target) throw new Error("Target not found");
        const { drawPile, discardPile, drawn } = drawCards(
          game.drawPile,
          game.discardPile,
          2,
        );
        game.drawPile = drawPile;
        game.discardPile = discardPile;
        target.hand.push(...drawn);
        if (target.hand.length !== 1) target.saidUno = false;
        logLine += ` on ${target.name} (+2, no skip)`;
        break;
      }
      case "wild_draw_four": {
        const victimIdx = nextTurn(game.turnIndex, game.direction, game.players.length, 0);
        const victim = game.players[victimIdx];
        const { drawPile, discardPile, drawn } = drawCards(
          game.drawPile,
          game.discardPile,
          4,
        );
        game.drawPile = drawPile;
        game.discardPile = discardPile;
        victim.hand.push(...drawn);
        if (victim.hand.length !== 1) victim.saidUno = false;
        skip = 1;
        logLine += ` → ${victim.name} draws 4 + skip`;
        break;
      }
      case "wild_forced_swap": {
        const target = game.players.find((p) => p.id === opts.targetId);
        if (!target) throw new Error("Target not found");
        const tmp = player.hand;
        player.hand = target.hand;
        target.hand = tmp;
        if (player.hand.length !== 1) player.saidUno = false;
        if (target.hand.length !== 1) target.saidUno = false;
        logLine += ` swapping hands with ${target.name}`;
        if (player.hand.length === 0) {
          game.status = "finished";
          game.winnerId = player.id;
          logPush(game, logLine);
          logPush(game, `${player.name} won!`);
          return game;
        }
        if (target.hand.length === 0) {
          game.status = "finished";
          game.winnerId = target.id;
          logPush(game, logLine);
          logPush(game, `${target.name} won!`);
          return game;
        }
        break;
      }
    }

    logPush(game, logLine);
    game.turnIndex = nextTurn(
      game.turnIndex,
      game.direction,
      game.players.length,
      skip,
    );
    return game;
  });
}

export async function drawCard(roomId: string, playerId: string) {
  await getStore().transact(roomId, (current) => {
    if (!current) throw new Error("Room not found");
    const game = clone(current);
    if (game.status !== "active") throw new Error("Game not active");
    const idx = indexOfPlayer(game.players, playerId);
    if (idx !== game.turnIndex) throw new Error("Not your turn");
    const player = game.players[idx];

    const { drawPile, discardPile, drawn } = drawCards(
      game.drawPile,
      game.discardPile,
      1,
    );
    if (drawn.length === 0) throw new Error("Deck empty");
    game.drawPile = drawPile;
    game.discardPile = discardPile;
    player.hand.push(...drawn);
    if (player.hand.length !== 1) player.saidUno = false;
    logPush(game, `${player.name} drew a card`);

    game.turnIndex = nextTurn(game.turnIndex, game.direction, game.players.length, 0);
    return game;
  });
}

export async function sayUno(roomId: string, playerId: string) {
  await getStore().transact(roomId, (current) => {
    if (!current) throw new Error("Room not found");
    const game = clone(current);
    const p = game.players.find((p) => p.id === playerId);
    if (!p) throw new Error("Not in this room");
    if (p.hand.length > 2) throw new Error("Too many cards to call UNO");
    p.saidUno = true;
    logPush(game, `${p.name} called UNO!`);
    return game;
  });
}

export async function challengeUno(
  roomId: string,
  challengerId: string,
  targetId: string,
) {
  await getStore().transact(roomId, (current) => {
    if (!current) throw new Error("Room not found");
    const game = clone(current);
    if (game.status !== "active") throw new Error("Game not active");
    if (challengerId === targetId) throw new Error("Challenge someone else");
    const target = game.players.find((p) => p.id === targetId);
    const challenger = game.players.find((p) => p.id === challengerId);
    if (!target || !challenger) throw new Error("Player not found");
    if (target.hand.length !== 1 || target.saidUno) {
      throw new Error("No valid challenge");
    }
    const { drawPile, discardPile, drawn } = drawCards(
      game.drawPile,
      game.discardPile,
      2,
    );
    game.drawPile = drawPile;
    game.discardPile = discardPile;
    target.hand.push(...drawn);
    target.saidUno = false;
    logPush(game, `${challenger.name} caught ${target.name} sleeping → +2`);
    return game;
  });
}

export async function resetToLobby(roomId: string, hostId: string) {
  await getStore().transact(roomId, (current) => {
    if (!current) throw new Error("Room not found");
    const game = clone(current);
    if (game.hostId !== hostId) throw new Error("Only host can reset");
    game.status = "waiting";
    game.players = game.players.map((p) => ({
      ...p,
      hand: [],
      isReady: false,
      saidUno: false,
    }));
    game.drawPile = [];
    game.discardPile = [];
    game.turnIndex = 0;
    game.direction = 1;
    game.pendingAction = null;
    game.winnerId = null;
    logPush(game, "Returned to lobby");
    return game;
  });
}

function clone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v));
}

function prettyCard(t: string) {
  return t.replace(/_/g, " ").replace("wild ", "");
}

export { STARTING_HAND_SIZE };
