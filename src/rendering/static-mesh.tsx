import { useLayoutEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import {
  BufferAttribute,
  Group,
  Matrix4,
  Mesh,
  MeshStandardMaterial,
} from "three";
import type { BufferGeometry } from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { vertexMaterial } from "./shared-assets";

/** Bake static colored props (or one articulated body part) into a few vertex-colored meshes. */
export function StaticMesh({ children }: { children: ReactNode }) {
  const source = useRef<Group>(null);
  const [baked] = useState(() => new Group());
  useLayoutEffect(() => {
    const root = source.current;
    if (!root) return;
    root.updateWorldMatrix(true, true);
    const inverse = new Matrix4().copy(root.matrixWorld).invert();
    const batches = new Map<string, BufferGeometry[]>();
    const owned: BufferGeometry[] = [];
    root.traverse((object) => {
      if (!(object instanceof Mesh) || !object.visible) return;
      const transform = new Matrix4().multiplyMatrices(
        inverse,
        object.matrixWorld,
      );
      const material = object.material;
      if (
        material instanceof MeshStandardMaterial &&
        !material.map &&
        !material.transparent &&
        material.emissiveIntensity === 1 &&
        material.emissive.getHex() === 0
      ) {
        const geometry = object.geometry.clone().applyMatrix4(transform);
        const colors = new Float32Array(geometry.attributes.position.count * 3);
        for (let i = 0; i < colors.length; i += 3) {
          colors[i] = material.color.r;
          colors[i + 1] = material.color.g;
          colors[i + 2] = material.color.b;
        }
        geometry.setAttribute("color", new BufferAttribute(colors, 3));
        const key = `${object.castShadow}:${object.receiveShadow}`;
        const batch = batches.get(key) ?? [];
        batch.push(geometry);
        batches.set(key, batch);
      } else {
        const mesh = new Mesh(object.geometry, material);
        mesh.matrix.copy(transform);
        mesh.matrixAutoUpdate = false;
        mesh.castShadow = object.castShadow;
        mesh.receiveShadow = object.receiveShadow;
        baked.add(mesh);
      }
    });
    for (const [key, geometries] of batches) {
      const merged = mergeGeometries(geometries, false);
      geometries.forEach((g) => g.dispose());
      if (!merged) continue;
      merged.computeBoundingSphere();
      owned.push(merged);
      const mesh = new Mesh(merged, vertexMaterial);
      const [cast, receive] = key.split(":");
      mesh.castShadow = cast === "true";
      mesh.receiveShadow = receive === "true";
      baked.add(mesh);
    }
    root.visible = false;
    return () => {
      baked.clear();
      owned.forEach((g) => g.dispose());
    };
  }, [baked]);
  return (
    <>
      <group ref={source}>{children}</group>
      <primitive object={baked} dispose={null} />
    </>
  );
}
