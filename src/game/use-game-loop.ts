import { useEffect } from "react";
import { useGame } from "./store";
import { installInput, input } from "./input";
import { audio } from "./audio";

export function useGameLoop() {
  useEffect(() => {
    void useGame.getState().checkSave();
    audio.configure(useGame.getState().preferences);
    const uninstall = installInput(
      () => useGame.getState().interact(),
      () => {
        if (document.querySelector("dialog[open]")) return;
        const state = useGame.getState();
        if (state.screen === "playing") state.pause();
        else if (state.screen === "paused") state.resume();
      },
      () => useGame.getState().preferences.sensitivity,
    );
    let last = performance.now();
    const loop = setInterval(() => {
      const now = performance.now(),
        dt = Math.min((now - last) / 1000, 0.5);
      last = now;
      if (!document.hidden) useGame.getState().tick(dt);
    }, 250);
    const autosave = setInterval(() => {
      if (useGame.getState().screen === "playing")
        void useGame.getState().save();
    }, 15000);
    const visibility = () => {
      if (document.hidden) {
        input.reset();
        audio.suspend();
        if (useGame.getState().screen === "playing") useGame.getState().pause();
      }
    };
    const pagehide = () => {
      if (useGame.getState().screen !== "menu") void useGame.getState().save();
    };
    document.addEventListener("visibilitychange", visibility);
    window.addEventListener("pagehide", pagehide);
    return () => {
      uninstall();
      clearInterval(loop);
      clearInterval(autosave);
      document.removeEventListener("visibilitychange", visibility);
      window.removeEventListener("pagehide", pagehide);
    };
  }, []);
}
