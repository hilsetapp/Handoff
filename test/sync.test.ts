import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { applySync, resolveTargets, SYNC_BLOCK, upsertManagedBlock } from '../src/sync.js';

describe('upsertManagedBlock', () => {
  it('creates content for an empty file', () => {
    const out = upsertManagedBlock('', SYNC_BLOCK);
    expect(out).toContain('<!-- handoff:start -->');
    expect(out).toContain('<!-- handoff:end -->');
  });

  it('appends to existing content without touching it', () => {
    const existing = '# My project rules\n\nAlways write tests.\n';
    const out = upsertManagedBlock(existing, SYNC_BLOCK);
    expect(out.startsWith('# My project rules')).toBe(true);
    expect(out).toContain('Always write tests.');
    expect(out).toContain('.handoff/HANDOFF.md');
  });

  it('is idempotent — re-running replaces the block instead of duplicating', () => {
    const once = upsertManagedBlock('# Rules\n', SYNC_BLOCK);
    const twice = upsertManagedBlock(once, SYNC_BLOCK);
    expect(twice).toBe(once);
    expect(twice.match(/handoff:start/g)).toHaveLength(1);
  });

  it('preserves content after the managed block', () => {
    const existing = '# Rules\n\n<!-- handoff:start -->\nold junk\n<!-- handoff:end -->\n\n## My own section\n';
    const out = upsertManagedBlock(existing, SYNC_BLOCK);
    expect(out).not.toContain('old junk');
    expect(out).toContain('## My own section');
  });
});

describe('resolveTargets', () => {
  it('always includes AGENTS.md', () => {
    const targets = resolveTargets([]);
    expect(targets.map((t) => t.file)).toEqual(['AGENTS.md']);
  });

  it('adds requested tools and rejects unknown ones', () => {
    expect(resolveTargets(['claude', 'cursor']).map((t) => t.id)).toEqual(['agents', 'claude', 'cursor']);
    expect(() => resolveTargets(['vim'])).toThrow(/unknown tool/);
  });
});

describe('applySync', () => {
  let dir: string;
  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'handoff-sync-'));
  });
  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it('creates AGENTS.md when missing', () => {
    applySync(dir, resolveTargets([]));
    const content = readFileSync(join(dir, 'AGENTS.md'), 'utf8');
    expect(content).toContain('.handoff/HANDOFF.md');
  });

  it('writes tool-specific files, creating parent directories', () => {
    const written = applySync(dir, resolveTargets(['copilot', 'cursor']));
    expect(written).toContain(join('.github', 'copilot-instructions.md'));
    expect(written).toContain(join('.cursor', 'rules', 'handoff.mdc'));
    const cursorRule = readFileSync(join(dir, '.cursor', 'rules', 'handoff.mdc'), 'utf8');
    expect(cursorRule).toContain('alwaysApply: true');
  });

  it('never destroys existing CLAUDE.md content', () => {
    writeFileSync(join(dir, 'CLAUDE.md'), '# Claude notes\n\nBe concise.\n', 'utf8');
    applySync(dir, resolveTargets(['claude']));
    const content = readFileSync(join(dir, 'CLAUDE.md'), 'utf8');
    expect(content).toContain('Be concise.');
    expect(content).toContain('<!-- handoff:start -->');
  });
});
