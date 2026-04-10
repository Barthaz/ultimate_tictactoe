import { useState } from "react";
import type { GameMode, TrainingDifficulty } from "@uttt/shared";
import { Modal } from "../components/Modal";

type HomeScreenProps = {
  mode: GameMode;
  joinCode: string;
  trainingDifficulty: TrainingDifficulty;
  onModeChange: (mode: GameMode) => void;
  onTrainingDifficultyChange: (difficulty: TrainingDifficulty) => void;
  onJoinCodeChange: (code: string) => void;
  onCreateSession: () => void;
  onJoinSession: () => void;
};

export function HomeScreen(props: HomeScreenProps) {
  const [helpOpen, setHelpOpen] = useState(false);
  const [startOpen, setStartOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  const logoUrl = `${import.meta.env.BASE_URL}assets/logo.png`;

  const handleStart = () => {
    props.onCreateSession();
    setStartOpen(false);
  };

  const handleJoin = () => {
    props.onJoinSession();
    setJoinOpen(false);
  };

  return (
    <section className="screen home-screen">
      <header className="hero-card">
        <img src={logoUrl} alt="Ultimate Tic Tac Toe logo" className="hero-logo" />
        <h1 className="hero-title">Ultimate Tic Tac Toe</h1>
        <p>
          Wejdź do świata strategicznej wersji kółko i krzyżyk, w której każdy ruch
          ma znaczenie. Przejmuj małe plansze, planuj kilka tur naprzód i buduj
          zwycięską linię na planszy głównej.
        </p>
        <div className="hero-actions">
          <button className="primary" onClick={() => setStartOpen(true)}>
            Zacznij grę
          </button>
          <button className="secondary" onClick={() => setJoinOpen(true)}>
            Dołącz do gry
          </button>
          <button className="secondary" onClick={() => setHelpOpen(true)}>
            Jak grać?
          </button>
        </div>
      </header>
      <section className="feature-grid">
        <article className="feature-card">
          <h3>Planowanie ruchów</h3>
          <p>
            Każdy ruch wysyła przeciwnika na konkretną małą planszę, więc myśl
            kilka tur do przodu.
          </p>
        </article>
        <article className="feature-card">
          <h3>Rywalizacja</h3>
          <p>
            Zagraj lokalnie, w treningu albo online - ten sam zestaw zasad i szybkie
            tempo rozgrywki.
          </p>
        </article>
      </section>
      <Modal
        open={helpOpen}
        title="Szybkie zasady UTTT"
        onClose={() => setHelpOpen(false)}
      >
        <div className="howto-grid">
          <article className="howto-card">
            <h4>1. Pierwszy ruch</h4>
            <p>Zaczynasz od dowolnego pola na dowolnej małej planszy.</p>
          </article>
          <article className="howto-card">
            <h4>2. Kierowanie przeciwnika</h4>
            <p>
              Numer pola, które wybierzesz, wskazuje planszę dla kolejnego
              gracza.
            </p>
          </article>
          <article className="howto-card">
            <h4>3. Wygrana małej planszy</h4>
            <p>Ułóż trzy symbole w linii, aby przejąć daną małą planszę.</p>
          </article>
          <article className="howto-card">
            <h4>4. Wygrana całej gry</h4>
            <p>Wygraj trzy małe plansze w linii na dużej planszy.</p>
          </article>
        </div>
      </Modal>
      <Modal
        open={startOpen}
        title="Rozpocznij nową grę"
        onClose={() => setStartOpen(false)}
      >
        <label className="field">
          Wybierz tryb:
          <select
            value={props.mode}
            onChange={(e) => props.onModeChange(e.target.value as GameMode)}
          >
            <option value="local">
              Lokalna (2 graczy na jednym urządzeniu)
            </option>
            <option value="training">Trening (kontra AI)</option>
            <option value="online">Online (utwórz kod sesji)</option>
          </select>
        </label>
        {props.mode === "training" ? (
          <label className="field">
            Poziom trudności treningu:
            <select
              value={props.trainingDifficulty}
              onChange={(e) =>
                props.onTrainingDifficultyChange(e.target.value as TrainingDifficulty)
              }
            >
              <option value="normal">Normalny</option>
              <option value="hardcore">Hardcore</option>
            </select>
          </label>
        ) : null}
        <div className="modal-actions">
          <button className="primary" onClick={handleStart}>
            Rozpocznij
          </button>
        </div>
      </Modal>
      <Modal
        open={joinOpen}
        title="Dołącz do istniejącej gry"
        onClose={() => setJoinOpen(false)}
      >
        <label className="field">
          Kod sesji:
          <input
            value={props.joinCode}
            onChange={(e) =>
              props.onJoinCodeChange(e.target.value.toUpperCase())
            }
            placeholder="np. A1B2C3"
            maxLength={6}
          />
        </label>
        <div className="modal-actions">
          <button className="secondary" onClick={handleJoin}>
            Dołącz
          </button>
        </div>
      </Modal>
    </section>
  );
}
