import { Component, lazy, Suspense } from "react";
import type { ReactNode, ErrorInfo } from "react";
import { Terminal, RotateCcw } from "lucide-react";
import { MainMenu } from "./ui/main-menu";
import { Hud } from "./ui/hud";
import { PauseMenu } from "./ui/pause-menu";
import { Results } from "./ui/results";
import { useGame } from "./game/store";
import { useGameLoop } from "./game/use-game-loop";

const GameScene = lazy(() => import("./rendering/game-scene"));
class GameErrorBoundary extends Component<
  { children: ReactNode },
  { error: string | null }
> {
  state: { error: string | null } = { error: null };
  static getDerivedStateFromError(error: Error) {
    return { error: error.message };
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Coder-Life rendering error", error, info.componentStack);
  }
  render() {
    if (this.state.error)
      return (
        <div className="boot-screen">
          <Terminal size={36} />
          <h1>A bug made it to production.</h1>
          <p>
            The 3D renderer could not start. Make sure WebGL and hardware
            acceleration are enabled.
          </p>
          <code>{this.state.error}</code>
          <button
            className="start-button"
            onClick={() => window.location.reload()}
          >
            <RotateCcw size={18} /> Try again
          </button>
        </div>
      );
    return this.props.children;
  }
}
export default function App() {
  const screen = useGame((s) => s.screen);
  useGameLoop();
  return (
    <GameErrorBoundary>
      {screen === "menu" ? (
        <MainMenu />
      ) : screen === "results" ? (
        <Results />
      ) : (
        <main className="game-shell">
          <Suspense
            fallback={
              <div className="boot-screen">
                <Terminal className="loading-pulse" size={32} />
                <h2>Compiling your Monday...</h2>
                <p>Loading the world & physics. Your coffee is safe.</p>
              </div>
            }
          >
            <GameScene />
          </Suspense>
          <Hud />
          {screen === "paused" && <PauseMenu />}
        </main>
      )}
    </GameErrorBoundary>
  );
}
