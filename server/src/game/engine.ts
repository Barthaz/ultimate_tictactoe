import { GameState, Move, PlayerSymbol, SmallBoardWinner } from "./types";

const WIN_LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
] as const;

export function createInitialGameState(): GameState {
  return {
    boards: Array.from({ length: 9 }, () => Array.from({ length: 9 }, () => null)),
    smallBoardWinners: Array.from({ length: 9 }, () => null),
    activeBoard: null,
    currentPlayer: "X",
    status: "playing",
    winner: null,
    moveCount: 0,
    lastMove: null,
  };
}

export function getLegalMoves(state: GameState): Move[] {
  if (state.status !== "playing") {
    return [];
  }

  const playableBoards = state.activeBoard !== null
    ? [state.activeBoard]
    : state.smallBoardWinners
        .map((winner, index) => ({ winner, index }))
        .filter((entry) => entry.winner === null)
        .map((entry) => entry.index);

  const moves: Move[] = [];
  for (const boardIndex of playableBoards) {
    const board = state.boards[boardIndex];
    for (let cellIndex = 0; cellIndex < board.length; cellIndex += 1) {
      if (board[cellIndex] === null) {
        moves.push({ boardIndex, cellIndex, player: state.currentPlayer });
      }
    }
  }
  return moves;
}

export function applyMove(state: GameState, move: Move): GameState {
  validateMove(state, move);

  const boards = state.boards.map((b) => [...b]);
  const smallBoardWinners = [...state.smallBoardWinners];
  boards[move.boardIndex][move.cellIndex] = move.player;

  const boardAfterMove = boards[move.boardIndex];
  const smallWinner = getSmallBoardWinner(boardAfterMove);
  if (smallWinner !== null) {
    smallBoardWinners[move.boardIndex] = smallWinner;
  }

  const mainWinner = getMainBoardWinner(smallBoardWinners);
  const moveCount = state.moveCount + 1;
  const allSmallBoardsResolved = smallBoardWinners.every((winner) => winner !== null);
  const isDraw = mainWinner === null && (allSmallBoardsResolved || moveCount >= 81);
  const status = mainWinner || isDraw ? "finished" : "playing";
  const winner = mainWinner ?? (isDraw ? "D" : null);

  const nextActiveBoard =
    status === "finished" ? null : resolveNextActiveBoard(smallBoardWinners, boards, move.cellIndex);

  const nextPlayer: PlayerSymbol = move.player === "X" ? "O" : "X";

  return {
    ...state,
    boards,
    smallBoardWinners,
    activeBoard: nextActiveBoard,
    currentPlayer: status === "finished" ? state.currentPlayer : nextPlayer,
    status,
    winner,
    moveCount,
    lastMove: move,
  };
}

function validateMove(state: GameState, move: Move): void {
  if (state.status !== "playing") {
    throw new Error("Gra jest już zakończona.");
  }
  if (move.player !== state.currentPlayer) {
    throw new Error("Nie jest kolej tego gracza.");
  }
  if (move.boardIndex < 0 || move.boardIndex > 8 || move.cellIndex < 0 || move.cellIndex > 8) {
    throw new Error("Ruch poza planszą.");
  }
  if (state.activeBoard !== null && move.boardIndex !== state.activeBoard) {
    throw new Error("Ruch musi zostać wykonany na aktywnej małej planszy.");
  }
  if (state.smallBoardWinners[move.boardIndex] !== null) {
    throw new Error("Ta mała plansza jest już zakończona.");
  }
  if (state.boards[move.boardIndex][move.cellIndex] !== null) {
    throw new Error("To pole jest już zajęte.");
  }
}

function getSmallBoardWinner(board: Array<PlayerSymbol | null>): SmallBoardWinner {
  for (const [a, b, c] of WIN_LINES) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a];
    }
  }
  const isDraw = board.every((cell) => cell !== null);
  return isDraw ? "D" : null;
}

function getMainBoardWinner(smallWinners: SmallBoardWinner[]): PlayerSymbol | null {
  for (const [a, b, c] of WIN_LINES) {
    const v1 = smallWinners[a];
    const v2 = smallWinners[b];
    const v3 = smallWinners[c];
    if (v1 && v1 !== "D" && v1 === v2 && v2 === v3) {
      return v1;
    }
  }
  return null;
}

function resolveNextActiveBoard(
  smallWinners: SmallBoardWinner[],
  boards: Array<Array<PlayerSymbol | null>>,
  targetBoardIndex: number
): number | null {
  const nextIsPlayable =
    smallWinners[targetBoardIndex] === null &&
    boards[targetBoardIndex].some((cell) => cell === null);
  return nextIsPlayable ? targetBoardIndex : null;
}
