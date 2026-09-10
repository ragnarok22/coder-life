import { Box, Cylinder, Sign } from "./primitives";
import { CHAIR_POSE } from "../data/pose-anchors";

export function Plant({
  position,
  scale = 1,
}: {
  position: [number, number, number];
  scale?: number;
}) {
  return (
    <group position={position} scale={scale}>
      <Cylinder
        position={[0, 0.23, 0]}
        height={0.46}
        radius={0.26}
        top={0.34}
        color="#d89870"
      />
      <Cylinder
        position={[0, 0.47, 0]}
        height={0.04}
        radius={0.28}
        color="#665542"
      />
      <Cylinder
        position={[0, 0.9, 0]}
        height={0.9}
        radius={0.035}
        color="#667853"
      />
      {[
        [0.22, 0.98, 0],
        [-0.22, 1.2, 0.02],
        [0.13, 1.43, 0.02],
        [-0.1, 1.55, 0],
        [0, 1.08, 0.2],
      ].map(([x, y, z], i) => (
        <mesh
          key={`${x},${y},${z}`}
          position={[x, y, z]}
          rotation={[0, i, i % 2 ? -0.55 : 0.55]}
          scale={[0.25, 0.48, 0.13]}
          castShadow
        >
          <icosahedronGeometry args={[1, 0]} />
          <meshStandardMaterial
            color={i % 2 ? "#49714d" : "#769553"}
            flatShading
          />
        </mesh>
      ))}
    </group>
  );
}
export function Mug({
  position,
  color = "#db8e58",
}: {
  position: [number, number, number];
  color?: string;
}) {
  return (
    <group position={position}>
      <Cylinder
        position={[0, 0.12, 0]}
        radius={0.12}
        height={0.23}
        color={color}
      />
      <Cylinder
        position={[0, 0.24, 0]}
        radius={0.096}
        height={0.012}
        color="#604235"
      />
      <mesh position={[0.13, 0.13, 0]}>
        <torusGeometry args={[0.09, 0.025, 5, 10]} />
        <meshStandardMaterial color={color} />
      </mesh>
    </group>
  );
}
export function Chair({
  position,
  rotation = 0,
  color = "#447d69",
}: {
  position: [number, number, number];
  rotation?: number;
  color?: string;
}) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <Cylinder
        position={[0, 0.28, 0]}
        radius={0.065}
        height={0.48}
        color="#46514a"
      />
      <Box position={[0, 0.1, 0]} size={[0.72, 0.08, 0.09]} color="#49534d" />
      <Box position={[0, 0.1, 0]} size={[0.09, 0.08, 0.72]} color="#49534d" />
      <Box
        position={[0, CHAIR_POSE.cushionCenter, 0]}
        size={[0.77, CHAIR_POSE.cushionThickness, 0.7]}
        color={color}
      />
      <Box position={[0, 0.96, 0.29]} size={[0.75, 0.75, 0.14]} color={color} />
      {[-0.3, 0.3].map((x) => (
        <Cylinder
          key={x}
          position={[x, 0.07, 0]}
          radius={0.08}
          height={0.12}
          color="#333d38"
          rotation={[Math.PI / 2, 0, 0]}
        />
      ))}
    </group>
  );
}
export function Desk({
  position,
  rotation = 0,
  player = false,
  chair = true,
  variant = "standard",
}: {
  position: [number, number, number];
  rotation?: number;
  player?: boolean;
  chair?: boolean;
  variant?: "standard" | "developer" | "rockstar" | "manager" | "tidy";
}) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <Box
        position={[0, 1.04, 0]}
        size={[variant === "manager" ? 3.2 : 2.8, 0.14, 1.3]}
        color={player ? "#e1ba7c" : "#e2d5b6"}
      />
      {[-1.15, 1.15].map((x) => (
        <group key={x}>
          <Box position={[x, 0.52, 0]} size={[0.12, 1, 0.88]} color="#5d756b" />
          <Box
            position={[x, 0.08, 0]}
            size={[0.42, 0.09, 1.02]}
            color="#5d756b"
          />
        </group>
      ))}
      <Box
        position={[-0.18, 1.18, -0.28]}
        size={[0.5, 0.06, 0.3]}
        color="#444e4c"
      />
      <Box
        position={[-0.18, 1.41, -0.36]}
        size={[0.09, 0.5, 0.08]}
        color="#444e4c"
      />
      <Box
        position={[-0.18, 1.76, -0.32]}
        size={[1.2, 0.76, 0.12]}
        color="#35413d"
      />
      <Box
        position={[-0.18, 1.76, -0.25]}
        size={[1.09, 0.63, 0.015]}
        color="#253a37"
      />
      {[0, 1, 2, 3, 4].map((i) => (
        <group key={i}>
          <Box
            position={[-0.53, 1.98 - i * 0.1, -0.237]}
            size={[0.05, 0.023, 0.006]}
            color="#84a488"
          />
          <Box
            position={[-0.29 + (i % 2) * 0.08, 1.98 - i * 0.1, -0.237]}
            size={[0.28 + (i % 3) * 0.09, 0.026, 0.006]}
            color={i % 2 ? "#cfc585" : "#92b99d"}
          />
        </group>
      ))}
      <Box
        position={[-0.18, 1.14, 0.27]}
        size={[0.8, 0.055, 0.28]}
        color="#dedfce"
      />
      {[0, 1, 2].map((i) => (
        <Box
          key={i}
          position={[-0.18, 1.173, 0.2 + i * 0.065]}
          size={[0.67, 0.008, 0.014]}
          color="#a6b0a2"
        />
      ))}
      <Box
        position={[0.45, 1.145, 0.28]}
        size={[0.13, 0.06, 0.2]}
        color="#526158"
      />
      <Mug
        position={[0.86, 1.11, 0.15]}
        color={player ? "#d3834d" : "#88a593"}
      />
      <Box
        position={[-1, 1.12, 0.12]}
        size={[0.34, 0.025, 0.45]}
        color="#f4f0dc"
        rotation={[0, 0.13, 0]}
      />
      {player && (
        <Sign
          text="// you got this"
          position={[-0.2, 1.4, -0.24]}
          width={0.6}
          height={0.14}
          background="#e8c774"
        />
      )}
      {chair && <Chair position={[0, 0, CHAIR_POSE.deskOffset]} />}
      {(variant === "developer" || variant === "rockstar") && (
        <>
          <ExtraMonitor position={[0.96, 1.13, -0.27]} rotation={-0.2} />
          {variant === "rockstar" && (
            <ExtraMonitor position={[-1.18, 1.13, -0.25]} rotation={0.22} />
          )}
          <Box
            position={[0, 1.13, -0.49]}
            size={[1.8, 0.035, 0.04]}
            color="#414c48"
          />
          <Box
            position={[-0.6, 1.17, 0.26]}
            size={[0.12, 0.015, 0.21]}
            color={variant === "rockstar" ? "#c7769b" : "#84a5a0"}
          />
        </>
      )}
      {variant === "tidy" && (
        <>
          <Plant position={[1.06, 1.13, -0.24]} scale={0.32} />
          <Box
            position={[-1, 1.3, -0.25]}
            size={[0.4, 0.35, 0.32]}
            color="#91a978"
          />
          {[-1.12, -1, -0.88].map((x) => (
            <Box
              key={x}
              position={[x, 1.35, -0.23]}
              size={[0.04, 0.39, 0.29]}
              color="#f0e9d0"
            />
          ))}
        </>
      )}
      {variant === "manager" && (
        <>
          <Box
            position={[1.28, 1.2, -0.15]}
            size={[0.3, 0.12, 0.5]}
            color="#986e49"
          />
          <Box
            position={[-1.21, 1.14, 0]}
            size={[0.5, 0.04, 0.45]}
            color="#617b72"
          />
        </>
      )}
    </group>
  );
}
function ExtraMonitor({
  position,
  rotation,
}: {
  position: [number, number, number];
  rotation: number;
}) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <Box position={[0, 0.17, 0]} size={[0.05, 0.3, 0.06]} color="#465650" />
      <Box position={[0, 0.5, 0]} size={[0.72, 0.6, 0.08]} color="#35413d" />
      <Box
        position={[0, 0.5, 0.045]}
        size={[0.63, 0.51, 0.012]}
        color="#294b48"
      />
      {[0, 1, 2].map((n) => (
        <Box
          key={n}
          position={[-0.05, 0.65 - n * 0.12, 0.055]}
          size={[0.36 + n * 0.055, 0.025, 0.006]}
          color={n % 2 ? "#d9b573" : "#91c0a8"}
        />
      ))}
    </group>
  );
}
export function CoffeeStation({
  position,
  rotation = 0,
}: {
  position: [number, number, number];
  rotation?: number;
}) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <Box position={[0, 0.58, 0]} size={[2.5, 1.16, 1]} color="#bcc4ad" />
      <Box position={[0, 1.19, 0]} size={[2.65, 0.12, 1.1]} color="#e3d2ad" />
      <Box
        position={[-0.45, 1.65, 0]}
        size={[0.75, 0.83, 0.7]}
        color="#3b5148"
      />
      <Box
        position={[-0.45, 1.57, 0.36]}
        size={[0.51, 0.4, 0.02]}
        color="#263a31"
      />
      <Box
        position={[-0.45, 1.96, 0.36]}
        size={[0.31, 0.11, 0.025]}
        color="#a8c391"
      />
      <Cylinder
        position={[-0.45, 2.2, -0.07]}
        radius={0.21}
        height={0.26}
        color="#816246"
      />
      <Mug position={[-0.45, 1.27, 0.31]} color="#f4ebd5" />
      <Mug position={[0.66, 1.26, 0.07]} />
      <Box
        position={[0.45, 0.66, 0.51]}
        size={[0.7, 0.04, 0.03]}
        color="#687763"
      />
      <Sign
        text="FUEL STATION"
        position={[0, 2.6, 0]}
        width={2.3}
        height={0.4}
      />
    </group>
  );
}
export function Printer({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <Box position={[0, 0.47, 0]} size={[1.1, 0.94, 1]} color="#c1c6b8" />
      <Box
        position={[0, 1.01, -0.04]}
        size={[1.2, 0.2, 1.02]}
        color="#e6e5d6"
      />
      <Box
        position={[0, 1.13, -0.13]}
        size={[0.8, 0.05, 0.55]}
        color="#708077"
      />
      <Box
        position={[0, 0.82, 0.51]}
        size={[0.78, 0.13, 0.03]}
        color="#59675c"
      />
      <Box
        position={[0, 0.81, 0.67]}
        size={[0.55, 0.018, 0.43]}
        color="#fff9e9"
      />
      <Box
        position={[0.44, 1.15, 0.29]}
        size={[0.13, 0.04, 0.1]}
        color="#d88452"
      />
    </group>
  );
}
export function WaterCooler({
  position,
}: {
  position: [number, number, number];
}) {
  return (
    <group position={position}>
      <Box position={[0, 0.6, 0]} size={[0.64, 1.2, 0.6]} color="#e5e4d5" />
      <Cylinder
        position={[0, 1.52, 0]}
        radius={0.28}
        height={0.62}
        color="#88b6b9"
      />
      <Box
        position={[0, 0.98, 0.31]}
        size={[0.3, 0.17, 0.08]}
        color="#526d68"
      />
    </group>
  );
}
export function WindowPanel({
  position,
  width = 2.2,
}: {
  position: [number, number, number];
  width?: number;
}) {
  return (
    <group position={position}>
      <Box size={[width, 2, 0.08]} color="#c3ded6" />
      <Box position={[0, 0, 0.06]} size={[0.08, 2, 0.06]} color="#faf4df" />
      <Box position={[0, 0, 0.06]} size={[width, 0.08, 0.06]} color="#faf4df" />
      <Box
        position={[0, -1, 0.09]}
        size={[width + 0.18, 0.12, 0.24]}
        color="#f7eed7"
      />
      {[-1, 1].map((i) => (
        <Box
          key={i}
          position={[(i * width) / 2, 0, 0.05]}
          size={[0.12, 2.12, 0.12]}
          color="#f7eed7"
        />
      ))}
    </group>
  );
}
