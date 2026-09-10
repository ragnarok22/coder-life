import { BALANCE } from "../data/balance";
import { score } from "./rules";
import type { CareerProfile, GameData } from "./types";
export const initialProfile = (): CareerProfile => ({
  achievements: [],
  endings: [],
  bestScore: 0,
  completedRuns: 0,
  history: [],
});
export function recordProgress(
  profile: CareerProfile,
  game: GameData,
): CareerProfile {
  const unlocked = [
    ...new Set([...profile.achievements, ...game.achievements]),
  ];
  if (
    !game.finished ||
    !game.ending ||
    profile.history.some((r) => r.id === game.runId)
  )
    return unlocked.length === profile.achievements.length
      ? profile
      : { ...profile, achievements: unlocked };
  return {
    ...profile,
    achievements: unlocked,
    endings: [...new Set([...profile.endings, game.ending])],
    bestScore: Math.max(profile.bestScore, score(game)),
    completedRuns: profile.completedRuns + 1,
    history: [
      {
        id: game.runId,
        seed: game.seed,
        score: score(game),
        ending: game.ending,
        productivity: game.productivity,
        stats: game.stats,
        relations: game.relations,
        quality: game.codeQuality,
        debt: game.technicalDebt,
        reputation: game.reputation,
      },
      ...profile.history,
    ].slice(0, BALANCE.runHistoryLimit),
  };
}
