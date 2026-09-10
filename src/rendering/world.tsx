import { CuboidCollider, RigidBody } from "@react-three/rapier";
import { Instances, Instance } from "@react-three/drei";
import { bounds, obstacles } from "../data/world";
import type { Location } from "../game/types";
import { Box, Sign } from "./primitives";
import { Plant, WindowPanel } from "./props";
import { Character } from "../entities/character";
import { OfficeEnvironment } from "./office";
import { officeFloorColor } from "../data/office-layout";
import { HOME_BED } from "../data/pose-anchors";

function Floor({ location }: { location: Location }) {
  const { w, d } = bounds[location];
  return (
    <group>
      <Box position={[0, -0.2, 0]} size={[w, 0.4, d]} color="#a8ae95" />
      <Instances limit={w * d} frames={1} castShadow={false} receiveShadow>
        <boxGeometry args={[0.98, 0.018, 0.98]} />
        <meshStandardMaterial roughness={1} />
        {Array.from({ length: w }, (_, x) =>
          Array.from({ length: d }, (_, z) => (
            <Instance
              key={`${x}-${z}`}
              position={[x - w / 2 + 0.5, 0.008, z - d / 2 + 0.5]}
              color={
                location === "home"
                  ? (x + z) % 2
                    ? "#cfb28c"
                    : "#d7bc97"
                  : location === "commute"
                    ? (x + z) % 2
                      ? "#c1c3b0"
                      : "#cbcbb9"
                    : officeFloorColor(x - w / 2 + 0.5, z - d / 2 + 0.5)
              }
            />
          )),
        )}
      </Instances>
      {obstacles[location].slice(0, 4).map((wall, i) => (
        <Box
          key={`${wall.x}:${wall.z}`}
          position={[wall.x, wall.h / 2, wall.z]}
          size={[wall.w, wall.h, wall.d]}
          color={["#d3dcc6", "#c1cdb6", "#c6d3bd", "#becbb4"][i]}
        />
      ))}
      <Box position={[0, 3.05, -d / 2]} size={[w, 0.12, 0.3]} color="#73957a" />
    </group>
  );
}
function Home() {
  return (
    <>
      <WindowPanel position={[-3.4, 1.9, -4.85]} width={2.8} />
      <Box
        position={[
          HOME_BED.center[0],
          HOME_BED.frame.centerY,
          HOME_BED.center[1],
        ]}
        size={HOME_BED.frame.size}
        color="#aa815c"
      />
      <Box
        position={[
          HOME_BED.center[0],
          HOME_BED.mattress.centerY,
          HOME_BED.center[1],
        ]}
        size={HOME_BED.mattress.size}
        color="#eee4c8"
      />
      <Box
        position={[
          HOME_BED.center[0],
          HOME_BED.blanket.centerY,
          HOME_BED.blanket.z,
        ]}
        size={HOME_BED.blanket.size}
        color="#769c88"
      />
      <Box
        position={[
          HOME_BED.center[0],
          HOME_BED.pillow.centerY,
          HOME_BED.pillow.z,
        ]}
        size={HOME_BED.pillow.size}
        color="#f6f0db"
      />
      <Box position={[0.5, 1.3, -3]} size={[0.18, 2.6, 4]} color="#c7d1b9" />
      <Box position={[3.6, 0.6, -3.8]} size={[3, 1.2, 1]} color="#8ba48b" />
      <Box
        position={[3.6, 1.25, -3.8]}
        size={[3.1, 0.1, 1.1]}
        color="#e6d5b3"
      />
      <Box position={[3.5, 1.4, -3.7]} size={[0.6, 0.2, 0.4]} color="#d3a361" />
      <Box position={[-3.8, 0.4, 2]} size={[2.8, 0.8, 1.2]} color="#d5a163" />
      <Box position={[-3.8, 0.9, 1.55]} size={[2.8, 1, 0.22]} color="#c48e55" />
      <Box position={[3, 1.3, 4.88]} size={[1.8, 2.6, 0.12]} color="#76927c" />
      <Sign
        text="THE OUTSIDE WORLD →"
        position={[3, 0.04, 3.6]}
        width={3.2}
        height={0.45}
        rotation={[-Math.PI / 2, 0, 0]}
        background="#c0bb98"
      />
      <Plant position={[5, 0, -4]} />
      <Plant position={[-5.2, 0, 3.8]} />
      <Sign
        text="HOME SWEET HOME"
        position={[3, 2.3, -4.84]}
        width={3}
        height={0.4}
      />
    </>
  );
}
function Commute() {
  return (
    <>
      <Box position={[-4.3, 1.5, 0]} size={[2, 3, 8]} color="#bdc6b1" />
      <Box position={[4.3, 1.5, 1]} size={[2, 3, 6]} color="#deb888" />
      <Sign
        text="MONDAY, INC. →"
        position={[0, 2.4, -8.85]}
        width={4}
        height={0.7}
      />
      <Box position={[0, 1.15, -8.7]} size={[2.6, 2.3, 0.1]} color="#7ba28b" />
      <group position={[-1.7, 0, 0]} rotation={[0, 1.4, 0]}>
        <Character color="#d0a668" />
      </group>
      {[-5, 4, 6].map((z) => (
        <Plant key={z} position={[2.4, 0, z]} scale={1.4} />
      ))}
      <Sign
        text="WORK. THIS WAY."
        position={[0, 0.04, -4]}
        rotation={[-Math.PI / 2, 0, 0]}
        width={3}
        height={0.6}
        background="#8ca28a"
        color="#f5efda"
      />
    </>
  );
}
export function World({ location }: { location: Location }) {
  const { w, d } = bounds[location];
  return (
    <>
      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider args={[w / 2, 0.2, d / 2]} position={[0, -0.2, 0]} />
        {obstacles[location].map((o) => (
          <CuboidCollider
            key={`${location}:${o.x},${o.z}:${o.w},${o.d},${o.h}`}
            args={[o.w / 2, o.h / 2, o.d / 2]}
            position={[o.x, o.h / 2, o.z]}
          />
        ))}
      </RigidBody>
      <Floor location={location} />
      {location === "office" ? (
        <OfficeEnvironment />
      ) : location === "home" ? (
        <Home />
      ) : (
        <Commute />
      )}
    </>
  );
}
