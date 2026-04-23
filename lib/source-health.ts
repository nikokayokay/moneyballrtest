export interface SourceHealthEntry {
  source: string;
  ok: boolean;
  latencyMs: number;
  checkedAt: string;
}

const health = new Map<string, SourceHealthEntry>();

export async function checkSourceHealth(source: string, url: string) {
  const started = performance.now();
  try {
    const response = await fetch(url, { method: "GET" });
    const entry = { source, ok: response.ok, latencyMs: Math.round(performance.now() - started), checkedAt: new Date().toISOString() };
    health.set(source, entry);
    return entry;
  } catch {
    const entry = { source, ok: false, latencyMs: Math.round(performance.now() - started), checkedAt: new Date().toISOString() };
    health.set(source, entry);
    return entry;
  }
}

export function sourceHealthSnapshot() {
  return Array.from(health.values());
}

export function healthiestSource(preferred: string[]) {
  return preferred.find((source) => health.get(source)?.ok) || preferred[0];
}
