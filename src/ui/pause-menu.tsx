import { useState } from "react";
import {
  Play,
  RotateCcw,
  Settings2,
  Home,
  Save,
  ArrowRight,
  Coffee,
} from "lucide-react";
import { useGame } from "../game/store";
import { Settings } from "./settings";
import { Modal } from "./modal";
import { clock } from "../game/rules";
import { Journal } from "./journal";

export function PauseMenu() {
  const [panel, setPanel] = useState<
    "pause" | "settings" | "restart" | "journal"
  >("pause");
  const game = useGame((s) => s.game),
    saveStatus = useGame((s) => s.saveStatus),
    saveError = useGame((s) => s.saveError);
  if (panel === "settings")
    return <Settings onClose={() => setPanel("pause")} />;
  if (panel === "journal") return <Journal onClose={() => setPanel("pause")} />;
  if (panel === "restart")
    return (
      <Modal title="Try Monday again?" onClose={() => setPanel("pause")}>
        <p className="modal-copy">
          Restart Day 1 at 08:00 with a fresh set of possibilities. Your
          achievements and best score stay with you.
        </p>
        <div className="button-row">
          <button
            className="secondary-button"
            onClick={() => setPanel("pause")}
          >
            Never mind
          </button>
          <button
            className="start-button"
            onClick={() => useGame.getState().newGame()}
          >
            Restart day <ArrowRight size={17} />
          </button>
        </div>
      </Modal>
    );
  return (
    <Modal
      title="Even the chaos can wait."
      subtitle="PAUSED"
      onClose={() => useGame.getState().resume()}
    >
      <div className="pause-summary">
        <Coffee size={30} />
        <div>
          <strong>Day 01 · {clock(game.minutes)}</strong>
          <span>
            {Math.round(game.productivity)}% shipped. {Math.round(game.stress)}%
            stressed.
          </span>
        </div>
      </div>
      <div className="pause-actions">
        <button
          className="secondary-button"
          onClick={() => setPanel("journal")}
        >
          Day journal · People, achievements & endings
        </button>
        <button
          className="start-button"
          onClick={() => useGame.getState().resume()}
        >
          <span className="button-leading">
            <Play size={17} /> Back to the grind
          </span>
          <kbd>ESC</kbd>
        </button>
        <button
          className="secondary-button"
          onClick={() => void useGame.getState().save()}
        >
          <Save size={17} />
          {saveStatus === "saving"
            ? "Saving..."
            : saveStatus === "saved"
              ? "Save game · saved locally"
              : "Save game"}
        </button>
        <button
          className="secondary-button"
          onClick={() => setPanel("restart")}
        >
          <RotateCcw size={17} /> Restart day
        </button>
        <button
          className="secondary-button"
          onClick={() => setPanel("settings")}
        >
          <Settings2 size={17} /> Settings
        </button>
        <button
          className="text-button"
          onClick={() => useGame.getState().menu()}
        >
          <Home size={16} /> Save & main menu
        </button>
      </div>
      {saveError && (
        <p role="alert" className="error-text">
          {saveError}
        </p>
      )}
      <p className="fine-print center">
        The clock is paused. That’s not how real meetings work.
      </p>
    </Modal>
  );
}
