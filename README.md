# Coder-Life

[![License: MIT](https://img.shields.io/badge/License-MIT-426b50)](LICENSE)
[![Contributions welcome](https://img.shields.io/badge/Contributions-welcome-ce784c)](CONTRIBUTING.md)

**Write code. Drink coffee. Survive “a quick question.”**

A free, open-source, low-poly browser game about a developer's first Monday. Get to the office, finish your tasks, and manage interruptions, relationships, energy, and stress before 17:00.

Only **Day 1** is playable, with branching encounters, coding decisions, achievements, and multiple endings. A run takes roughly **12–18 minutes**. Progress autosaves locally in your browser.

Built with React, TypeScript, Three.js, and Rapier. Gameplay runs entirely on your device.

## The office, upgraded

The Day 1 office now has **39% more floor area** (30×20 units), with a developer zone, HR/accounting, two meeting spaces, a manager suite, print/copy area, kitchen and coffee corner, reception, lounge, bathroom and utility/server room. Central, western and southern routes let you change course when someone comes looking for you. Floor palettes, furniture, plants and landmarks distinguish the spaces.

Movement has configurable acceleration, braking, progressive turning and camera-relative controls. The shoulder-height camera smooths its target and orbit separately, sweeps a padded volume against obstacles, and lifts automatically in tight spaces. Walk/run animation cadence follows actual movement, including stopping against a wall.

The default cast has **12 NPCs** with modular silhouettes, skin tones, 11 hairstyles, coordinated outfits and accessories. Important characters keep their visual identities; secondary staff use seeded variations. Look out for **Jules, the Rockstar Developer**, at the triple-monitor setup, and **Sterling, the Corporate Visionary**, with the teal blazer and tablet.

Presentation tuning lives in `src/data/presentation.ts`, layout/collision geometry in `src/data/office-layout.ts`, and appearance definitions in `src/data/appearances.ts`. Static scenery and character parts are batched; floor tiles are instanced and AI/perception updates are throttled. Existing saves that overlap new furniture are moved to the nearest clear floor on Continue.

In development, **F2 → World / Camera / Cast** offers room teleportation, office overview, camera-ray/collider/navigation overlays, NPC freezing, ambient spawning up to 15, and appearance inspection. These controls are excluded from production.

## Run locally

Requires **Node.js 22.18+ or 24+** and **pnpm**.

```sh
pnpm install
pnpm dev
```

Open the URL printed by Vite. See the [contributing guide](CONTRIBUTING.md#set-up-your-environment) for fork and clone instructions.

## How to play

Start a **New game**, press **E** to wake up, and follow the map to the office. Find **YOUR DESK** and press **E** to work. Balance your tasks with requests and breaks until the day ends.

| Input             | Action                         |
| ----------------- | ------------------------------ |
| WASD / arrow keys | Move                           |
| Shift             | Move faster                    |
| Mouse drag        | Rotate camera                  |
| Scroll            | Zoom                           |
| E                 | Interact / get up / leave desk |
| Escape            | Pause / resume                 |

Touch controls are available; keyboard and mouse are recommended. Dialogues, pause menus, and hidden tabs pause the clock. Use **Continue** to resume a saved game.

## Build and deploy

```sh
SITE_URL=https://your-domain.com/coder-life/ pnpm build
pnpm preview
```

Replace `SITE_URL` with your public homepage URL, including any subdirectory. You can also set it in `.env.production.local` using `.env.example` as a template.

Deploy `dist/` to any static host. The build bundles assets locally, prerenders the menu, and generates search and social metadata. Playing requires JavaScript and WebGL.

Without `SITE_URL`, local builds work but omit canonical URLs, absolute social image URLs, and the sitemap. For subdirectory hosting, merge the generated sitemap directive into the host's origin-root `/robots.txt`.

## Contributing

Bug reports, gameplay ideas, code, and art are welcome.

- [Contributing guide](CONTRIBUTING.md) — setup, architecture, and checks.
- [Issues](https://github.com/ragnarok22/coder-life/issues) — report bugs or suggest improvements.
- [Code of Conduct](CODE_OF_CONDUCT.md) — community standards.
- [Security policy](SECURITY.md) — report vulnerabilities privately.

## License

[MIT](LICENSE).
