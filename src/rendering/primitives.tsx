import { useEffect, useMemo } from "react";
import { CanvasTexture, SRGBColorSpace } from "three";
import type { ThreeElements } from "@react-three/fiber";
import { matte, unitBox, cylinderFor } from "./shared-assets";

type BoxProps = {
  position?: [number, number, number];
  size?: [number, number, number];
  color?: string;
  rotation?: [number, number, number];
} & Pick<ThreeElements["mesh"], "castShadow" | "receiveShadow">;
export function Box({
  position,
  size = [1, 1, 1],
  color = "#f4ecd9",
  rotation,
  castShadow = true,
  receiveShadow = true,
}: BoxProps) {
  return (
    <mesh
      position={position}
      rotation={rotation}
      castShadow={castShadow}
      receiveShadow={receiveShadow}
      geometry={unitBox}
      material={matte(color)}
      scale={size}
      dispose={null}
    ></mesh>
  );
}
export function Cylinder({
  position,
  radius = 0.2,
  height = 0.4,
  color = "#f4ecd9",
  top,
  rotation,
}: {
  position?: [number, number, number];
  radius?: number;
  top?: number;
  height?: number;
  color?: string;
  rotation?: [number, number, number];
}) {
  return (
    <mesh
      position={position}
      rotation={rotation}
      castShadow
      receiveShadow
      material={matte(color)}
      geometry={cylinderFor((top ?? radius) / radius)}
      scale={[radius, height, radius]}
      dispose={null}
    />
  );
}
export function Sign({
  text,
  position,
  width = 2,
  height = 0.5,
  color = "#37574a",
  background = "#f2ecd9",
  rotation = [0, 0, 0],
}: {
  text: string;
  position: [number, number, number];
  width?: number;
  height?: number;
  color?: string;
  background?: string;
  rotation?: [number, number, number];
}) {
  const texture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 128;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, 512, 128);
    ctx.fillStyle = color;
    ctx.font = "bold 44px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, 256, 68, 490);
    const result = new CanvasTexture(canvas);
    result.colorSpace = SRGBColorSpace;
    return result;
  }, [text, background, color]);
  useEffect(() => () => texture.dispose(), [texture]);
  return (
    <mesh position={position} rotation={rotation}>
      <planeGeometry args={[width, height]} />
      <meshBasicMaterial map={texture} />
    </mesh>
  );
}
