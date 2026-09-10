import { useGame } from "../game/store";

export async function fullscreen() {
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else await document.documentElement.requestFullscreen();
  } catch {
    useGame
      .getState()
      .notify(
        "Fullscreen unavailable",
        "Your browser does not support fullscreen in this view.",
      );
  }
}
