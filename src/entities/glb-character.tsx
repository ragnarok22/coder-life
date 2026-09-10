import { useEffect, useRef } from "react";
import { useAnimations, useGLTF, Clone } from "@react-three/drei";
import type { Group } from "three";
import type { AnimationState } from "../game/types";
import type { AnimationSample } from "../game/types";
import { useFrame } from "@react-three/fiber";
import { PLAYER_MOTION } from "../data/presentation";

// Drop-in asset path: locally hosted GLB files with idle/walk/run/sit/typing/talk clips.
export default function GlbCharacter({
  url,
  animation,
  sample,
}: {
  url: string;
  animation: AnimationState;
  sample?: () => AnimationSample;
}) {
  const { scene, animations } = useGLTF(url, false);
  const group = useRef<Group>(null);
  const { actions } = useAnimations(animations, group);
  const previous = useRef<string | null>(null);
  useFrame(() => {
    const state = sample?.(),
      requested = state?.animation ?? animation;
    const name = actions[requested]
      ? requested
      : actions.idle
        ? "idle"
        : Object.keys(actions)[0];
    if (!name) return;
    if (name !== previous.current) {
      if (previous.current) actions[previous.current]?.fadeOut(0.22);
      actions[name]?.reset().fadeIn(0.22).play();
      previous.current = name;
    }
    const action = actions[name];
    if (action) {
      const timeScale =
        requested === "walk" || requested === "run"
          ? Math.max(
              0.2,
              Math.min(
                1.8,
                (state?.speed ?? PLAYER_MOTION.walkSpeed) /
                  (requested === "run"
                    ? PLAYER_MOTION.runSpeed
                    : PLAYER_MOTION.walkSpeed),
              ),
            )
          : 1;
      action.setEffectiveTimeScale(state?.active === false ? 0 : timeScale);
    }
  });
  useEffect(
    () => () => {
      Object.values(actions).forEach((action) => action?.stop());
    },
    [actions],
  );
  return (
    <group ref={group}>
      <Clone object={scene} />
    </group>
  );
}
