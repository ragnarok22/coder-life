import * as RAPIER from "@dimforge/rapier3d";

export * from "@dimforge/rapier3d";

// Vite awaits the native WASM import before evaluating this module. Keep the
// compat init() API expected by @react-three/rapier without embedding base64.
export function init(): Promise<void> {
  return Promise.resolve();
}

export default { ...RAPIER, init };
