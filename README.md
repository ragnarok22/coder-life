# Coder-Life

**Write code. Drink coffee. Survive “a quick question.”**

A playable, low-poly, third-person browser game about a developer's first Monday. Everything runs on the device: physics, NPC navigation, decisions, time, audio and saves. The production build is a set of static files.

## Run

```sh
pnpm install
pnpm dev
```

Open the local URL printed by Vite. Node is only used for development/build tooling; gameplay has no server or API.

```sh
pnpm build        # Type-check and generate dist/
pnpm preview      # Inspect the static production build locally
```

Deploy the contents of `dist/` to any static host. Relative asset paths support subdirectories. All fonts, JavaScript and Rapier WASM are bundled locally. There are no runtime CDN assets, accounts or remote databases.

## Play Day 1

1. Start a **New game**, then press **E** to wake up at 08:00.
2. Walk through the house. Breakfast is optional. The green dot on the map marks the exit.
3. Walk to the office; a neighbor needs help on the way.
4. Survive HR and the printer request. Accepting costs time; refusing can affect stress, relationships and future requests.
5. Find the gold-topped desk with the **YOUR DESK** floor marker. Press **E** to work.
6. After 30 minutes of actual work, the manager comes looking for you. Watch for the orange `!` above incoming NPCs. Moving behind walls breaks line of sight.
7. Use the coffee machine, lunch, water or a quiet break to manage your energy and stress.
8. Reach **100% work** before **17:00**, then get your end-of-day score. Time continues after completing your tasks until the end of the workday.

The clock advances at **one game minute per real second** (a day lasts about nine minutes, less time spent in interactions). Decisions, pause menus and hidden tabs pause the clock. Change `GAME_MINUTES_PER_SECOND` in `src/data/content.ts` to adjust pacing.

### Controls

| Input             | Action                             |
| ----------------- | ---------------------------------- |
| WASD / arrow keys | Camera-relative movement           |
| Shift             | Move faster (energy affects speed) |
| Mouse drag        | Rotate third-person camera         |
| Scroll            | Limited camera zoom                |
| E                 | Interact, get up or leave the desk |
| Escape            | Pause / resume                     |

Touch devices have on-screen movement and interaction buttons. Keyboard/mouse is the primary experience. Input bindings are abstracted in `src/game/input.ts`.

## Saves and settings

- **IndexedDB** database `coder-life`, store `saves`: one versioned save with current day, position, progress, clock, resources, active dialogue, event flags/cooldowns, decisions, relationships, statistics and achievements.
- Autosaves every 15 seconds, after important decisions and transitions, on pause and at day end. The pause menu also has **Save game**.
- **Continue** restores the last saved day, or its results if completed. Working is stopped on load so the player can reorient themselves.
- **Restart day**, **New game**, and **Settings → Reset progress** provide explicit reset controls.
- **localStorage** contains only small preferences: audio levels, graphics and mouse sensitivity.
- Browser storage can fail (for example, quotas or privacy settings); failures are shown rather than silently claiming success. Saves are per origin and browser profile.

## Architecture

All source filenames use **kebab-case**. Use an intermediate filename for case-only renames on macOS.

```text
src/
  ai/navigation.ts        Clearance-aware A*, visibility and collision-aware paths
  data/content.ts         Day, career, NPC schedules, interruptions, random events
  data/world.ts           Shared world bounds, obstacles and interactable objects
  entities/               Rapier player controller, NPC brains, character/animation adapter
  events/                 Weighted event selection, eligibility and cooldown gates
  game/                   Pure rules, Zustand orchestration, input, audio, persistence
  rendering/              3D worlds, menu diorama, reusable props and lighting
  ui/                     Menus, HUD, map, work panel, dialogue and results
```

### Adding content

- **Interruption:** add an `Interruption` in `src/data/content.ts`: NPC, conditions, probability, cooldown, dialogue and choices. Choices use generic effects for time, resources, relationships, productivity, flags and future interruption likelihood.
- **NPC:** add a definition with appearance, desk, spawn and goal-based schedule. Navigation is calculated dynamically from the obstacle layout.
- **Object:** add a `WorldObject` in `src/data/world.ts`, its visual geometry in the world renderer, and an obstacle when needed. Existing object kinds use generic effects/cooldowns.
- **Event:** add a data entry with time/progress conditions, probability, cooldown and effects.
- **Further days:** the day and career definitions include roles and difficulty metadata. Only Day 1 is playable in this vertical slice.

### Navigation and physics

Rapier's kinematic character controller handles gravity, sliding, collisions, ground snapping and steps up to 0.3 units. Camera obstruction uses physics raycasts. NPCs use A* on a 0.65-unit grid with radius clearance, diagonal corner-cut prevention and local separation. Rendering and navigation share obstacle definitions. NPCs know their workplace landmarks, but only learn the player's current position through distance, field of view and line-of-sight detection.

### Models and audio

The current art uses local procedural placeholder geometry. `src/entities/character.tsx` accepts a local `modelUrl` GLB and maps `idle`, `walk`, `run`, `sit`, `typing` and `talk` clips through Drei. No finished external character assets are required. For replacement assets, prefer low-poly, Meshopt-compressed GLBs with embedded textures; keep all decoder/assets local and verify clip names.

`src/game/audio.ts` provides a Web Audio mixer and synthesized placeholder cues for steps, typing, notifications, doors, coffee, dialogue and printers, plus a quiet ambient chord. Audio is unlocked after user interaction. Real audio samples can replace cues behind the same interface.

### Performance

The 3D views are lazy-loaded. Floor tiles are instanced; transient player/NPC state is updated outside React. Game rules/HUD update four times per second; the map updates independently. Three graphic presets control resolution and shadows. There is one shadow-casting light per scene. Rapier's bundled WASM is the largest lazy asset. The 60 FPS target depends on hardware and graphics settings; use Low for constrained devices.

## Checks

```sh
pnpm typecheck
pnpm lint
pnpm format:check
pnpm test
pnpm test:coverage
pnpm test:e2e
```

Unit/integration tests cover day rules, decisions, resource bounds, end-of-day scoring, A* reachability, visibility, IndexedDB and the Day 1 flow. Playwright uses an isolated Chrome instance to drive the real keyboard/controller from home to office, verify working and manager interception, save/reload, and check results. It also captures desktop/mobile screenshots. The remainder of the day is accelerated in the test harness by calling the same game rules, not by modifying production pacing.

Playwright expects Google Chrome (`channel: 'chrome'`). Install it, or change `playwright.config.ts` to bundled Chromium and run `pnpm exec playwright install chromium`.
