import { isInitialized, loadConfig } from '../config.js';
import { dim, kv, sym } from '../render.js';
import { takeSnapshot, writeSnapshot } from '../snapshot.js';
import { runInit } from './init.js';
import { countOpen } from '../notes.js';

export interface SaveOptions {
  message?: string;
  test?: boolean;
  noTest?: boolean;
  version: string;
}

export function runSave(cwd: string, opts: SaveOptions): number {
  if (!isInitialized(cwd)) {
    console.log(`${sym.info} no .handoff/ found — initializing with defaults.`);
    runInit(cwd, {});
  }

  const config = loadConfig(cwd);
  const shouldTest = opts.test === true || (config.autoRunTests && opts.noTest !== true);

  if (shouldTest && config.testCommand) {
    console.log(dim(`running ${config.testCommand} …`));
  }

  const snap = takeSnapshot(cwd, config, { summary: opts.message, runTests: shouldTest, version: opts.version });
  const mdPath = writeSnapshot(cwd, snap);

  console.log(`${sym.ok} Snapshot saved → ${mdPath.replace(`${cwd}/`, '')}`);

  const { next, done } = countOpen(snap.notes);
  const parts = [
    `${next} next step${next === 1 ? '' : 's'}`,
    `${snap.notes.decisions.length} decision${snap.notes.decisions.length === 1 ? '' : 's'}`,
    `${snap.notes.failed.length} failed approach${snap.notes.failed.length === 1 ? '' : 'es'}`,
  ];
  console.log(kv('notes', parts.join(dim(' · ')) + (done ? dim(` (+${done} done)`) : '')));

  if (snap.git.isRepo) {
    const where = snap.git.branch ? `branch ${snap.git.branch}` : 'detached HEAD';
    const changes = snap.git.changes.length;
    console.log(kv('git', `${where} · ${changes ? `${changes} uncommitted file${changes === 1 ? '' : 's'}` : 'clean'}${snap.git.shortstat ? dim(` (${snap.git.shortstat.trim()})`) : ''}`));
  } else {
    console.log(kv('git', dim('not a repository — snapshot is notes-only')));
  }

  if (snap.tests) {
    console.log(kv('tests', snap.tests.ok ? `PASS ${dim(`(${snap.tests.command})`)}` : `FAIL ${dim(`(${snap.tests.command})`)}`));
  } else if (config.testCommand && !shouldTest) {
    console.log(kv('tests', dim(`skipped (${config.testCommand})`)));
  }

  console.log('');
  console.log(dim('Agents don\'t read this yet? Run: handoff sync --with claude,cursor,copilot'));
  return snap.tests && !snap.tests.ok ? 1 : 0;
}
