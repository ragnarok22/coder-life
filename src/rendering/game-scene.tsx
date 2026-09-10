import { Canvas } from "@react-three/fiber";
import { Physics } from "@react-three/rapier";
import { Suspense, useMemo, lazy } from "react";
import { useGame } from "../game/store";
import { World } from "./world";
import { Player } from "../entities/player";
import { Npc } from "../entities/npc";
import { npcs } from "../data/content";
import { OFFICE_PRESENTATION, THIRD_PERSON_CAMERA } from "../data/presentation";
import { officeAppearances } from "../data/appearances";
import { useSceneDebug } from "../game/scene-debug";

const SceneDebugOverlays = import.meta.env.DEV
  ? lazy(() => import("./scene-debug-overlays"))
  : null;

export default function GameScene() {
  const location = useGame((s) => s.game.location),
    revision = useGame((s) => s.revision);
  const quality = useGame((s) => s.preferences.quality),
    paused = useGame((s) => s.screen !== "playing" || !!s.game.dialogue);
  const seed = useGame((s) => s.game.seed);
  const debug = useSceneDebug();
  const appearances = useMemo(
    () =>
      officeAppearances(
        npcs.map((n) => n.id),
        seed,
      ),
    [seed],
  );
  return (
    <Canvas
      shadows={quality !== "low"}
      camera={{
        position: [0, 6, 10],
        fov: THIRD_PERSON_CAMERA.fov,
        near: THIRD_PERSON_CAMERA.near,
        far: 100,
      }}
      dpr={quality === "low" ? 1 : quality === "medium" ? [1, 1.25] : [1, 1.75]}
      gl={{ antialias: quality !== "low" }}
    >
      <color attach="background" args={["#e3e5d5"]} />
      <fog
        attach="fog"
        args={["#e3e5d5", debug.overview ? 80 : 35, debug.overview ? 130 : 65]}
      />
      <ambientLight intensity={1} />
      <hemisphereLight args={["#fff3d9", "#8caa8d", 1.1]} />
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
          debug={import.meta.env.DEV && debug.colliders}
        >
          <World location={location} />
          <Player />
          {location === "office" &&
            npcs
              .slice(0, OFFICE_PRESENTATION.npcCount)
              .map((npc) => (
                <Npc
                  key={npc.id}
                  definition={npc}
                  appearance={debug.appearances[npc.id] ?? appearances[npc.id]}
                />
              ))}
          {SceneDebugOverlays && (
            <Suspense fallback={null}>
              <SceneDebugOverlays />
            </Suspense>
          )}
        </Physics>
      </Suspense>
    </Canvas>
  );
}
