import {
  ArrowRight,
  Award,
  Coffee,
  Code2,
  Check,
  Clock3,
  Users,
  Flame,
  RotateCcw,
  Home,
} from "lucide-react";
import { useGame } from "../game/store";
import {
  clock,
  duration,
  score,
  taskNames,
  tasksComplete,
} from "../game/rules";
import { achievements } from "../data/achievements";
import { evaluateEnding } from "../data/endings";
import { TIME_CATEGORIES, TIME_LABELS } from "../data/balance";
import { useState } from "react";
import { Journal } from "./journal";

export function Results() {
  const game = useGame((s) => s.game),
    profile = useGame((s) => s.profile);
  const ending = evaluateEnding(game);
  const [journal, setJournal] = useState(false);
  const mostWasted = TIME_CATEGORIES.filter((c) => c !== "coding").toSorted(
    (a, b) => game.stats.time[b] - game.stats.time[a],
  )[0];
  const rows = [
    ["Real work", `${Math.round(game.stats.workMinutes)} min`, Code2],
    [
      "Time donated to chaos",
      `${Math.round(game.stats.wastedMinutes)} min`,
      Clock3,
    ],
    ["Interruptions survived", game.stats.interruptions, Users],
    ["Meetings that could be emails", game.stats.meetings, Users],
    [
      "People helped / boundaries set",
      `${game.stats.helped} / ${game.stats.rejected}`,
      Check,
    ],
    ["Coffees consumed", game.stats.coffees, Coffee],
    ["Peak stress", `${Math.round(game.stats.maxStress)}%`, Flame],
    ["Final energy", `${Math.round(game.energy)}%`, Coffee],
    ["Code quality", `${Math.round(game.codeQuality)}%`, Code2],
    ["Technical debt", `${Math.round(game.technicalDebt)}%`, Code2],
    ["Office reputation", `${Math.round(game.reputation)}%`, Users],
    ["Requests evaded", game.stats.evaded, Users],
    [
      "First reached your desk",
      game.stats.deskArrival === null
        ? "Desk? What desk?"
        : clock(game.stats.deskArrival),
      Clock3,
    ],
  ] as const;
  return (
    <main className="results-screen">
      <header className="results-header">
        <span className="wordmark">
          <span className="logo-box">
            <Code2 size={21} />
          </span>
          coder-life.
        </span>
        <span className="eyebrow">END OF DAY REPORT / MONDAY, INC.</span>
      </header>
      <section className="results-card">
        <div className="results-main">
          <span className="eyebrow">
            <span className="live-dot" /> 17:00. CLOSE THE LAPTOP.
          </span>
          <div className="award-stamp">
            <Award size={48} />
          </div>
          <h1>
            Day one.
            <br />
            <span>You survived.</span>
          </h1>
          <p className="result-verdict">
            <strong>{ending.title}</strong>
            <br />“{ending.quote}”
          </p>
          <div className="score-number">
            {score(game)}
            <span>MONDAY SURVIVAL POINTS</span>
            <small className="best-score">
              PERSONAL BEST: {profile.bestScore}
            </small>
          </div>
          <div className="result-work">
            <span>PRODUCTIVITY</span>
            <strong>{Math.round(game.productivity)}%</strong>
            <div className="progress-track">
              <div style={{ width: `${game.productivity}%` }} />
            </div>
            <small>
              {tasksComplete(game)}/{taskNames(game).length} tasks completed ·{" "}
              {game.stats.counters.bugsResolved ?? 0} bugs resolved
            </small>
          </div>
          <div className="achievement-list">
            {game.achievements.map((a) => (
              <span key={a}>
                <Award size={13} />
                {achievements.find((definition) => definition.id === a)
                  ?.title ?? a}
              </span>
            ))}
          </div>
        </div>
        <div className="results-detail">
          <div className="eyebrow">HERE’S WHERE YOUR DAY WENT</div>
          <h2>The damage report.</h2>
          <div className="result-rows">
            {rows.map(([label, value, Icon]) => (
              <div key={label}>
                <Icon size={16} />
                <span>{label}</span>
                <strong>{value}</strong>
              </div>
            ))}
          </div>
          <div className="result-note">
            <Coffee size={22} />
            <p>
              Most time lost to: {TIME_LABELS[mostWasted]}
              <br />
              <strong>
                {duration(game.stats.time[mostWasted])} · {ending.description}
              </strong>
            </p>
          </div>
          <button
            className="start-button"
            onClick={() => useGame.getState().newGame()}
          >
            <span className="button-leading">
              <RotateCcw size={17} /> Give Monday another go
            </span>
            <ArrowRight size={18} />
          </button>
          <button
            className="text-button full-width center"
            onClick={() => useGame.getState().menu()}
          >
            <Home size={16} /> Back to main menu
          </button>
          <button
            className="text-button full-width"
            onClick={() => setJournal(true)}
          >
            View journal, achievements & discovered endings
          </button>
          <p className="fine-print center">
            <Check size={12} />{" "}
            {useGame((s) => s.saveStatus) === "error"
              ? "Save unavailable. Keep this window open to retain results."
              : "Your day is saved on this device."}
          </p>
        </div>
      </section>
      <section className="results-breakdown">
        <div>
          <p className="eyebrow">NINE HOURS. EVERY MINUTE ACCOUNTED FOR.</p>
          <h2>Where Monday went.</h2>
        </div>
        <div className="time-breakdown">
          {TIME_CATEGORIES.map((category) => (
            <div key={category}>
              <span>{TIME_LABELS[category]}</span>
              <div>
                <i
                  style={{
                    width: `${(game.stats.time[category] / 540) * 100}%`,
                  }}
                />
              </div>
              <strong>{duration(game.stats.time[category])}</strong>
            </div>
          ))}
        </div>
      </section>
      {journal && <Journal onClose={() => setJournal(false)} />}
      <footer className="results-footer">
        DAY 1 / JUNIOR DEVELOPER{" "}
        <span>CAREER ROADMAP: DEVELOPER → SENIOR → TECH LEAD</span>
      </footer>
    </main>
  );
}
