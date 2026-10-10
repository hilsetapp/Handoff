import { existsSync, mkdirSync, renameSync } from 'node:fs';
import { join } from 'node:path';
import { paths } from '../config.js';
import { resetNotes } from '../notes.js';
import { dim, sym } from '../render.js';

/** End the session: archive the current HANDOFF.md and reset the notes store. */
export function runArchive(cwd: string): number {
  const p = paths(cwd);
  if (!existsSync(p.md)) {
    console.log(`${sym.warn} nothing to archive — no snapshot yet.`);
    return 1;
  }
  mkdirSync(p.archive, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:T]/g, '-').slice(0, 19);
  const dest = join(p.archive, `${stamp}.md`);
  renameSync(p.md, dest);
  resetNotes(cwd);
  console.log(`${sym.ok} session archived → ${dest.replace(`${cwd}/`, '')}`);
  console.log(dim('notes store reset. Start a new session with: handoff next "..."'));
  return 0;
}
