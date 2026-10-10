import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

const START = '<!-- handoff:start -->';
const END = '<!-- handoff:end -->';

export const SYNC_BLOCK = `${START}
## Live session context

This repository uses [handoff](https://github.com/hilsetapp/handoff).
**At the start of every session, read \`.handoff/HANDOFF.md\` before doing anything else.**
It contains the current working state: open next steps, decisions made,
failed approaches (do not retry them) and latest test status.
When the human says the work session is over, suggest running \`handoff save\`.
${END}`;

/**
 * Insert or replace the managed handoff block inside a markdown file's content.
 * Everything outside the markers is preserved. Idempotent.
 */
export function upsertManagedBlock(content: string, block: string): string {
  const startIdx = content.indexOf(START);
  const endIdx = content.indexOf(END);

  if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
    const before = content.slice(0, startIdx);
    const after = content.slice(endIdx + END.length);
    return `${before}${block}${after}`.replace(/\n{3,}/g, '\n\n');
  }

  const trimmed = content.replace(/\s+$/, '');
  return trimmed ? `${trimmed}\n\n${block}\n` : `${block}\n`;
}

const CURSOR_RULE = `---
description: Live session context via handoff
alwaysApply: true
---
# Live session context

This repository uses handoff. At the start of every session, read \`.handoff/HANDOFF.md\`
before doing anything else. It contains the current working state: open next steps,
decisions made, failed approaches (do not retry them) and latest test status.
When the human says the work session is over, suggest running \`handoff save\`.
`;

export interface SyncTarget {
  /** id used on the CLI: --with claude,cursor */
  id: string;
  label: string;
  /** path relative to repo root */
  file: string;
  /** 'block' = upsert managed block into existing file; 'owned' = file fully managed by handoff */
  mode: 'block' | 'owned';
}

export const AGENTS_TARGET: SyncTarget = {
  id: 'agents',
  label: 'AGENTS.md (Codex, Copilot, Windsurf, Aider, …)',
  file: 'AGENTS.md',
  mode: 'block',
};

export const EXTRA_TARGETS: SyncTarget[] = [
  { id: 'claude', label: 'Claude Code', file: 'CLAUDE.md', mode: 'block' },
  { id: 'gemini', label: 'Gemini CLI', file: 'GEMINI.md', mode: 'block' },
  { id: 'copilot', label: 'GitHub Copilot', file: join('.github', 'copilot-instructions.md'), mode: 'block' },
  { id: 'cursor', label: 'Cursor', file: join('.cursor', 'rules', 'handoff.mdc'), mode: 'owned' },
];

function safePath(rel: string): void {
  if (rel.includes('\0') || rel.startsWith('/') || rel.startsWith('..')) {
    throw new Error(`unsafe path: ${rel}`);
  }
}

/** Resolve targets from a --with list. Always includes AGENTS.md. */
export function resolveTargets(withList: string[]): SyncTarget[] {
  const targets: SyncTarget[] = [AGENTS_TARGET];
  for (const id of withList) {
    const t = EXTRA_TARGETS.find((x) => x.id === id);
    if (!t) throw new Error(`unknown tool "${id}". Available: ${EXTRA_TARGETS.map((x) => x.id).join(', ')}`);
    if (!targets.includes(t)) targets.push(t);
  }
  return targets;
}

/** Apply the sync to disk. Returns the list of files written. */
export function applySync(cwd: string, targets: SyncTarget[]): string[] {
  const written: string[] = [];
  for (const t of targets) {
    safePath(t.file);
    const abs = join(cwd, t.file);
    mkdirSync(dirname(abs), { recursive: true });
    if (t.mode === 'owned') {
      writeFileSync(abs, CURSOR_RULE, 'utf8');
    } else {
      const existing = existsSync(abs) ? readFileSync(abs, 'utf8') : '';
      writeFileSync(abs, upsertManagedBlock(existing, SYNC_BLOCK), 'utf8');
    }
    written.push(t.file);
  }
  return written;
}
