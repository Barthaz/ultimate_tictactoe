import { applyMove, getLegalMoves } from "./engine";
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
const INF = 1_000_000;
const SEARCH_TIME_LIMIT_MS = 1200;

type TTEntry = {
  depth: number;
  score: number;
};

export function chooseAiMove(state: GameState): Move {
  const legalMoves = getLegalMoves(state);
  if (legalMoves.length === 0) {
    throw new Error("Brak legalnych ruchów dla AI.");
  }
  const aiPlayer = state.currentPlayer;
  const opponent = getOpponent(aiPlayer);

  // 1) Natychmiastowe zwycięstwo AI.
  const winningMove = legalMoves.find((move) => isImmediateGameWin(state, move, aiPlayer));
  if (winningMove) return winningMove;

  // 2) Blokada natychmiastowego zwycięstwa przeciwnika w następnym ruchu.
  const blockingMove = legalMoves.find((move) => {
    const next = applyMove(state, move);
    const oppMoves = getLegalMoves(next);
    return !oppMoves.some((oppMove) => isImmediateGameWin(next, oppMove, opponent));
  });
  if (blockingMove) return blockingMove;

  // 3) Minimax z odcinaniem alfa-beta na ograniczonym drzewie.
  const depth = chooseSearchDepth(legalMoves.length, state.moveCount);
  const orderedMoves = orderMoves(state, legalMoves, aiPlayer);
  const tt = new Map<string, TTEntry>();
  const deadline = Date.now() + SEARCH_TIME_LIMIT_MS;

  let bestMove = orderedMoves[0];
  // Iteracyjne pogłębianie: zwraca najlepszy stabilny ruch w limicie czasu.
  for (let currentDepth = 2; currentDepth <= depth; currentDepth += 1) {
    if (Date.now() >= deadline) break;
    const result = searchAtDepth(state, orderedMoves, aiPlayer, currentDepth, tt, deadline);
    if (result.timedOut) break;
    bestMove = result.bestMove;
  }

  return bestMove;
}

function searchAtDepth(
  state: GameState,
  orderedMoves: Move[],
  aiPlayer: PlayerSymbol,
  depth: number,
  tt: Map<string, TTEntry>,
  deadline: number
): { bestMove: Move; timedOut: boolean } {
  let bestScore = -INF;
  let bestMove = orderedMoves[0];
  let alpha = -INF;
  const beta = INF;

  for (const move of orderedMoves) {
    if (Date.now() >= deadline) {
      return { bestMove, timedOut: true };
    }
    const nextState = applyMove(state, move);
    const score = minimax(nextState, depth - 1, alpha, beta, false, aiPlayer, tt, deadline);
    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    }
    alpha = Math.max(alpha, bestScore);
  }

  return { bestMove, timedOut: false };
}

function minimax(
  state: GameState,
  depth: number,
  alpha: number,
  beta: number,
  maximizing: boolean,
  aiPlayer: PlayerSymbol,
  tt: Map<string, TTEntry>,
  deadline: number
): number {
  if (Date.now() >= deadline) {
    return evaluateState(state, aiPlayer);
  }

  const key = getStateKey(state);
  const cached = tt.get(key);
  if (cached && cached.depth >= depth) {
    return cached.score;
  }

  if (state.status === "finished" || depth === 0) {
    const evalScore = evaluateState(state, aiPlayer);
    tt.set(key, { depth, score: evalScore });
    return evalScore;
  }

  const legalMoves = getLegalMoves(state);
  if (legalMoves.length === 0) {
    const evalScore = evaluateState(state, aiPlayer);
    tt.set(key, { depth, score: evalScore });
    return evalScore;
  }

  const orderedMoves = orderMoves(state, legalMoves, aiPlayer);
  // Szersze drzewo dla mocniejszego AI, ale nadal kontrolowane czasem.
  const branchLimit = depth >= 4 ? 16 : 22;
  const limitedMoves = orderedMoves.slice(0, branchLimit);

  if (maximizing) {
    let best = -INF;
    for (const move of limitedMoves) {
      const next = applyMove(state, move);
      best = Math.max(best, minimax(next, depth - 1, alpha, beta, false, aiPlayer, tt, deadline));
      alpha = Math.max(alpha, best);
      if (beta <= alpha) break;
    }
    tt.set(key, { depth, score: best });
    return best;
  }

  let best = INF;
  for (const move of limitedMoves) {
    const next = applyMove(state, move);
    best = Math.min(best, minimax(next, depth - 1, alpha, beta, true, aiPlayer, tt, deadline));
    beta = Math.min(beta, best);
    if (beta <= alpha) break;
  }
  tt.set(key, { depth, score: best });
  return best;
}

function evaluateState(state: GameState, aiPlayer: PlayerSymbol): number {
  const opponent = getOpponent(aiPlayer);

  if (state.status === "finished") {
    if (state.winner === aiPlayer) return 200_000 + (81 - state.moveCount);
    if (state.winner === opponent) return -200_000 - (81 - state.moveCount);
    return 0;
  }

  let score = 0;
  score += evaluateMainBoard(state.smallBoardWinners, aiPlayer) * 35;
  score += evaluateSmallBoards(state, aiPlayer);
  score += evaluateTempo(state, aiPlayer);

  return score;
}

function evaluateMainBoard(winners: SmallBoardWinner[], aiPlayer: PlayerSymbol): number {
  const opponent = getOpponent(aiPlayer);
  let score = 0;

  for (const [a, b, c] of WIN_LINES) {
    const line = [winners[a], winners[b], winners[c]];
    const aiCount = line.filter((v) => v === aiPlayer).length;
    const oppCount = line.filter((v) => v === opponent).length;
    const drawCount = line.filter((v) => v === "D").length;

    if (drawCount > 0 || (aiCount > 0 && oppCount > 0)) continue;
    if (aiCount === 2) score += 80;
    else if (aiCount === 1) score += 14;
    if (oppCount === 2) score -= 95;
    else if (oppCount === 1) score -= 16;
  }

  if (winners[4] === aiPlayer) score += 18;
  if (winners[4] === opponent) score -= 18;
  for (const i of [0, 2, 6, 8]) {
    if (winners[i] === aiPlayer) score += 8;
    if (winners[i] === opponent) score -= 8;
  }

  return score;
}

function evaluateSmallBoards(state: GameState, aiPlayer: PlayerSymbol): number {
  const opponent = getOpponent(aiPlayer);
  let score = 0;

  for (let boardIndex = 0; boardIndex < 9; boardIndex += 1) {
    const winner = state.smallBoardWinners[boardIndex];
    if (winner === aiPlayer) {
      score += boardIndex === 4 ? 20 : 12;
      continue;
    }
    if (winner === opponent) {
      score -= boardIndex === 4 ? 24 : 14;
      continue;
    }
    if (winner === "D") continue;

    const board = state.boards[boardIndex];
    for (const [a, b, c] of WIN_LINES) {
      const line = [board[a], board[b], board[c]];
      const aiCount = line.filter((v) => v === aiPlayer).length;
      const oppCount = line.filter((v) => v === opponent).length;
      if (aiCount > 0 && oppCount > 0) continue;
      if (aiCount === 2) score += 10;
      else if (aiCount === 1) score += 2;
      if (oppCount === 2) score -= 11;
      else if (oppCount === 1) score -= 2;
    }

    if (board[4] === aiPlayer) score += 3;
    if (board[4] === opponent) score -= 3;
  }

  return score;
}

function evaluateTempo(state: GameState, aiPlayer: PlayerSymbol): number {
  const legalMoves = getLegalMoves(state);
  const mobility = legalMoves.length;
  const isAiTurn = state.currentPlayer === aiPlayer;
  return (isAiTurn ? 1 : -1) * Math.min(10, Math.floor(mobility / 2));
}

function orderMoves(state: GameState, moves: Move[], aiPlayer: PlayerSymbol): Move[] {
  const opponent = getOpponent(aiPlayer);

  return [...moves].sort((a, b) => {
    const scoreA = scoreMove(state, a, aiPlayer, opponent);
    const scoreB = scoreMove(state, b, aiPlayer, opponent);
    return scoreB - scoreA;
  });
}

function scoreMove(
  state: GameState,
  move: Move,
  aiPlayer: PlayerSymbol,
  opponent: PlayerSymbol
): number {
  let score = 0;
  if (move.cellIndex === 4) score += 6;
  if (move.boardIndex === 4) score += 5;
  if ([0, 2, 6, 8].includes(move.cellIndex)) score += 2;

  const next = applyMove(state, move);
  if (next.status === "finished" && next.winner === aiPlayer) score += 100_000;
  if (next.smallBoardWinners[move.boardIndex] === aiPlayer) score += 45;
  if (next.smallBoardWinners[move.boardIndex] === opponent) score -= 35;

  const oppMoves = getLegalMoves(next);
  if (oppMoves.some((m) => isImmediateGameWin(next, m, opponent))) score -= 500;

  return score;
}

function isImmediateGameWin(state: GameState, move: Move, player: PlayerSymbol): boolean {
  if (move.player !== player) return false;
  const simulated = applyMove(state, move);
  return simulated.status === "finished" && simulated.winner === player;
}

function chooseSearchDepth(legalMovesCount: number, moveCount: number): number {
  if (moveCount > 58) return 7;
  if (moveCount > 44) return 6;
  if (legalMovesCount <= 5) return 7;
  if (legalMovesCount <= 10) return 6;
  if (legalMovesCount <= 16) return 5;
  return 4;
}

function getOpponent(player: PlayerSymbol): PlayerSymbol {
  return player === "X" ? "O" : "X";
}

function getStateKey(state: GameState): string {
  const winners = state.smallBoardWinners.map((v) => v ?? "_").join("");
  const boards = state.boards.map((b) => b.map((c) => c ?? "_").join("")).join("|");
  return `${state.currentPlayer}|${state.activeBoard ?? "_"}|${winners}|${boards}`;
}
