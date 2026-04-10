import cors from "cors";
import express from "express";
import http from "http";
import { Server } from "socket.io";
import {
  CreateSessionAck,
  CreateSessionPayload,
  GameErrorEvent,
  JoinSessionAck,
  JoinSessionPayload,
  PlayMovePayload,
  PROTOCOL_VERSION,
  SOCKET_EVENTS,
  TrainingDifficulty,
  ServerInfoEvent,
  SessionJoinedEvent,
  SessionStateEvent,
} from "@uttt/shared";
import { chooseAiMove } from "./game/ai";
import { applyMove, createInitialGameState } from "./game/engine";
import { GameMode, GameSession, PlayerSymbol } from "./game/types";

const app = express();
app.use(cors({ origin: "*" }));
app.get("/health", (_req, res) => res.json({ ok: true }));
app.get("/protocol", (_req, res) =>
  res.json({
    protocolVersion: PROTOCOL_VERSION,
    events: SOCKET_EVENTS,
  })
);

const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

const sessions = new Map<string, GameSession>();

io.on("connection", (socket) => {
  const serverInfo: ServerInfoEvent = {
    protocolVersion: PROTOCOL_VERSION,
    serverTime: Date.now(),
  };
  socket.emit(SOCKET_EVENTS.SERVER_INFO, serverInfo);

  socket.on(
    SOCKET_EVENTS.SESSION_CREATE,
    ({ mode, trainingDifficulty }: CreateSessionPayload, callback: (ack: CreateSessionAck) => void) => {
    try {
      if (!["local", "training", "online"].includes(mode)) {
        throw new Error("Niepoprawny tryb gry.");
      }
      if (
        mode === "training" &&
        trainingDifficulty &&
        !["normal", "hardcore"].includes(trainingDifficulty)
      ) {
        throw new Error("Niepoprawny poziom treningu.");
      }

      const sessionId = generateSessionId();
      const resolvedDifficulty: TrainingDifficulty | null =
        mode === "training" ? (trainingDifficulty ?? "normal") : null;
      const session: GameSession = {
        id: sessionId,
        mode,
        trainingDifficulty: resolvedDifficulty,
        game: createInitialGameState(),
        players: {
          X: socket.id,
          O: mode === "local" ? socket.id : null,
        },
        createdAt: Date.now(),
      };

      sessions.set(sessionId, session);
      socket.join(sessionId);
      callback?.({ ok: true, sessionId, playerSymbol: "X" });
      broadcastState(sessionId);
    } catch (error) {
      callback?.({ ok: false, message: toMessage(error) });
    }
    }
  );

  socket.on(
    SOCKET_EVENTS.SESSION_JOIN,
    ({ sessionId }: JoinSessionPayload, callback: (ack: JoinSessionAck) => void) => {
      try {
        const session = getSession(sessionId);
        if (session.mode !== "online") {
          throw new Error("Dołączyć można tylko do gry online.");
        }
        if (session.players.O && session.players.O !== socket.id) {
          throw new Error("Pokój jest już pełny.");
        }

        session.players.O = socket.id;
        socket.join(sessionId);
        callback?.({ ok: true, sessionId, playerSymbol: "O" });
        const payload: SessionJoinedEvent = { sessionId };
        io.to(sessionId).emit(SOCKET_EVENTS.SESSION_JOINED, payload);
        broadcastState(sessionId);
      } catch (error) {
        callback?.({ ok: false, message: toMessage(error) });
      }
    }
  );

  socket.on(
    SOCKET_EVENTS.MOVE_PLAY,
    ({ sessionId, boardIndex, cellIndex }: PlayMovePayload) => {
      try {
        const session = getSession(sessionId);
        const player = resolvePlayerForMove(session, socket.id);

        if (!player) {
          throw new Error("Nie należysz do tej sesji.");
        }
        if (session.mode === "online" && !session.players.O) {
          throw new Error("Czekamy na drugiego gracza.");
        }

        session.game = applyMove(session.game, { boardIndex, cellIndex, player });
        broadcastState(sessionId);

        if (
          session.mode === "training" &&
          session.game.status === "playing" &&
          session.game.currentPlayer === "O"
        ) {
          setTimeout(() => {
            const latest = sessions.get(sessionId);
            if (
              !latest ||
              latest.game.status !== "playing" ||
              latest.game.currentPlayer !== "O" ||
              latest.mode !== "training"
            ) {
              return;
            }
            const aiMove = chooseAiMove(latest.game, latest.trainingDifficulty ?? "normal");
            latest.game = applyMove(latest.game, aiMove);
            broadcastState(sessionId);
          }, 350);
        }
      } catch (error) {
        const payload: GameErrorEvent = { message: toMessage(error) };
        socket.emit(SOCKET_EVENTS.GAME_ERROR, payload);
      }
    }
  );

  socket.on("disconnect", () => {
    for (const session of sessions.values()) {
      const wasPlayer = session.players.X === socket.id || session.players.O === socket.id;
      if (!wasPlayer) {
        continue;
      }
      const payload: GameErrorEvent = { message: "Jeden z graczy rozłączył się z serwerem." };
      io.to(session.id).emit(SOCKET_EVENTS.GAME_ERROR, payload);
      if (session.mode === "online") {
        if (session.players.X === socket.id) {
          session.players.X = null;
        }
        if (session.players.O === socket.id) {
          session.players.O = null;
        }
      }
    }
  });
});

function broadcastState(sessionId: string): void {
  const session = getSession(sessionId);
  const payload: SessionStateEvent = { session };
  io.to(sessionId).emit(SOCKET_EVENTS.SESSION_STATE, payload);
}

function getSession(sessionId: string): GameSession {
  const session = sessions.get(sessionId);
  if (!session) {
    throw new Error("Nie znaleziono sesji.");
  }
  return session;
}

function getPlayerSymbolForSocket(session: GameSession, socketId: string): PlayerSymbol | null {
  if (session.players.X === socketId) {
    return "X";
  }
  if (session.players.O === socketId) {
    return "O";
  }
  return null;
}

function resolvePlayerForMove(session: GameSession, socketId: string): PlayerSymbol | null {
  // In local mode one socket controls both turns, so symbol comes from current game turn.
  if (session.mode === "local" && session.players.X === socketId) {
    return session.game.currentPlayer;
  }
  return getPlayerSymbolForSocket(session, socketId);
}

function generateSessionId(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i += 1) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  if (sessions.has(code)) {
    return generateSessionId();
  }
  return code;
}

function toMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return "Wystąpił nieznany błąd.";
}

const PORT = Number(process.env.PORT ?? 3001);
httpServer.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`UTTT server listening on port ${PORT}`);
});
