# handoff — agent instructions

Portable session context for AI coding agents (this repo dogfoods its own philosophy).

## Commands

- `npm run build` — compile TypeScript to `dist/` (tsc, NodeNext ESM)
- `npm test` — vitest suite (unit + e2e against real temp git repos)
- `npm run typecheck` — strict tsc check
- `node dist/cli.js <cmd>` — run the CLI locally

## Structure

- `src/git.ts` — git state capture. `parsePorcelain` is pure; **never trim porcelain output** (leading space = unstaged marker)
- `src/snapshot.ts` — `buildMarkdown` (pure renderer of HANDOFF.md) + `runTests`
- `src/sync.ts` — managed-block upsert into agent files; never destroys user content outside `<!-- handoff:start/end -->`
- `src/commands/*` — thin command handlers calling the above

## Conventions

- Node >= 18, strict TS with `noUncheckedIndexedAccess`, ESM with explicit `.js` import suffixes
- Two runtime dependencies only (`commander`, `picocolors`) — do not add more without discussion
- All new logic: pure function + unit test first

## Testing rules

- Unit tests live beside `test/*.test.ts`; e2e creates real temp git repos (auto-configures identity)
- Never write outside the OS temp dir in tests
