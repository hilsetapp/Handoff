import { describe, expect, it } from 'vitest';
import { parsePorcelain } from '../src/git.js';

describe('parsePorcelain', () => {
  it('returns an empty list for a clean tree', () => {
    expect(parsePorcelain('')).toEqual([]);
    expect(parsePorcelain('\n')).toEqual([]);
  });

  it('parses unstaged modifications', () => {
    const changes = parsePorcelain(' M src/cli.ts\n');
    expect(changes).toEqual([{ path: 'src/cli.ts', status: 'modified', staged: false }]);
  });

  it('parses staged additions', () => {
    const changes = parsePorcelain('A  src/new-file.ts\n');
    expect(changes).toEqual([{ path: 'src/new-file.ts', status: 'added', staged: true }]);
  });

  it('parses mixed staged + unstaged state', () => {
    const changes = parsePorcelain('MM src/both.ts\n');
    expect(changes).toEqual([{ path: 'src/both.ts', status: 'modified', staged: true }]);
  });

  it('parses deletions', () => {
    expect(parsePorcelain(' D src/gone.ts\n')).toEqual([
      { path: 'src/gone.ts', status: 'deleted', staged: false },
    ]);
  });

  it('parses untracked files', () => {
    expect(parsePorcelain('?? docs/notes.md\n')).toEqual([
      { path: 'docs/notes.md', status: 'untracked', staged: false },
    ]);
  });

  it('parses renames, keeping the destination path', () => {
    const changes = parsePorcelain('R  src/old.ts -> src/new.ts\n');
    expect(changes).toEqual([{ path: 'src/new.ts', status: 'renamed', staged: true }]);
  });

  it('handles quoted paths with spaces and non-ascii names', () => {
    const changes = parsePorcelain(' M "src/my file.ts"\n?? "src/привет.ts"\n');
    expect(changes).toEqual([
      { path: 'src/my file.ts', status: 'modified', staged: false },
      { path: 'src/привет.ts', status: 'untracked', staged: false },
    ]);
  });

  it('skips ignored entries', () => {
    expect(parsePorcelain('!! node_modules/\n')).toEqual([]);
  });

  it('parses a realistic multi-file status', () => {
    const raw = [
      'M  README.md',
      ' M src/git.ts',
      'A  src/commands/sync.ts',
      'D  src/old.ts',
      'R  docs/a.md -> docs/b.md',
      '?? .handoff/HANDOFF.md',
    ].join('\n');
    const changes = parsePorcelain(raw);
    expect(changes).toHaveLength(6);
    expect(changes.map((c) => c.status)).toEqual([
      'modified',
      'modified',
      'added',
      'deleted',
      'renamed',
      'untracked',
    ]);
    expect(changes[0]?.staged).toBe(true);
    expect(changes[1]?.staged).toBe(false);
  });

  it('regression: keeps the leading space of the first line (unstaged marker)', () => {
    // a consumer that .trim()s the raw output turns ' M src/auth.ts' into
    // 'M src/auth.ts' — breaking both the staged flag and the path
    const raw = ' M src/auth.ts\n?? docs/\n';
    const changes = parsePorcelain(raw);
    expect(changes[0]).toEqual({ path: 'src/auth.ts', status: 'modified', staged: false });
  });
});
