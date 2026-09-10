/** Independent seeded streams make saved runs reproducible without tying events to render FPS. */
export function randomStream(seed: number) {
  let state = seed >>> 0;
  return {
    next() {
      state = (state + 0x6d2b79f5) >>> 0;
      let n = state;
      n = Math.imul(n ^ (n >>> 15), n | 1);
      n ^= n + Math.imul(n ^ (n >>> 7), n | 61);
      return ((n ^ (n >>> 14)) >>> 0) / 4294967296;
    },
    get state() {
      return state;
    },
  };
}
export const randomInt = (
  range: readonly [number, number],
  random: () => number,
) => Math.floor(range[0] + random() * (range[1] - range[0] + 1));
export function npcSeed(seed: number, id: string) {
  return (
    [...id].reduce((n, c) => Math.imul(n, 31) + c.charCodeAt(0), seed) >>> 0
  );
}
