import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { CapsuleCollider, RigidBody } from "@react-three/rapier";
import type { RapierRigidBody } from "@react-three/rapier";
import type { Group } from "three";
import { Character } from "./character";
import type { NpcDefinition, NpcState, Vec2 } from "../game/types";
import { useGame } from "../game/store";
import { runtime } from "../game/runtime";
import { canSee, findPath, lineOfSight, walkable } from "../ai/navigation";
import { interruptions } from "../data/content";

export function Npc({
  definition: npc,
  index,
}: {
  definition: NpcDefinition;
  index: number;
}) {
  const group = useRef<Group>(null),
    body = useRef<RapierRigidBody>(null);
  const brain = useRef({
    position: [...npc.position] as Vec2,
    destination: [...npc.desk] as Vec2,
    state: "idle" as NpcState,
    heading: 0,
    path: [] as Vec2[],
    timer: index * 0.3,
    lastSeen: null as Vec2 | null,
    searchTime: 0,
  });
  const seeking = useGame(
    (s) =>
      s.seeking &&
      interruptions.find((i) => i.id === s.seeking)?.npc === npc.id,
  );
  useEffect(() => {
    const current = brain.current;
    runtime.npcs.set(npc.id, current);
    return () => {
      runtime.npcs.delete(npc.id);
    };
  }, [npc.id]);
  useFrame((_, delta) => {
    const state = useGame.getState(),
      b = brain.current,
      dt = Math.min(delta, 0.05);
    if (state.screen !== "playing" || state.game.dialogue) {
      b.state = state.game.dialogue ? "talking" : "waiting";
      return;
    }
    b.timer -= dt;
    if (b.timer <= 0) {
      b.timer = 1.2 + index * 0.04;
      const event = interruptions.find((i) => i.id === state.seeking);
      const wantsPlayer = event?.npc === npc.id;
      if (
        wantsPlayer &&
        canSee(b.position, b.heading, runtime.player, "office")
      ) {
        b.lastSeen = [...runtime.player];
        b.searchTime = 0;
      }
      if (wantsPlayer && b.lastSeen) {
        b.destination = b.lastSeen;
        b.state = "lookingForPlayer";
        b.searchTime += b.timer;
        if (b.searchTime > 15) {
          b.lastSeen = null;
          b.searchTime = 0;
        }
      } else {
        const schedule = [...npc.schedule]
          .reverse()
          .find((s) => s.at <= state.game.minutes - index * 2);
        const goal = wantsPlayer ? "wander" : schedule?.goal;
        if (goal === "desk") b.destination = npc.desk;
        else if (goal === "coffee")
          b.destination = [7.5 + (index % 2) * 0.8, 3.8 + (index % 3) * 0.8];
        else if (goal === "meeting")
          b.destination = [6.5 + (index % 4), -6.6 + (index % 2) * 0.6];
        else if (!b.path.length) {
          for (let attempt = 0; attempt < 12; attempt++) {
            const next: Vec2 = [
              Math.random() * 20 - 10,
              Math.random() * 14 - 7,
            ];
            if (walkable(next, "office")) {
              b.destination = next;
              break;
            }
          }
        }
        b.state = "walking";
      }
      b.path = findPath(b.position, b.destination, "office");
    }
    if (
      seeking &&
      Math.hypot(
        b.position[0] - runtime.player[0],
        b.position[1] - runtime.player[1],
      ) < 1.8 &&
      lineOfSight(b.position, runtime.player, "office")
    ) {
      if (state.seeking) state.interrupt(state.seeking);
      return;
    }
    const next = b.path[0];
    if (next) {
      const dx = next[0] - b.position[0],
        dz = next[1] - b.position[1],
        distance = Math.hypot(dx, dz);
      if (distance < 0.15) b.path.shift();
      else {
        const step = Math.min(distance, dt * (seeking ? 1.7 : 1.05));
        const candidate: Vec2 = [
          b.position[0] + (dx / distance) * step,
          b.position[1] + (dz / distance) * step,
        ];
        const blocked = [...runtime.npcs.entries()].some(
          ([id, other]) =>
            id !== npc.id &&
            Math.hypot(
              candidate[0] - other.position[0],
              candidate[1] - other.position[1],
            ) < 0.6 &&
            id < npc.id,
        );
        if (
          !blocked &&
          Math.hypot(
            candidate[0] - runtime.player[0],
            candidate[1] - runtime.player[1],
          ) > 0.7
        )
          b.position = candidate;
        b.heading = Math.atan2(dx, dz);
      }
    } else b.state = seeking ? "lookingForPlayer" : "working";
    if (group.current) group.current.rotation.y = b.heading;
    body.current?.setNextKinematicTranslation({
      x: b.position[0],
      y: 0.8,
      z: b.position[1],
    });
  });
  return (
    <RigidBody
      ref={body}
      type="kinematicPosition"
      colliders={false}
      position={[npc.position[0], 0.8, npc.position[1]]}
    >
      <CapsuleCollider args={[0.45, 0.27]} />
      <group ref={group} position={[0, -0.8, 0]}>
        <Character
          color={npc.color}
          skin={npc.skin}
          hair={npc.hair}
          glasses={npc.id === "accountant"}
          moving={() =>
            brain.current.path.length > 0 &&
            useGame.getState().screen === "playing" &&
            !useGame.getState().game.dialogue
          }
        />
      </group>
      {seeking && (
        <Html position={[0, 1.55, 0]} center zIndexRange={[8, 0]}>
          <div className="npc-alert">
            !<span>{npc.name} needs you</span>
          </div>
        </Html>
      )}
    </RigidBody>
  );
}
