import {
  BoxGeometry,
  CylinderGeometry,
  IcosahedronGeometry,
  MeshStandardMaterial,
  TorusGeometry,
} from "three";

// Module-owned, bounded palette resources. Individual meshes must not dispose shared assets.
export const unitBox = new BoxGeometry(1, 1, 1);
export const unitCylinder = new CylinderGeometry(1, 1, 1, 10);
export const unitLeaf = new IcosahedronGeometry(1, 0);
export const mugHandle = new TorusGeometry(0.09, 0.025, 5, 10);
export const glassesRing = new TorusGeometry(0.12, 0.018, 5, 12);
export const headphoneBand = new TorusGeometry(0.4, 0.045, 5, 12, Math.PI);
export const vertexMaterial = new MeshStandardMaterial({
  vertexColors: true,
  roughness: 0.85,
});
const materials = new Map<string, MeshStandardMaterial>();
export function matte(color: string) {
  let material = materials.get(color);
  if (!material) {
    material = new MeshStandardMaterial({ color, roughness: 0.85 });
    materials.set(color, material);
  }
  return material;
}
