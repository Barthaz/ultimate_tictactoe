import { useEffect, useMemo, useState } from "react";
import { io, Socket } from "socket.io-client";
import { trackEvent } from "../lib/analytics";
import type {
  CreateSessionAck,
  GameErrorEvent,
  GameMode,
  GameSession,
  JoinSessionAck,
  PlayerSymbol,
  ServerInfoEvent,
  SessionJoinedEvent,
  SessionStateEvent,
} from "@uttt/shared";

const serverUrl = import.meta.env.VITE_SERVER_URL ?? "http://localhost:3001";
const SOCKET_EVENTS = {
  SERVER_INFO: "server:info",
  SESSION_CREATE: "session:create",
  SESSION_JOIN: "session:join",
  SESSION_STATE: "session:state",
  SESSION_JOINED: "session:joined",
  MOVE_PLAY: "move:play",
  GAME_ERROR: "game:error",
} as const;

type GameSocketState = {
  mode: GameMode;
  joinCode: string;
  mySymbol: PlayerSymbol;
  session: GameSession | null;
  statusMessage: string;
  protocolVersion: string | null;
  isServerReady: boolean;
  canPlay: boolean;
  setMode: (mode: GameMode) => void;
  setJoinCode: (code: string) => void;
  createSession: () => void;
  joinSession: () => void;
  playMove: (boardIndex: number, cellIndex: number) => void;
  resetClientState: () => void;
};

export function useGameSocket(): GameSocketState {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [session, setSession] = useState<GameSession | null>(null);
  const [mode, setMode] = useState<GameMode>("local");
  const [joinCode, setJoinCode] = useState("");
  const [mySymbol, setMySymbol] = useState<PlayerSymbol>("X");
  const [statusMessage, setStatusMessage] = useState("Wybierz tryb i rozpocznij grę.");
  const [protocolVersion, setProtocolVersion] = useState<string | null>(null);
  const [isServerReady, setIsServerReady] = useState(false);

  useEffect(() => {
    const s = io(serverUrl, { transports: ["websocket"] });
    setSocket(s);

    s.on(SOCKET_EVENTS.SERVER_INFO, (payload: ServerInfoEvent) => {
      setProtocolVersion(payload.protocolVersion);
      setIsServerReady(true);
    });
    s.on(SOCKET_EVENTS.SESSION_STATE, (payload: SessionStateEvent) => {
      setSession(payload.session);
    });
    s.on(SOCKET_EVENTS.SESSION_JOINED, (_payload: SessionJoinedEvent) => {
      setStatusMessage("Drugi gracz dołączył.");
    });
    s.on(SOCKET_EVENTS.GAME_ERROR, (payload: GameErrorEvent) => {
      setStatusMessage(payload.message);
    });
    s.on("disconnect", () => {
      setIsServerReady(false);
    });
    s.on("connect_error", () => {
      setIsServerReady(false);
    });

    return () => {
      s.disconnect();
    };
  }, []);

  const canPlay = useMemo(() => {
    if (!session) return false;
    if (session.mode === "local") return true;
    return session.game.currentPlayer === mySymbol;
  }, [mySymbol, session]);

  const createSession = () => {
    if (!socket) return;
    socket.emit(SOCKET_EVENTS.SESSION_CREATE, { mode }, (ack: CreateSessionAck) => {
      if (!ack.ok) {
        setStatusMessage(ack.message ?? "Nie udało się utworzyć sesji.");
        return;
      }
      setMySymbol(ack.playerSymbol);
      setStatusMessage(`Sesja ${ack.sessionId} gotowa.`);
      trackEvent("start_game", {
        mode,
        session_id: ack.sessionId,
        player_symbol: ack.playerSymbol,
      });
    });
  };

  const joinSession = () => {
    if (!socket || !joinCode.trim()) return;
    socket.emit(
      SOCKET_EVENTS.SESSION_JOIN,
      { sessionId: joinCode.trim().toUpperCase() },
      (ack: JoinSessionAck) => {
      if (!ack.ok) {
        setStatusMessage(ack.message ?? "Nie udało się dołączyć.");
        return;
      }
      setMySymbol(ack.playerSymbol);
      setStatusMessage(`Dołączono do sesji ${ack.sessionId}.`);
      trackEvent("join_game", {
        mode: "online",
        session_id: ack.sessionId,
        player_symbol: ack.playerSymbol,
      });
      }
    );
  };

  const playMove = (boardIndex: number, cellIndex: number) => {
    if (!socket || !session || !canPlay || session.game.status !== "playing") return;
    socket.emit(SOCKET_EVENTS.MOVE_PLAY, { sessionId: session.id, boardIndex, cellIndex });
  };

  const resetClientState = () => {
    setSession(null);
    setJoinCode("");
    setMySymbol("X");
    setStatusMessage("Wybierz tryb i rozpocznij grę.");
  };

  return {
    mode,
    joinCode,
    mySymbol,
    session,
    statusMessage,
    protocolVersion,
    isServerReady,
    canPlay,
    setMode,
    setJoinCode,
    createSession,
    joinSession,
    playMove,
    resetClientState,
  };
}
