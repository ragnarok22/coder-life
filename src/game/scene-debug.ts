import { useEffect, useState } from "react";
import type { NpcAppearance } from "../data/appearances";
export const sceneDebug = {
  overview: false,
  camera: false,
  navigation: false,
  colliders: false,
  freezeNpcs: false,
  extras: 0,
  appearances: {} as Record<string, NpcAppearance>,
};
export function changeSceneDebug(patch: Partial<typeof sceneDebug>) {
  if (!import.meta.env.DEV) return;
  Object.assign(sceneDebug, patch);
  window.dispatchEvent(new Event("coder-life:scene-debug"));
}
export function useSceneDebug() {
  const [snapshot, setSnapshot] = useState(() => ({ ...sceneDebug }));
  useEffect(() => {
    if (!import.meta.env.DEV) return;
    const update = () => setSnapshot({ ...sceneDebug });
    window.addEventListener("coder-life:scene-debug", update);
    return () => window.removeEventListener("coder-life:scene-debug", update);
  }, []);
  return snapshot;
}
