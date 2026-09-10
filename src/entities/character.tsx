import { lazy, Suspense, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Vector3 } from "three";
import type { Group } from "three";
import type { AnimationSample, AnimationState } from "../game/types";
import {
  PLAYER_APPEARANCE,
  BODY_SCALES,
  OUTFIT_PALETTES,
} from "../data/appearances";
import type { NpcAppearance } from "../data/appearances";
import { PLAYER_MOTION as M, OFFICE_PRESENTATION } from "../data/presentation";
import { Box } from "../rendering/primitives";
import { Mug } from "../rendering/props";
import { StaticMesh } from "../rendering/static-mesh";
import { Hair, HeadAccessories, OutfitDetails } from "./character-parts";
import { damp } from "../game/locomotion";

const GlbCharacter = lazy(() => import("./glb-character"));
interface Props {
  appearance?: NpcAppearance;
  color?: string;
  skin?: string;
  hair?: string;
  glasses?: boolean;
  animation?: AnimationState;
  moving?: () => boolean;
  sample?: () => AnimationSample;
  modelUrl?: string;
}
export function Character({
  appearance,
  color,
  skin,
  hair,
  glasses = false,
  animation = "idle",
  moving,
  sample,
  modelUrl,
}: Props) {
  const a = useMemo<NpcAppearance>(
    () =>
      appearance ?? {
        ...PLAYER_APPEARANCE,
        shirtColor: color ?? "#689881",
        skinTone: skin ?? PLAYER_APPEARANCE.skinTone,
        hairColor: hair ?? PLAYER_APPEARANCE.hairColor,
        accessories: glasses ? ["glasses"] : [],
      },
    [appearance, color, skin, hair, glasses],
  );
  const p = OUTFIT_PALETTES[a.palette],
    shirt = a.outfit === "blazer" ? p.jacket : (a.shirtColor ?? p.shirt),
    pants = a.pantsColor ?? p.pants;
  const root = useRef<Group>(null),
    leftLeg = useRef<Group>(null),
    rightLeg = useRef<Group>(null),
    leftArm = useRef<Group>(null),
    rightArm = useRef<Group>(null),
    coffee = useRef<Group>(null);
  const location = useMemo(() => new Vector3(), []);
  const motion = useRef({ phase: 0, weight: 0, seated: 0, run: 0, time: 0 }),
    frameBudget = useRef(0);
  useFrame(({ camera }, delta) => {
    const state = sample?.();
    if (state?.active === false) return;
    const dt = Math.min(delta, 0.05);
    frameBudget.current += dt;
    if (
      root.current &&
      camera.position.distanceToSquared(
        root.current.getWorldPosition(location),
      ) >
        OFFICE_PRESENTATION.animationDistance ** 2 &&
      frameBudget.current < 1 / 12
    )
      return;
    const elapsed = frameBudget.current;
    frameBudget.current = 0;
    const activeAnimation = state?.animation ?? animation;
    const speed =
      state?.speed ??
      (moving?.()
        ? M.walkSpeed
        : activeAnimation === "walk"
          ? M.walkSpeed
          : activeAnimation === "run"
            ? M.runSpeed
            : 0);
    const s = motion.current;
    s.time += elapsed;
    s.phase += speed * elapsed * 4.7;
    s.weight = damp(
      s.weight,
      speed > M.idleThreshold ? 1 : 0,
      M.animationBlend,
      elapsed,
    );
    s.run = damp(
      s.run,
      activeAnimation === "run" ? 1 : 0,
      M.animationBlend,
      elapsed,
    );
    s.seated = damp(
      s.seated,
      activeAnimation === "typing" || activeAnimation === "sit" ? 1 : 0,
      10,
      elapsed,
    );
    const swing = Math.sin(s.phase) * (0.46 + s.run * 0.2) * s.weight;
    if (leftLeg.current)
      leftLeg.current.rotation.x = swing * (1 - s.seated) - 1.1 * s.seated;
    if (rightLeg.current)
      rightLeg.current.rotation.x = -swing * (1 - s.seated) - 1.1 * s.seated;
    const gesture =
      activeAnimation === "talk" ? Math.sin(s.time * 3) * 0.16 - 0.35 : 0;
    if (leftArm.current)
      leftArm.current.rotation.x = damp(
        leftArm.current.rotation.x,
        a.accessories.includes("tablet")
          ? -0.8
          : s.seated
            ? -0.98 + Math.sin(s.time * 16) * 0.045
            : -swing * 0.7 + gesture,
        12,
        elapsed,
      );
    if (rightArm.current)
      rightArm.current.rotation.x = damp(
        rightArm.current.rotation.x,
        state?.gesture === "coffee" || a.accessories.includes("coffee-cup")
          ? -1.15
          : s.seated
            ? -0.98 + Math.cos(s.time * 16) * 0.045
            : swing * 0.7 - gesture,
        12,
        elapsed,
      );
    if (root.current) {
      root.current.position.y =
        -0.14 * s.seated + Math.abs(Math.sin(s.phase)) * s.weight * 0.025;
      root.current.rotation.x = damp(
        root.current.rotation.x,
        a.visualTag === "visionary" ? -0.035 : s.run * 0.07,
        9,
        elapsed,
      );
    }
    if (coffee.current)
      coffee.current.visible =
        state?.gesture === "coffee" || a.accessories.includes("coffee-cup");
  });
  if (modelUrl)
    return (
      <Suspense fallback={null}>
        <GlbCharacter url={modelUrl} animation={animation} sample={sample} />
      </Suspense>
    );
  const key = JSON.stringify(a);
  return (
    <group ref={root} scale={BODY_SCALES[a.body]} key={key}>
      <StaticMesh>
        <Box
          position={[0, 0.86, 0]}
          size={[a.presentation === "feminine" ? 0.59 : 0.65, 0.64, 0.4]}
          color={shirt}
        />
        <Box position={[0, 0.63, 0]} size={[0.53, 0.2, 0.38]} color={shirt} />
        <Box
          position={[0, 1.17, 0]}
          size={[0.22, 0.16, 0.24]}
          color={a.skinTone}
        />
        <OutfitDetails appearance={a} />
        <Box
          position={[0, 1.48, 0.025]}
          size={[0.61, 0.58, 0.54]}
          color={a.skinTone}
        />
        <Hair appearance={a} />
        <Box
          position={[0, 1.48, 0.32]}
          size={[0.09, 0.12, 0.1]}
          color={a.skinTone}
        />
        {[-0.15, 0.15].map((x) => (
          <Box
            key={x}
            position={[x, 1.56, 0.302]}
            size={[0.055, 0.07, 0.02]}
            color="#343931"
          />
        ))}
        <Box
          position={[0.035, 1.35, 0.303]}
          size={[0.11, 0.024, 0.02]}
          color="#ab745e"
        />
        <HeadAccessories appearance={a} />
      </StaticMesh>
      {[
        { side: -1, ref: leftLeg },
        { side: 1, ref: rightLeg },
      ].map(({ side, ref }) => (
        <group key={side} ref={ref} position={[side * 0.17, 0.56, 0]}>
          <StaticMesh>
            <Box
              position={[0, -0.22, 0]}
              size={[0.23, 0.49, 0.28]}
              color={pants}
            />
            <Box
              position={[0, -0.47, 0.07]}
              size={[0.26, a.shoes === "boots" ? 0.19 : 0.14, 0.43]}
              color={p.shoes}
            />
            <Box
              position={[0, -0.53, 0.07]}
              size={[0.27, 0.045, 0.44]}
              color={a.shoes === "loafers" ? "#4f5048" : "#e9e2cf"}
            />
          </StaticMesh>
        </group>
      ))}
      {[
        { side: -1, ref: leftArm },
        { side: 1, ref: rightArm },
      ].map(({ side, ref }) => (
        <group key={side} ref={ref} position={[side * 0.4, 1.1, 0]}>
          <StaticMesh>
            <Box
              position={[0, -0.13, 0]}
              size={[
                0.21,
                a.outfit === "casual" || a.outfit === "creative" ? 0.32 : 0.48,
                0.31,
              ]}
              color={shirt}
            />
            <Box
              position={[0, -0.38, 0.02]}
              size={[0.18, 0.23, 0.22]}
              color={a.skinTone}
            />
            {side === -1 && a.accessories.includes("watch") && (
              <Box
                position={[-0.015, -0.32, 0.13]}
                size={[0.21, 0.1, 0.05]}
                color="#3c4e51"
              />
            )}
            {side === -1 && a.accessories.includes("tablet") && (
              <>
                <Box
                  position={[0, -0.5, 0.08]}
                  size={[0.38, 0.52, 0.055]}
                  color="#354d56"
                />
                <Box
                  position={[0, -0.5, 0.117]}
                  size={[0.3, 0.43, 0.015]}
                  color="#a5c8be"
                />
              </>
            )}
          </StaticMesh>
          {side === 1 && (
            <group
              ref={coffee}
              position={[0, -0.47, 0.15]}
              visible={a.accessories.includes("coffee-cup")}
            >
              <StaticMesh>
                <Mug position={[0, 0, 0]} color={p.accent} />
              </StaticMesh>
            </group>
          )}
        </group>
      ))}
    </group>
  );
}
