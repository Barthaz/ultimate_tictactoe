import { useEffect, useState } from "react";
import { useGameSocket } from "./hooks/useGameSocket";
import { GameScreen } from "./screens/GameScreen";
import { HomeScreen } from "./screens/HomeScreen";
import { ResultScreen } from "./screens/ResultScreen";
import "./App.css";

type Screen = "home" | "game" | "result";

function App() {
  const game = useGameSocket();
  const [screen, setScreen] = useState<Screen>("home");

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

  const handleCreateSession = () => {
    game.createSession();
  };

  const handleJoinSession = () => {
    game.joinSession();
  };

  const handleBackToMenu = () => {
    game.resetClientState();
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
