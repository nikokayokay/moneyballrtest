export interface DataVersion<T> {
  version: string;
  timestamp: string;
  data: T;
  note?: string;
}

const versions = new Map<string, DataVersion<unknown>[]>();

export function storeDataVersion<T>(key: string, data: T, note?: string) {
  const version: DataVersion<T> = { version: `${key}-${Date.now()}`, timestamp: new Date().toISOString(), data, note };
  versions.set(key, [...(versions.get(key) || []), version].slice(-30));
  return version;
}

export function listDataVersions<T>(key: string) {
  return (versions.get(key) || []) as DataVersion<T>[];
}

export function rollbackDataVersion<T>(key: string, version: string) {
  return (listDataVersions<T>(key).find((entry) => entry.version === version) || null);
}
