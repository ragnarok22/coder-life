import { Canvas } from "@react-three/fiber";
import { ContactShadows, Html, OrbitControls } from "@react-three/drei";
import { Suspense } from "react";
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
import { Character } from "../entities/character";
import { importantAppearances } from "../data/appearances";
import { useGame } from "../game/store";

function Diorama() {
  return (
    <group position={[0, -0.2, 0]}>
      <Box position={[0, -0.32, 0]} size={[12, 0.65, 9.3]} color="#5e7865" />
      <Box
        position={[0, 0.015, 0]}
        size={[11.85, 0.12, 9.16]}
        color="#d8d6bc"
      />
      {Array.from({ length: 12 }, (_, x) =>
        Array.from({ length: 9 }, (_, z) => (
          <Box
            key={`${x}-${z}`}
            position={[x - 5.5, 0.08, z - 4]}
            size={[0.978, 0.025, 0.978]}
            color={(x + z) % 2 ? "#d9dbc7" : "#e5e2cc"}
            castShadow={false}
          />
        )),
      )}
      <Box position={[0, 1.75, -4.5]} size={[12, 3.5, 0.18]} color="#dce1cc" />
      <Box position={[-5.9, 1.75, 0]} size={[0.18, 3.5, 9]} color="#cbd5be" />
      <Box
        position={[0, 3.55, -4.5]}
        size={[12.1, 0.12, 0.28]}
        color="#7e997f"
      />
      <Box position={[-5.9, 3.55, 0]} size={[0.28, 0.12, 9]} color="#7e997f" />
      <Box
        position={[0, 0.32, -4.35]}
        size={[11.8, 0.14, 0.1]}
        color="#8c9e80"
      />
      <Box position={[-5.78, 0.32, 0]} size={[0.1, 0.14, 9]} color="#8c9e80" />
      <WindowPanel position={[-3.7, 2.15, -4.38]} width={2.6} />
      <WindowPanel position={[-0.1, 2.15, -4.38]} width={2.6} />
      <Sign
        text="MONDAY, INC."
        position={[3.6, 2.75, -4.38]}
        width={2.5}
        height={0.48}
        color="#3d624e"
        background="#dce1cc"
      />
      <Box
        position={[3.65, 1.75, -4.3]}
        size={[2.4, 1.12, 0.05]}
        color="#bda77b"
      />
      <Sign
        text="SHIP. SIP. REPEAT."
        position={[3.65, 1.8, -4.26]}
        width={2.05}
        height={0.4}
        background="#f1e6bc"
      />
      <Desk position={[-3.7, 0.1, -2.2]} />
      <Desk position={[0.2, 0.1, -2.2]} />
      <Desk position={[-1.7, 0.1, 1.65]} player />
      <group position={[-1.7, 0.18, 2.82]} rotation={[0, Math.PI, 0]}>
        <Character glasses animation="typing" />
      </group>
      <group position={[-3.7, 0.18, -0.95]} rotation={[0, Math.PI, 0]}>
        <Character appearance={importantAppearances.hr} animation="typing" />
      </group>
      <group position={[0.2, 0.18, -0.95]} rotation={[0, Math.PI, 0]}>
        <Character
          appearance={importantAppearances.accountant}
          animation="typing"
        />
      </group>
      <CoffeeStation position={[4.18, 0.1, -2.95]} />
      <Printer position={[-4.95, 0.1, 1.4]} />
      <WaterCooler position={[-5.22, 0.1, 3.5]} />
      <Plant position={[-5.15, 0.1, -3.55]} scale={1.1} />
      <Plant position={[5, 0.1, 3.6]} scale={1.2} />
      <Plant position={[1.5, 1.22, -2.4]} scale={0.4} />
      <group position={[3.6, 0.1, 0.85]} rotation={[0, -0.45, 0]}>
        <Character appearance={importantAppearances.manager} />
        <Box
          position={[0.64, 0.85, 0.1]}
          size={[0.38, 0.53, 0.07]}
          color="#ebd8ad"
        />
      </group>
      <group position={[2.65, 0.1, 3.15]} rotation={[0, -1.7, 0]}>
        <Character appearance={importantAppearances.sales} />
        <Mug position={[0.4, 0.8, 0.25]} />
      </group>
      <Box
        position={[4.3, 0.52, 1.2]}
        size={[1.6, 0.12, 1.3]}
        color="#d7b577"
      />
      <Cylinder
        position={[4.3, 0.25, 1.2]}
        radius={0.12}
        height={0.5}
        color="#557364"
      />
      <Chair position={[4.9, 0.1, 2.1]} rotation={-0.6} color="#bc9657" />
      <Mug position={[4.4, 0.6, 1.2]} color="#f3e8ca" />
      <Box
        position={[-1.7, 0.11, 2.5]}
        size={[3.35, 0.015, 2.45]}
        color="#a8b89a"
      />
      <Html position={[3.5, 2.9, 0.8]} center zIndexRange={[5, 0]}>
        <div className="scene-bubble">
          Got a minute? <span>👀</span>
        </div>
      </Html>
      <Html position={[-1.7, 2.65, 2.8]} center zIndexRange={[5, 0]}>
        <div className="focus-bubble">
          <span /> trying to focus...
        </div>
      </Html>
    </group>
  );
}
export default function MenuScene() {
  const quality = useGame((s) => s.preferences.quality);
  return (
    <Canvas
      orthographic
      camera={{ position: [14, 13, 17], zoom: 46, near: 0.1, far: 100 }}
      shadows={quality !== "low"}
      dpr={quality === "low" ? 1 : [1, 1.75]}
      gl={{ antialias: true, alpha: true }}
    >
      <ambientLight intensity={1.4} />
      <hemisphereLight args={["#fff4dd", "#899e7e", 1.5]} />
      <directionalLight
        position={[-3, 12, 7]}
        intensity={2.5}
        castShadow
        shadow-mapSize={quality === "high" ? 2048 : 1024}
        shadow-camera-left={-12}
        shadow-camera-right={12}
        shadow-camera-top={12}
        shadow-camera-bottom={-12}
        shadow-normalBias={0.04}
      />
      <Suspense fallback={null}>
        <Diorama />
        {quality !== "low" && (
          <ContactShadows
            position={[0, -0.72, 0]}
            opacity={0.26}
            scale={26}
            blur={2.8}
            far={5}
            resolution={512}
            frames={1}
          />
        )}
      </Suspense>
      <OrbitControls
        target={[0, 1, 0]}
        enableZoom={false}
        enablePan={false}
        minPolarAngle={0.6}
        maxPolarAngle={1.05}
        minAzimuthAngle={0.3}
        maxAzimuthAngle={1}
        autoRotate
        autoRotateSpeed={0.18}
      />
    </Canvas>
  );
}
