import { useMemo } from "react";
import type { RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import { useRapier } from "@react-three/rapier";
import { Vector3 } from "three";
import type { Group } from "three";
import { createCameraRig, updateCameraRig } from "./camera-rig";
import { THIRD_PERSON_CAMERA as C } from "../data/presentation";
import { input } from "../game/input";
import { runtime } from "../game/runtime";
import { useGame } from "../game/store";

export function PlayerCamera({ target }: { target: RefObject<Group | null> }) {
  const { world, rapier } = useRapier();
  const rig = useMemo(createCameraRig, []),
    look = useMemo(() => new Vector3(), []);
  const sweep = useMemo(() => {
    const shape = new rapier.Ball(C.collisionRadius),
      rotation = { x: 0, y: 0, z: 0, w: 1 };
    const filter =
      rapier.QueryFilterFlags.EXCLUDE_DYNAMIC |
      rapier.QueryFilterFlags.EXCLUDE_KINEMATIC |
      rapier.QueryFilterFlags.EXCLUDE_SENSORS;
    return (origin: Vector3, direction: Vector3, distance: number) =>
      world.castShape(
        origin,
        rotation,
        direction,
        shape,
        0,
        distance,
        true,
        filter,
      )?.time_of_impact ?? null;
  }, [world, rapier]);
  useFrame(({ camera }, dt) => {
    if (!target.current) return;
    // Read the interpolated render transform, not a staircase of fixed physics positions.
    target.current.getWorldPosition(look);
    look.y += C.lookHeight;
    const state = useGame.getState();
    updateCameraRig(rig, look, input, dt, sweep, !!state.game.dialogue);
    camera.position.copy(rig.position);
    camera.lookAt(rig.target);
    runtime.camera.yaw = rig.yaw;
    runtime.camera.pitch = rig.pitch;
    runtime.camera.collided = rig.collided;
    rig.target.toArray(runtime.camera.target);
    rig.position.toArray(runtime.camera.position);
    rig.desired.toArray(runtime.camera.desired);
  });
  return null;
}
