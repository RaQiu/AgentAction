export function createId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function summarize(text: string, max = 160): string {
  if (text.length <= max) {
    return text;
  }

  return `${text.slice(0, max - 1)}…`;
}
