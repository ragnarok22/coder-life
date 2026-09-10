import { Maximize, Volume2, Mouse, Monitor, Trash2 } from "lucide-react";
import { useState } from "react";
import { useGame } from "../game/store";
import { Modal } from "./modal";
import { fullscreen } from "./fullscreen";
export function Settings({ onClose }: { onClose: () => void }) {
  const preferences = useGame((s) => s.preferences),
    update = useGame((s) => s.setPreferences);
  const [confirm, setConfirm] = useState(false);
  return (
    <Modal
      title="Make yourself comfortable."
      subtitle="SETTINGS"
      onClose={onClose}
    >
      <div className="settings-section">
        <h3>
          <Volume2 size={17} /> Sound
        </h3>
        {(["master", "music", "effects"] as const).map((key) => (
          <label className="slider-row" key={key}>
            <span>
              {key === "master"
                ? "Master volume"
                : key === "music"
                  ? "Music"
                  : "Sound effects"}
            </span>
            <input
              type="range"
              min="0"
              max="1"
              step=".05"
              value={preferences[key]}
              onChange={(e) => update({ [key]: Number(e.target.value) })}
            />
            <output>{Math.round(preferences[key] * 100)}%</output>
          </label>
        ))}
      </div>
      <div className="settings-section">
        <h3>
          <Mouse size={17} /> Controls
        </h3>
        <label className="slider-row">
          <span>Mouse sensitivity</span>
          <input
            type="range"
            min=".2"
            max="2"
            step=".1"
            value={preferences.sensitivity}
            onChange={(e) => update({ sensitivity: Number(e.target.value) })}
          />
          <output>{preferences.sensitivity.toFixed(1)}×</output>
        </label>
        <p className="fine-print">
          Click and drag to rotate the camera. Scroll to zoom.
        </p>
      </div>
      <div className="settings-section">
        <h3>
          <Monitor size={17} /> Display
        </h3>
        <label className="select-row">
          <span>Graphics quality</span>
          <select
            value={preferences.quality}
            onChange={(e) =>
              update({ quality: e.target.value as "low" | "medium" | "high" })
            }
          >
            <option value="low">Low · a potato is a computer</option>
            <option value="medium">Medium · sensible defaults</option>
            <option value="high">High · expense it</option>
          </select>
        </label>
        <button
          className="secondary-button full-width"
          onClick={() => void fullscreen()}
        >
          <Maximize size={17} /> Toggle fullscreen
        </button>
      </div>
      <div className="settings-bottom">
        <p className="fine-print">Preferences are saved on this device.</p>
        <button
          className="text-button danger"
          onClick={() => setConfirm(!confirm)}
        >
          <Trash2 size={14} /> Reset progress
        </button>
      </div>
      {confirm && (
        <div className="reset-confirm">
          <p>Delete your saved day, stats, relationships and achievements?</p>
          <div className="button-row">
            <button
              className="secondary-button"
              onClick={() => setConfirm(false)}
            >
              Keep my save
            </button>
            <button
              className="danger-button"
              onClick={() => {
                void useGame.getState().reset().then(onClose);
              }}
            >
              Delete progress
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
