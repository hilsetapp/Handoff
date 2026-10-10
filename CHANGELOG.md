# Changelog

All notable changes to this project are documented here.
The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## [0.1.0] - 2026-10-10

Initial release.

### Added

- Core context file format: `.handoff/HANDOFF.md` (Markdown) + JSON sidecar
- `handoff init` — smart setup with test-command auto-detection
- `handoff save` — snapshot of git state + notes + test results
- `handoff next / decision / failed / blocker` — structured session notes
- `handoff done`, `handoff clear` — next-step tracking
- `handoff show` — status view with staleness detection
- `handoff sync` — managed-block wiring into `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`,
  `.github/copilot-instructions.md`, `.cursor/rules/handoff.mdc`
- `handoff archive` — session close-out with history in `.handoff/archive/`
- Russian documentation (`README.ru.md`) and step-by-step guide (`GUIDE_RU.md`)

[0.1.0]: https://github.com/yourname/handoff/releases/tag/v0.1.0
