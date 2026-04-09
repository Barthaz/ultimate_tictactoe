import { applyMove, getLegalMoves } from "./engine";
import { GameState, Move } from "./types";

export function chooseAiMove(state: GameState): Move {
  const legalMoves = getLegalMoves(state);
  if (legalMoves.length === 0) {
    throw new Error("Brak legalnych ruchów dla AI.");
  }

  const winningMove = legalMoves.find((move) => {
    const simulated = applyMove(state, move);
    return simulated.status === "finished" && simulated.winner === move.player;
  });

  if (winningMove) {
    return winningMove;
  }

  const centerMove = legalMoves.find((move) => move.cellIndex === 4);
  if (centerMove) {
    return centerMove;
  }

  return legalMoves[Math.floor(Math.random() * legalMoves.length)];
}
