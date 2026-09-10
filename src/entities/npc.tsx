import { useEffect, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { CapsuleCollider, RigidBody } from "@react-three/rapier";
import type { RapierRigidBody } from "@react-three/rapier";
import type { Group } from "three";
import { Character } from "./character";
import type { NpcDefinition } from "../game/types";
import { useGame } from "../game/store";
import { runtime } from "../game/runtime";
import { getEncounter } from "../data/content";
import { createBrain, stepBrain } from "../ai/npc-brain";

export function Npc({
  definition: npc,
}: {
  definition: NpcDefinition;
  index?: number;
}) {
  const group = useRef<Group>(null),
    body = useRef<RapierRigidBody>(null);
  const [brain] = useState(() =>
    createBrain(npc, useGame.getState().game.seed),
  );
  const seeking = useGame(
    (s) => getEncounter(s.game.search?.id ?? null)?.npc === npc.id,
  );
  useEffect(() => {
    runtime.npcs.set(npc.id, brain);
    return () => {
      runtime.npcs.delete(npc.id);
    };
  }, [npc.id, brain]);
  useFrame((_, delta) => {
    const state = useGame.getState();
    if (state.screen !== "playing") return;
    const shouldTalk = stepBrain(
      brain,
      npc,
      state.game,
      runtime.player,
      delta,
      runtime.npcs.values(),
    );
    if (shouldTalk && state.game.search) state.interrupt(state.game.search.id);
    if (group.current) {
      group.current.rotation.y = brain.heading;
      group.current.visible = !(
        state.game.minutes < (state.game.cooldowns[`npc:${npc.id}`] ?? 0) &&
        Math.hypot(brain.position[0], brain.position[1] - 7.7) < 0.6
      );
    }
    body.current?.setNextKinematicTranslation({
      x: brain.position[0],
      y: 0.8,
      z: brain.position[1],
    });
  });
  return (
    <RigidBody
      ref={body}
      type="kinematicPosition"
      colliders={false}
      position={[npc.position[0], 0.8, npc.position[1]]}
    >
      <CapsuleCollider args={[0.45, 0.27]} sensor />
      <group ref={group} position={[0, -0.8, 0]}>
        <Character
          color={npc.color}
          skin={npc.skin}
          hair={npc.hair}
          glasses={npc.id === "accountant" || npc.id === "senior"}
          moving={() =>
            brain.path.length > 0 &&
            useGame.getState().screen === "playing" &&
            !useGame.getState().game.dialogue
          }
        />
      </group>
      {seeking && (
        <Html position={[0, 1.55, 0]} center zIndexRange={[8, 0]}>
          <div className="npc-alert">
            !<span>{npc.name} is looking for you</span>
          </div>
        </Html>
      )}
    </RigidBody>
  );
}
