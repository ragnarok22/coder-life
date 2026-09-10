import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import {
  CapsuleCollider,
  RigidBody,
  useBeforePhysicsStep,
  useRapier,
} from "@react-three/rapier";
import type { RapierRigidBody } from "@react-three/rapier";
import { Group, Vector3 } from "three";
import { input } from "../game/input";
import { runtime } from "../game/runtime";
import { useGame } from "../game/store";
import { objects } from "../data/world";
import { lineOfSight } from "../ai/navigation";
import { Character } from "./Character";
import { audio } from "../game/audio";

export function Player() {
  const body = useRef<RapierRigidBody>(null),
    visual = useRef<Group>(null);
  const { world, rapier } = useRapier();
  const controller = useRef<ReturnType<
    typeof world.createCharacterController
  > | null>(null);
  const working = useGame((s) => s.game.working),
    spawn = useGame((s) => s.game.position);
  const cameraTarget = useRef(new Vector3()),
    desired = useRef(new Vector3()),
    direction = useRef(new Vector3());
  const timer = useRef(0),
    first = useRef(true),
    moving = useRef(false);
  useEffect(() => {
    const c = world.createCharacterController(0.025);
    c.enableAutostep(0.3, 0.2, true);
    c.enableSnapToGround(0.3);
    c.setSlideEnabled(true);
    controller.current = c;
    input.yaw = 0;
    input.pitch = 0.58;
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
    const canMove =
      state.screen === "playing" &&
      state.game.awake &&
      !state.game.dialogue &&
      !state.game.working;
    let x = canMove
      ? Number(input.held.has("right")) - Number(input.held.has("left"))
      : 0;
    let z = canMove
      ? Number(input.held.has("backward")) - Number(input.held.has("forward"))
      : 0;
    const length = Math.hypot(x, z),
      speed =
        (input.held.has("run") ? 5 : 3) * (0.65 + state.game.energy / 285);
    if (length) {
      x /= length;
      z /= length;
    }
    const dx = (x * Math.cos(input.yaw) + z * Math.sin(input.yaw)) * speed * dt;
    const dz = (z * Math.cos(input.yaw) - x * Math.sin(input.yaw)) * speed * dt;
    c.computeColliderMovement(
      b.collider(0),
      { x: dx, y: -9.81 * dt, z: dz },
      undefined,
      undefined,
      (collider) => collider.parent()?.handle !== b.handle,
    );
    const m = c.computedMovement();
    b.setNextKinematicTranslation({ x: p.x + m.x, y: p.y + m.y, z: p.z + m.z });
    runtime.player[0] = p.x;
    runtime.player[1] = p.z;
    moving.current = length > 0;
    runtime.animation = state.game.working
      ? "typing"
      : length
        ? input.held.has("run")
          ? "run"
          : "walk"
        : "idle";
    if (length) {
      runtime.yaw = Math.atan2(dx, dz);
      audio.play("step");
    }
  });
  useFrame(({ camera }, dt) => {
    const b = body.current;
    if (!b) return;
    const p = b.translation(),
      state = useGame.getState();
    if (visual.current) {
      const target = state.game.working ? 0 : runtime.yaw;
      const angle = Math.atan2(
        Math.sin(target - visual.current.rotation.y),
        Math.cos(target - visual.current.rotation.y),
      );
      visual.current.rotation.y += angle * Math.min(1, dt * 12);
    }
    cameraTarget.current.set(p.x, p.y + 0.55, p.z);
    direction.current.set(
      Math.sin(input.yaw) * Math.cos(input.pitch),
      Math.sin(input.pitch),
      Math.cos(input.yaw) * Math.cos(input.pitch),
    );
    const ray = new rapier.Ray(cameraTarget.current, direction.current);
    const hit = world.castRay(
      ray,
      input.zoom,
      true,
      rapier.QueryFilterFlags.EXCLUDE_DYNAMIC |
        rapier.QueryFilterFlags.EXCLUDE_KINEMATIC,
    );
    const distance = hit ? Math.max(0.7, hit.timeOfImpact - 0.25) : input.zoom;
    desired.current
      .copy(cameraTarget.current)
      .addScaledVector(direction.current, distance);
    camera.position.lerp(
      desired.current,
      first.current ||
        distance < camera.position.distanceTo(cameraTarget.current)
        ? 1
        : 1 - Math.exp(-dt * 7),
    );
    camera.lookAt(cameraTarget.current);
    first.current = false;
    timer.current += dt;
    if (timer.current > 0.15) {
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
    }
  });
  return (
    <RigidBody
      ref={body}
      type="kinematicPosition"
      colliders={false}
      position={[spawn[0], 0.86, spawn[1]]}
      enabledRotations={[false, false, false]}
    >
      <CapsuleCollider args={[0.48, 0.3]} />
      <group ref={visual} position={[0, -0.8, 0]}>
        <Character
          glasses
          animation={working ? "typing" : "idle"}
          moving={() => moving.current}
        />
      </group>
      <mesh position={[0, -0.77, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.42, 0.49, 32]} />
        <meshBasicMaterial color="#e8c669" transparent opacity={0.9} />
      </mesh>
    </RigidBody>
  );
}
