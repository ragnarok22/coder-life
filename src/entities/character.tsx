import { lazy, Suspense, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group } from "three";
import type { AnimationState } from "../game/types";
import { Box } from "../rendering/primitives";

const GlbCharacter = lazy(() => import("./glb-character"));

export function Character({
  color = "#689881",
  skin = "#e9b78e",
  hair = "#40382e",
  glasses = false,
  animation = "idle",
  moving,
  modelUrl,
}: {
  color?: string;
  skin?: string;
  hair?: string;
  glasses?: boolean;
  animation?: AnimationState;
  moving?: () => boolean;
  modelUrl?: string;
}) {
  const leftLeg = useRef<Group>(null),
    rightLeg = useRef<Group>(null),
    leftArm = useRef<Group>(null),
    rightArm = useRef<Group>(null);
  const seated = animation === "sit" || animation === "typing";
  useFrame(({ clock }) => {
    const active = moving
      ? moving()
      : animation === "walk" || animation === "run";
    const sway = active
      ? Math.sin(clock.elapsedTime * (animation === "run" ? 14 : 9)) * 0.48
      : 0;
    if (leftLeg.current) leftLeg.current.rotation.x = seated ? -1.3 : sway;
    if (rightLeg.current) rightLeg.current.rotation.x = seated ? -1.3 : -sway;
    if (leftArm.current)
      leftArm.current.rotation.x = seated
        ? -1.1 + Math.sin(clock.elapsedTime * 17) * 0.045
        : -sway * 0.65;
    if (rightArm.current)
      rightArm.current.rotation.x = seated
        ? -1.1 + Math.cos(clock.elapsedTime * 17) * 0.045
        : sway * 0.65;
  });
  if (modelUrl)
    return (
      <Suspense fallback={null}>
        <GlbCharacter url={modelUrl} animation={animation} />
      </Suspense>
    );
  return (
    <group position={[0, seated ? -0.25 : 0, 0]}>
      <group ref={leftLeg} position={[-0.17, 0.56, 0]}>
        <Box
          position={[0, -0.22, 0]}
          size={[0.23, 0.49, 0.28]}
          color="#3e4b4e"
        />
        <Box
          position={[0, -0.47, 0.07]}
          size={[0.25, 0.14, 0.43]}
          color="#f1ead8"
        />
        <Box
          position={[0, -0.52, 0.07]}
          size={[0.26, 0.05, 0.44]}
          color="#b4b6a5"
        />
      </group>
      <group ref={rightLeg} position={[0.17, 0.56, 0]}>
        <Box
          position={[0, -0.22, 0]}
          size={[0.23, 0.49, 0.28]}
          color="#3e4b4e"
        />
        <Box
          position={[0, -0.47, 0.07]}
          size={[0.25, 0.14, 0.43]}
          color="#f1ead8"
        />
        <Box
          position={[0, -0.52, 0.07]}
          size={[0.26, 0.05, 0.44]}
          color="#b4b6a5"
        />
      </group>
      <Box position={[0, 0.88, 0]} size={[0.65, 0.68, 0.4]} color={color} />
      <Box
        position={[0, 1.13, 0.21]}
        size={[0.16, 0.17, 0.025]}
        color="#eddec3"
      />
      <Box
        position={[0.17, 0.88, 0.217]}
        size={[0.15, 0.16, 0.025]}
        color="#e6dbb5"
      />
      <Box
        position={[0.17, 0.91, 0.236]}
        size={[0.08, 0.045, 0.012]}
        color="#829282"
      />
      <group ref={leftArm} position={[-0.42, 1.1, 0]}>
        <Box position={[0, -0.13, 0]} size={[0.21, 0.35, 0.32]} color={color} />
        <Box
          position={[0, -0.38, 0.02]}
          size={[0.18, 0.22, 0.22]}
          color={skin}
        />
      </group>
      <group ref={rightArm} position={[0.42, 1.1, 0]}>
        <Box position={[0, -0.13, 0]} size={[0.21, 0.35, 0.32]} color={color} />
        <Box
          position={[0, -0.38, 0.02]}
          size={[0.18, 0.22, 0.22]}
          color={skin}
        />
      </group>
      <Box position={[0, 1.48, 0.025]} size={[0.61, 0.58, 0.54]} color={skin} />
      <Box position={[0, 1.8, -0.015]} size={[0.65, 0.18, 0.59]} color={hair} />
      <Box
        position={[0, 1.64, -0.255]}
        size={[0.65, 0.26, 0.09]}
        color={hair}
      />
      <Box position={[-0.25, 1.7, 0.16]} size={[0.15, 0.2, 0.3]} color={hair} />
      <Box position={[0, 1.48, 0.32]} size={[0.09, 0.12, 0.1]} color={skin} />
      {[-0.15, 0.15].map((x) => (
        <group key={x}>
          <Box
            position={[x, 1.56, 0.302]}
            size={[0.055, 0.07, 0.02]}
            color="#343931"
          />
          {glasses && (
            <>
              <Box
                position={[x, 1.57, 0.316]}
                size={[0.23, 0.17, 0.03]}
                color="#3c4941"
              />
              <Box
                position={[x, 1.57, 0.335]}
                size={[0.16, 0.105, 0.008]}
                color="#a4c0b2"
              />
            </>
          )}
        </group>
      ))}
      {glasses && (
        <Box
          position={[0, 1.59, 0.32]}
          size={[0.09, 0.03, 0.025]}
          color="#3c4941"
        />
      )}
      <Box
        position={[0.035, 1.35, 0.303]}
        size={[0.11, 0.024, 0.02]}
        color="#ab745e"
      />
    </group>
  );
}
