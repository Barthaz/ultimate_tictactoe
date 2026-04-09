import { useEffect, useRef, useState } from "react";
import { trackEvent } from "./lib/analytics";
import { useGameSocket } from "./hooks/useGameSocket";
import { GameScreen } from "./screens/GameScreen";
import { HomeScreen } from "./screens/HomeScreen";
import { ResultScreen } from "./screens/ResultScreen";
import "./App.css";

type Screen = "home" | "game" | "result";

function App() {
  const game = useGameSocket();
  const [screen, setScreen] = useState<Screen>("home");
  const lastTrackedFinishedSession = useRef<string | null>(null);

  useEffect(() => {
    if (!game.session) {
      setScreen("home");
      return;
    }
    if (game.session.game.status === "finished") {
      setScreen("result");
      return;
    }
    setScreen("game");
  }, [game.session]);

  useEffect(() => {
    if (!game.session || game.session.game.status !== "finished") {
      return;
    }
    if (lastTrackedFinishedSession.current === game.session.id) {
      return;
    }

    const winner = game.session.game.winner;
    const outcome =
      winner === "D" || winner === null ? "draw" : winner === game.mySymbol ? "win" : "lose";

    trackEvent("finish_game", {
      mode: game.session.mode,
      session_id: game.session.id,
      winner: winner ?? "none",
      my_symbol: game.mySymbol,
      outcome,
      moves: game.session.game.moveCount,
    });

    lastTrackedFinishedSession.current = game.session.id;
  }, [game.mySymbol, game.session]);

  const handleCreateSession = () => {
    game.createSession();
  };

  const handleJoinSession = () => {
    game.joinSession();
  };

  const handleBackToMenu = () => {
    game.resetClientState();
    lastTrackedFinishedSession.current = null;
    setScreen("home");
  };

  const handlePlayAgain = () => {
    game.resetClientState();
    game.createSession();
  };

  return (
    <main className="app">
      {!game.isServerReady && (
        <div className="waiting-overlay" role="status" aria-live="polite">
          <div className="waiting-card">
            <div className="spinner" aria-hidden="true" />
            <h3>Łączenie z serwerem</h3>
            <p>Trwa nawiązywanie połączenia. Gra uruchomi się automatycznie.</p>
          </div>
        </div>
      )}
      {screen === "home" && (
        <HomeScreen
          mode={game.mode}
          joinCode={game.joinCode}
          onModeChange={game.setMode}
          onJoinCodeChange={game.setJoinCode}
          onCreateSession={handleCreateSession}
          onJoinSession={handleJoinSession}
        />
      )}
      {screen === "game" && game.session && (
        <GameScreen
          session={game.session}
          canPlay={game.canPlay}
          mySymbol={game.mySymbol}
          statusMessage={game.statusMessage}
          onPlayMove={game.playMove}
          onLeave={handleBackToMenu}
        />
      )}
      {screen === "result" && game.session && (
        <ResultScreen
          session={game.session}
          mySymbol={game.mySymbol}
          onBackToMenu={handleBackToMenu}
          onNewGame={handlePlayAgain}
        />
      )}
    </main>
  );
}

export default App;
