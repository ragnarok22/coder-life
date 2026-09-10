import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { BufferAttribute, BufferGeometry, Color } from "three";
import type { LineSegments } from "three";
import { Instances, Instance } from "@react-three/drei";
import { useSceneDebug } from "../game/scene-debug";
import { runtime } from "../game/runtime";
import { useGame } from "../game/store";
import { bounds } from "../data/world";
import { walkable } from "../ai/navigation";
import { npcs } from "../data/content";
import { officePatrol } from "../data/office-layout";
import { OFFICE_PRESENTATION } from "../data/presentation";
import { generateAppearance } from "../data/appearances";
import { Npc } from "../entities/npc";

function CameraRays() {
  const lines = useRef<LineSegments>(null);
  const geometry = useMemo(() => {
    const g = new BufferGeometry();
    g.setAttribute("position", new BufferAttribute(new Float32Array(12), 3));
    const color = new Float32Array(12);
    new Color("#df9b56").toArray(color, 0);
    new Color("#df9b56").toArray(color, 3);
    new Color("#619979").toArray(color, 6);
    new Color("#619979").toArray(color, 9);
    g.setAttribute("color", new BufferAttribute(color, 3));
    return g;
  }, []);
  useEffect(() => () => geometry.dispose(), [geometry]);
  useFrame(() => {
    if (!lines.current) return;
    const a = lines.current.geometry.attributes.position as BufferAttribute;
    a.array.set(runtime.camera.target, 0);
    a.array.set(runtime.camera.desired, 3);
    a.array.set(runtime.camera.target, 6);
    a.array.set(runtime.camera.position, 9);
    a.needsUpdate = true;
  });
  return (
    <lineSegments
      ref={lines}
      geometry={geometry}
      frustumCulled={false}
      renderOrder={50}
    >
      <lineBasicMaterial vertexColors depthTest={false} />
    </lineSegments>
  );
}
export default function SceneDebugOverlays() {
  const debug = useSceneDebug(),
    location = useGame((s) => s.game.location),
    seed = useGame((s) => s.game.seed);
  const cells = useMemo(() => {
    if (!debug.navigation) return [];
    const result: [number, number][] = [];
    const { w, d } = bounds[location];
    for (let x = -w / 2 + 0.65; x < w / 2; x += 0.65)
      for (let z = -d / 2 + 0.65; z < d / 2; z += 0.65)
        if (walkable([x, z], location)) result.push([x, z]);
    return result;
  }, [location, debug.navigation]);
  const extras = useMemo(
    () =>
      Array.from(
        {
          length: Math.max(
            0,
            Math.min(
              OFFICE_PRESENTATION.maxNpcs - OFFICE_PRESENTATION.npcCount,
              debug.extras,
            ),
          ),
        },
        (_, i) => ({
          ...npcs[npcs.length - 1],
          id: `debug-guest-${i}`,
          name: `Guest ${i + 1}`,
          position: officePatrol[i + 3],
          desk: officePatrol[i + 3],
          appearance: generateAppearance(seed + i, "debug-guest"),
        }),
      ),
    [debug.extras, seed],
  );
  return (
    <>
      {debug.camera && <CameraRays />}
      {cells.length > 0 && (
        <Instances limit={cells.length} frustumCulled={false}>
          <boxGeometry args={[0.12, 0.025, 0.12]} />
          <meshBasicMaterial
            color="#59bba5"
            depthTest={false}
            transparent
            opacity={0.6}
          />
          {cells.map(([x, z]) => (
            <Instance key={`${x}:${z}`} position={[x, 0.15, z]} />
          ))}
        </Instances>
      )}
      {location === "office" &&
        extras.map((n) => (
          <Npc key={n.id} definition={n} appearance={n.appearance} />
        ))}
    </>
  );
}
