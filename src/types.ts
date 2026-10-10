/** Note categories stored between sessions. */
export type NoteKind = 'next' | 'decision' | 'failed' | 'blocker';

export const NOTE_KINDS: NoteKind[] = ['next', 'decision', 'failed', 'blocker'];

export interface Note {
  text: string;
  /** ISO timestamp of when the note was added. */
  ts: string;
  done?: boolean;
}

export interface NotesStore {
  next: Note[];
  decisions: Note[];
  failed: Note[];
  blockers: Note[];
}

export function emptyNotes(): NotesStore {
  return { next: [], decisions: [], failed: [], blockers: [] };
}

export interface GitFileChange {
  path: string;
  /** Human readable status: modified | added | deleted | renamed | untracked | ... */
  status: string;
  staged: boolean;
}

export interface RecentCommit {
  hash: string;
  subject: string;
}

export interface GitState {
  isRepo: boolean;
  branch?: string;
  detached?: boolean;
  /** short HEAD hash */
  commit?: string;
  upstream?: string;
  ahead?: number;
  behind?: number;
  recentCommits: RecentCommit[];
  changes: GitFileChange[];
  /** raw `git diff --shortstat HEAD` output, if any */
  shortstat?: string;
}

export interface TestResult {
  command: string;
  ok: boolean;
  exitCode: number | null;
  ranAt: string;
  /** last few lines of combined output */
  tail?: string;
}

export interface HandoffConfig {
  version: 1;
  /** Command used to run the test suite, if any. */
  testCommand?: string;
  /** Run tests automatically on every `handoff save`. */
  autoRunTests: boolean;
  /** How many recent commits to embed in the snapshot. */
  recentCommits: number;
}

export interface Environment {
  node: string;
  pm?: string;
  os: string;
}

export interface Snapshot {
  tool: string;
  generatedAt: string;
  project: string;
  /** free-form one-liner supplied via `handoff save -m` */
  summary?: string;
  git: GitState;
  tests?: TestResult | null;
  notes: NotesStore;
  env: Environment;
  /** hash of HEAD+changes at snapshot time, used for staleness detection */
  fingerprint: string;
}
