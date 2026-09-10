import { useEffect, useRef, useState, useMemo } from "react";
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
import { OFFICE_PRESENTATION } from "../data/presentation";
import type { NpcAppearance } from "../data/appearances";
import type { AnimationSample } from "../game/types";
import { angleDifference } from "../game/locomotion";
import { sceneDebug } from "../game/scene-debug";
import { groundHeight } from "../data/world";

export function Npc({
  definition: npc,
  appearance,
}: {
  definition: NpcDefinition;
  index?: number;
  appearance?: NpcAppearance;
}) {
  const group = useRef<Group>(null),
    body = useRef<RapierRigidBody>(null);
  const [brain] = useState(() =>
    createBrain(npc, useGame.getState().game.seed),
  );
  const elapsed = useRef(0);
  const pose = useMemo<AnimationSample>(
    () => ({ animation: "idle", speed: 0, active: true, gesture: null }),
    [],
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
    pose.active =
      state.screen === "playing" &&
      !(import.meta.env.DEV && sceneDebug.freezeNpcs);
    if (!pose.active) return;
    elapsed.current += Math.min(delta, 0.05);
    const far =
      Math.hypot(
        brain.position[0] - runtime.player[0],
        brain.position[1] - runtime.player[1],
      ) > OFFICE_PRESENTATION.farDistance;
    if (
      elapsed.current >=
      (far ? OFFICE_PRESENTATION.farAiInterval : OFFICE_PRESENTATION.aiInterval)
    ) {
      const dt = elapsed.current;
      elapsed.current = 0;
      const oldX = brain.position[0],
        oldZ = brain.position[1];
      const shouldTalk = stepBrain(
        brain,
        npc,
        state.game,
        runtime.player,
        dt,
        runtime.npcs.values(),
      );
      if (shouldTalk && state.game.search)
        state.interrupt(state.game.search.id);
      pose.speed =
        Math.hypot(brain.position[0] - oldX, brain.position[1] - oldZ) / dt;
      pose.animation =
        pose.speed > 0.06
          ? "walk"
          : brain.state === "talking"
            ? "talk"
            : brain.state === "working" && npc.seated
              ? "typing"
              : "idle";
      pose.gesture =
        brain.state === "usingObject"
          ? "coffee"
          : brain.state === "talking"
            ? "chat"
            : null;
    }
    if (group.current) {
      group.current.position.y +=
        (groundHeight(brain.position, "office") - group.current.position.y) *
        (1 - Math.exp(-22 * delta));
      group.current.rotation.y +=
        angleDifference(group.current.rotation.y, brain.heading) *
        (1 - Math.exp(-12 * delta));
      group.current.position.x +=
        (brain.position[0] - group.current.position.x) *
        (1 - Math.exp(-22 * delta));
      group.current.position.z +=
        (brain.position[1] - group.current.position.z) *
        (1 - Math.exp(-22 * delta));
      group.current.visible = !(
        state.game.minutes < (state.game.cooldowns[`npc:${npc.id}`] ?? 0) &&
        Math.hypot(brain.position[0], brain.position[1] - 7.7) < 0.6
      );
    }
    body.current?.setNextKinematicTranslation({
      x: brain.position[0],
      y: 0.8 + groundHeight(brain.position, "office"),
      z: brain.position[1],
    });
  });
  return (
    <>
      <RigidBody
        ref={body}
        type="kinematicPosition"
        colliders={false}
        position={[npc.position[0], 0.8, npc.position[1]]}
      >
        <CapsuleCollider args={[0.45, 0.27]} sensor />
      </RigidBody>
      <group
        ref={group}
        position={[npc.position[0], 0, npc.position[1]]}
        rotation={[0, npc.workHeading ?? 0, 0]}
      >
        <Character
          color={npc.color}
          skin={npc.skin}
          hair={npc.hair}
          glasses={npc.id === "accountant" || npc.id === "senior"}
          appearance={appearance ?? npc.appearance}
          sample={() => pose}
        />
        {seeking && (
          <Html position={[0, 2.35, 0]} center zIndexRange={[8, 0]}>
            <div className="npc-alert">
              !<span>{npc.name} is looking for you</span>
            </div>
          </Html>
        )}
      </group>
    </>
  );
}
