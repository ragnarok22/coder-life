import type { NpcAppearance } from "../data/appearances";
import { OUTFIT_PALETTES } from "../data/appearances";
import { Box, Cylinder } from "../rendering/primitives";
import {
  glassesRing,
  headphoneBand,
  matte,
  unitLeaf,
} from "../rendering/shared-assets";

function Puff({
  position,
  scale,
  color,
}: {
  position: [number, number, number];
  scale: [number, number, number];
  color: string;
}) {
  return (
    <mesh
      position={position}
      scale={scale}
      geometry={unitLeaf}
      material={matte(color)}
      castShadow
      dispose={null}
    />
  );
}
export function Hair({ appearance: a }: { appearance: NpcAppearance }) {
  const c = a.hairColor;
  if (a.hair === "bald") return null;
  if (a.hair === "afro")
    return (
      <>
        <Puff
          position={[0, 1.91, -0.06]}
          scale={[0.48, 0.41, 0.37]}
          color={c}
        />
        <Puff
          position={[-0.31, 1.68, -0.1]}
          scale={[0.2, 0.29, 0.26]}
          color={c}
        />
        <Puff
          position={[0.31, 1.68, -0.1]}
          scale={[0.2, 0.29, 0.26]}
          color={c}
        />
      </>
    );
  if (a.hair === "curly")
    return (
      <>
        {[-0.28, 0, 0.28].map((x) => (
          <group key={x}>
            <Puff
              position={[x, 1.83, 0.08]}
              scale={[0.22, 0.2, 0.27]}
              color={c}
            />
            <Puff
              position={[x, 1.78, -0.2]}
              scale={[0.23, 0.22, 0.23]}
              color={c}
            />
          </group>
        ))}
      </>
    );
  return (
    <>
      <Box
        position={[0, a.hair === "buzz" ? 1.782 : 1.8, -0.02]}
        size={[0.65, a.hair === "buzz" ? 0.05 : 0.17, 0.59]}
        color={c}
      />
      {a.hair !== "buzz" && (
        <Box position={[0, 1.65, -0.255]} size={[0.64, 0.25, 0.1]} color={c} />
      )}
      {["short", "side-part", "messy"].includes(a.hair) && (
        <Box
          position={[-0.25, 1.68, 0.17]}
          size={[0.13, 0.22, 0.26]}
          color={c}
        />
      )}
      {a.hair === "side-part" && (
        <>
          <Box
            position={[0.09, 1.88, 0.04]}
            size={[0.47, 0.14, 0.56]}
            rotation={[0, 0, -0.15]}
            color={c}
          />
          <Box
            position={[-0.21, 1.8, 0.27]}
            size={[0.2, 0.17, 0.08]}
            color={c}
          />
        </>
      )}
      {a.hair === "messy" &&
        [-0.2, 0, 0.23].map((x, i) => (
          <Box
            key={x}
            position={[x, 1.92, 0.02]}
            size={[0.2, 0.25, 0.32]}
            rotation={[0.12, i * 0.25, i % 2 ? 0.28 : -0.25]}
            color={c}
          />
        ))}
      {["medium", "long"].includes(a.hair) && (
        <>
          <Box
            position={[0, a.hair === "long" ? 1.35 : 1.55, -0.28]}
            size={[0.65, a.hair === "long" ? 0.8 : 0.48, 0.18]}
            color={c}
          />
          {[-1, 1].map((s) => (
            <Box
              key={s}
              position={[s * 0.3, a.hair === "long" ? 1.45 : 1.6, 0.03]}
              size={[0.13, a.hair === "long" ? 0.66 : 0.36, 0.42]}
              rotation={[0, 0, s * 0.08]}
              color={c}
            />
          ))}
        </>
      )}
      {a.hair === "ponytail" && (
        <>
          <Puff
            position={[0, 1.76, -0.4]}
            scale={[0.17, 0.19, 0.2]}
            color={c}
          />
          <Box
            position={[0, 1.46, -0.47]}
            size={[0.24, 0.52, 0.23]}
            rotation={[-0.2, 0, 0]}
            color={c}
          />
          <Box
            position={[0, 1.73, -0.4]}
            size={[0.27, 0.065, 0.25]}
            color="#c8ac6e"
          />
        </>
      )}
      {a.hair === "bun" && (
        <>
          <Puff
            position={[0, 1.94, -0.26]}
            scale={[0.24, 0.23, 0.22]}
            color={c}
          />
          <Box
            position={[0, 1.78, -0.27]}
            size={[0.39, 0.07, 0.24]}
            color="#cba86e"
          />
        </>
      )}
    </>
  );
}
export function HeadAccessories({
  appearance: a,
}: {
  appearance: NpcAppearance;
}) {
  const has = (name: (typeof a.accessories)[number]) =>
      a.accessories.includes(name),
    p = OUTFIT_PALETTES[a.palette];
  return (
    <>
      {has("glasses") && (
        <>
          {[-0.15, 0.15].map((x) => (
            <group key={x}>
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
            </group>
          ))}
          <Box
            position={[0, 1.59, 0.32]}
            size={[0.09, 0.03, 0.025]}
            color="#3c4941"
          />
        </>
      )}
      {has("round-glasses") && (
        <>
          {[-0.15, 0.15].map((x) => (
            <mesh
              key={x}
              position={[x, 1.57, 0.324]}
              geometry={glassesRing}
              material={matte(
                a.visualTag === "visionary" ? "#cfb263" : "#53625c",
              )}
              dispose={null}
            />
          ))}
          <Box
            position={[0, 1.58, 0.325]}
            size={[0.1, 0.025, 0.02]}
            color="#637466"
          />
        </>
      )}
      {has("headphones") && (
        <>
          <mesh
            position={[0, 1.59, -0.05]}
            geometry={headphoneBand}
            material={matte("#333a43")}
            castShadow
            dispose={null}
          />
          {[-0.39, 0.39].map((x) => (
            <group key={x}>
              <Cylinder
                position={[x, 1.55, -0.02]}
                rotation={[0, 0, Math.PI / 2]}
                radius={0.2}
                height={0.13}
                color="#364554"
              />
              <Cylinder
                position={[x * 1.17, 1.55, -0.02]}
                rotation={[0, 0, Math.PI / 2]}
                radius={0.13}
                height={0.03}
                color={p.accent}
              />
            </group>
          ))}
        </>
      )}
      {has("cap") && (
        <>
          <Box
            position={[0, 1.83, -0.02]}
            size={[0.68, 0.16, 0.61]}
            color={p.accent}
          />
          <Box
            position={[0.02, 1.75, 0.37]}
            size={[0.64, 0.06, 0.32]}
            color={p.accent}
          />
        </>
      )}
      {has("earrings") &&
        [-0.345, 0.345].map((x) => (
          <Puff
            key={x}
            position={[x, 1.37, 0.02]}
            scale={[0.04, 0.09, 0.04]}
            color="#d4b16d"
          />
        ))}
    </>
  );
}
export function OutfitDetails({
  appearance: a,
}: {
  appearance: NpcAppearance;
}) {
  const p = OUTFIT_PALETTES[a.palette];
  return (
    <>
      {a.outfit === "blazer" ? (
        <>
          <Box
            position={[0, 0.9, 0.209]}
            size={[0.24, 0.58, 0.022]}
            color={p.shirt}
          />
          {[-1, 1].map((s) => (
            <Box
              key={s}
              position={[s * 0.17, 1.05, 0.23]}
              rotation={[0, 0, s * 0.22]}
              size={[0.13, 0.32, 0.035]}
              color={p.jacket}
            />
          ))}
          <Box
            position={[0, 0.95, 0.242]}
            size={[0.065, 0.28, 0.027]}
            color={p.accent}
          />
        </>
      ) : a.outfit === "office-casual" ? (
        <>
          <Box
            position={[0, 0.91, 0.211]}
            size={[0.028, 0.57, 0.015]}
            color={p.accent}
          />
          <Box
            position={[0.19, 0.98, 0.213]}
            size={[0.14, 0.13, 0.018]}
            color={p.accent}
          />
        </>
      ) : (
        <>
          <Box
            position={[0, 0.97, 0.211]}
            size={[0.25, 0.2, 0.015]}
            color={p.accent}
          />
          <Box
            position={[0, 0.98, 0.225]}
            size={[0.12, 0.027, 0.008]}
            color={p.shirt}
          />
        </>
      )}
      {a.accessories.includes("lanyard") && (
        <>
          <Box
            position={[-0.1, 1.02, 0.24]}
            rotation={[0, 0, -0.18]}
            size={[0.035, 0.4, 0.02]}
            color="#596d88"
          />
          <Box
            position={[0.1, 1.02, 0.24]}
            rotation={[0, 0, 0.18]}
            size={[0.035, 0.4, 0.02]}
            color="#596d88"
          />
          <Box
            position={[0, 0.78, 0.255]}
            size={[0.18, 0.2, 0.026]}
            color="#e4e5d5"
          />
          <Box
            position={[0, 0.83, 0.272]}
            size={[0.11, 0.04, 0.008]}
            color="#829b83"
          />
        </>
      )}
      {a.accessories.includes("backpack") && (
        <>
          <Box
            position={[0, 0.9, -0.3]}
            size={[0.5, 0.57, 0.25]}
            color={p.jacket}
          />
          <Box
            position={[0, 0.83, -0.44]}
            size={[0.33, 0.25, 0.04]}
            color={p.accent}
          />
          {[-0.24, 0.24].map((x) => (
            <Box
              key={x}
              position={[x, 0.94, 0.22]}
              size={[0.075, 0.52, 0.03]}
              color={p.jacket}
            />
          ))}
        </>
      )}
    </>
  );
}
