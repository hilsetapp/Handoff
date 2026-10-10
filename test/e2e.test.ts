import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { getGitState } from '../src/git.js';
import { runInit } from '../src/commands/init.js';
import { runSave } from '../src/commands/save.js';
import { paths } from '../src/config.js';
import { readFileSync } from 'node:fs';

function gitAvailable(): boolean {
  try {
    execFileSync('git', ['--version'], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

let dir: string;

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'handoff-e2e-'));
  execFileSync('git', ['init', '-q'], { cwd: dir });
  execFileSync('git', ['-c', 'user.email=test@example.com', '-c', 'user.name=Test', 'commit', '--allow-empty', '-q', '-m', 'initial commit'], { cwd: dir });
});

afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
});

describe.skipIf(!gitAvailable())('e2e with a real git repo', () => {
  it('collects git state from a real repository', () => {
    writeFileSync(join(dir, 'app.js'), 'console.log("hi");\n');
    writeFileSync(join(dir, 'README.md'), '# demo\n');
    execFileSync('git', ['add', 'README.md'], { cwd: dir });

    const state = getGitState(dir);
    expect(state.isRepo).toBe(true);
    expect(state.recentCommits[0]?.subject).toBe('initial commit');
    expect(state.changes).toContainEqual({ path: 'app.js', status: 'untracked', staged: false });
    expect(state.changes).toContainEqual({ path: 'README.md', status: 'added', staged: true });
  });

  it('init + save produces a complete HANDOFF.md', () => {
    writeFileSync(
      join(dir, 'package.json'),
      JSON.stringify({ name: 'demo-app', scripts: { test: 'node -e "process.exit(0)"' } }, null, 2),
    );

    expect(runInit(dir, {})).toBe(0);
    expect(runSave(dir, { version: '0.0.0-test' })).toBe(0);

    const md = readFileSync(paths(dir).md, 'utf8');
    expect(md).toContain('# Session handoff — demo-app');
    expect(md).toContain('`npm test` — ✅ PASS');
    expect(existsSync(paths(dir).state)).toBe(true);
  });

  it('save returns exit code 1 when tests fail', () => {
    writeFileSync(
      join(dir, 'package.json'),
      JSON.stringify({ name: 'demo-fail', scripts: { test: 'node -e "process.exit(1)"' } }, null, 2),
    );
    runInit(dir, {});
    expect(runSave(dir, { version: '0.0.0-test' })).toBe(1);
    const md = readFileSync(paths(dir).md, 'utf8');
    expect(md).toContain('❌ FAIL');
  });
});
