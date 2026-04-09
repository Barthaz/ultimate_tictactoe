import type { GameSession, PlayerSymbol } from "@uttt/shared";

type GameStatusProps = {
  statusMessage: string;
  session: GameSession | null;
  mySymbol: PlayerSymbol;
};

export function GameStatus({ statusMessage, session, mySymbol }: GameStatusProps) {
  const normalizedStatus = statusMessage.trim().toLowerCase();
  const shouldHideStatusLine = normalizedStatus === "czekamy na drugiego gracza.";
  const displayStatus = shouldHideStatusLine ? "" : statusMessage;
  const statusClass =
    displayStatus.toLowerCase().includes("błąd") ||
    displayStatus.toLowerCase().includes("blad") ||
    displayStatus.toLowerCase().includes("error")
      ? "status-line error"
      : "status-line";
  const isOnline = session?.mode === "online";
  const currentPlayer = session?.game.currentPlayer;
  const isMyTurn = session?.game.status === "playing" && currentPlayer === mySymbol;

  return (
    <section className="panel info">
      {!shouldHideStatusLine && <div className={statusClass}>{displayStatus}</div>}
      <div className="turn-banner">
        <span className={`symbol-chip ${mySymbol === "X" ? "x" : "o"}`}>Twój symbol: {mySymbol}</span>
        {session?.game.status === "playing" && (
          <span className={`turn-chip ${isMyTurn ? "my-turn" : ""}`}>Ruch: {currentPlayer}</span>
        )}
      </div>
      <div className="status-grid">
        {isOnline && session && <span>Kod sesji: {session.id}</span>}
        {session && session.game.activeBoard !== null && session.game.status === "playing" && (
          <span>Aktywna mała plansza: {session.game.activeBoard + 1}</span>
        )}
        {session && session.game.status === "finished" && (
          <span>Wynik: {session.game.winner === "D" ? "Remis" : `Wygrywa ${session.game.winner}`}</span>
        )}
      </div>
    </section>
  );
}
