import { applySync, resolveTargets } from '../sync.js';
import { dim, kv, sym, header } from '../render.js';

export interface SyncOptions {
  with?: string;
}

export function runSync(cwd: string, opts: SyncOptions): number {
  const withList = (opts.with ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  let targets;
  try {
    targets = resolveTargets(withList);
  } catch (err) {
    console.error(`${sym.fail} ${(err as Error).message}`);
    return 1;
  }

  const written = applySync(cwd, targets);
  console.log(`${sym.ok} ${header('agents wired to your handoff context')}`);
  for (const f of written) console.log(kv('updated', f));
  console.log('');
  console.log(dim('Every session now starts with your live working state. Commit these files to share with the team.'));
  return 0;
}
