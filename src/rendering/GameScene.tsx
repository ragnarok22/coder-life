import { Canvas } from "@react-three/fiber";
import { Physics } from "@react-three/rapier";
import { Suspense } from "react";
import { useGame } from "../game/store";
import { World } from "./World";
import { Player } from "../entities/Player";
import { Npc } from "../entities/Npc";
import { npcs } from "../data/content";

export default function GameScene() {
  const location = useGame((s) => s.game.location),
    revision = useGame((s) => s.revision);
  const quality = useGame((s) => s.preferences.quality),
    paused = useGame((s) => s.screen !== "playing" || !!s.game.dialogue);
  return (
    <Canvas
      shadows={quality !== "low"}
      camera={{ position: [0, 6, 10], fov: 48, near: 0.1, far: 100 }}
      dpr={quality === "low" ? 1 : quality === "medium" ? [1, 1.25] : [1, 1.75]}
      gl={{ antialias: quality !== "low" }}
    >
      <color attach="background" args={["#e3e5d5"]} />
      <fog attach="fog" args={["#e3e5d5", 35, 65]} />
      <ambientLight intensity={1.35} />
      <hemisphereLight args={["#fff3d9", "#8caa8d", 1.2]} />
      <directionalLight
        position={[-6, 14, 9]}
        intensity={2.2}
        castShadow={quality !== "low"}
        shadow-mapSize={quality === "high" ? 2048 : 1024}
        shadow-camera-left={-18}
        shadow-camera-right={18}
        shadow-camera-top={18}
        shadow-camera-bottom={-18}
        shadow-normalBias={0.04}
      />
      <Suspense fallback={null}>
        <Physics
          key={`${location}-${revision}`}
          gravity={[0, -9.81, 0]}
          paused={paused}
          timeStep={1 / 60}
        >
          <World location={location} />
          <Player />
          {location === "office" &&
            npcs.map((npc, i) => (
              <Npc key={npc.id} definition={npc} index={i} />
            ))}
        </Physics>
      </Suspense>
    </Canvas>
  );
}
