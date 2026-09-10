import { CuboidCollider, RigidBody } from "@react-three/rapier";
import { Instances, Instance } from "@react-three/drei";
import { bounds, obstacles, OFFICE_DESKS } from "../data/world";
import type { Location } from "../game/types";
import { Box, Sign } from "./Primitives";
import {
  CoffeeStation,
  Desk,
  Plant,
  Printer,
  WaterCooler,
  WindowPanel,
} from "./Props";
import { Character } from "../entities/Character";

function Floor({ location }: { location: Location }) {
  const { w, d } = bounds[location];
  return (
    <group>
      <Box position={[0, -0.2, 0]} size={[w, 0.4, d]} color="#a8ae95" />
      <Instances limit={500} castShadow={false} receiveShadow>
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
                    : (x + z) % 2
                      ? "#d9ddca"
                      : "#e1e3d1"
              }
            />
          )),
        )}
      </Instances>
      <Box position={[0, 1.5, -d / 2]} size={[w, 3, 0.2]} color="#d3dcc6" />
      <Box position={[-w / 2, 1.5, 0]} size={[0.2, 3, d]} color="#c6d3bd" />
      <Box position={[w / 2, 0.4, 0]} size={[0.2, 0.8, d]} color="#becbb4" />
      <Box position={[0, 0.3, d / 2]} size={[w, 0.6, 0.2]} color="#c1cdb6" />
      <Box position={[0, 3.05, -d / 2]} size={[w, 0.12, 0.3]} color="#73957a" />
    </group>
  );
}
function Office() {
  return (
    <>
      {[-8, -4, 0, 8].map((x) => (
        <WindowPanel key={x} position={[x, 1.9, -8.86]} width={2.6} />
      ))}
      {OFFICE_DESKS.map(([x, z], i) => (
        <Desk
          key={i}
          position={[x, 0, z]}
          player={i === 2}
          rotation={Math.PI}
        />
      ))}
      <Sign
        text="ENGINEERING"
        position={[-5.8, 2.6, -8.8]}
        width={2.8}
        height={0.4}
      />
      <Sign
        text="MONDAY, INC."
        position={[0.5, 2.6, -8.8]}
        width={3}
        height={0.5}
      />
      <Sign
        text="YOUR DESK"
        position={[-6, 0.035, 0.6]}
        rotation={[-Math.PI / 2, 0, 0]}
        width={2}
        height={0.5}
        background="#8dae85"
        color="#fff8e6"
      />
      <CoffeeStation position={[9.9, 0, 2.2]} />
      <Box position={[10, 1, 6]} size={[1.5, 2, 1]} color="#dfdfc8" />
      <Box
        position={[10, 1.45, 6.52]}
        size={[1.3, 0.025, 0.03]}
        color="#929f8b"
      />
      <Sign text="LUNCH" position={[10, 2.4, 6]} width={1.5} height={0.4} />
      <Printer position={[-10.5, 0, -5.5]} />
      <WaterCooler position={[-10.8, 0, 1]} />
      <Box position={[-8.5, 0.65, 6]} size={[3.4, 1.3, 1.4]} color="#82a18c" />
      <Box position={[-8.5, 1.35, 6]} size={[3.6, 0.12, 1.6]} color="#ddc99f" />
      <Sign
        text="HELLO, HUMAN."
        position={[-8.5, 0.85, 6.72]}
        width={2.5}
        height={0.4}
      />
      <Box
        position={[5.5, 1.4, -5.8]}
        size={[0.18, 2.8, 6.4]}
        color="#b3c7b5"
      />
      <Box
        position={[8.7, 1.4, -1.8]}
        size={[6.6, 2.8, 0.18]}
        color="#c5d4c0"
      />
      <Sign
        text="QUICK SYNC"
        position={[8.5, 2.2, -1.69]}
        width={2.4}
        height={0.45}
      />
      <Box position={[8, 1, -4.5]} size={[4, 0.15, 2]} color="#dfc797" />
      {[-1.5, 1.5].map((x) => (
        <Box
          key={x}
          position={[8 + x, 0.48, -4.5]}
          size={[0.15, 0.95, 1.5]}
          color="#728b73"
        />
      ))}
      <Box position={[5, 1.25, 5.7]} size={[0.18, 2.5, 3]} color="#bccbb7" />
      <Box
        position={[2.9, 1.25, 7.2]}
        size={[4.3, 2.5, 0.18]}
        color="#cbd7c0"
      />
      <Sign
        text="QUIET ZONE / WC"
        position={[2.8, 2, 7.09]}
        rotation={[0, Math.PI, 0]}
        width={3}
        height={0.4}
      />
      <Sign
        text="SUPPORT"
        position={[-10.82, 2, -4]}
        rotation={[0, Math.PI / 2, 0]}
        width={2}
        height={0.4}
      />
      <Plant position={[-11, 0, -8]} />
      <Plant position={[11, 0, -8]} />
      <Plant position={[6.5, 0, 7.6]} />
      <Plant position={[-10.5, 0, 8]} />
    </>
  );
}
function Home() {
  return (
    <>
      <WindowPanel position={[-3.4, 1.9, -4.85]} width={2.8} />
      <Box
        position={[-3.6, 0.3, -2.7]}
        size={[2.3, 0.6, 3.4]}
        color="#aa815c"
      />
      <Box
        position={[-3.6, 0.67, -2.7]}
        size={[2.2, 0.2, 3.3]}
        color="#eee4c8"
      />
      <Box
        position={[-3.6, 0.81, -2.15]}
        size={[2.23, 0.14, 2.1]}
        color="#769c88"
      />
      <Box
        position={[-3.6, 0.86, -3.83]}
        size={[1.6, 0.22, 0.7]}
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
        {obstacles[location].map((o, i) => (
          <CuboidCollider
            key={i}
            args={[o.w / 2, o.h / 2, o.d / 2]}
            position={[o.x, o.h / 2, o.z]}
          />
        ))}
      </RigidBody>
      <Floor location={location} />
      {location === "office" ? (
        <Office />
      ) : location === "home" ? (
        <Home />
      ) : (
        <Commute />
      )}
    </>
  );
}
