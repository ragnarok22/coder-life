import {
  officeAreas,
  officeDesks,
  officePartitions,
  officeSteps,
} from "../data/office-layout";
import { Box, Cylinder, Sign } from "./primitives";
import {
  Chair,
  CoffeeStation,
  Desk,
  Mug,
  Plant,
  Printer,
  WaterCooler,
  WindowPanel,
} from "./props";
import { StaticMesh } from "./static-mesh";

function Whiteboard({
  position,
  width = 2.5,
  rotation = 0,
}: {
  position: [number, number, number];
  width?: number;
  rotation?: number;
}) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <Box size={[width, 1.3, 0.1]} color="#839485" />
      <Box
        position={[0, 0, 0.06]}
        size={[width - 0.13, 1.16, 0.025]}
        color="#f5f1df"
      />
      {[-0.65, 0, 0.65].map((x, i) => (
        <group key={x}>
          <Box
            position={[x, 0.2, 0.083]}
            size={[0.4, 0.27, 0.012]}
            color={["#debc76", "#8dad9b", "#ca9386"][i]}
          />
          <Box
            position={[x, -0.2, 0.083]}
            size={[0.31, 0.018, 0.012]}
            color="#91a295"
          />
        </group>
      ))}
    </group>
  );
}
function Files({
  position,
  color = "#a5b699",
}: {
  position: [number, number, number];
  color?: string;
}) {
  return (
    <group position={position}>
      <Box position={[0, 0.7, 0]} size={[0.8, 1.4, 0.65]} color={color} />
      {[0.27, 0.68, 1.09].map((y) => (
        <group key={y}>
          <Box
            position={[0, y, 0.335]}
            size={[0.69, 0.34, 0.025]}
            color="#bdc7b0"
          />
          <Box
            position={[0, y + 0.04, 0.36]}
            size={[0.22, 0.04, 0.035]}
            color="#778777"
          />
        </group>
      ))}
    </group>
  );
}
function WasteBin({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <Cylinder
        position={[0, 0.25, 0]}
        radius={0.22}
        top={0.26}
        height={0.5}
        color="#8e9c8a"
      />
      <Cylinder
        position={[0, 0.505, 0]}
        radius={0.21}
        height={0.012}
        color="#4f6153"
      />
    </group>
  );
}
function Laptop({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <Box size={[0.7, 0.045, 0.5]} color="#84988e" />
      <Box
        position={[0, 0.24, -0.23]}
        size={[0.7, 0.47, 0.04]}
        color="#445d54"
        rotation={[-0.15, 0, 0]}
      />
      <Box
        position={[0, 0.25, -0.198]}
        size={[0.61, 0.35, 0.012]}
        color="#a2c6ba"
      />
    </group>
  );
}
function Partition({
  partition: p,
}: {
  partition: (typeof officePartitions)[number];
}) {
  if (!p.glass)
    return (
      <>
        <Box
          position={[p.x, p.h / 2, p.z]}
          size={[p.w, p.h, p.d]}
          color={p.color}
        />
        <Box
          position={[p.x, p.h + 0.035, p.z]}
          size={[p.w + 0.04, 0.07, p.d + 0.04]}
          color="#879d8b"
        />
      </>
    );
  const alongX = p.w > p.d;
  return (
    <group position={[p.x, 0, p.z]}>
      <Box position={[0, 0.42, 0]} size={[p.w, 0.84, p.d]} color={p.color} />
      <mesh position={[0, (p.h + 0.84) / 2, 0]}>
        <boxGeometry args={[p.w, p.h - 0.84, p.d * 0.7]} />
        <meshStandardMaterial
          color="#bad8cc"
          transparent
          opacity={0.22}
          depthWrite={false}
          roughness={0.4}
        />
      </mesh>
      <Box
        position={[0, p.h, 0]}
        size={[p.w + 0.03, 0.08, p.d + 0.03]}
        color="#6c9182"
      />
      {[-1, 1].map((s) => (
        <Box
          key={s}
          position={[
            alongX ? (s * p.w) / 2 : 0,
            p.h / 2,
            alongX ? 0 : (s * p.d) / 2,
          ]}
          size={[alongX ? 0.065 : p.w + 0.02, p.h, alongX ? p.d + 0.02 : 0.065]}
          color="#729384"
        />
      ))}
    </group>
  );
}
export function OfficeEnvironment() {
  return (
    <StaticMesh>
      {officeAreas.map((area) => (
        <Box
          key={area.id}
          position={[area.x, 0.022, area.z]}
          size={[area.w, 0.008, area.d]}
          color={area.floor}
          castShadow={false}
        />
      ))}
      <Box
        position={[0, 0.035, 0]}
        size={[0.1, 0.015, 18]}
        color="#e6c684"
        castShadow={false}
      />
      <Box
        position={[0.1, 0.035, 0.05]}
        size={[22, 0.015, 0.1]}
        color="#e6c684"
        castShadow={false}
      />
      {[-12, -8, -3, 2, 8, 12].map((x) => (
        <WindowPanel key={x} position={[x, 1.85, -9.87]} width={2.45} />
      ))}
      {officePartitions.map((partition) => (
        <Partition key={partition.id} partition={partition} />
      ))}
      {officeSteps.map((s) => (
        <Box
          key={`${s.x}:${s.z}`}
          position={[s.x, s.h / 2, s.z]}
          size={[s.w, s.h, s.d]}
          color="#9bafb0"
        />
      ))}
      {officeDesks.map((d) => (
        <Desk
          key={d.id}
          position={[d.position[0], 0, d.position[1]]}
          rotation={d.rotation}
          player={d.player}
          variant={d.variant}
        />
      ))}
      <Sign
        text="YOUR DESK"
        position={[-6, 0.04, 3.4]}
        rotation={[-Math.PI / 2, 0, 0]}
        width={2}
        height={0.5}
        background="#719776"
        color="#fff4d9"
      />
      <Whiteboard position={[-6.7, 2.1, -9.86]} width={2.4} />
      <Whiteboard position={[-4, 1.9, -9.86]} width={3.3} />
      <Whiteboard position={[11.9, 1.9, -9.86]} width={3.2} />
      <Sign
        text="MONDAY, INC."
        position={[1.5, 2.5, -9.85]}
        width={2.8}
        height={0.5}
      />
      <Sign
        text="SHIP / SIP / REPEAT"
        position={[-9, 2.7, -9.85]}
        width={2.4}
        height={0.35}
        background="#cbd9c2"
      />
      <Sign
        text="QUICK SYNC"
        position={[10.5, 2.34, -1.68]}
        width={2.2}
        height={0.36}
      />
      <Sign
        text="PEOPLE & PAPERWORK"
        position={[-14.85, 2.5, 4.6]}
        rotation={[0, Math.PI / 2, 0]}
        width={3.3}
        height={0.43}
      />
      <Box position={[9, 1, -4.5]} size={[4.5, 0.15, 2]} color="#d7bc8d" />
      {[-1.7, 1.7].map((x) => (
        <Box
          key={x}
          position={[9 + x, 0.48, -4.5]}
          size={[0.16, 0.95, 1.6]}
          color="#708b80"
        />
      ))}
      {[7.6, 9, 10.4].map((x) => (
        <group key={x}>
          <Chair position={[x, 0, -6]} color="#6c938b" rotation={Math.PI} />
          <Chair position={[x, 0, -3]} color="#6c938b" />
          <Mug position={[x, 1.09, -4.9]} color="#f0e7cf" />
        </group>
      ))}
      <Laptop position={[9, 1.13, -4.35]} />
      <Box position={[-4, 1, -8.3]} size={[3, 0.14, 1.1]} color="#d2b884" />
      <Box
        position={[-4, 0.48, -8.3]}
        size={[0.15, 0.95, 0.8]}
        color="#8c9c7b"
      />
      <Chair position={[-4, 0, -6.95]} color="#b7a06c" />
      <Chair
        position={[-5.9, 0, -8.2]}
        color="#b7a06c"
        rotation={-Math.PI / 2}
      />
      <Chair
        position={[-2.1, 0, -8.2]}
        color="#b7a06c"
        rotation={Math.PI / 2}
      />
      <CoffeeStation position={[9.9, 0, 2.2]} />
      <Box position={[13.5, 0.6, 4]} size={[1.1, 1.2, 3.1]} color="#b5bda0" />
      <Box position={[13.5, 1.23, 4]} size={[1.15, 0.1, 3.2]} color="#eddec1" />
      <group position={[13.4, 1.3, 4.7]} rotation={[0, -Math.PI / 2, 0]}>
        <Box position={[0, 0.3, 0]} size={[1, 0.6, 0.68]} color="#ebe7d4" />
        <Box
          position={[-0.1, 0.3, 0.35]}
          size={[0.67, 0.38, 0.025]}
          color="#43554a"
        />
        <Box
          position={[0.37, 0.36, 0.35]}
          size={[0.07, 0.15, 0.035]}
          color="#cc9b5b"
        />
      </group>
      <Box position={[10, 1, 6]} size={[1.5, 2, 1]} color="#e0e5d0" />
      <Box
        position={[10, 1.25, 6.52]}
        size={[1.3, 0.035, 0.025]}
        color="#96aa91"
      />
      <Box
        position={[10.55, 1.5, 6.56]}
        size={[0.06, 0.4, 0.08]}
        color="#7f987d"
      />
      <Sign
        text="LUNCH IS A FEATURE"
        position={[10, 2.4, 6]}
        width={2.35}
        height={0.32}
      />
      <Box
        position={[12.7, 0.98, 7.5]}
        size={[1.8, 0.12, 1.5]}
        color="#dcc096"
      />
      <Cylinder
        position={[12.7, 0.48, 7.5]}
        radius={0.13}
        height={0.95}
        color="#78907a"
      />
      <Chair position={[12.7, 0, 8.6]} color="#d1aa68" />
      <Mug position={[12.8, 1.05, 7.5]} />
      {Array.from({ length: 6 }, (_, x) =>
        Array.from({ length: 7 }, (_, z) => (
          <Box
            key={`tile-${x}-${z}`}
            position={[7.5 + x, 0.029, 1.8 + z]}
            size={[0.94, 0.006, 0.94]}
            color={(x + z) % 2 ? "#e7d7b9" : "#ecdcc1"}
            castShadow={false}
          />
        )),
      )}
      <Printer position={[-10.5, 0, -5.5]} />
      <WaterCooler position={[-11.1, 0, 1]} />
      <Files position={[-14, 0, 1]} color="#a4b593" />
      <Files position={[-14, 0, 5]} />
      <Files position={[-14, 0, 6]} />
      <Box position={[-8.5, 0.65, 6]} size={[3.4, 1.3, 1.4]} color="#82a18c" />
      <Box position={[-8.5, 1.35, 6]} size={[3.6, 0.12, 1.6]} color="#ddc99f" />
      <Sign
        text="HELLO, HUMAN."
        position={[-8.5, 0.85, 6.72]}
        width={2.5}
        height={0.4}
      />
      <Chair position={[-8.5, 0, 7.4]} />
      <Laptop position={[-8.5, 1.44, 6]} />
      <Box position={[-2.5, 0.5, 9]} size={[3.2, 0.6, 1.1]} color="#ba875f" />
      <Box
        position={[-2.5, 0.98, 9.48]}
        size={[3.2, 0.6, 0.15]}
        color="#ba875f"
      />
      {[-3.8, -1.2].map((x) => (
        <Box
          key={x}
          position={[x, 0.75, 9]}
          size={[0.3, 0.6, 1.1]}
          color="#c29368"
        />
      ))}
      <Box
        position={[3.8, 0.45, 6.55]}
        size={[0.65, 0.6, 0.7]}
        color="#eef0df"
      />
      <Box
        position={[3.8, 0.95, 6.82]}
        size={[0.65, 0.65, 0.15]}
        color="#e4e9d8"
      />
      <Box
        position={[1.4, 0.8, 6.6]}
        size={[0.7, 0.17, 0.65]}
        color="#f1eedb"
      />
      <Cylinder
        position={[1.4, 0.63, 6.6]}
        radius={0.17}
        height={0.35}
        color="#c3cebc"
      />
      <Sign
        text="QUIET ZONE / WC"
        position={[4.45, 2.05, 4.08]}
        rotation={[0, Math.PI, 0]}
        width={1.05}
        height={0.24}
      />
      <Box
        position={[-14, 1.15, -8.3]}
        size={[1.2, 2.3, 1.5]}
        color="#52666d"
      />
      {[0.45, 0.8, 1.15, 1.5, 1.85].map((y) => (
        <group key={y}>
          <Box
            position={[-14, y, -7.535]}
            size={[1, 0.24, 0.035]}
            color="#354c53"
          />
          <Box
            position={[-13.64, y, -7.508]}
            size={[0.07, 0.06, 0.015]}
            color="#a5c486"
          />
        </group>
      ))}
      <Box
        position={[-12.9, 0.9, -9.35]}
        size={[1.4, 1.8, 0.8]}
        color="#a3ad99"
      />
      <Sign
        text="PLEASE DO NOT REBOOT"
        position={[-14, 2.7, -9.85]}
        width={1.7}
        height={0.26}
      />
      {[
        [-13.8, -4.7],
        [-12.8, -4.7],
        [-13.8, -6.2],
      ].map(([x, z]) => (
        <group key={`${x}:${z}`}>
          <Box
            position={[x, 0.24, z]}
            size={[0.7, 0.48, 0.65]}
            color="#c4a373"
          />
          <Box
            position={[x, 0.485, z]}
            size={[0.12, 0.01, 0.66]}
            color="#e6cca0"
          />
        </group>
      ))}
      {[0, 0.035, 0.07, 0.105].map((y) => (
        <Box
          key={y}
          position={[-10.5, 0.99 + y, -5.13]}
          size={[0.47, 0.03, 0.36]}
          color="#faf4df"
        />
      ))}
      {[
        [-14, 8.7],
        [-14, -3.4],
        [-7, 8.9],
        [4, -9.2],
        [14, -9.1],
        [14, 0.1],
        [6.6, 8.8],
        [-0.3, -5],
      ].map(([x, z]) => (
        <Plant key={`${x}:${z}`} position={[x, 0, z]} scale={1.1} />
      ))}
      {[
        [-7.7, 2.4],
        [-3.7, -2.5],
        [-11.6, 8.4],
        [12, 2.1],
      ].map(([x, z]) => (
        <WasteBin key={`${x}:${z}`} position={[x, 0, z]} />
      ))}
    </StaticMesh>
  );
}
