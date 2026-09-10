# Contributing to Coder-Life

Thanks for helping make Monday a little more playable. Bug reports, gameplay feedback, documentation, code, and art contributions are welcome.

Please follow our [Code of Conduct](CODE_OF_CONDUCT.md). It also explains how to report community concerns privately.

## Find something to work on

- Browse [existing issues](https://github.com/ragnarok22/coder-life/issues) and [pull requests](https://github.com/ragnarok22/coder-life/pulls) before starting, and leave a comment if you plan to work on an issue.
- Small fixes and documentation improvements can go straight to a pull request.
- For larger features, balance changes, or architectural work, sharing an issue first helps align the approach and avoid duplicated effort.

Only Day 1 is currently playable. The [README](README.md) describes the game, its architecture, and where to add content. [AGENTS.md](AGENTS.md) contains detailed repository conventions, including guidance for coding agents.

### Report a bug

Open an [issue](https://github.com/ragnarok22/coder-life/issues/new) with:

- A short description of the problem and what you expected instead.
- Steps to reproduce it, including whether you started a new game or continued a save.
- Your browser, operating system, device, and graphics setting when relevant.
- The location, in-game time, and choices leading up to a gameplay problem.
- Screenshots, a short recording, or relevant browser console errors if available.

For gameplay suggestions, describe the situation you want to improve and how the change would affect the player's choices.

## Set up your environment

You will need:

- **Node.js 22.18+ or 24+**. The production build executes TypeScript scripts directly with Node.
- **pnpm**, the package manager used by this repository. See the [pnpm installation guide](https://pnpm.io/installation) if needed.
- **Git** and a browser with JavaScript and WebGL support.
- **Google Chrome** for the Playwright end-to-end and SEO suites; both use `channel: "chrome"`.

Fork [ragnarok22/coder-life](https://github.com/ragnarok22/coder-life), then clone your fork. Replace `YOUR-USERNAME` below with your GitHub username:

```sh
git clone https://github.com/YOUR-USERNAME/coder-life.git
cd coder-life
git switch -c your-change-name
pnpm install
pnpm dev
```

Open the URL printed by Vite. Gameplay runs entirely in the browser; there is no backend service to configure. Use pnpm for dependency changes and include the corresponding `pnpm-lock.yaml` update.

To inspect a production build:

```sh
pnpm build
pnpm preview
```

Use `pnpm build` rather than calling Vite's build directly: it runs TypeScript checks, bundles the app, and prerenders the main menu into `dist/index.html`.

`SITE_URL` is optional for local development. To test canonical URLs, social metadata, or subdirectory hosting, configure the full homepage URL through `SITE_URL` or `.env.production.local`. See [Search engines and link previews](README.md#search-engines-and-link-previews).

## Make your changes

Keep each change focused and follow the patterns in the surrounding code.

### Code style

- Use TypeScript and **kebab-case** source filenames. On macOS, use an intermediate filename for case-only renames.
- Follow the repository's Prettier and ESLint configuration. Address lint findings at their source rather than suppressing them just to pass checks.
- Format the files you change with `pnpm exec prettier --write path/to/file`. `pnpm format` formats the whole repository.
- Keep generated output such as `dist/`, `coverage/`, and `test-results/` out of your pull request.

### Architecture and gameplay

- Put pure game transitions in `src/game/rules.ts`. Use `src/game/store.ts` to coordinate events, UI state, audio, and saves.
- Keep high-frequency player and NPC state in `src/game/runtime.ts`, outside React and persistent game state.
- Use the shared world definitions in `src/data/world.ts` for navigation and physics. World/save `Vec2` coordinates are `[x, z]`. World object changes may also require updates in `src/rendering/world.tsx`.
- Keep game tuning and encounters in the existing data and event systems. See [Adding content](README.md#adding-content) for the relevant files.
- Preserve save compatibility and stable achievement IDs. When changing persistence, account for migration in `src/game/save-migration.ts` and cover the affected save paths. Save fixtures must keep the time ledger equal to `minutes - dayStart`.
- Keep runtime assets local, including fonts, models, audio, and Rapier WASM.
- Preserve lazy loading of `GameScene` and `MenuScene`. The main menu is also rendered in Node by `src/prerender.ts`, so its render/import path must remain safe without browser globals. Retain `<!--app-html-->` in `index.html`.

For manual gameplay checks, **F2** opens development tools while playing on the dev server. They can move the player, trigger encounters, and advance the day. Use a fresh run when testing because these actions affect the current local save.

## Verify your work

For code changes, run the core checks before submitting:

```sh
pnpm typecheck
pnpm lint
pnpm format:check
pnpm test:coverage
pnpm build
```

Typechecking covers `src/`, `scripts/`, and `vite.config.ts`; it does not cover tests or the Playwright/Vitest configuration files. Run the affected tests as well as typechecking.

For documentation-only changes, a focused formatting check is sufficient:

```sh
pnpm exec prettier --check CONTRIBUTING.md README.md
```

### Unit and integration tests

Vitest runs in Node and discovers `tests/**/*.test.ts`. To run the suite without coverage or focus on one behavior:

```sh
pnpm test
pnpm test tests/store.test.ts -t "pauses the clock"
```

For a bug fix, start with a test that reproduces the problem, confirm that it fails, then make it pass with the fix. Add meaningful coverage for new rules, event behavior, and persistence changes.

Storage tests use `fake-indexeddb/auto`. Store tests mock audio and reset both Zustand state and `runtime.player`; follow the setup in `tests/store.test.ts`.

### Browser and production checks

Run the relevant browser checks for UI, controls, gameplay flow, rendering, or save/restore changes:

```sh
pnpm test:e2e
pnpm test:e2e e2e/game.spec.ts -g "mobile menu"
```

The gameplay suite starts or reuses Vite on port **5173** and excludes SEO tests. Its accelerated Day 1 flow imports the active store from the dev server. Keep acceleration in the test rather than changing production pacing. For visual changes, check both desktop and mobile layouts and keyboard interaction.

For metadata, prerendering, asset-loading, or production build changes:

```sh
pnpm test:seo
```

The SEO suite builds the production app and serves it on port **4187**, which must be free. It overwrites `dist/` using `SITE_URL=https://example.com/coder-life/`. Rebuild with the real `SITE_URL` before deploying.

For balance, encounter, or ending changes, useful focused checks include:

```sh
pnpm test tests/replay-simulation.test.ts --reporter=verbose --disableConsoleIntercept
pnpm test tests/ending-routes.test.ts
pnpm test:e2e e2e/gameplay-polish.spec.ts
```

## Submit a pull request

Push your branch to your fork and open a pull request against the upstream repository's default branch. Use a descriptive title and include:

- What changed and why, with a linked issue when applicable.
- How you tested it, including the commands you ran and their results.
- Screenshots or a short recording for visible UI or rendering changes.
- Any gameplay, performance, or save-compatibility tradeoffs relevant to the change.

Keep the diff focused, update documentation when behavior or setup changes, and use clear commit messages. Draft pull requests are welcome for work in progress. If a check fails, include the failure details so reviewers can understand the current state.

## License

Contributions are made under the project's [MIT License](LICENSE). When adding third-party code or assets, include their source, license, and any required attribution.
