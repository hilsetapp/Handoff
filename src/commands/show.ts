import { existsSync, readFileSync } from 'node:fs';
import pc from 'picocolors';
import { paths } from '../config.js';
import { fingerprint, getGitState } from '../git.js';
import { loadNotes } from '../notes.js';
import { dim, header, kv, sym, timeAgo } from '../render.js';
import type { Snapshot } from '../types.js';

export interface ShowOptions {
  json?: boolean;
}

function readState(cwd: string): Snapshot | null {
  const p = paths(cwd).state;
  if (!existsSync(p)) return null;
  try {
    return JSON.parse(readFileSync(p, 'utf8')) as Snapshot;
  } catch {
    return null;
  }
}

export function runShow(cwd: string, opts: ShowOptions): number {
  const state = readState(cwd);
  if (!state) {
    console.log(`${sym.warn} no snapshot yet. Run \`handoff save\` to create one.`);
    return 1;
  }

  if (opts.json) {
    console.log(JSON.stringify(state, null, 2));
    return 0;
  }

  const git = getGitState(cwd);
  const stale = git.isRepo && fingerprint(git) !== state.fingerprint;

  console.log(header(`handoff — ${state.project}`));
  console.log(kv('saved', `${timeAgo(state.generatedAt)} ${dim(`(${state.generatedAt})`)}`));
  if (stale) {
    console.log(kv('state', `${sym.warn} working tree changed since snapshot ${dim('— run `handoff save`')}`));
  } else {
    console.log(kv('state', `${sym.ok} up to date`));
  }
  console.log('');

  const notes = loadNotes(cwd);
  console.log(header('Next steps'));
  if (notes.next.length === 0) {
    console.log(dim('  none — add one: handoff next "..."'));
  } else {
    notes.next.forEach((n, i) => {
      const box = n.done ? '[x]' : '[ ]';
      const text = n.done ? pc.dim(n.text) : n.text;
      console.log(`  ${pc.dim(String(i + 1).padStart(2))} ${box} ${text}`);
    });
  }
  console.log('');

  console.log(kv('decisions', String(notes.decisions.length)));
  console.log(kv('failed', String(notes.failed.length)));
  console.log(kv('blockers', String(notes.blockers.length)));
  if (state.tests) {
    console.log(kv('tests', `${state.tests.ok ? 'PASS' : 'FAIL'} ${dim(`(${state.tests.command}, ${timeAgo(state.tests.ranAt)})`)}`));
  }
  if (state.git.isRepo) {
    const changeCount = state.git.changes.length;
    console.log(kv('git (saved)', `${state.git.branch ?? 'detached'} · ${changeCount ? `${changeCount} changed file${changeCount === 1 ? '' : 's'}` : 'clean'}`));
  }
  console.log('');
  console.log(dim(`context file: ${paths(cwd).md.replace(`${cwd}/`, '')}`));
  return 0;
}
