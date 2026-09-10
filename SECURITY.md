# Security Policy

Thank you for helping keep Coder-Life and its contributors safe. Please report suspected security vulnerabilities privately so we can investigate and coordinate a fix.

## Supported versions

Coder-Life is in early development. Security fixes target the latest code on the default branch, `main`.

| Version or branch           | Security support |
| --------------------------- | ---------------- |
| Latest code on `main`       | Supported        |
| Older commits and snapshots | Not maintained   |

If possible, check whether the problem is reproducible on the latest `main` and include the affected commit in your report. Reports about older code are still welcome; we may ask you to help confirm whether the current code is affected.

## Report a vulnerability

Email **[sasuke.reinier@gmail.com](mailto:sasuke.reinier@gmail.com)** with the subject **`[Coder-Life Security] Short description`**.

Please do not disclose vulnerability details in public issues, discussions, or pull requests before we have coordinated disclosure.

Include as much of the following as you can:

- A description of the vulnerability and its potential security impact.
- The affected commit, dependency version, file, or deployed URL.
- Steps to reproduce the issue, including any required conditions or user actions.
- A minimal proof of concept, screenshots, or relevant logs.
- Your browser and operating system; for development or build tooling, include Node.js and pnpm versions.
- Any suggested mitigation or fix, if you have one.
- Whether and how you would like to be credited in a public advisory.

You do not need a complete exploit or a proposed fix to report a concern. Share only the information needed to reproduce it; remove unrelated personal data, credentials, and private browser data from attachments.

## Scope

Coder-Life is a client-side browser game distributed as static files. Game saves use IndexedDB, and preferences use localStorage. There is no application backend or account system.

Relevant reports include vulnerabilities in:

- The application's browser code, rendering, and handling of persisted game data.
- Bundled runtime assets or dependencies that affect the game.
- This repository's development and build scripts or dependency configuration.

For dependency findings, include the affected package and advisory identifier if available, plus any evidence of how it affects this project. For issues specific to an independently hosted copy, contact that deployment's operator; let us know if the underlying project code is also affected.

Ordinary gameplay bugs, balance issues, and changes made to your own local save through browser developer tools can be reported through [GitHub issues](https://github.com/ragnarok22/coder-life/issues). If you are unsure whether an issue has security implications, use the private reporting address first.

## Response and disclosure

The maintainer will:

1. Acknowledge the report and request additional information if needed.
2. Attempt to reproduce the issue and assess its impact.
3. Coordinate a fix or mitigation and share progress with the reporter.
4. Coordinate public disclosure once a fix or mitigation is available, including affected code, remediation steps, and credit according to the reporter's preference.

Reports will be handled privately and shared only with people needed to investigate and resolve the issue. Please coordinate publication of exploit details with the maintainer. If you have not received a response, follow up in the same email thread.

## Responsible testing

Use a local copy or an environment you have permission to test. Keep demonstrations minimal and avoid accessing other people's data or disrupting deployed sites and third-party services.

For community conduct concerns, see the [Code of Conduct](CODE_OF_CONDUCT.md). For general development contributions, see [CONTRIBUTING.md](CONTRIBUTING.md).
