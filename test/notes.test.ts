import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { addNote, clearDone, countOpen, loadNotes, markDone } from '../src/notes.js';
import { emptyNotes } from '../src/types.js';

let dir: string;

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'handoff-test-'));
});

afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
});

describe('notes store', () => {
  it('returns an empty store when nothing was saved', () => {
    expect(loadNotes(dir)).toEqual(emptyNotes());
  });

  it('adds notes of every kind and survives a reload', () => {
    addNote(dir, 'next', 'write the parser');
    addNote(dir, 'decision', 'use SQLite: offline-first requirement');
    addNote(dir, 'failed', 'zlib streaming corrupts binary files');
    addNote(dir, 'blocker', 'waiting for API access');

    const store = loadNotes(dir);
    expect(store.next).toHaveLength(1);
    expect(store.decisions).toHaveLength(1);
    expect(store.failed).toHaveLength(1);
    expect(store.blockers).toHaveLength(1);
    expect(store.next[0]?.text).toBe('write the parser');
    expect(store.decisions[0]?.ts).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('marks items done with 1-based indexes', () => {
    addNote(dir, 'next', 'first task');
    addNote(dir, 'next', 'second task');
    addNote(dir, 'next', 'third task');

    expect(markDone(dir, [1, 3])).toBe(2);
    const store = loadNotes(dir);
    expect(store.next[0]?.done).toBe(true);
    expect(store.next[1]?.done).toBeUndefined();
    expect(store.next[2]?.done).toBe(true);
    expect(countOpen(store)).toEqual({ next: 1, done: 2 });
  });

  it('ignores out-of-range indexes without crashing', () => {
    addNote(dir, 'next', 'only task');
    expect(markDone(dir, [5, 99])).toBe(0);
  });

  it('clearDone removes completed items only', () => {
    addNote(dir, 'next', 'task a');
    addNote(dir, 'next', 'task b');
    markDone(dir, [1]);
    expect(clearDone(dir)).toBe(1);
    const store = loadNotes(dir);
    expect(store.next).toHaveLength(1);
    expect(store.next[0]?.text).toBe('task b');
  });
});
