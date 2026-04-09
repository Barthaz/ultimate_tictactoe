import type { GameSession, PlayerSymbol } from "@uttt/shared";
import { Board } from "../components/Board";

type ResultScreenProps = {
  session: GameSession;
  onNewGame: () => void;
  onBackToMenu: () => void;
  mySymbol: PlayerSymbol;
};

export function ResultScreen({ session, onNewGame, onBackToMenu, mySymbol }: ResultScreenProps) {
  const xBoards = session.game.smallBoardWinners.filter((value) => value === "X").length;
  const oBoards = session.game.smallBoardWinners.filter((value) => value === "O").length;
  const draws = session.game.smallBoardWinners.filter((value) => value === "D").length;
  const winnerLabel = getWinnerLabel(session, mySymbol);
  const outcomeClass = getOutcomeClass(session, mySymbol);

  return (
    <section className="screen result-screen">
      <Board session={session} canPlay={false} onPlayMove={() => undefined} />
      <div className="result-overlay">
        <div className="result-popup">
          <h2>Koniec gry</h2>
          <p className={`result-winner ${outcomeClass}`}>{winnerLabel}</p>
          <div className="result-grid">
            <div>
              <span>Ruchy</span>
              <strong>{session.game.moveCount}</strong>
            </div>
            <div>
              <span>Małe plansze X</span>
              <strong>{xBoards}</strong>
            </div>
            <div>
              <span>Małe plansze O</span>
              <strong>{oBoards}</strong>
            </div>
            <div>
              <span>Remisy małych plansz</span>
              <strong>{draws}</strong>
            </div>
          </div>
          <div className="result-actions">
            <button className="secondary" onClick={onBackToMenu}>
              Powrót do menu
            </button>
            <button className="primary" onClick={onNewGame}>
              Nowa gra
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function getWinnerLabel(session: GameSession, mySymbol: PlayerSymbol): string {
  const winner = session.game.winner;
  if (winner === "D" || winner === null) {
    return "Remis";
  }

  if (session.mode === "local") {
    return `Wygrał gracz ${winner}`;
  }

  return winner === mySymbol ? "Wygrałeś!" : "Przegrałeś";
}

function getOutcomeClass(session: GameSession, mySymbol: PlayerSymbol): string {
  const winner = session.game.winner;
  if (winner === "D" || winner === null) {
    return "draw";
  }
  if (session.mode === "local") {
    return winner === "X" ? "x" : "o";
  }
  return winner === mySymbol ? "win" : "lose";
}
