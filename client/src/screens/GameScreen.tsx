import { useEffect, useState } from "react";
import type { GameSession, PlayerSymbol } from "@uttt/shared";
import { Board } from "../components/Board";
import { GameStatus } from "../components/GameStatus";
import { Modal } from "../components/Modal";

type GameScreenProps = {
  session: GameSession;
  canPlay: boolean;
  mySymbol: PlayerSymbol;
  statusMessage: string;
  onPlayMove: (boardIndex: number, cellIndex: number) => void;
  onLeave: () => void;
};

export function GameScreen(props: GameScreenProps) {
  const [tipsOpen, setTipsOpen] = useState(false);
  const [showWaitExit, setShowWaitExit] = useState(false);
  const waitingForOpponent = props.session.mode === "online" && !props.session.players.O;

  useEffect(() => {
    if (!waitingForOpponent) {
      setShowWaitExit(false);
      return;
    }
    const timer = setTimeout(() => {
      setShowWaitExit(true);
    }, 5000);

    return () => clearTimeout(timer);
  }, [waitingForOpponent]);

  return (
    <section className="screen game-screen">
      <GameStatus
        statusMessage={props.statusMessage}
        session={props.session}
        mySymbol={props.mySymbol}
      />
      <Board session={props.session} canPlay={props.canPlay} onPlayMove={props.onPlayMove} />
      <div className="actions-row">
        <button className="ghost" onClick={() => setTipsOpen(true)}>
          Tips
        </button>
        <button className="secondary" onClick={props.onLeave}>
          Wróć do menu
        </button>
      </div>
      <Modal open={tipsOpen} title="Podpowiedzi" onClose={() => setTipsOpen(false)}>
        <p>Patrz na aktywną małą planszę - tam musisz wykonać ruch.</p>
        <p>Staraj się jednocześnie kontrolować środek i przekątne dużej planszy.</p>
        <p>Na końcu gry sprawdź ekran wyników - linia zwycięstwa jest podświetlona.</p>
      </Modal>
      {waitingForOpponent && (
        <div className="waiting-overlay" role="status" aria-live="polite">
          <div className="waiting-card">
            <div className="spinner" aria-hidden="true" />
            <h3>Czekamy na drugiego gracza</h3>
            <p>Udostępnij kod sesji i poczekaj chwilę. Rozgrywka ruszy od razu po dołączeniu.</p>
            <strong>Kod sesji: {props.session.id}</strong>
            {showWaitExit && (
              <button className="secondary waiting-exit" onClick={props.onLeave}>
                Powrót do menu
              </button>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
