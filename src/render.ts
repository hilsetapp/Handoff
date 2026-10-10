import pc from 'picocolors';

/** Short human relative time, e.g. "12 min ago". */
export function timeAgo(iso: string, now = Date.now()): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return iso;
  const diffSec = Math.max(0, Math.round((now - then) / 1000));
  if (diffSec < 60) return 'just now';
  const min = Math.floor(diffSec / 60);
  if (min < 60) return `${min} min ago`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h} h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d} d ago`;
  return iso.slice(0, 10);
}

export const sym = {
  ok: pc.green('✔'),
  fail: pc.red('✖'),
  warn: pc.yellow('▲'),
  info: pc.cyan('ℹ'),
  bullet: pc.dim('·'),
};

export function header(text: string): string {
  return pc.bold(pc.cyan(text));
}

export function dim(text: string): string {
  return pc.dim(text);
}

export function kv(key: string, value: string): string {
  return `  ${pc.dim(key.padEnd(14))} ${value}`;
}
