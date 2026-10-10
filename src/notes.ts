import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { ensureHandoffDir, paths } from './config.js';
import { emptyNotes, type Note, type NoteKind, type NotesStore } from './types.js';

export function loadNotes(cwd: string): NotesStore {
  const p = paths(cwd).notes;
  if (!existsSync(p)) return emptyNotes();
  try {
    const raw = JSON.parse(readFileSync(p, 'utf8')) as Partial<NotesStore>;
    const store = emptyNotes();
    for (const kind of ['next', 'decisions', 'failed', 'blockers'] as const) {
      if (Array.isArray(raw[kind])) store[kind] = raw[kind] as Note[];
    }
    return store;
  } catch {
    return emptyNotes();
  }
}

export function saveNotes(cwd: string, store: NotesStore): void {
  ensureHandoffDir(cwd);
  writeFileSync(paths(cwd).notes, JSON.stringify(store, null, 2) + '\n', 'utf8');
}

export function addNote(cwd: string, kind: NoteKind, text: string): Note {
  const store = loadNotes(cwd);
  const listKey = kind === 'next' ? 'next' : kind === 'decision' ? 'decisions' : kind === 'failed' ? 'failed' : 'blockers';
  const note: Note = { text, ts: new Date().toISOString() };
  store[listKey].push(note);
  saveNotes(cwd, store);
  return note;
}

/**
 * Mark next-step items as done. Indexes are 1-based positions in the
 * flattened `next` list, exactly as printed by `handoff show`.
 * Returns the number of items updated.
 */
export function markDone(cwd: string, indexes: number[]): number {
  const store = loadNotes(cwd);
  let updated = 0;
  for (const i of indexes) {
    const item = store.next[i - 1];
    if (item && !item.done) {
      item.done = true;
      updated++;
    }
  }
  if (updated > 0) saveNotes(cwd, store);
  return updated;
}

/** Remove all completed next-steps. Returns removed count. */
export function clearDone(cwd: string): number {
  const store = loadNotes(cwd);
  const before = store.next.length;
  store.next = store.next.filter((n) => !n.done);
  const removed = before - store.next.length;
  if (removed > 0) saveNotes(cwd, store);
  return removed;
}

export function resetNotes(cwd: string): void {
  saveNotes(cwd, emptyNotes());
}

export function countOpen(store: NotesStore): { next: number; done: number } {
  const done = store.next.filter((n) => n.done).length;
  return { next: store.next.length - done, done };
}
