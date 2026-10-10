import { isInitialized } from '../config.js';
import { addNote, clearDone, markDone } from '../notes.js';
import { dim, sym } from '../render.js';
import { NOTE_KINDS, type NoteKind } from '../types.js';
import { runInit } from './init.js';

const LABELS: Record<NoteKind, string> = {
  next: 'next step',
  decision: 'decision',
  failed: 'failed approach',
  blocker: 'blocker',
};

export function runNote(cwd: string, kind: NoteKind, text: string): number {
  if (!NOTE_KINDS.includes(kind)) {
    console.error(`${sym.fail} unknown note kind "${kind}". Use one of: ${NOTE_KINDS.join(', ')}`);
    return 1;
  }
  if (!text.trim()) {
    console.error(`${sym.fail} empty note text.`);
    return 1;
  }
  if (!isInitialized(cwd)) runInit(cwd, {});
  addNote(cwd, kind, text.trim());
  console.log(`${sym.ok} ${LABELS[kind]} recorded ${dim('— visible to agents after `handoff save`')}`);
  return 0;
}

export function runDone(cwd: string, indexes: string[]): number {
  if (!isInitialized(cwd)) {
    console.error(`${sym.fail} no .handoff/ found — run handoff init first.`);
    return 1;
  }
  const parsed = indexes.map((s) => parseInt(s, 10)).filter((n) => Number.isFinite(n) && n > 0);
  if (parsed.length === 0) {
    console.error(`${sym.fail} give at least one item number, e.g. handoff done 1 2`);
    return 1;
  }
  const n = markDone(cwd, parsed);
  if (n === 0) {
    console.log(`${sym.warn} no matching open items for: ${parsed.join(', ')} ${dim('(see numbers in `handoff show`)')}`);
  } else {
    console.log(`${sym.ok} marked ${n} item${n === 1 ? '' : 's'} done ${dim('— run `handoff save` to publish')}`);
  }
  return 0;
}

export function runClearDone(cwd: string): number {
  const removed = clearDone(cwd);
  console.log(removed > 0 ? `${sym.ok} cleared ${removed} completed item${removed === 1 ? '' : 's'}` : `${sym.info} nothing completed to clear`);
  return 0;
}
