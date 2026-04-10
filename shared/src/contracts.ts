export const PROTOCOL_VERSION = "1.0.0";
export const SOCKET_EVENTS = {
  SERVER_INFO: "server:info",
  SESSION_CREATE: "session:create",
  SESSION_JOIN: "session:join",
  SESSION_STATE: "session:state",
  SESSION_JOINED: "session:joined",
  MOVE_PLAY: "move:play",
  GAME_ERROR: "game:error",
} as const;

export type PlayerSymbol = "X" | "O";
export type TrainingDifficulty = "normal" | "hardcore";
export type GameMode = "local" | "training" | "online";
export type CellValue = PlayerSymbol | null;
export type SmallBoardWinner = PlayerSymbol | "D" | null;
export type GameWinner = PlayerSymbol | "D" | null;

export type Move = {
  boardIndex: number;
  cellIndex: number;
  player: PlayerSymbol;
};

export type GameState = {
  boards: CellValue[][];
  smallBoardWinners: SmallBoardWinner[];
  activeBoard: number | null;
  currentPlayer: PlayerSymbol;
  status: "playing" | "finished";
  winner: GameWinner;
  moveCount: number;
  lastMove: Move | null;
};

export type GameSession = {
  id: string;
  mode: GameMode;
  trainingDifficulty?: TrainingDifficulty | null;
  game: GameState;
  players: {
    X: string | null;
    O: string | null;
  };
  createdAt: number;
};

export type AckOk<T> = { ok: true } & T;
export type AckError = { ok: false; message: string };

export type CreateSessionPayload = {
  mode: GameMode;
  trainingDifficulty?: TrainingDifficulty;
};
export type CreateSessionAck = AckOk<{ sessionId: string; playerSymbol: PlayerSymbol }> | AckError;

export type JoinSessionPayload = { sessionId: string };
export type JoinSessionAck = AckOk<{ sessionId: string; playerSymbol: PlayerSymbol }> | AckError;

export type PlayMovePayload = { sessionId: string; boardIndex: number; cellIndex: number };

export type SessionStateEvent = { session: GameSession };
export type SessionJoinedEvent = { sessionId: string };
export type GameErrorEvent = { message: string };
export type ServerInfoEvent = { protocolVersion: string; serverTime: number };
