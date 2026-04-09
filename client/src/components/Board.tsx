import type { GameSession } from "@uttt/shared";

type BoardProps = {
  session: GameSession | null;
  canPlay: boolean;
  onPlayMove: (boardIndex: number, cellIndex: number) => void;
};

export function Board({ session, canPlay, onPlayMove }: BoardProps) {
  if (!session) {
    return null;
  }

  const winningLine = getWinningLine(session.game.smallBoardWinners, session.game.winner);

  return (
    <section className="board-shell">
      <div className="board-header">
        <h3>Plansza gry</h3>
        <span className={session.game.status === "finished" ? "pill finished" : "pill"}>
          {session.game.status === "finished"
            ? "Gra zakończona"
            : session.game.activeBoard === null
              ? "Dowolna mała plansza"
              : `Aktywna: ${session.game.activeBoard + 1}`}
        </span>
      </div>
      <div className="big-board">
      {session.game.boards.map((smallBoard, boardIndex) => {
        const boardWinner = session.game.smallBoardWinners[boardIndex];
        const isActive = session.game.activeBoard === null || session.game.activeBoard === boardIndex;
        const isWinningBoard = winningLine.includes(boardIndex);

        return (
          <div
            key={boardIndex}
            className={`small-board ${isActive ? "active" : "inactive"} ${isWinningBoard ? "win-line" : ""} ${
              boardWinner === "X" ? "winner-x" : ""
            } ${boardWinner === "O" ? "winner-o" : ""} ${boardWinner === "D" ? "winner-draw" : ""}`}
          >
            {smallBoard.map((cell, cellIndex) => {
              const isLocked =
                session.game.status !== "playing" || Boolean(boardWinner) || !isActive || Boolean(cell) || !canPlay;

              return (
                <button
                  key={`${boardIndex}-${cellIndex}`}
                  className={`cell ${cell === "X" ? "cell-x" : ""} ${cell === "O" ? "cell-o" : ""}`}
                  disabled={isLocked}
                  onClick={() => onPlayMove(boardIndex, cellIndex)}
                >
                  {cell ?? ""}
                </button>
              );
            })}
            {boardWinner && (
              <div
                className={`small-board-result ${boardWinner === "X" ? "result-x" : ""} ${
                  boardWinner === "O" ? "result-o" : ""
                }`}
              >
                {boardWinner === "D" ? "Remis" : boardWinner}
              </div>
            )}
          </div>
        );
      })}
      </div>
    </section>
  );
}

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

function getWinningLine(
  smallBoardWinners: GameSession["game"]["smallBoardWinners"],
  winner: GameSession["game"]["winner"]
): number[] {
  if (winner !== "X" && winner !== "O") {
    return [];
  }

  for (const line of WIN_LINES) {
    const [a, b, c] = line;
    if (smallBoardWinners[a] === winner && smallBoardWinners[b] === winner && smallBoardWinners[c] === winner) {
      return [...line];
    }
  }
  return [];
}
