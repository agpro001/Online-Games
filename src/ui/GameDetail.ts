import type { Game } from "../games/types";
import {
  compatibility,
  type Capabilities,
} from "../performance/DeviceDetector";
import { recordSession } from "../storage/StorageManager";
import {
  el,
  link,
  externalLink,
  button,
  message,
  toggleFullscreen,
} from "./dom";
export function externalLaunch(game: Game): HTMLAnchorElement {
  const a = externalLink(
    "Open original host ↗",
    game.entry ?? game.reference ?? "",
    "primary",
  );
  a.addEventListener("click", () =>
    recordSession({
      id: game.id,
      timestamp: Date.now(),
      duration: 0,
      kind: "external-attempt",
    }),
  );
  return a;
}
export function renderDetail(root: HTMLElement, g: Game, c: Capabilities) {
  root.append(link("← Back to library", "#/library", "back-link"));
  const hero = el("section", "detail-hero");
  hero.style.setProperty("--tone", g.tone);
  if (g.artwork) {
    const img = el("img");
    img.src = g.artwork;
    img.alt =
      "Original generated atmospheric city artwork, not a game screenshot";
    hero.append(img);
  }
  const content = el("div", "detail-content");
  content.append(
    el("div", "eyebrow", g.series + " / " + g.year),
    el("h1", "", g.title),
    el("p", "", g.description),
  );
  const actions = el("div", "page-actions");
  if (g.status === "available")
    actions.append(link("Play input lab", `#/play/${g.id}`, "primary"));
  else if (g.status === "external")
    actions.append(link("Launch options", `#/play/${g.id}`, "primary"));
  else {
    const unavailable = el(
      "span",
      "unavailable-label",
      "NOT INSTALLED · AUTHORIZED BUILD REQUIRED",
    );
    actions.append(unavailable);
    if (g.reference)
      actions.append(
        externalLink("Research reference / catalog ↗", g.reference),
      );
  }
  if (g.status === "available")
    actions.append(
      button("Fullscreen detail", () => {
        void toggleFullscreen(root).then(message);
      }),
    );
  content.append(actions);
  hero.append(content);
  root.append(hero);
  const compat = compatibility(g, c);
  const table = el("div", "detail-grid");
  for (const [name, value] of [
    ["RUNTIME", g.runtime],
    [
      "AVAILABILITY",
      g.status === "available"
        ? "Local input laboratory only"
        : g.status === "external"
          ? "External reference"
          : "Pending authorized files",
    ],
    ["SUPPORTED DEVICES", g.platform],
    ["API COMPATIBILITY", compat.status + " — " + compat.reason],
    ["PERFORMANCE", g.performance + " · no game FPS rating assigned"],
    [
      "CONTROLS",
      g.controls
        ? Object.entries(g.controls.keyboard)
            .map(([k, v]) => k + " → " + v)
            .join(", ")
        : "External host controls only / no adapter installed",
    ],
    [
      "ORIENTATION",
      g.landscape ? "Landscape recommended" : "Portrait and landscape",
    ],
    [
      "SAVES",
      g.save === "lab-json"
        ? "Position-only local lab JSON, export/import supported"
        : g.save === "external"
          ? "Managed by external host; not imported by this hub"
          : "No installed save integration",
    ],
    ["RIGHTS / FILES", g.rights],
  ]) {
    const item = el("section");
    item.append(el("h2", "eyebrow muted", name), el("p", "", value));
    table.append(item);
  }
  root.append(el("p", "notice", g.notice), table);
}
