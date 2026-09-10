import { useEffect, useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import {
  CapsuleCollider,
  RigidBody,
  useBeforePhysicsStep,
  useRapier,
} from "@react-three/rapier";
import type { RapierRigidBody } from "@react-three/rapier";
import type { Group } from "three";
import { input } from "../game/input";
import { runtime } from "../game/runtime";
import { useGame } from "../game/store";
import { objects } from "../data/world";
import { lineOfSight } from "../ai/navigation";
import { Character } from "./character";
import { audio } from "../game/audio";
import {
  PLAYER_MOTION as M,
  THIRD_PERSON_CAMERA as C,
} from "../data/presentation";
import {
  angleDifference,
  createLocomotion,
  stepLocomotion,
  turnToward,
} from "../game/locomotion";
import { PlayerCamera } from "../rendering/player-camera";

export function Player() {
  const body = useRef<RapierRigidBody>(null),
    visual = useRef<Group>(null);
  const { world, rapier } = useRapier();
  const controller = useRef<ReturnType<
    typeof world.createCharacterController
  > | null>(null);
  const spawn = useGame((s) => s.game.position),
    motion = useMemo(createLocomotion, []),
    timer = useRef(0);
  useEffect(() => {
    const c = world.createCharacterController(M.colliderOffset);
    c.enableAutostep(M.stepHeight, M.stepWidth, true);
    c.enableSnapToGround(M.snapDistance);
    c.setSlideEnabled(true);
    controller.current = c;
    input.yaw = 0;
    input.pitch = C.pitch;
    input.zoom = C.distance;
    runtime.camera.yaw = 0;
    runtime.speed = 0;
    input.reset();
    return () => {
      world.removeCharacterController(c);
    };
  }, [world]);
  useBeforePhysicsStep(() => {
    const b = body.current,
      c = controller.current;
    if (!b || !c) return;
    const state = useGame.getState(),
      p = b.translation(),
      dt = world.timestep;
    const allowed =
      state.screen === "playing" &&
      state.game.awake &&
      !state.game.dialogue &&
      !state.game.hidingZone &&
      !state.game.working;
    const x = allowed
      ? Number(input.held.has("right")) - Number(input.held.has("left"))
      : 0;
    const z = allowed
      ? Number(input.held.has("backward")) - Number(input.held.has("forward"))
      : 0;
    const running = input.held.has("run");
    if (!allowed) {
      motion.x = 0;
      motion.z = 0;
    } else
      stepLocomotion(
        motion,
        x,
        z,
        runtime.camera.yaw,
        running,
        state.game.energy,
        dt,
      );
    motion.vertical = c.computedGrounded()
      ? -1
      : Math.max(-M.terminalVelocity, motion.vertical - M.gravity * dt);
    c.computeColliderMovement(
      b.collider(0),
      { x: motion.x * dt, y: motion.vertical * dt, z: motion.z * dt },
      rapier.QueryFilterFlags.EXCLUDE_SENSORS,
      undefined,
      (collider) => collider.parent()?.handle !== b.handle,
    );
    const movement = c.computedMovement();
    b.setNextKinematicTranslation({
      x: p.x + movement.x,
      y: p.y + movement.y,
      z: p.z + movement.z,
    });
    runtime.player[0] = p.x;
    runtime.player[1] = p.z;
    runtime.playerHeight = p.y;
    runtime.speed = Math.hypot(movement.x, movement.z) / dt;
    runtime.animation = state.game.working
      ? "typing"
      : state.game.dialogue
        ? "talk"
        : runtime.speed < M.idleThreshold
          ? "idle"
          : running && runtime.speed > M.walkSpeed * 0.9
            ? "run"
            : "walk";
    if (runtime.speed > M.idleThreshold) {
      const heading = Math.atan2(movement.x, movement.z),
        angle = Math.abs(angleDifference(motion.heading, heading));
      motion.heading = turnToward(
        motion.heading,
        heading,
        angle > Math.PI * 0.65
          ? M.reversalRotationSpeed
          : running
            ? M.runRotationSpeed
            : M.walkRotationSpeed,
        dt,
      );
      runtime.yaw = motion.heading;
      audio.play("step");
    }
  });
  useFrame((_, dt) => {
    const b = body.current;
    if (!b) return;
    const state = useGame.getState(),
      p = b.translation();
    if (state.screen !== "playing" || state.game.dialogue) {
      motion.x = 0;
      motion.z = 0;
      runtime.speed = 0;
    }
    if (visual.current) {
      const heading = state.game.working ? Math.PI : motion.heading;
      visual.current.rotation.y +=
        angleDifference(visual.current.rotation.y, heading) *
        (1 - Math.exp(-25 * dt));
    }
    timer.current += dt;
    if (timer.current < 0.15) return;
    timer.current = 0;
    let nearest: string | null = null,
      distance = 2.1;
    for (const o of objects) {
      if (o.location !== state.game.location) continue;
      const d = Math.hypot(p.x - o.position[0], p.z - o.position[1]);
      if (
        d < distance &&
        lineOfSight([p.x, p.z], o.position, o.location, 0.02)
      ) {
        nearest = o.id;
        distance = d;
      }
    }
    for (const [id, npc] of runtime.npcs) {
      const d = Math.hypot(p.x - npc.position[0], p.z - npc.position[1]);
      if (
        d < Math.min(distance, 1.6) &&
        lineOfSight([p.x, p.z], npc.position, "office")
      ) {
        nearest = `npc:${id}`;
        distance = d;
      }
    }
    if (state.nearest !== nearest) useGame.setState({ nearest });
  });
  return (
    <>
      <RigidBody
        ref={body}
        type="kinematicPosition"
        colliders={false}
        position={[spawn[0], 0.86, spawn[1]]}
        enabledRotations={[false, false, false]}
      >
        <CapsuleCollider args={[M.halfHeight, M.radius]} />
        <group ref={visual} position={[0, -0.8, 0]}>
          <Character glasses sample={() => runtime} />
        </group>
        <mesh position={[0, -0.77, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.42, 0.49, 32]} />
          <meshBasicMaterial color="#e8c669" transparent opacity={0.9} />
        </mesh>
      </RigidBody>
      <PlayerCamera target={visual} />
    </>
  );
}
