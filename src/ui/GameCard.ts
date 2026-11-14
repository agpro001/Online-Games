import type { Game } from "../games/types";
import { store, stringArray } from "../storage/StorageManager";
import { el, link, button, message } from "./dom";
export function favoriteIds() {
  return store.get("favorites", [], stringArray);
}
export function gameCard(
  game: Game,
  onFavorite: () => void = () => {},
): HTMLElement {
  const article = el("article", "game-card");
  article.style.setProperty("--tone", game.tone);
  article.style.setProperty("--accent", game.accent);
  const art = link("", `#/game/${game.id}`, "card-art");
  art.setAttribute("aria-label", "Details: " + game.title);
  if (game.artwork) {
    const img = el("img");
    img.src = game.artwork;
    img.alt = "";
    img.loading = "lazy";
    art.append(img);
  }
  const badge = el(
    "span",
    "card-badge",
    game.status === "available"
      ? "LOCAL INPUT LAB"
      : game.status === "external"
        ? "EXTERNAL REFERENCE"
        : "NOT INSTALLED",
  );
  art.append(badge);
  const name = el(
    "span",
    "art-title",
    game.series === "GTA"
      ? "grand theft auto"
      : game.series === "Resident Evil"
        ? "resident evil"
        : "input laboratory",
  );
  const sub = el(
    "em",
    "",
    game.title
      .replace("Grand Theft Auto", "")
      .replace("Resident Evil", "")
      .replace(/^:\s*/, "") || "The original",
  );
  if (game.series === "Tools") sub.textContent = "Test your setup";
  name.append(sub);
  art.append(name);
  const info = el("div", "card-info");
  const text = el("div");
  text.append(
    link(game.title, `#/game/${game.id}`),
    el("p", "", game.year + " / " + game.series + " / " + game.performance),
  );
  const f = button(
    favoriteIds().includes(game.id) ? "♥" : "♡",
    () => {
      const current = favoriteIds();
      const next = current.includes(game.id)
        ? current.filter((id) => id !== game.id)
        : [...current, game.id];
      if (!store.set("favorites", next))
        message("Favorites cannot be persisted: storage is blocked.");
      f.textContent = next.includes(game.id) ? "♥" : "♡";
      f.setAttribute("aria-pressed", String(next.includes(game.id)));
      onFavorite();
    },
    "favorite",
  );
  f.setAttribute("aria-label", "Favorite " + game.title);
  f.setAttribute("aria-pressed", String(favoriteIds().includes(game.id)));
  info.append(text, f);
  article.append(
    art,
    info,
    el(
      "span",
      "availability",
      game.status === "available"
        ? "Authorized local diagnostic runtime"
        : game.status === "external"
          ? "Host-owned runtime · support unverified"
          : "Legal game files / authorized build required",
    ),
  );
  return article;
}
