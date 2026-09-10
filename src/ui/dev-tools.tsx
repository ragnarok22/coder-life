import { useEffect, useState } from "react";
import { Bug, X } from "lucide-react";
import { useGame } from "../game/store";
import { runtime } from "../game/runtime";
import { BALANCE } from "../data/balance";
import { encounters, npcs, randomEvents } from "../data/content";
import { objects } from "../data/world";
import { advance, clamp, taskNames } from "../game/rules";
import { recordProgress } from "../game/profile";
import { applyWorldEvent } from "../events/encounter-engine";
import type { GameData } from "../game/types";

/** This module is only dynamically imported from the development branch in app.tsx. */
export default function DevTools() {
  const [open, setOpen] = useState(false),
    [eventId, setEventId] = useState("production"),
    [encounterId, setEncounterId] = useState("minute"),
    [npc, setNpc] = useState("manager"),
    [destination, setDestination] = useState("desk");
  const game = useGame((s) => s.game);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.code === "F2") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, []);
  const update = (patch: Partial<GameData>) =>
    useGame.setState({ game: { ...useGame.getState().game, ...patch } });
  const setTime = (minutes: number) => {
    const g = useGame.getState().game,
      next = clamp(minutes, BALANCE.dayStart, BALANCE.dayEnd - 1),
      elapsed = g.minutes - BALANCE.dayStart;
    const time = { ...g.stats.time };
    if (next >= g.minutes) time.other += next - g.minutes;
    else
      for (const category of Object.keys(time) as (keyof typeof time)[])
        time[category] *= elapsed ? (next - BALANCE.dayStart) / elapsed : 0;
    update({
      minutes: next,
      stats: {
        ...g.stats,
        time,
        workMinutes: time.coding,
        wastedMinutes: next - BALANCE.dayStart - time.coding,
      },
      dialogue: null,
      search: null,
    });
  };
  const endDay = () => {
    const s = useGame.getState();
    const finished = advance(
      {
        ...s.game,
        awake: true,
        dialogue: null,
        working: false,
        hidingZone: null,
      },
      BALANCE.dayEnd - s.game.minutes,
    );
    useGame.setState({
      game: finished,
      screen: "results",
      seeking: null,
      profile: recordProgress(s.profile, finished),
    });
    void useGame.getState().save();
  };
  return (
    <div className="dev-tools">
      <button
        className="dev-toggle"
        onClick={() => setOpen(!open)}
        aria-label="Development tools"
      >
        <Bug size={14} /> DEV · F2
      </button>
      {open && (
        <aside className="dev-panel" aria-label="Development playground">
          <header>
            <strong>DEVELOPMENT PLAYGROUND</strong>
            <button
              aria-label="Close development tools"
              onClick={() => setOpen(false)}
            >
              <X size={15} />
            </button>
          </header>
          <label>
            Time
            <input
              type="time"
              value={`${Math.floor(game.minutes / 60)
                .toString()
                .padStart(2, "0")}:${Math.floor(game.minutes % 60)
                .toString()
                .padStart(2, "0")}`}
              onChange={(e) => {
                const [h, m] = e.target.value.split(":").map(Number);
                if (Number.isFinite(h) && Number.isFinite(m))
                  setTime(h * 60 + m);
              }}
            />
          </label>
          {(
            [
              "stress",
              "energy",
              "technicalDebt",
              "codeQuality",
              "reputation",
            ] as const
          ).map((key) => (
            <label key={key}>
              {key}
              <input
                type="range"
                min="0"
                max="100"
                value={game[key]}
                onChange={(e) => {
                  const value = Number(e.target.value);
                  update({
                    [key]: value,
                    ...(key === "stress"
                      ? {
                          stats: {
                            ...game.stats,
                            maxStress: Math.max(value, game.stats.maxStress),
                          },
                        }
                      : {}),
                  });
                }}
              />
              <output>{Math.round(game[key])}</output>
            </label>
          ))}
          <label>
            NPC
            <select value={npc} onChange={(e) => setNpc(e.target.value)}>
              {npcs.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.name} · {n.role}
                </option>
              ))}
            </select>
          </label>
          <label>
            Relationship
            <input
              type="range"
              min="-100"
              max="100"
              value={game.relations[npc] ?? 0}
              onChange={(e) =>
                update({
                  relations: {
                    ...game.relations,
                    [npc]: Number(e.target.value),
                  },
                })
              }
            />
            <output>{game.relations[npc] ?? 0}</output>
          </label>
          <label>
            Teleport
            <select
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
            >
              {objects.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.location} / {o.id}
                </option>
              ))}
            </select>
          </label>
          <button
            onClick={() => {
              const o = objects.find((o) => o.id === destination)!;
              runtime.player = [...o.position];
              runtime.npcs.clear();
              const s = useGame.getState();
              useGame.setState({
                game: {
                  ...s.game,
                  location: o.location,
                  position: [...o.position],
                  awake: true,
                  working: false,
                  dialogue: null,
                  search: null,
                  hidingZone: null,
                },
                revision: s.revision + 1,
                nearest: o.id,
                seeking: null,
              });
            }}
          >
            Teleport
          </button>
          <label>
            Encounter
            <select
              value={encounterId}
              onChange={(e) => setEncounterId(e.target.value)}
            >
              {encounters.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.id}
                </option>
              ))}
            </select>
          </label>
          <button
            onClick={() => {
              update({ dialogue: null });
              useGame.getState().interrupt(encounterId);
            }}
          >
            Trigger interruption / coding decision
          </button>
          <label>
            World event
            <select
              value={eventId}
              onChange={(e) => setEventId(e.target.value)}
            >
              {randomEvents.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.id}
                </option>
              ))}
            </select>
          </label>
          <button
            onClick={() => {
              const event = randomEvents.find((e) => e.id === eventId)!;
              update(
                applyWorldEvent(
                  { ...game, dialogue: null },
                  { ...event, conditions: {} },
                ),
              );
            }}
          >
            Trigger event (ignore conditions)
          </button>
          <div className="button-row">
            <button
              onClick={() =>
                update({
                  productivity: Math.min(
                    100,
                    ((Math.floor(
                      (game.productivity * taskNames(game).length) / 100,
                    ) +
                      1) *
                      100) /
                      taskNames(game).length,
                  ),
                })
              }
            >
              Complete task
            </button>
            <button onClick={endDay}>Finish day</button>
          </div>
          <small>
            Seed {game.seed} · queue {game.pendingEvents.length}/
            {BALANCE.queueLimit} · changes are real local gameplay state.
          </small>
        </aside>
      )}
    </div>
  );
}
