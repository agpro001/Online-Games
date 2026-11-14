export type Route =
  | {
      page:
        | "home"
        | "library"
        | "favorites"
        | "recent"
        | "settings"
        | "diagnostics";
      series?: string;
    }
  | { page: "game" | "play"; id: string }
  | { page: "not-found" };
export function parseRoute(hash: string): Route {
  let path: string;
  try {
    path = decodeURIComponent(hash.replace(/^#\/?/, ""));
  } catch {
    return { page: "not-found" };
  }
  if (!path) return { page: "home" };
  if (
    ["library", "favorites", "recent", "settings", "diagnostics"].includes(path)
  )
    return { page: path as "library" };
  if (path === "gta") return { page: "library", series: "GTA" };
  if (path === "resident-evil")
    return { page: "library", series: "Resident Evil" };
  const m = /^(game|play)\/([a-z0-9-]+)$/.exec(path);
  return m
    ? { page: m[1] as "game" | "play", id: m[2] }
    : { page: "not-found" };
}
export class Router {
  private listener = () => this.onChange(parseRoute(location.hash));
  constructor(private onChange: (route: Route) => void) {
    window.addEventListener("hashchange", this.listener);
  }
  start() {
    this.listener();
  }
  destroy() {
    window.removeEventListener("hashchange", this.listener);
  }
}
