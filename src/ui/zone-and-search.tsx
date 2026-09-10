import { EyeOff, UserRoundSearch } from "lucide-react";
import { useGame } from "../game/store";
import { runtime } from "../game/runtime";
import { getEncounter, npcs } from "../data/content";
import { zoneAt, meetingOccupied } from "../data/zones";

export function ZoneAndSearch() {
  const game = useGame((s) => s.game),
    zone = zoneAt(runtime.player, game.location);
  const npc = npcs.find(
    (n) => n.id === getEncounter(game.search?.id ?? null)?.npc,
  );
  return (
    <>
      {npc && (
        <div className="search-warning">
          <UserRoundSearch size={16} />
          <div>
            <strong>{npc.name} is looking for you</strong>
            <span>
              {game.hidingZone
                ? "Stay out of sight. They may give up."
                : "Break line of sight, take another aisle, or face the question."}
            </span>
          </div>
        </div>
      )}
      {zone?.hide && !game.hidingZone && !game.working && (
        <div className="zone-hint">
          <EyeOff size={16} />
          <div>
            <strong>{zone.name}</strong>
            <span>{zone.description}</span>
          </div>
          <button
            disabled={
              (zone.id === "meeting-room" && meetingOccupied(game.minutes)) ||
              game.minutes < (game.cooldowns.hide ?? 0)
            }
            onClick={() => useGame.getState().hide()}
          >
            {zone.id === "meeting-room" && meetingOccupied(game.minutes)
              ? "Occupied"
              : game.minutes < (game.cooldowns.hide ?? 0)
                ? "On cooldown"
                : "Lay low · 7 min"}
          </button>
        </div>
      )}
    </>
  );
}
