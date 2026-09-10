import { useEffect, useRef, useLayoutEffect } from "react";
import { useFrame } from "@react-three/fiber";
import {
  CapsuleCollider,
  RigidBody,
  useBeforePhysicsStep,
  useRapier,
} from "@react-three/rapier";
import type { RapierRigidBody } from "@react-three/rapier";
import { Vector3 } from "three";
import type { Group, Mesh } from "three";
import { input } from "../game/input";
import { runtime } from "../game/runtime";
import { useGame } from "../game/store";
import { objects, groundHeight } from "../data/world";
import { lineOfSight, nearestWalkable } from "../ai/navigation";
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
import type { Locomotion } from "../game/locomotion";
import { PlayerCamera } from "../rendering/player-camera";
import { sceneDebug } from "../game/scene-debug";
import { HOME_BED, CHAIR_POSE } from "../data/pose-anchors";
import { playerChairPose } from "../data/office-layout";
import { playerAnimation } from "../game/player-presentation";

interface PlayerPosture {
  mode: "sleep" | "seat" | "stand" | null;
  transitioning: number;
  world: Vector3;
  parent: Vector3;
  desired: Vector3;
  dialogue: boolean;
}

export function Player() {
  const body = useRef<RapierRigidBody>(null),
    visual = useRef<Group>(null),
    cameraAnchor = useRef<Group>(null),
    marker = useRef<Mesh>(null),
    posture = useRef<PlayerPosture | null>(null);
  const { world, rapier } = useRapier();
  const controller = useRef<ReturnType<
    typeof world.createCharacterController
  > | null>(null);
  const spawn = useGame((s) => s.game.position),
    motionRef = useRef<Locomotion | null>(null),
    timer = useRef(0);
  useLayoutEffect(() => {
    posture.current = {
      mode: null,
      transitioning: 0,
      world: new Vector3(),
      parent: new Vector3(),
      desired: new Vector3(),
      dialogue: false,
    };
  }, []);
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
      motion = (motionRef.current ??= createLocomotion()),
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
    if (import.meta.env.DEV && sceneDebug.colliders) {
      runtime.movementContacts.length = 0;
      if (runtime.speed < 0.1 && Math.hypot(motion.x, motion.z) > 1)
        for (let i = 0; i < c.numComputedCollisions(); i++) {
          const contact = c.computedCollision(i);
          if (contact?.collider)
            runtime.movementContacts.push({
              position: contact.collider.translation(),
              normal: contact.normal1,
            });
        }
    }
    runtime.animation = playerAnimation(
      state.game,
      state.screen,
      runtime.speed,
      running,
    );
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
      motion = (motionRef.current ??= createLocomotion());
    const pose = posture.current;
    if (
      !pose ||
      !visual.current ||
      !visual.current.parent ||
      !cameraAnchor.current
    )
      return;
    const sleeping = !state.game.awake && state.game.location === "home";
    const seated =
      state.game.location === "office" &&
      (state.game.working || (pose.mode === "seat" && !!state.game.dialogue));
    const mode = sleeping ? "sleep" : seated ? "seat" : "stand";
    const initial = pose.mode === null;
    if (mode !== pose.mode) {
      const point =
        mode === "seat"
          ? playerChairPose.position
          : pose.mode === "sleep"
            ? HOME_BED.wakePosition
            : pose.mode === "seat"
              ? nearestWalkable(
                  playerChairPose.exitPosition,
                  state.game.location,
                )
              : null;
      if (point) {
        const y =
          M.halfHeight +
          M.radius +
          M.colliderOffset +
          groundHeight(point, state.game.location);
        b.setTranslation({ x: point[0], y, z: point[1] }, true);
        b.setNextKinematicTranslation({ x: point[0], y, z: point[1] });
        runtime.player[0] = point[0];
        runtime.player[1] = point[1];
        motion.x = 0;
        motion.z = 0;
        motion.vertical = 0;
        runtime.speed = 0;
        motion.heading =
          mode === "seat"
            ? playerChairPose.heading
            : pose.mode === "sleep"
              ? 0
              : motion.heading;
        runtime.yaw = motion.heading;
        input.reset();
      }
      pose.transitioning = initial ? 0 : 0.35;
      pose.mode = mode;
    }
    if (state.game.dialogue && !pose.dialogue) input.reset();
    pose.dialogue = !!state.game.dialogue;
    if (
      state.screen !== "playing" ||
      state.game.dialogue ||
      sleeping ||
      seated ||
      state.game.hidingZone
    ) {
      motion.x = 0;
      motion.z = 0;
      runtime.speed = 0;
    }
    runtime.animation = playerAnimation(
      state.game,
      state.screen,
      runtime.speed,
      input.held.has("run"),
    );
    runtime.active = state.screen === "playing";
    runtime.seated = seated;
    runtime.seatHeight = CHAIR_POSE.seatHeight;
    const elapsed = Math.max(0, Math.min(dt, 0.05));
    visual.current.parent.getWorldPosition(pose.parent);
    if (sleeping) pose.desired.fromArray(HOME_BED.sleepOrigin);
    else if (seated)
      pose.desired.set(
        playerChairPose.position[0],
        groundHeight(playerChairPose.position, "office"),
        playerChairPose.position[1],
      );
    else pose.desired.set(pose.parent.x, pose.parent.y - 0.8, pose.parent.z);
    if (initial || pose.transitioning <= 0) pose.world.copy(pose.desired);
    else {
      pose.world.lerp(pose.desired, 1 - Math.exp(-20 * elapsed));
      pose.transitioning -= elapsed;
    }
    visual.current.position.copy(pose.world).sub(pose.parent);
    const pitch = sleeping ? -Math.PI / 2 : 0,
      heading = sleeping
        ? 0
        : seated
          ? playerChairPose.heading
          : motion.heading;
    visual.current.rotation.x = initial
      ? pitch
      : visual.current.rotation.x +
        (pitch - visual.current.rotation.x) * (1 - Math.exp(-18 * elapsed));
    visual.current.rotation.y +=
      angleDifference(visual.current.rotation.y, heading) *
      (1 - Math.exp(-25 * elapsed));
    if (sleeping)
      cameraAnchor.current.position.set(
        HOME_BED.sleepLookAt[0] - pose.parent.x,
        HOME_BED.sleepLookAt[1] - C.lookHeight - pose.parent.y,
        HOME_BED.sleepLookAt[2] - pose.parent.z,
      );
    else cameraAnchor.current.position.copy(visual.current.position);
    if (marker.current) marker.current.visible = mode === "stand";
    const p = b.translation();
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
  }, -1);
  return (
    <>
      <RigidBody
        ref={body}
        type="kinematicPosition"
        colliders={false}
        position={[
          spawn[0],
          0.86 + groundHeight(spawn, useGame.getState().game.location),
          spawn[1],
        ]}
        enabledRotations={[false, false, false]}
      >
        <CapsuleCollider args={[M.halfHeight, M.radius]} />
        <group ref={visual} name="player-character" position={[0, -0.8, 0]}>
          <Character glasses sample={() => runtime} />
        </group>
        <group ref={cameraAnchor} position={[0, -0.8, 0]} />
        <mesh
          ref={marker}
          position={[0, -0.77, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <ringGeometry args={[0.42, 0.49, 32]} />
          <meshBasicMaterial color="#e8c669" transparent opacity={0.9} />
        </mesh>
      </RigidBody>
      <PlayerCamera target={cameraAnchor} />
    </>
  );
}
