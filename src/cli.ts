#!/usr/bin/env node
import { Command } from 'commander';
import { createRequire } from 'node:module';
import { runArchive } from './commands/archive.js';
import { runDone, runClearDone, runNote } from './commands/note.js';
import { runInit } from './commands/init.js';
import { runSave } from './commands/save.js';
import { runShow } from './commands/show.js';
import { runSync } from './commands/sync.js';
import type { NoteKind } from './types.js';

const require = createRequire(import.meta.url);
const { version } = require('../package.json') as { version: string };

const program = new Command();

program
  .name('handoff')
  .description(
    'Portable session context for AI coding agents.\nSave your working state once — every agent (Claude Code, Codex, Cursor, Copilot, Gemini CLI) picks it up instantly.',
  )
  .version(version);

program
  .command('init')
  .description('create .handoff/ with a smart default config (auto-detects your test command)')
  .option('--test <command>', 'test command to run on save; empty string disables')
  .option('--force', 're-write the config even if .handoff/ exists')
  .action((opts) => exit(runInit(process.cwd(), opts)));

program
  .command('save')
  .description('snapshot git state + notes + test status into .handoff/HANDOFF.md')
  .option('-m, --message <text>', 'one-line focus for this snapshot')
  .option('--test', 'run the test command even if autoRunTests is off')
  .option('--no-test', 'skip tests for this save')
  .action((opts) => exit(runSave(process.cwd(), { ...opts, version })));

const note = program.command('note').description('record a note without taking a full snapshot');
note
  .argument('<kind>', `one of: next | decision | failed | blocker`)
  .argument('<text...>', 'note text')
  .action((kind: NoteKind, text: string[]) => exit(runNote(process.cwd(), kind, text.join(' '))));

program
  .command('next')
  .description('shortcut: record a next step ("what I am about to do")')
  .argument('<text...>')
  .action((text: string[]) => exit(runNote(process.cwd(), 'next', text.join(' '))));

program
  .command('decision')
  .description('shortcut: record a decision and its reason')
  .argument('<text...>')
  .action((text: string[]) => exit(runNote(process.cwd(), 'decision', text.join(' '))));

program
  .command('failed')
  .description('shortcut: record a failed approach so no agent retries it')
  .argument('<text...>')
  .action((text: string[]) => exit(runNote(process.cwd(), 'failed', text.join(' '))));

program
  .command('blocker')
  .description('shortcut: record a blocker')
  .argument('<text...>')
  .action((text: string[]) => exit(runNote(process.cwd(), 'blocker', text.join(' '))));

program
  .command('done')
  .description('mark next-step items as done (numbers from `handoff show`)')
  .argument('<indexes...>')
  .action((indexes: string[]) => exit(runDone(process.cwd(), indexes)));

program
  .command('clear')
  .description('remove completed next-step items')
  .action(() => exit(runClearDone(process.cwd())));

program
  .command('show')
  .description('print the current handoff status (default command)')
  .option('--json', 'print the raw snapshot JSON')
  .action((opts) => exit(runShow(process.cwd(), opts)));

program
  .command('sync')
  .description('wire AI tools to your context: writes managed blocks into AGENTS.md / CLAUDE.md / etc.')
  .option('--with <tools>', 'comma-separated extra targets: claude,cursor,copilot,gemini')
  .action((opts) => exit(runSync(process.cwd(), opts)));

program
  .command('archive')
  .description('end the session: archive HANDOFF.md and reset the notes store')
  .action(() => exit(runArchive(process.cwd())));

// default: bare `handoff` behaves like `handoff show`
program.action(() => exit(runShow(process.cwd(), {})));

program.parseAsync(process.argv).catch((err) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});

function exit(code: number): void {
  process.exitCode = code;
}
