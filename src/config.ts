import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { HandoffConfig } from './types.js';

export const HANDOFF_DIR = '.handoff';
export const HANDOFF_MD = 'HANDOFF.md';
export const STATE_JSON = 'state.json';
export const NOTES_JSON = 'notes.json';
export const CONFIG_JSON = 'config.json';
export const ARCHIVE_DIR = 'archive';

export function paths(cwd: string) {
  const dir = join(cwd, HANDOFF_DIR);
  return {
    dir,
    md: join(dir, HANDOFF_MD),
    state: join(dir, STATE_JSON),
    notes: join(dir, NOTES_JSON),
    config: join(dir, CONFIG_JSON),
    archive: join(dir, ARCHIVE_DIR),
  };
}

export const DEFAULT_CONFIG: HandoffConfig = {
  version: 1,
  autoRunTests: false,
  recentCommits: 5,
};

export function isInitialized(cwd: string): boolean {
  return existsSync(paths(cwd).dir);
}

export function ensureHandoffDir(cwd: string): void {
  mkdirSync(paths(cwd).dir, { recursive: true });
}

export function loadConfig(cwd: string): HandoffConfig {
  const p = paths(cwd).config;
  if (!existsSync(p)) return { ...DEFAULT_CONFIG };
  try {
    const raw = JSON.parse(readFileSync(p, 'utf8')) as Partial<HandoffConfig>;
    return { ...DEFAULT_CONFIG, ...raw, version: 1 };
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}

export function writeConfig(cwd: string, config: HandoffConfig): void {
  ensureHandoffDir(cwd);
  writeFileSync(paths(cwd).config, JSON.stringify(config, null, 2) + '\n', 'utf8');
}
