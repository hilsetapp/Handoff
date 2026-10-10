import { describe, expect, it } from 'vitest';
import { buildMarkdown } from '../src/snapshot.js';
import type { Snapshot } from '../src/types.js';

function makeSnapshot(overrides: Partial<Snapshot> = {}): Snapshot {
  return {
    tool: 'handoff 0.1.0 (test)',
    generatedAt: '2026-10-10T14:30:00.000Z',
    project: 'orbit-api',
    git: {
      isRepo: true,
      branch: 'feat/token-refresh',
      commit: 'a1b2c3d',
      upstream: 'origin/feat/token-refresh',
      ahead: 2,
      behind: 0,
      recentCommits: [
        { hash: 'a1b2c3d', subject: 'add refresh endpoint' },
        { hash: 'e5f6a7b', subject: 'extract token store' },
      ],
      changes: [
        { path: 'src/auth.ts', status: 'modified', staged: false },
        { path: 'docs/plan.md', status: 'untracked', staged: false },
      ],
      shortstat: ' 1 file changed, 42 insertions(+), 3 deletions(-)',
    },
    tests: {
      command: 'npm test',
      ok: true,
      exitCode: 0,
      ranAt: '2026-10-10T14:29:55.000Z',
      tail: '  12 passing (1s)',
    },
    notes: {
      next: [
        { text: 'Implement token refresh in /auth', ts: '2026-10-09T10:00:00.000Z' },
        { text: 'Write snapshot tests', ts: '2026-10-09T11:00:00.000Z', done: true },
      ],
      decisions: [{ text: 'SQLite for token cache: offline-first requirement', ts: '2026-10-09T10:05:00.000Z' }],
      failed: [{ text: 'redis as cache: adds infra dependency we do not want', ts: '2026-10-09T12:00:00.000Z' }],
      blockers: [],
    },
    env: { node: 'v22.11.0', pm: 'pnpm', os: 'linux' },
    fingerprint: 'abc123',
    ...overrides,
  };
}

describe('buildMarkdown', () => {
  it('renders every core section', () => {
    const md = buildMarkdown(makeSnapshot());
    expect(md).toContain('# Session handoff — orbit-api');
    expect(md).toContain('## Next steps');
    expect(md).toContain('## Decisions made');
    expect(md).toContain('## Failed approaches (do not retry)');
    expect(md).toContain('## Working tree');
    expect(md).toContain('## Tests');
    expect(md).toContain('## Environment');
  });

  it('tells agents to read the file', () => {
    const md = buildMarkdown(makeSnapshot());
    expect(md).toContain('AI coding agents');
    expect(md).toContain('read this file at session start');
  });

  it('renders next steps as checkboxes with done state', () => {
    const md = buildMarkdown(makeSnapshot());
    expect(md).toContain('- [ ] Implement token refresh in /auth');
    expect(md).toContain('- [x] Write snapshot tests');
  });

  it('renders git state: branch, upstream, commits, changes', () => {
    const md = buildMarkdown(makeSnapshot());
    expect(md).toContain('branch `feat/token-refresh`');
    expect(md).toContain('ahead 2, behind 0');
    expect(md).toContain('`a1b2c3d` add refresh endpoint');
    expect(md).toContain('modified `src/auth.ts`');
    expect(md).toContain('untracked `docs/plan.md`');
  });

  it('renders pass/fail test status', () => {
    expect(buildMarkdown(makeSnapshot())).toContain('`npm test` — ✅ PASS');
    const failing = makeSnapshot();
    failing.tests = { command: 'npm test', ok: false, exitCode: 1, ranAt: '2026-10-10T14:29:55.000Z', tail: 'failing test' };
    const md = buildMarkdown(failing);
    expect(md).toContain('`npm test` — ❌ FAIL');
    expect(md).toContain('<details><summary>output tail</summary>');
  });

  it('omits blockers section when empty, renders it when present', () => {
    expect(buildMarkdown(makeSnapshot())).not.toContain('## Blockers');
    const blocked = makeSnapshot();
    blocked.notes.blockers = [{ text: 'waiting for prod DB access', ts: '2026-10-09T10:00:00.000Z' }];
    expect(buildMarkdown(blocked)).toContain('## Blockers');
    expect(buildMarkdown(blocked)).toContain('waiting for prod DB access');
  });

  it('handles non-git directories gracefully', () => {
    const snap = makeSnapshot();
    snap.git = { isRepo: false, recentCommits: [], changes: [] };
    expect(buildMarkdown(snap)).toContain('_Not a git repository._');
  });

  it('renders empty-notes placeholders so humans know the commands', () => {
    const snap = makeSnapshot();
    snap.notes = { next: [], decisions: [], failed: [], blockers: [] };
    snap.tests = null;
    const md = buildMarkdown(snap);
    expect(md).toContain('handoff next "..."');
    expect(md).toContain('_Not run. Configure `"testCommand"`');
  });
});
