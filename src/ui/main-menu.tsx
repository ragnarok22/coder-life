import { lazy, Suspense, useState } from "react";
import {
  ArrowRight,
  Play,
  RotateCcw,
  Settings2,
  ArrowUpRight,
  Terminal,
  Volume2,
  VolumeX,
  Maximize,
  Clock3,
  Coffee,
  Code2,
  HardDrive,
  MoveUpRight,
  Sparkles,
  X,
} from "lucide-react";
import { useGame } from "../game/store";
import { Settings } from "./settings";
import { fullscreen } from "./fullscreen";
import { Modal } from "./modal";
import { Journal } from "./journal";

const MenuScene = lazy(() => import("../rendering/menu-scene"));
export function MainMenu() {
  const [overlay, setOverlay] = useState<
    "settings" | "about" | "new" | "journal" | null
  >(null);
  const hasSave = useGame((s) => s.hasSave),
    master = useGame((s) => s.preferences.master),
    saveError = useGame((s) => s.saveError);
  const newGame = () => {
    if (hasSave) setOverlay("new");
    else useGame.getState().newGame();
  };
  return (
    <main className="main-menu">
      <header className="site-header">
        <a className="wordmark" href="./" aria-label="Coder-Life home">
          <span className="logo-box">
            <Terminal size={20} strokeWidth={2.5} />
          </span>
          coder-life<span className="wordmark-dot">.</span>
        </a>
        <div className="header-right">
          <span className="local-badge">
            <span /> NO CLOUD. JUST COFFEE.
          </span>
          <span className="header-divider" />
          <a
            className="github-link"
            href="https://github.com/ragnarok22/coder-life"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="View Coder-Life source on GitHub (opens in a new tab)"
            title="Open source on GitHub"
          >
            <svg
              width="19"
              height="19"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M12 .297C5.37.297 0 5.67 0 12.297c0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.043-1.61-4.043-1.61-.546-1.387-1.333-1.756-1.333-1.756-1.09-.745.083-.729.083-.729 1.205.084 1.838 1.237 1.838 1.237 1.07 1.835 2.807 1.305 3.492.998.108-.776.418-1.305.762-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.469-2.38 1.236-3.22-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23a11.52 11.52 0 0 1 3.003-.404c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.652.242 2.873.118 3.176.77.84 1.235 1.91 1.235 3.22 0 4.61-2.805 5.625-5.478 5.922.43.372.823 1.102.823 2.222 0 1.606-.015 2.898-.015 3.293 0 .322.216.694.825.576C20.565 22.092 24 17.597 24 12.297c0-6.627-5.373-12-12-12" />
            </svg>
            <span>Open source</span>
          </a>
          <button
            className="icon-button"
            aria-label={master ? "Mute sound" : "Enable sound"}
            onClick={() =>
              useGame.getState().setPreferences({ master: master ? 0 : 0.6 })
            }
          >
            {master ? <Volume2 size={19} /> : <VolumeX size={19} />}
          </button>
          <button
            className="icon-button"
            aria-label="Fullscreen"
            onClick={() => void fullscreen()}
          >
            <Maximize size={18} />
          </button>
        </div>
      </header>
      <section className="menu-hero">
        <div className="hero-copy">
          <div className="eyebrow hero-eyebrow">
            <span className="tiny-line" /> A WORK-LIFE IMBALANCE SIMULATOR
          </div>
          <h1 aria-label="Coder-Life">
            CODER<span className="title-hyphen">-</span>
            <br />
            <span className="life-word">
              LIFE
              <span className="title-cursor" aria-hidden="true">
                _
              </span>
            </span>
          </h1>
          <p className="hero-tagline">
            Write code. Drink coffee.
            <br />
            Survive <span>“a quick question.”</span>
          </p>
          <p className="hero-description">
            A free, open-source 3D developer simulator in your browser.
            <br />
            Code, drink coffee, and survive office interruptions.
          </p>
          <nav className="menu-actions" aria-label="Main menu">
            <button className="start-button" onClick={newGame}>
              <span className="button-leading">
                <Play size={18} fill="currentColor" /> New game
              </span>
              <ArrowRight size={21} />
            </button>
            <button
              className="continue-button"
              disabled={!hasSave}
              onClick={() => void useGame.getState().continueGame()}
            >
              <span className="button-leading">
                <RotateCcw size={18} /> Continue
              </span>
              <span className="button-caption">
                {hasSave ? "Your desk is waiting" : "No saved coffee breaks"}
              </span>
            </button>
            <div className="menu-small-actions">
              <button onClick={() => setOverlay("settings")}>
                <Settings2 size={17} /> Settings
              </button>
              <button onClick={() => setOverlay("about")}>
                <span>About the game</span>
                <ArrowUpRight size={17} />
              </button>
            </div>
          </nav>
          <div className="local-save-note">
            <HardDrive size={13} />
            <span>Saved locally. Your boss can’t see this.</span>
          </div>
          <button
            className="journal-menu-link"
            onClick={() => setOverlay("journal")}
          >
            Day 1 Gameplay Polish <span>·</span> Journal & achievements{" "}
            <ArrowUpRight size={12} />
          </button>
        </div>
        <div className="hero-world">
          <div className="world-halo" />
          <div className="world-grid" />
          <div className="day-sticker">
            <span className="day-sticker-icon">
              <Coffee size={21} />
            </span>
            <div>
              <span className="eyebrow">YOUR FIRST MONDAY</span>
              <strong>
                Day 01 <span>/</span> Junior Developer
              </strong>
            </div>
            <span className="status-dot" />
          </div>
          <div className="menu-canvas">
            <Suspense
              fallback={
                <div className="scene-loading">
                  <Terminal className="loading-pulse" /> Booting the office...
                </div>
              }
            >
              {import.meta.env.SSR ? (
                <div className="scene-loading">
                  <Terminal /> Your first Monday is waiting.
                </div>
              ) : (
                <MenuScene />
              )}
            </Suspense>
          </div>
          <div className="mission-note">
            <span className="note-pin" />
            <div className="eyebrow">TODAY’S VERY SIMPLE PLAN</div>
            <p>Just do your job.</p>
            <span>How hard could it be?</span>
            <svg
              className="note-scribble"
              viewBox="0 0 90 35"
              aria-hidden="true"
            >
              <path d="M4 16 Q30 0 60 15 Q40 30 23 20 Q53 40 85 17 M73 18 L86 16 L82 29" />
            </svg>
          </div>
          <div className="world-caption">
            <span className="live-dot" /> ACTUAL IN-GAME CHAOS{" "}
            <MoveUpRight size={13} />
            <span className="drag-hint">drag to take a look</span>
          </div>
          <span className="scene-coordinate">OFFICE_01 / 08:00 AM</span>
        </div>
      </section>
      <section className="feature-strip" aria-label="Game features">
        <div className="feature">
          <span className="feature-icon">
            <Clock3 size={22} />
          </span>
          <div>
            <strong>Time is your currency.</strong>
            <p>Spend it like your deadline depends on it.</p>
          </div>
        </div>
        <div className="feature">
          <span className="feature-icon">
            <Coffee size={23} />
          </span>
          <div>
            <strong>Caffeine is your strategy.</strong>
            <p>A perfectly healthy coping mechanism.</p>
          </div>
        </div>
        <div className="feature">
          <span className="feature-icon">
            <Code2 size={23} />
          </span>
          <div>
            <strong>Shipping is optional. Almost.</strong>
            <p>Make it to 5 PM with something to show.</p>
          </div>
        </div>
      </section>
      <footer className="site-footer">
        <span>
          BUILT WITH BUGS & A LITTLE LOVE <span className="footer-star">✳</span>
        </span>
        <span>
          WASD to move <span className="footer-dot">·</span> Mouse to look{" "}
          <span className="footer-dot">·</span> E to politely suffer
        </span>
        <span className="version">
          v0.1.0 <span>EARLY COFFEE ACCESS</span>
        </span>
      </footer>
      {saveError && (
        <div className="save-error" role="alert">
          {saveError}
          <button
            aria-label="Dismiss"
            onClick={() => useGame.setState({ saveError: "" })}
          >
            <X size={16} />
          </button>
        </div>
      )}
      {overlay === "settings" && <Settings onClose={() => setOverlay(null)} />}
      {overlay === "journal" && <Journal onClose={() => setOverlay(null)} />}
      {overlay === "new" && (
        <Modal
          title="A fresh cup. A fresh start."
          subtitle="NEW GAME"
          onClose={() => setOverlay(null)}
        >
          <p className="modal-copy">
            Starting a new day will replace your current local save. Ready to
            clock in?
          </p>
          <div className="button-row">
            <button
              className="secondary-button"
              onClick={() => setOverlay(null)}
            >
              Keep my day
            </button>
            <button
              className="start-button"
              onClick={() => useGame.getState().newGame()}
            >
              Let’s do this <ArrowRight size={18} />
            </button>
          </div>
        </Modal>
      )}
      {overlay === "about" && (
        <Modal
          title="Your job is to do your job."
          subtitle="ABOUT THE GAME"
          onClose={() => setOverlay(null)}
        >
          <div className="about-icon">
            <Sparkles size={27} />
          </div>
          <p className="modal-copy">
            Unfortunately, everyone else has other plans. Coder-Life is a tiny
            3D comedy about the world’s most interrupted developer.
          </p>
          <div className="about-goal">
            <strong>One day. Four tasks. Too many people.</strong>
            <p>
              Get to the office, find your desk, and reach 100% work before
              17:00. Protect your energy, manage your stress, and remember:
              “five minutes” is never five minutes.
            </p>
          </div>
          <div className="controls-grid">
            <span>
              <kbd>W A S D</kbd> Move
            </span>
            <span>
              <kbd>SHIFT</kbd> Move faster
            </span>
            <span>
              <kbd>E</kbd> Interact / get up
            </span>
            <span>
              <kbd>ESC</kbd> Pause
            </span>
            <span>
              <kbd>DRAG</kbd> Rotate camera
            </span>
            <span>
              <kbd>SCROLL</kbd> Zoom
            </span>
          </div>
          <p className="fine-print">
            A normal day lasts about 12–18 real minutes. Coding decisions, trust
            and shortcuts change each run. All gameplay and saves stay in your
            browser. Made with React, Three.js and Rapier. No external assets or
            services required.
          </p>
        </Modal>
      )}
    </main>
  );
}
