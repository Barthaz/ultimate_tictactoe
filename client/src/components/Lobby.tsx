import type { GameMode } from "@uttt/shared";

type LobbyProps = {
  mode: GameMode;
  joinCode: string;
  onModeChange: (mode: GameMode) => void;
  onJoinCodeChange: (code: string) => void;
  onCreateSession: () => void;
  onJoinSession: () => void;
};

export function Lobby(props: LobbyProps) {
  return (
    <section className="panel lobby">
      <label className="field">
        Tryb:
        <select value={props.mode} onChange={(e) => props.onModeChange(e.target.value as GameMode)}>
          <option value="local">Lokalna</option>
          <option value="training">Trening (kontra AI)</option>
          <option value="online">Online</option>
        </select>
      </label>
      <button className="primary" onClick={props.onCreateSession}>
        Utwórz sesję
      </button>
      <input
        value={props.joinCode}
        onChange={(e) => props.onJoinCodeChange(e.target.value)}
        placeholder="Kod sesji online"
      />
      <button className="secondary" onClick={props.onJoinSession}>
        Dołącz
      </button>
    </section>
  );
}
