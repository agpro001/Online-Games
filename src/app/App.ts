import { Router, type Route } from "./Router";
import { games, findGame, matches } from "../games/GameRegistry";
import { gameCard, favoriteIds } from "../ui/GameCard";
import { renderDetail, externalLaunch } from "../ui/GameDetail";
import { el, button, link, externalLink } from "../ui/dom";
import { detectDevice, compatibility } from "../performance/DeviceDetector";
import { PerformanceManager } from "../performance/PerformanceManager";
import { store, recentValid } from "../storage/StorageManager";
import { AudioManager } from "../audio/AudioManager";
import { Intro } from "../cinematic/Intro";
import { GameLauncher } from "../games/GameLauncher";
import { renderSettings } from "../ui/Settings";
import type { Game } from "../games/types";
export class App {
  private device = detectDevice();
  private quality = new PerformanceManager(this.device);
  private audio = new AudioManager(() => this.quality.settings);
  private intro = new Intro();
  private launcher: GameLauncher | null = null;
  private cleanup: (() => void) | null = null;
  private router: Router;
  private generation = 0;
  private root = document.getElementById("view")!;
  private devTimer = 0;
  constructor() {
    this.router = new Router((route) => {
      void this.navigate(route);
    });
    this.bind();
    this.router.start();
    this.intro.auto(this.quality.settings.motion);
  }
  private bind() {
    document.querySelector(".skip-link")?.addEventListener("click", (e) => {
      e.preventDefault();
      this.root.focus();
    });
    document
      .getElementById("cinema")
      ?.addEventListener("click", () => this.intro.show());
    const network = document.getElementById("network")!;
    const update = () => {
      network.hidden = navigator.onLine;
    };
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    update();
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) this.audio.suspend();
    });
    if (new URLSearchParams(location.search).get("dev") === "true") {
      const panel = el("pre", "dev-panel");
      document.body.append(panel);
      this.devTimer = window.setInterval(() => {
        panel.textContent = `DEV / local only\nSession: ${this.launcher?.activeState ?? "IDLE"}\nDPR cap: ${this.quality.dpr}\nProfile: ${this.quality.profile}\nNetwork: ${navigator.onLine ? "online" : "offline"}\nRenderer: ${this.device.gpu}\nMemory hint: ${this.device.memory ?? "unexposed"} GiB`;
      }, 500);
    }
  }
  private async navigate(route: Route) {
    const generation = ++this.generation;
    this.launcher?.destroy();
    this.launcher = null;
    this.cleanup?.();
    this.cleanup = null;
    this.root.replaceChildren();
    this.root.className = "page-view";
    document.querySelectorAll("header nav a").forEach((a) => {
      const active = (a as HTMLAnchorElement).hash === location.hash;
      if (active) a.setAttribute("aria-current", "page");
      else a.removeAttribute("aria-current");
    });
    window.scrollTo({ top: 0, behavior: "instant" });
    document.title =
      "AFTERHOURS — " +
      (route.page === "game" || route.page === "play"
        ? (findGame(route.id)?.title ?? "Not found")
        : route.page);
    this.root.focus({ preventScroll: true });
    try {
      if (route.page === "home") {
        this.home();
        return;
      }
      if (["library", "favorites", "recent"].includes(route.page)) {
        this.library(route as Extract<Route, { page: "library" }>);
        return;
      }
      if (route.page === "settings") {
        renderSettings(this.root, this.quality, this.audio, () =>
          this.intro.show(),
        );
        return;
      }
      if (route.page === "diagnostics") {
        const { renderDiagnostics } =
          await import("../diagnostics/Diagnostics");
        if (generation === this.generation)
          this.cleanup = renderDiagnostics(this.root);
        return;
      }
      if (route.page === "game" || route.page === "play") {
        const g = findGame(route.id);
        if (!g) {
          this.notFound();
          return;
        }
        if (route.page === "game") {
          renderDetail(this.root, g, this.device);
          return;
        }
        if (g.status === "available" && g.launchMode === "iframe") {
          const compatible = compatibility(g, this.device);
          if (compatible.status === "UNSUPPORTED") {
            this.root.append(
              el("h1", "", "Unsupported browser"),
              el("p", "", compatible.reason),
              link("Back", "#/game/" + g.id),
            );
            return;
          }
          this.root.className = "page-view player-view";
          this.launcher = new GameLauncher(g, this.root, this.quality);
          await this.launcher.start();
          return;
        }
        this.launchOptions(g);
        return;
      }
      this.notFound();
    } catch (error) {
      console.error("[App]", error);
      this.root.replaceChildren(
        el("h1", "", "This view could not be opened"),
        el(
          "p",
          "page-copy",
          "Try returning to the library. No game files were changed.",
        ),
        link("Back to library", "#/library", "primary"),
      );
    }
  }
  private home() {
    const hero = el("section", "hero");
    const art = el("div", "hero-art");
    const shade = el("div", "hero-shade");
    const content = el("div", "hero-content");
    content.append(
      el("div", "eyebrow", "AFTERHOURS / CURATED CLASSICS"),
      el("div", "feature-label", "THE AFTERHOURS SPOTLIGHT   01 / 02"),
    );
    const h = el("h1");
    h.append(
      document.createTextNode("Welcome back"),
      el("br"),
      document.createTextNode("to "),
      el("em", "", "Vice City."),
    );
    content.append(
      h,
      el(
        "p",
        "",
        "Neon nights. Familiar streets. One more ride.\nA new entrance. The original game, untouched.",
      ),
    );
    const actions = el("div", "hero-buttons");
    actions.append(
      link("Explore Vice City ↗", "#/game/vc", "primary"),
      button("▷ Watch the intro", () => this.intro.show(), "watch"),
    );
    content.append(
      actions,
      el(
        "div",
        "hero-meta",
        "EXTERNAL HOST  •  GAMEPLAY UNTESTED  •  ORIGINAL FILES UNCHANGED",
      ),
    );
    const bottom = el("div", "hero-bottom");
    bottom.append(
      el("span", "", "CURATED CLASSICS. NEW PERSPECTIVE."),
      link("EXPLORE THE COLLECTION ↓", "#/library"),
    );
    hero.append(art, shade, content, bottom);
    this.root.append(hero);
    const featured = el("section", "home-section");
    featured.append(
      el("div", "eyebrow muted", "YOUR NEXT LATE NIGHT STARTS HERE"),
      el("h2", "", "Choose your world."),
    );
    const filters = el("div", "home-links");
    filters.append(
      link("Grand Theft Auto ↗", "#/gta"),
      link("Resident Evil ↗", "#/resident-evil"),
      link("Full library ↗", "#/library"),
    );
    featured.append(filters);
    const grid = el("div", "grid");
    games.slice(0, 3).forEach((g) => grid.append(gameCard(g)));
    featured.append(grid);
    this.root.append(featured);
    this.homeRow("GTA", games.filter((g) => g.series === "GTA").slice(0, 3));
    this.homeRow(
      "RESIDENT EVIL",
      games.filter((g) => g.series === "Resident Evil").slice(0, 3),
    );
    const recent = store.get("recent", [], recentValid);
    this.homeRow(
      "RECENT SESSIONS / EXTERNAL LAUNCH ATTEMPTS",
      recent
        .map((r) => findGame(r.id))
        .filter((g): g is Game => !!g)
        .slice(0, 3),
      "No sessions yet. External launches are recorded as attempts, not verified gameplay.",
    );
    this.homeRow(
      "FAVORITES",
      games.filter((g) => favoriteIds().includes(g.id)).slice(0, 3),
      "Use the heart on a game card to save it locally.",
    );
    const support = el("section", "support-section");
    support.append(
      el("div", "eyebrow muted", "YOUR SCREEN. YOUR SETUP."),
      el("h2", "", "A better way in."),
      el(
        "p",
        "page-copy",
        "The hub adapts to desktop, tablet and phone. Game compatibility is assessed separately; no commercial mobile runtime has been verified.",
      ),
      link("Check this device", "#/diagnostics", "primary"),
      link(
        "Test joystick and controls",
        "#/game/input-lab",
        "button-link secondary",
      ),
    );
    this.root.append(support);
  }
  private homeRow(title: string, list: Game[], empty = "") {
    const section = el("section", "home-section compact");
    section.append(el("h2", "eyebrow muted", title));
    if (list.length) {
      const grid = el("div", "grid");
      list.forEach((g) => grid.append(gameCard(g)));
      section.append(grid);
    } else section.append(el("p", "page-copy", empty));
    this.root.append(section);
  }
  private library(route: { page: string; series?: string }) {
    const title =
      route.page === "favorites"
        ? "Your favorites."
        : route.page === "recent"
          ? "Recent sessions."
          : (route.series ?? "The collection.");
    this.root.append(
      el("div", "eyebrow muted", "CURATED CLASSICS / HONEST AVAILABILITY"),
      el("h1", "", title),
    );
    const search = el("input", "search");
    search.type = "search";
    search.placeholder = "Search title, series, aliases or tags…";
    search.setAttribute("aria-label", "Search games");
    const toolbar = el("div", "library-toolbar");
    const filter = el("select");
    filter.setAttribute("aria-label", "Game filter");
    for (const [value, label] of [
      ["all", "All games"],
      ["GTA", "GTA"],
      ["Resident Evil", "Resident Evil"],
      ["action", "Action"],
      ["open world", "Open world"],
      ["horror", "Horror"],
      ["3d", "3D"],
      ["webgl", "WebGL"],
      ["wasm", "WASM"],
      ["mobile", "Declared mobile support"],
      ["available", "Available local runtime"],
    ]) {
      const o = el("option", "", label);
      o.value = value;
      filter.append(o);
    }
    filter.value = route.series ?? "all";
    toolbar.append(search, filter);
    const count = el("p", "fine");
    count.setAttribute("aria-live", "polite");
    const grid = el("div", "grid");
    const render = () => {
      const recents = store.get("recent", [], recentValid);
      const favorites = favoriteIds();
      let list = games.filter(
        (g) =>
          matches(g, search.value) &&
          (filter.value === "all" ||
            g.series === filter.value ||
            g.tags.includes(filter.value)) &&
          (route.page !== "favorites" || favorites.includes(g.id)) &&
          (route.page !== "recent" || recents.some((r) => r.id === g.id)),
      );
      if (route.page === "recent")
        list = [...list].sort(
          (a, b) =>
            recents.findIndex((r) => r.id === a.id) -
            recents.findIndex((r) => r.id === b.id),
        );
      grid.replaceChildren();
      for (const g of list) {
        const card = gameCard(g, () => {
          if (route.page === "favorites") render();
        });
        if (route.page === "recent") {
          const r = recents.find((r) => r.id === g.id)!;
          card.append(
            el(
              "p",
              "fine",
              `${r.kind === "external-attempt" ? "External launch attempt" : "Local session"} · ${new Date(r.timestamp).toLocaleString()} · ${r.duration}s`,
            ),
          );
        }
        grid.append(card);
      }
      count.textContent =
        list.length + " entries · No commercial game files bundled";
      if (!list.length)
        grid.append(
          el(
            "p",
            "page-copy",
            "No matching entries. Try another filter or add favorites.",
          ),
        );
    };
    search.addEventListener("input", render);
    filter.addEventListener("change", render);
    this.root.append(toolbar, count, grid);
    render();
  }
  private launchOptions(g: Game) {
    this.root.append(
      link("← Game details", "#/game/" + g.id, "back-link"),
      el("h1", "", g.title),
      el("p", "notice", g.notice),
    );
    if (g.status === "external" && g.entry) {
      this.root.append(
        el(
          "p",
          "page-copy",
          "This opens a third-party host in a new tab. This hub cannot confirm its game readiness, add input controls, manage its audio, access saves or guarantee mobile performance.",
        ),
        externalLaunch(g),
      );
    } else {
      this.root.append(
        el("h2", "", "Not installed"),
        el(
          "p",
          "page-copy",
          "This entry has no authorized embeddable build. Required: legal browser game files, hosting permission, declared capabilities and an opt-in integration bridge.",
        ),
      );
      if (g.reference)
        this.root.append(
          externalLink("Inspect external reference ↗", g.reference, "primary"),
        );
    }
    this.root.append(
      link(
        "Test local input infrastructure",
        "#/game/input-lab",
        "button-link secondary",
      ),
    );
  }
  private notFound() {
    this.root.append(
      el("h1", "", "That page is off the map."),
      link("Return to the library", "#/library", "primary"),
    );
  }
  destroy() {
    clearInterval(this.devTimer);
    this.router.destroy();
    this.launcher?.destroy();
    this.cleanup?.();
    this.intro.close();
    this.audio.destroy();
  }
}
