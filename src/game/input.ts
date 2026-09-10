export type Action =
  "forward" | "backward" | "left" | "right" | "run" | "interact" | "pause";
export const bindings: Record<Action, string[]> = {
  forward: ["KeyW", "ArrowUp"],
  backward: ["KeyS", "ArrowDown"],
  left: ["KeyA", "ArrowLeft"],
  right: ["KeyD", "ArrowRight"],
  run: ["ShiftLeft", "ShiftRight"],
  interact: ["KeyE"],
  pause: ["Escape"],
};
export const input = {
  held: new Set<Action>(),
  yaw: 0,
  pitch: 0.55,
  zoom: 7.5,
  dragging: false,
  reset() {
    this.held.clear();
    this.dragging = false;
  },
};
export function installInput(
  onInteract: () => void,
  onPause: () => void,
  sensitivity: () => number,
) {
  const keydown = (event: KeyboardEvent) => {
    if ((event.target as HTMLElement).matches("input, select, textarea"))
      return;
    for (const [action, keys] of Object.entries(bindings))
      if (keys.includes(event.code)) {
        if (action !== "pause") event.preventDefault();
        input.held.add(action as Action);
        if (!event.repeat && action === "interact") onInteract();
        if (!event.repeat && action === "pause") onPause();
      }
  };
  const keyup = (event: KeyboardEvent) => {
    for (const [action, keys] of Object.entries(bindings))
      if (keys.includes(event.code)) input.held.delete(action as Action);
  };
  const down = (e: PointerEvent) => {
    if ((e.target as HTMLElement).tagName === "CANVAS") input.dragging = true;
  };
  const up = () => {
    input.dragging = false;
  };
  const move = (e: PointerEvent) => {
    if (!input.dragging && !document.pointerLockElement) return;
    input.yaw -= e.movementX * 0.004 * sensitivity();
    input.pitch = Math.max(
      0.18,
      Math.min(1.1, input.pitch + e.movementY * 0.003 * sensitivity()),
    );
  };
  const wheel = (e: WheelEvent) => {
    if ((e.target as HTMLElement).tagName === "CANVAS")
      input.zoom = Math.max(3, Math.min(10, input.zoom + e.deltaY * 0.01));
  };
  const blur = () => input.reset();
  window.addEventListener("keydown", keydown);
  window.addEventListener("keyup", keyup);
  window.addEventListener("pointerdown", down);
  window.addEventListener("pointerup", up);
  window.addEventListener("pointermove", move);
  window.addEventListener("wheel", wheel, { passive: true });
  window.addEventListener("blur", blur);
  return () => {
    window.removeEventListener("keydown", keydown);
    window.removeEventListener("keyup", keyup);
    window.removeEventListener("pointerdown", down);
    window.removeEventListener("pointerup", up);
    window.removeEventListener("pointermove", move);
    window.removeEventListener("wheel", wheel);
    window.removeEventListener("blur", blur);
    input.reset();
  };
}
