import type { AnimationState, GameData, Screen } from "./types";
import { PLAYER_MOTION } from "../data/presentation";

/** Animation selection must run even while dialogue pauses the physics world. */
export function playerAnimation(
  game: GameData,
  screen: Screen,
  speed: number,
  running: boolean,
): AnimationState {
  if (!game.awake && game.location === "home") return "sleep";
  if (game.dialogue) return "talk";
  if (game.working) return "typing";
  if (
    screen !== "playing" ||
    game.hidingZone ||
    speed < PLAYER_MOTION.idleThreshold
  )
    return "idle";
  return running && speed > PLAYER_MOTION.walkSpeed * 0.9 ? "run" : "walk";
}
