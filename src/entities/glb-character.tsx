import { useEffect, useRef } from "react";
import { useAnimations, useGLTF, Clone } from "@react-three/drei";
import type { Group } from "three";
import type { AnimationState } from "../game/types";

// Drop-in asset path: locally hosted GLB files with idle/walk/run/sit/typing/talk clips.
export default function GlbCharacter({
  url,
  animation,
}: {
  url: string;
  animation: AnimationState;
}) {
  const { scene, animations } = useGLTF(url, false);
  const group = useRef<Group>(null);
  const { actions } = useAnimations(animations, group);
  useEffect(() => {
    const action = actions[animation];
    action?.reset().fadeIn(0.2).play();
    return () => {
      action?.fadeOut(0.2);
    };
  }, [actions, animation]);
  return (
    <group ref={group}>
      <Clone object={scene} />
    </group>
  );
}
