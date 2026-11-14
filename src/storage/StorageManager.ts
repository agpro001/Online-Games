export class StorageManager {
  constructor(
    private backend: Pick<
      Storage,
      "getItem" | "setItem" | "removeItem"
    > | null = (() => {
      try {
        return localStorage;
      } catch {
        return null;
      }
    })(),
  ) {}
  get<T>(key: string, fallback: T, valid: (x: unknown) => x is T): T {
    try {
      const s = this.backend?.getItem("afterhours:" + key);
      if (!s) return fallback;
      const v: unknown = JSON.parse(s);
      return valid(v) ? v : fallback;
    } catch {
      return fallback;
    }
  }
  set(key: string, value: unknown): boolean {
    try {
      if (!this.backend) return false;
      this.backend.setItem("afterhours:" + key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  }
  remove(key: string) {
    try {
      this.backend?.removeItem("afterhours:" + key);
    } catch {
      /* Storage may be unavailable. */
    }
  }
}
export const store = new StorageManager();
export const stringArray = (x: unknown): x is string[] =>
  Array.isArray(x) && x.every((v) => typeof v === "string");
export interface Recent {
  id: string;
  timestamp: number;
  duration: number;
  kind: "local-session" | "external-attempt";
}
export const recentValid = (x: unknown): x is Recent[] =>
  Array.isArray(x) &&
  x.length <= 30 &&
  x.every(
    (v) =>
      v &&
      typeof v.id === "string" &&
      Number.isFinite(v.timestamp) &&
      Number.isFinite(v.duration) &&
      ["local-session", "external-attempt"].includes(v.kind),
  );
export function recordSession(record: Recent) {
  const recent = store
    .get("recent", [], recentValid)
    .filter((x) => x.id !== record.id);
  store.set("recent", [record, ...recent].slice(0, 20));
}
