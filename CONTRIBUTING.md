# Contributing to handoff

Thanks for considering a contribution! This project is intentionally small and well-tested — let's keep it that way.

## Development setup

```bash
git clone https://github.com/yourname/handoff.git
cd handoff
npm install
npm run build        # compile to dist/
npm test             # run the test suite (vitest)
npm run typecheck    # strict TypeScript check
node dist/cli.js --help
```

Try the CLI against any throwaway git repo:

```bash
mkdir /tmp/demo && cd /tmp/demo && git init
node /path/to/handoff/dist/cli.js init
```

## Ground rules

- **Two runtime dependencies is a feature.** Think hard before adding a third.
- **Pure functions where possible.** `parsePorcelain`, `buildMarkdown`, `upsertManagedBlock` are pure and unit-tested — keep new logic testable the same way.
- **Never destroy user files.** Anything `handoff` writes outside `.handoff/` must be inside managed `<!-- handoff:start/end -->` markers or files handoff fully owns.
- **Node >= 18**, strict TypeScript, ESM.

## Pull requests

1. Fork, create a branch from `main`.
2. Add tests for any behavior change (unit for pure logic, `test/e2e.test.ts`-style for git integration).
3. Make sure `npm run typecheck && npm test && npm run build` is green.
4. Describe the *why*, not just the *what*.

Good first contributions: additional sync targets (Windsurf, Aider, Zed), smarter test-output tails, `--watch` mode, docs and translations.
