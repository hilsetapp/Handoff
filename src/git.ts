import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import type { GitFileChange, GitState, RecentCommit } from './types.js';

/**
 * Run a git command, returning raw stdout or null on any failure.
 * Callers trim as needed — porcelain output has significant leading spaces
 * that a naive .trim() would destroy (regression: unstaged file on the
 * first status line lost its ' ' marker and its first path character).
 */
export function git(args: string[], cwd: string): string | null {
  try {
    return execFileSync('git', args, {
      cwd,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
      maxBuffer: 16 * 1024 * 1024,
    });
  } catch {
    return null;
  }
}

export function isGitRepo(cwd: string): boolean {
  return git(['rev-parse', '--is-inside-work-tree'], cwd)?.trim() === 'true';
}

const STATUS_LABELS: Record<string, string> = {
  M: 'modified',
  A: 'added',
  D: 'deleted',
  R: 'renamed',
  C: 'copied',
  T: 'typechange',
  U: 'unmerged',
};

/**
 * Parse `git status --porcelain=v1` output into structured file changes.
 * Pure function — heavily unit tested.
 */
export function parsePorcelain(raw: string): GitFileChange[] {
  const changes: GitFileChange[] = [];

  for (const line of raw.split('\n')) {
    if (!line || line.length < 4) continue;
    const x = line.charAt(0);
    const y = line.charAt(1);

    // ignored entries are noise for agents
    if (x === '!' && y === '!') continue;

    let path = line.slice(3);
    const arrow = path.indexOf(' -> ');
    if (arrow !== -1) path = path.slice(arrow + 4);
    if (path.startsWith('"') && path.endsWith('"')) {
      try {
        path = JSON.parse(path) as string;
      } catch {
        path = path.slice(1, -1);
      }
    }

    if (x === '?' && y === '?') {
      changes.push({ path, status: 'untracked', staged: false });
      continue;
    }

    const code = x !== ' ' ? x : y;
    changes.push({
      path,
      status: STATUS_LABELS[code] ?? 'changed',
      staged: x !== ' ' && x !== '?',
    });
  }

  return changes;
}

/** Collect the current working-tree state of a git repository. */
export function getGitState(cwd: string, recentCommitCount = 5): GitState {
  if (!isGitRepo(cwd)) {
    return { isRepo: false, recentCommits: [], changes: [] };
  }

  const state: GitState = { isRepo: true, recentCommits: [], changes: [] };

  const branch = git(['branch', '--show-current'], cwd)?.trim();
  if (branch) {
    state.branch = branch;
  } else {
    state.detached = true;
  }

  state.commit = git(['rev-parse', '--short', 'HEAD'], cwd)?.trim() ?? undefined;

  const upstream = git(['rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{upstream}'], cwd)?.trim();
  if (upstream) {
    state.upstream = upstream;
    const counts = git(['rev-list', '--left-right', '--count', '@{upstream}...HEAD'], cwd)?.trim();
    if (counts) {
      const [behind, ahead] = counts.split(/\s+/).map((n) => parseInt(n, 10));
      state.behind = Number.isFinite(behind) ? behind : 0;
      state.ahead = Number.isFinite(ahead) ? ahead : 0;
    }
  }

  const log = git(['log', '-n', String(recentCommitCount), '--pretty=format:%h%x09%s'], cwd)?.trim();
  if (log) {
    state.recentCommits = log
      .split('\n')
      .map((line): RecentCommit | null => {
        const tab = line.indexOf('\t');
        if (tab === -1) return null;
        return { hash: line.slice(0, tab), subject: line.slice(tab + 1) };
      })
      .filter((c): c is RecentCommit => c !== null);
  }

  // NOTE: do not trim — leading spaces in porcelain lines carry the staged flag
  const porcelain = git(['status', '--porcelain=v1'], cwd);
  state.changes = parsePorcelain(porcelain ?? '');

  const shortstat = git(['diff', '--shortstat', 'HEAD'], cwd)?.trim();
  state.shortstat = shortstat || undefined;

  return state;
}

/** Fingerprint of HEAD + working tree changes for staleness detection. */
export function fingerprint(state: GitState): string {
  const basis = JSON.stringify({ commit: state.commit, branch: state.branch, changes: state.changes });
  return createHash('sha1').update(basis).digest('hex').slice(0, 12);
}
