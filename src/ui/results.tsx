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
import { clock, score, tasksComplete } from "../game/rules";

export function Results() {
  const game = useGame((s) => s.game),
    won = game.productivity >= 100;
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
            {won
              ? "“Somehow, you actually shipped it.”"
              : "“Somehow still employed.”"}
          </p>
          <div className="score-number">
            {score(game)}
            <span>MONDAY SURVIVAL POINTS</span>
          </div>
          <div className="result-work">
            <span>PRODUCTIVITY</span>
            <strong>{Math.round(game.productivity)}%</strong>
            <div className="progress-track">
              <div style={{ width: `${game.productivity}%` }} />
            </div>
            <small>
              {tasksComplete(game)}/4 tasks completed · {tasksComplete(game)}{" "}
              bugs resolved
            </small>
          </div>
          <div className="achievement-list">
            {game.achievements.map((a) => (
              <span key={a}>
                <Award size={13} />
                {a}
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
              Tomorrow’s agenda?
              <br />
              <strong>More experience. Probably more meetings.</strong>
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
          <p className="fine-print center">
            <Check size={12} />{" "}
            {useGame((s) => s.saveStatus) === "error"
              ? "Save unavailable. Keep this window open to retain results."
              : "Your day is saved on this device."}
          </p>
        </div>
      </section>
      <footer className="results-footer">
        DAY 1 / JUNIOR DEVELOPER{" "}
        <span>CAREER ROADMAP: DEVELOPER → SENIOR → TECH LEAD</span>
      </footer>
    </main>
  );
}
