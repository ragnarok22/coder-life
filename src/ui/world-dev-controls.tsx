import { useState } from "react";
import {
  sceneDebug,
  changeSceneDebug,
  useSceneDebug,
} from "../game/scene-debug";
import { officeAreas } from "../data/office-layout";
import { OFFICE_PRESENTATION } from "../data/presentation";
import {
  HAIR_STYLES,
  importantAppearances,
  generateAppearance,
  OUTFIT_PALETTES,
  BODY_SCALES,
} from "../data/appearances";
import type { HairStyle, PaletteName, BodyVariant } from "../data/appearances";
import { npcs } from "../data/content";
import { useGame } from "../game/store";
import { runtime } from "../game/runtime";
import { nearestWalkable } from "../ai/navigation";

export function WorldDevControls() {
  const debug = useSceneDebug(),
    [room, setRoom] = useState("developers"),
    [npc, setNpc] = useState("manager"),
    [reroll, setReroll] = useState(0);
  const seed = useGame((s) => s.game.seed),
    appearance =
      debug.appearances[npc] ??
      importantAppearances[npc] ??
      generateAppearance(seed, npc);
  const updateAppearance = (patch: Partial<typeof appearance>) =>
    changeSceneDebug({
      appearances: {
        ...sceneDebug.appearances,
        [npc]: { ...appearance, ...patch },
      },
    });
  return (
    <section className="world-dev-controls">
      <h4>WORLD / CAMERA / CAST</h4>
      {(
        ["overview", "camera", "colliders", "navigation", "freezeNpcs"] as const
      ).map((key) => (
        <label key={key}>
          <input
            type="checkbox"
            checked={debug[key]}
            onChange={(e) => changeSceneDebug({ [key]: e.target.checked })}
          />
          {
            {
              overview: "Office overview",
              camera: "Camera collision rays",
              colliders: "Physics colliders",
              navigation: "Navigation grid",
              freezeNpcs: "Freeze NPCs",
            }[key]
          }
        </label>
      ))}
      <label>
        Room
        <select
          aria-label="Teleport to room"
          value={room}
          onChange={(e) => setRoom(e.target.value)}
        >
          {officeAreas.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
      </label>
      <button
        onClick={() => {
          const area = officeAreas.find((a) => a.id === room)!;
          const s = useGame.getState(),
            position = nearestWalkable(area.arrival, "office");
          runtime.player = [...position];
          runtime.npcs.clear();
          useGame.setState({
            game: {
              ...s.game,
              location: "office",
              position,
              awake: true,
              working: false,
              hidingZone: null,
              dialogue: null,
              search: null,
            },
            revision: s.revision + 1,
            seeking: null,
            nearest: null,
          });
        }}
      >
        Teleport to room
      </button>
      <button
        disabled={
          debug.extras >=
          OFFICE_PRESENTATION.maxNpcs - OFFICE_PRESENTATION.npcCount
        }
        onClick={() => changeSceneDebug({ extras: debug.extras + 1 })}
      >
        Spawn ambient NPC ({OFFICE_PRESENTATION.npcCount + debug.extras}/
        {OFFICE_PRESENTATION.maxNpcs})
      </button>
      <label>
        Appearance
        <select
          aria-label="NPC appearance"
          value={npc}
          onChange={(e) => setNpc(e.target.value)}
        >
          {npcs.map((n) => (
            <option key={n.id} value={n.id}>
              {n.name} · {n.role}
            </option>
          ))}
        </select>
      </label>
      <label>
        Hair
        <select
          aria-label="Hair style"
          value={appearance.hair}
          onChange={(e) =>
            updateAppearance({ hair: e.target.value as HairStyle })
          }
        >
          {HAIR_STYLES.map((h) => (
            <option key={h}>{h}</option>
          ))}
        </select>
      </label>
      <label>
        Palette
        <select
          aria-label="Outfit palette"
          value={appearance.palette}
          onChange={(e) =>
            updateAppearance({ palette: e.target.value as PaletteName })
          }
        >
          {Object.keys(OUTFIT_PALETTES).map((p) => (
            <option key={p}>{p}</option>
          ))}
        </select>
      </label>
      <label>
        Body
        <select
          aria-label="Body variant"
          value={appearance.body}
          onChange={(e) =>
            updateAppearance({ body: e.target.value as BodyVariant })
          }
        >
          {Object.keys(BODY_SCALES).map((p) => (
            <option key={p}>{p}</option>
          ))}
        </select>
      </label>
      <button
        disabled={!!importantAppearances[npc]}
        onClick={() => {
          const next = reroll + 1;
          setReroll(next);
          changeSceneDebug({
            appearances: {
              ...debug.appearances,
              [npc]: generateAppearance(seed + next, npc),
            },
          });
        }}
      >
        Reroll procedural NPC
      </button>
      <button
        onClick={() => {
          const appearances = { ...debug.appearances };
          delete appearances[npc];
          changeSceneDebug({ appearances });
        }}
      >
        Restore visual identity
      </button>
    </section>
  );
}
