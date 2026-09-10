import { BALANCE } from "../data/balance";
import { zoneAt, meetingOccupied } from "../data/zones";
import { getEncounter } from "../data/content";
import { npcSeed, randomStream } from "../game/random";
import { canSee, findPath, walkable, lineOfSight } from "./navigation";
import type { GameData, NpcDefinition, NpcState, Vec2 } from "../game/types";
import { OFFICE_PRESENTATION as P } from "../data/presentation";
import { officePatrol } from "../data/office-layout";

export function createBrain(npc: NpcDefinition, seed: number) {
  const random = randomStream(npcSeed(seed, npc.id));
  return {
    id: npc.id,
    position: [...npc.position] as Vec2,
    destination: [...npc.desk] as Vec2,
    state: "idle" as NpcState,
    heading: npc.workHeading ?? 0,
    path: [] as Vec2[],
    timer: random.next(),
    random,
    offset: (random.next() - 0.5) * BALANCE.npcScheduleJitter * 2,
    lastSeen: null as Vec2 | null,
    lastSeenAt: -Infinity,
    searchKey: "",
    allowBathroom: false,
    blockedSeconds: 0,
    gaveUpUntil: 0,
    elapsed: 0,
    perceptionTimer: 0,
    sees: false,
    goal: "",
    pathTarget: null as Vec2 | null,
    socialUntil: 0,
    socialAt: 15 + random.next() * 20,
    socialPoint: null as Vec2 | null,
    goalKind: "desk",
  };
}
export type NpcBrain = ReturnType<typeof createBrain>;
type Neighbor = {
  position: Vec2;
  id?: string;
  elapsed?: number;
  socialUntil?: number;
  socialPoint?: Vec2 | null;
  socialAt?: number;
  state?: NpcState;
};
export function visibleToNpc(brain: NpcBrain, game: GameData, player: Vec2) {
  const playerZone = zoneAt(player, "office"),
    npcZone = zoneAt(brain.position, "office");
  if (
    playerZone?.id === "bathroom" &&
    (npcZone?.id !== "bathroom" || !brain.allowBathroom)
  )
    return false;
  if (
    game.hidingZone &&
    (npcZone?.id !== game.hidingZone ||
      Math.hypot(player[0] - brain.position[0], player[1] - brain.position[1]) >
        2.2)
  )
    return false;
  return canSee(brain.position, brain.heading, player, "office");
}
const patrol = officePatrol;
export function stepBrain(
  b: NpcBrain,
  npc: NpcDefinition,
  game: GameData,
  player: Vec2,
  seconds: number,
  neighbors: Iterable<Neighbor> = [],
): boolean {
  const dt = Math.min(seconds, 0.1);
  b.elapsed += dt;
  if (game.dialogue || game.finished) {
    b.state =
      getEncounter(game.dialogue)?.npc === npc.id ? "talking" : "waiting";
    return false;
  }
  const search = game.search,
    seeking = !!search && getEncounter(search.id)?.npc === npc.id;
  if (seeking && game.minutes < search.startedAt) {
    b.state = "working";
    return false;
  }
  if (seeking && game.minutes < game.quietUntil) {
    b.state = "waitingForPlayer";
    return false;
  }
  if (seeking && b.searchKey !== `${search.id}:${search.startedAt}`) {
    b.searchKey = `${search.id}:${search.startedAt}`;
    b.allowBathroom =
      b.random.next() >= (npc.personality?.bathroomRespect ?? 1);
    b.timer = 0;
    b.path = [];
  } else if (!seeking && b.searchKey) {
    b.searchKey = "";
    b.state = "gaveUp";
    b.gaveUpUntil = b.elapsed + 2;
    b.path = [];
  }
  if (b.gaveUpUntil > b.elapsed) return false;
  const others = [...neighbors];
  if (!seeking && b.socialUntil > b.elapsed) {
    b.state = "talking";
    if (b.socialPoint)
      b.heading = Math.atan2(
        b.socialPoint[0] - b.position[0],
        b.socialPoint[1] - b.position[1],
      );
    return false;
  }
  b.timer -= dt;
  b.perceptionTimer -= dt;
  if (b.perceptionTimer <= 0) {
    b.sees = visibleToNpc(b, game, player);
    b.perceptionTimer = P.perceptionInterval;
  }
  const sees = b.sees;
  if (
    seeking &&
    sees &&
    Math.hypot(player[0] - b.position[0], player[1] - b.position[1]) <
      BALANCE.interactionDistance &&
    visibleToNpc(b, game, player)
  )
    return true;
  if (b.timer <= 0) {
    b.timer = P.pathInterval;
    const sees = visibleToNpc(b, game, player);
    if (sees) {
      b.lastSeen = [...player];
      b.lastSeenAt = game.minutes;
    }
    if (seeking) {
      if (sees) {
        b.destination = [...player];
        b.state = "approachingPlayer";
      } else if (
        b.lastSeen &&
        game.minutes - b.lastSeenAt < BALANCE.lastSeenMemory
      ) {
        b.destination = b.lastSeen;
        b.state = "lookingForPlayer";
      } else if (game.minutes - search.startedAt < 8) {
        b.destination = [-6, 3.4];
        b.state = "lookingForPlayer";
      } else if (!b.path.length) {
        b.destination = patrol[Math.floor(b.random.next() * patrol.length)]!;
        b.state = "lookingForPlayer";
      }
    } else {
      const schedule = [...npc.schedule]
          .reverse()
          .find((s) => s.at + b.offset <= game.minutes),
        goal = schedule?.goal;
      const goalKey = `${schedule?.at}:${goal}:${game.minutes < (game.cooldowns[`npc:${npc.id}`] ?? 0)}`;
      const changed = goalKey !== b.goal;
      b.goal = goalKey;
      b.goalKind = goal ?? "wander";
      if (game.minutes < (game.cooldowns[`npc:${npc.id}`] ?? 0))
        b.destination = [0, 7.7];
      else if (goal === "desk") b.destination = npc.desk;
      else if (goal === "coffee" && changed)
        b.destination = [7.2 + b.random.next(), 4 + b.random.next() * 1.6];
      else if (goal === "meeting" && meetingOccupied(game.minutes) && changed)
        b.destination = [7.5 + b.random.next() * 3, -6.5];
      else if (
        goal !== "coffee" &&
        !(goal === "meeting" && meetingOccupied(game.minutes)) &&
        !b.path.length
      )
        b.destination = patrol[Math.floor(b.random.next() * patrol.length)]!;
      b.state = "walking";
      const zone = zoneAt(b.position, "office");
      if (
        b.elapsed >= b.socialAt &&
        (zone?.id === "kitchen" || zone?.id === "lounge")
      ) {
        b.socialAt = b.elapsed + P.smallTalkCooldown;
        const peer = others.find(
          (o) =>
            o.id &&
            o.id !== npc.id &&
            o.socialUntil !== undefined &&
            o.socialUntil <= (o.elapsed ?? 0) &&
            Math.hypot(
              o.position[0] - b.position[0],
              o.position[1] - b.position[1],
            ) < 1.7 &&
            lineOfSight(b.position, o.position, "office"),
        );
        if (peer) {
          const duration =
            P.smallTalkSeconds[0] +
            b.random.next() * (P.smallTalkSeconds[1] - P.smallTalkSeconds[0]);
          b.socialUntil = b.elapsed + duration;
          b.socialPoint = [...peer.position];
          peer.socialUntil = (peer.elapsed ?? b.elapsed) + duration;
          peer.socialPoint = [...b.position];
          peer.socialAt = (peer.elapsed ?? b.elapsed) + P.smallTalkCooldown;
          b.path = [];
          b.state = "talking";
          return false;
        }
      }
    }
    if (
      !b.pathTarget ||
      Math.hypot(
        b.pathTarget[0] - b.destination[0],
        b.pathTarget[1] - b.destination[1],
      ) > 0.5 ||
      (!b.path.length &&
        Math.hypot(
          b.position[0] - b.destination[0],
          b.position[1] - b.destination[1],
        ) > 0.3)
    ) {
      b.path = findPath(b.position, b.destination, "office");
      b.pathTarget = [...b.destination];
    }
  }
  // Courtesy steering yields to the player. Sensor colliders are a final safeguard in tight doors.
  const playerDistance = Math.hypot(
    b.position[0] - player[0],
    b.position[1] - player[1],
  );
  if (playerDistance < BALANCE.npcYieldRadius && !seeking) {
    const dx = b.position[0] - player[0],
      dz = b.position[1] - player[1],
      length = Math.max(0.01, playerDistance);
    const step: Vec2 = [
      b.position[0] + (dx / length) * dt * 1.8,
      b.position[1] + (dz / length) * dt * 1.8,
    ];
    if (
      walkable(step, "office") &&
      lineOfSight(b.position, step, "office", 0.35)
    )
      b.position = step;
    b.state = "waitingForPlayer";
    return false;
  }
  const next = b.path[0];
  if (!next) {
    b.state = seeking
      ? "waitingForPlayer"
      : b.goalKind === "coffee"
        ? "usingObject"
        : "working";
    if (!seeking && b.goalKind === "desk" && npc.workHeading !== undefined)
      b.heading = npc.workHeading;
    return false;
  }
  const dx = next[0] - b.position[0],
    dz = next[1] - b.position[1],
    distance = Math.hypot(dx, dz);
  if (distance < 0.12) {
    b.path.shift();
    return false;
  }
  const step = Math.min(
    distance,
    dt *
      (seeking ? BALANCE.npcSearchSpeed : BALANCE.npcSpeed) *
      (npc.personality?.speed ?? 1),
  );
  let candidate: Vec2 = [
    b.position[0] + (dx / distance) * step,
    b.position[1] + (dz / distance) * step,
  ];
  const occupied = (p: Vec2) =>
    others.some(
      (other) =>
        other !== b &&
        Math.hypot(p[0] - other.position[0], p[1] - other.position[1]) < 0.55,
    );
  if (occupied(candidate)) {
    const side: Vec2 = [
      b.position[0] - (dz / distance) * step,
      b.position[1] + (dx / distance) * step,
    ];
    if (!occupied(side) && walkable(side, "office")) candidate = side;
    else {
      b.blockedSeconds += dt;
      if (b.blockedSeconds > 2) {
        b.path = [];
        b.timer = 0;
        b.blockedSeconds = 0;
      }
      return false;
    }
  }
  if (
    walkable(candidate, "office") &&
    Math.hypot(candidate[0] - player[0], candidate[1] - player[1]) > 0.65
  )
    b.position = candidate;
  b.blockedSeconds = 0;
  b.heading = Math.atan2(dx, dz);
  return false;
}
