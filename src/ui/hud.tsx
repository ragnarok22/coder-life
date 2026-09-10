import { useEffect, useRef } from "react";
import {
  BatteryMedium,
  Flame,
  Code2,
  Pause,
  Coffee,
  Terminal,
  ChevronRight,
  ArrowUpRight,
  Save,
  Clock3,
  Check,
  X,
  Footprints,
  LogOut,
} from "lucide-react";
import { useGame } from "../game/store";
import { clock, taskNames, tasksComplete, matches } from "../game/rules";
import { getEncounter, npcs } from "../data/content";
import { BALANCE } from "../data/balance";
import { ZoneAndSearch } from "./zone-and-search";
import { objects } from "../data/world";
import { MiniMap } from "./mini-map";
import { audio } from "../game/audio";
import { input } from "../game/input";

function WorkPanel() {
  const game = useGame((s) => s.game);
  const tasks = taskNames(game);
  const active = Math.min(tasks.length - 1, tasksComplete(game)),
    progress =
      game.productivity >= 100 ? 100 : (game.productivity * tasks.length) % 100;
  useEffect(() => {
    const timer = setInterval(() => audio.play("keyboard"), 480);
    return () => clearInterval(timer);
  }, []);
  return (
    <section className="work-panel">
      <div className="work-titlebar">
        <span className="window-dots">
          <i />
          <i />
          <i />
        </span>
        <span>actually-working.ts</span>
        <Terminal size={14} />
      </div>
      <div className="work-body">
        <div className="eyebrow">
          <span className="live-dot" /> FOCUS MODE{" "}
          <span className="work-rate">
            {game.coffeeUntil > game.minutes
              ? "CAFFEINATED ×1.2"
              : "ONE THING AT A TIME"}
          </span>
        </div>
        <h3>
          {game.productivity >= 100
            ? "It’s shipped. You did the thing."
            : tasks[active]}
        </h3>
        <div className="code-preview">
          <span>01</span>
          <code>
            <b>const</b> today = <em>"be productive"</em>;
          </code>
          <span>02</span>
          <code>
            <b>while</b> (!interrupted) {"{"}
          </code>
          <span>03</span>
          <code>
            {" "}
            <b>await</b> writeGoodCode();
            <i className="typing-cursor" />
          </code>
          <span>04</span>
          <code>
            {"}"} <small>// a developer can dream</small>
          </code>
        </div>
        <div className="task-progress-label">
          <span>
            TASK {active + 1} / {tasks.length}
          </span>
          <strong>{Math.round(progress)}%</strong>
        </div>
        <div className="progress-track">
          <div style={{ width: `${progress}%` }} />
        </div>
        {game.extraTasks.length > 0 && (
          <p className="extra-task">
            ↳ {game.extraTasks.length} extra task
            {game.extraTasks.length === 1 ? "" : "s"}. Same day. Naturally.
          </p>
        )}
        <div className="code-health">
          <span>
            Quality <strong>{Math.round(game.codeQuality)}</strong>
          </span>
          <span className={game.technicalDebt > 40 ? "debt-high" : ""}>
            Tech debt <strong>{Math.round(game.technicalDebt)}</strong>
          </span>
          <span>
            Next decision{" "}
            <strong>
              ~
              {Math.max(
                0,
                Math.ceil(game.nextCodingAt - game.stats.workMinutes),
              )}{" "}
              min
            </strong>
          </span>
        </div>
        <div className="work-bottom">
          <span>
            <Clock3 size={13} /> Time keeps moving.
          </span>
          <button onClick={() => useGame.getState().stopWorking()}>
            <LogOut size={14} /> Leave desk <kbd>E</kbd>
          </button>
        </div>
      </div>
    </section>
  );
}
function Dialogue() {
  const id = useGame((s) => s.game.dialogue);
  const screen = useGame((s) => s.screen);
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const element = dialog.current;
    if (screen === "playing") element?.showModal();
    else element?.close();
    return () => element?.close();
  }, [screen, id]);
  const game = useGame((s) => s.game);
  const interruption = getEncounter(id);
  if (!interruption) return null;
  const npc = npcs.find((n) => n.id === interruption.npc);
  return (
    <dialog
      ref={dialog}
      className="dialogue-card dialogue-native"
      aria-label={interruption.name}
      onCancel={(event) => {
        event.preventDefault();
        useGame.getState().pause();
      }}
    >
      <div className="dialogue-top">
        <div
          className="npc-avatar"
          style={{ background: npc?.color ?? "#d4a566" }}
        >
          {npc?.name[0] ??
            (interruption.npc === "system" ? <Terminal size={23} /> : "N")}
          <span>!</span>
        </div>
        <div>
          <span className="eyebrow">
            {interruption.category === "meeting"
              ? "THIS COULD HAVE BEEN AN EMAIL"
              : interruption.category === "coding"
                ? "A DECISION FOR FUTURE YOU"
                : "AN UNSCHEDULED SIDE QUEST"}
          </span>
          <h3>
            {npc?.name ??
              (interruption.npc === "system"
                ? "Your code"
                : "Your neighbor")}{" "}
            <span>
              ·{" "}
              {npc?.role ??
                (interruption.npc === "system"
                  ? "Engineering"
                  : "Also not your job")}
            </span>
          </h3>
        </div>
        <span className="dialogue-pause">
          <Pause size={12} /> CLOCK PAUSED
        </span>
      </div>
      {npc && (
        <p className="relationship-hint" title={npc.personality?.description}>
          Trust:{" "}
          {(game.relations[npc.id] ?? 0) >= BALANCE.goodRelationship
            ? "has your back"
            : (game.relations[npc.id] ?? 0) <= BALANCE.hostileRelationship
              ? "strained"
              : "getting to know you"}{" "}
          · {npc.personality?.description}
        </p>
      )}
      <p className="dialogue-quote">“{interruption.dialogue}”</p>
      <div className="dialogue-options">
        {interruption.choices.map((choice, index) => (
          <button
            key={choice.label}
            autoFocus={index === 0}
            disabled={!!choice.conditions && !matches(game, choice.conditions)}
            onClick={() => useGame.getState().choose(index)}
          >
            <span className="choice-number">0{index + 1}</span>
            <span>
              <strong>{choice.label}</strong>
              <small>{choice.hint}</small>
            </span>
            <ArrowUpRight size={18} />
          </button>
        ))}
      </div>
      <div className="dialogue-footnote">
        {interruption.category === "coding"
          ? `Code quality ${Math.round(game.codeQuality)} · Technical debt ${Math.round(game.technicalDebt)} · Your future bugs are listening.`
          : "Your choices matter. Mostly to your calendar."}
      </div>
    </dialog>
  );
}
function TouchControls() {
  return (
    <div className="touch-controls">
      <div className="touch-dpad">
        {(["forward", "left", "backward", "right"] as const).map(
          (action, i) => (
            <button
              key={action}
              aria-label={`Move ${action}`}
              onPointerDown={(e) => {
                e.currentTarget.setPointerCapture(e.pointerId);
                input.held.add(action);
              }}
              onPointerUp={() => input.held.delete(action)}
              onPointerCancel={() => input.held.delete(action)}
            >
              {["↑", "←", "↓", "→"][i]}
            </button>
          ),
        )}
      </div>
      <button
        className="touch-interact"
        onClick={() => useGame.getState().interact()}
      >
        E
      </button>
    </div>
  );
}
export function Hud() {
  const game = useGame((s) => s.game),
    nearest = useGame((s) => s.nearest),
    toast = useGame((s) => s.toast),
    status = useGame((s) => s.saveStatus);
  const nearestObject = objects.find((o) => o.id === nearest),
    npc = npcs.find((n) => `npc:${n.id}` === nearest);
  const objective = game.hidingZone
    ? `LAY LOW · ${Math.ceil(game.hiddenUntil - game.minutes)} MIN`
    : !game.awake
      ? "GET OUT OF BED"
      : game.location === "home"
        ? "GET TO WORK"
        : game.location === "commute"
          ? "WALK TO THE OFFICE"
          : game.productivity >= 100
            ? "SURVIVE UNTIL 17:00"
            : game.working
              ? "SHIP SOMETHING. ANYTHING."
              : game.energy < 25
                ? "REFUEL AT THE KITCHEN"
                : "REACH YOUR DESK";
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => useGame.setState({ toast: null }), 7000);
    return () => clearTimeout(timer);
  }, [toast]);
  return (
    <div
      className={`game-ui ${game.minutes >= game.deadline - 60 && game.productivity < 100 ? "deadline-pressure" : ""}`}
    >
      <header className="game-top">
        <div className="day-clock">
          <span className="mini-logo">
            <Terminal size={20} />
          </span>
          <div>
            <span className="eyebrow">
              DAY 01 <span>/</span> MONDAY
            </span>
            <strong>
              {clock(game.minutes)}
              <span> / 17:00</span>
            </strong>
          </div>
          <div className="day-track">
            <i style={{ height: `${((game.minutes - 480) / 540) * 100}%` }} />
          </div>
        </div>
        <div className="resource-bar">
          {[
            {
              label: "Work",
              value: game.productivity,
              icon: Code2,
              color: "green",
            },
            {
              label: "Energy",
              value: game.energy,
              icon: BatteryMedium,
              color: "gold",
            },
            {
              label: "Stress",
              value: game.stress,
              icon: Flame,
              color: "orange",
            },
          ].map(({ label, value, icon: Icon, color }) => (
            <div className={`resource ${color}`} key={label}>
              <div>
                <Icon size={15} />
                <span>{label}</span>
                <strong>
                  {Math.round(value)}
                  <small>%</small>
                </strong>
              </div>
              <div className="resource-track">
                <i style={{ width: `${value}%` }} />
              </div>
            </div>
          ))}
          <button
            className="pause-button"
            aria-label="Pause game"
            onClick={() => useGame.getState().pause()}
          >
            <Pause size={20} />
          </button>
        </div>
      </header>
      <div className="objective-card">
        <span className="eyebrow">
          <span className="live-dot" /> YOUR OBJECTIVE
        </span>
        <strong>{objective}</strong>
        <span className="objective-detail">
          {game.location === "home"
            ? "An exciting new day of existing."
            : game.location === "commute"
              ? "Follow the path. Avoid eye contact."
              : `${tasksComplete(game)}/${taskNames(game).length} tasks · ${game.stats.interruptions} interruptions · ${game.stats.evaded} evaded`}
        </span>
        {game.coffeeUntil > game.minutes && (
          <span className="coffee-buff">
            <Coffee size={12} /> Java boost ·{" "}
            {Math.ceil(game.coffeeUntil - game.minutes)} min
          </span>
        )}
        {game.minutes >= game.deadline - 60 && game.productivity < 100 && (
          <span className="deadline-note">
            Delivery {clock(game.deadline)} ·{" "}
            {Math.max(0, Math.ceil(game.deadline - game.minutes))} min left.
            Protect your focus.
          </span>
        )}
      </div>
      {toast && !game.dialogue && (
        <div className="game-toast" role="status">
          <span className="toast-icon">
            <Terminal size={18} />
          </span>
          <div>
            <strong>{toast.title}</strong>
            <p>{toast.message}</p>
          </div>
          <button
            aria-label="Dismiss notification"
            onClick={() => useGame.setState({ toast: null })}
          >
            <X size={16} />
          </button>
        </div>
      )}
      {!game.dialogue && !game.working && (
        <>
          <MiniMap />
          <div className="interaction-prompt">
            {game.hidingZone ? (
              <>
                <div>
                  <span>STRATEGIC DISAPPEARANCE</span>
                  <strong>
                    {Math.max(0, Math.ceil(game.hiddenUntil - game.minutes))}{" "}
                    min remaining. Work is waiting.
                  </strong>
                </div>
                <button onClick={() => useGame.getState().stopHiding()}>
                  <kbd>E</kbd> Leave hiding spot
                </button>
              </>
            ) : !game.awake ? (
              <>
                <span className="prompt-icon">
                  <Coffee size={19} />
                </span>
                <div>
                  <span>08:00. YOUR ALARM HAS NO MERCY.</span>
                  <strong>Another day. Another deadline.</strong>
                </div>
                <button onClick={() => useGame.getState().interact()}>
                  <kbd>E</kbd> Get up <ChevronRight size={15} />
                </button>
              </>
            ) : nearestObject || npc ? (
              <>
                <span className="prompt-icon">
                  <Footprints size={19} />
                </span>
                <div>
                  <span>{npc ? npc.role : "INTERACT"}</span>
                  <strong>
                    {npc ? `Talk to ${npc.name}` : nearestObject?.label}
                  </strong>
                </div>
                <button onClick={() => useGame.getState().interact()}>
                  <kbd>E</kbd> {npc ? "Talk" : nearestObject?.action}{" "}
                  <ChevronRight size={15} />
                </button>
              </>
            ) : (
              <div className="explore-hint">
                <kbd>WASD</kbd> Move <span>·</span>
                <kbd>DRAG</kbd> Look <span>·</span>
                <kbd>SHIFT</kbd> Move faster
              </div>
            )}
          </div>
        </>
      )}
      {game.working && !game.dialogue && <WorkPanel />}
      {game.dialogue && <Dialogue />}
      {!game.dialogue && <ZoneAndSearch />}
      <div
        className={`save-indicator ${status === "error" ? "save-failed" : ""}`}
      >
        {status === "saved" ? <Check size={12} /> : <Save size={12} />}
        {status === "saving"
          ? "SAVING..."
          : status === "error"
            ? "SAVE FAILED — OPEN PAUSE"
            : "LOCAL AUTOSAVE"}
        <span>ESC TO PAUSE</span>
      </div>
      <TouchControls />
    </div>
  );
}
