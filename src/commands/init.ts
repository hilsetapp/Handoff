import { existsSync } from 'node:fs';
import pc from 'picocolors';
import { ensureHandoffDir, isInitialized, loadConfig, paths, writeConfig } from '../config.js';
import { detectProjectName, detectTestCommand } from '../detect.js';
import { saveNotes } from '../notes.js';
import { dim, header, kv, sym } from '../render.js';
import { emptyNotes } from '../types.js';

export interface InitOptions {
  test?: string;
  force?: boolean;
}

const cmd = (s: string) => pc.cyan(s);

export function runInit(cwd: string, opts: InitOptions): number {
  const already = isInitialized(cwd);
  if (already && !opts.force) {
    console.log(`${sym.info} .handoff/ already exists. Nothing to do ${dim('(use --force to reset config)')}.`);
    return 0;
  }

  ensureHandoffDir(cwd);

  const config = loadConfig(cwd);
  const detected = detectTestCommand(cwd);
  if (opts.test !== undefined) {
    config.testCommand = opts.test || undefined;
    config.autoRunTests = Boolean(opts.test);
  } else if (!config.testCommand && detected) {
    config.testCommand = detected;
    config.autoRunTests = true;
  }
  writeConfig(cwd, config);

  if (!existsSync(paths(cwd).notes)) saveNotes(cwd, emptyNotes());

  console.log(`${sym.ok} ${header('handoff initialized')} in ${dim(paths(cwd).dir)}`);
  console.log(kv('project', detectProjectName(cwd)));
  console.log(
    kv(
      'tests',
      config.testCommand
        ? `${config.testCommand} ${dim('(auto-run on save — disable with --no-test)')}`
        : dim('not detected — set anytime: handoff init --test "npm test"'),
    ),
  );
  console.log('');
  console.log('Next:');
  console.log(`  ${cmd('handoff next "fix the auth bug"')}  ${dim('# record what you are about to do')}`);
  console.log(`  ${cmd('handoff save')}                      ${dim('# snapshot git state + notes → .handoff/HANDOFF.md')}`);
  console.log(`  ${cmd('handoff sync --with claude')}        ${dim('# teach your AI tools to read it')}`);
  console.log('');
  console.log(dim('Tip: commit .handoff/ so teammates and agents share the same context.'));
  return 0;
}
