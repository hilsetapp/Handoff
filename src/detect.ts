import { readFileSync } from 'node:fs';
import { basename, join } from 'node:path';

/** Read package.json if present. */
function readPkg(cwd: string): Record<string, unknown> | null {
  try {
    return JSON.parse(readFileSync(join(cwd, 'package.json'), 'utf8')) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function detectProjectName(cwd: string): string {
  const pkg = readPkg(cwd);
  if (pkg && typeof pkg.name === 'string' && pkg.name.trim()) return pkg.name;
  return basename(cwd);
}

/**
 * Detect a meaningful test command from package.json scripts.
 * Returns undefined when the script is missing or is the npm default placeholder.
 */
export function detectTestCommand(cwd: string): string | undefined {
  const pkg = readPkg(cwd);
  if (!pkg) return undefined;
  const scripts = pkg.scripts as Record<string, string> | undefined;
  const test = scripts?.test;
  if (!test) return undefined;
  if (test.includes('no test specified')) return undefined;
  return 'npm test';
}

/** Detect package manager by lockfile. */
export function detectPackageManager(cwd: string): string | undefined {
  const candidates: [string, string][] = [
    ['pnpm-lock.yaml', 'pnpm'],
    ['yarn.lock', 'yarn'],
    ['bun.lockb', 'bun'],
    ['bun.lock', 'bun'],
    ['package-lock.json', 'npm'],
  ];
  for (const [file, pm] of candidates) {
    if (exists(join(cwd, file))) return pm;
  }
  return readPkg(cwd) ? 'npm' : undefined;
}

function exists(p: string): boolean {
  try {
    readFileSync(p);
    return true;
  } catch {
    return false;
  }
}
