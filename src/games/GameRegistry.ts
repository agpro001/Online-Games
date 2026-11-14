import raw from "../../data/games.json";
import type { Game } from "./types";
const trustedExternal = new Set(["https://www.lemon-web.net"]);
export function safeEntry(entry: string, mode: "iframe" | "external"): boolean {
  try {
    const url = new URL(entry, "https://hub.invalid");
    if (mode === "iframe")
      return (
        /^\/games\/[a-zA-Z0-9_/-]+\.html$/.test(entry) &&
        url.origin === "https://hub.invalid" &&
        url.pathname.startsWith("/games/") &&
        !url.pathname.includes("..") &&
        !url.search &&
        !url.hash
      );
    return (
      url.protocol === "https:" &&
      trustedExternal.has(url.origin) &&
      !url.username &&
      !url.password
    );
  } catch {
    return false;
  }
}
export function validateRegistry(value: unknown): Game[] {
  if (!Array.isArray(value)) throw new Error("Game registry must be an array");
  const ids = new Set<string>();
  for (const item of value) {
    const g = item as Game;
    if (
      !g ||
      typeof g.id !== "string" ||
      !/^[a-z0-9-]+$/.test(g.id) ||
      ids.has(g.id)
    )
      throw new Error("Invalid or duplicate game ID");
    ids.add(g.id);
    if (
      typeof g.title !== "string" ||
      typeof g.year !== "string" ||
      typeof g.runtime !== "string" ||
      typeof g.platform !== "string" ||
      ![true, false, null].includes(g.mobile) ||
      typeof g.fullscreen !== "boolean" ||
      typeof g.touchControls !== "boolean" ||
      typeof g.landscape !== "boolean" ||
      typeof g.bridge !== "boolean" ||
      !["Untested", "Playable", "Good", "Excellent"].includes(g.performance) ||
      !["unknown", "low", "medium", "high"].includes(g.performanceTier) ||
      !["external", "lab-json", "none"].includes(g.save) ||
      !/^#[a-fA-F0-9]{6}$/.test(g.tone) ||
      !/^#[a-fA-F0-9]{6}$/.test(g.accent) ||
      typeof g.description !== "string" ||
      !["GTA", "Resident Evil", "Tools"].includes(g.series) ||
      !["external", "iframe", "pending"].includes(g.launchMode) ||
      !["external", "available", "pending"].includes(g.status) ||
      !Array.isArray(g.tags) ||
      !g.tags.every((x) => typeof x === "string") ||
      !Array.isArray(g.aliases) ||
      !g.aliases.every((x) => typeof x === "string") ||
      typeof g.notice !== "string" ||
      typeof g.rights !== "string" ||
      !g.requirements ||
      typeof g.requirements.wasm !== "boolean" ||
      typeof g.requirements.webgl2 !== "boolean"
    )
      throw new Error("Invalid game metadata");
    if (
      g.entry !== null &&
      (typeof g.entry !== "string" ||
        !safeEntry(g.entry, g.launchMode === "iframe" ? "iframe" : "external"))
    )
      throw new Error("Untrusted entry URL");
    if (
      g.reference !== null &&
      (typeof g.reference !== "string" || !safeEntry(g.reference, "external"))
    )
      throw new Error("Untrusted reference URL");
    if (
      g.artwork !== null &&
      (typeof g.artwork !== "string" ||
        !/^\/assets\/[a-zA-Z0-9._/-]+$/.test(g.artwork) ||
        g.artwork.includes(".."))
    )
      throw new Error("Only project artwork allowed");
    if (
      g.status === "available" &&
      (g.launchMode !== "iframe" || !g.entry || !g.bridge || !g.rights)
    )
      throw new Error(
        "Available runtime requires local entry, bridge and rights",
      );
    if (
      g.launchMode === "pending" &&
      (g.entry !== null || g.status !== "pending")
    )
      throw new Error("Pending entry must not execute");
    if (g.launchMode === "external" && (g.status !== "external" || !g.entry))
      throw new Error("External mode requires explicit entry and status");
    if (g.controls !== null) {
      const c = g.controls;
      const keys = Object.values(c.keyboard ?? {});
      const pads = Object.values(c.gamepad ?? {});
      if (
        !c.joystick ||
        typeof c.joystick.enabled !== "boolean" ||
        !Number.isFinite(c.joystick.radius) ||
        c.joystick.radius < 20 ||
        c.joystick.radius > 120 ||
        !Number.isFinite(c.joystick.deadZone) ||
        c.joystick.deadZone < 0 ||
        c.joystick.deadZone >= 1 ||
        !c.axes ||
        !Object.values(c.axes).every((v) => typeof v === "string") ||
        !Array.isArray(c.buttons) ||
        !c.buttons.every(
          (v) => typeof v.label === "string" && typeof v.action === "string",
        ) ||
        !keys.every((v) => typeof v === "string") ||
        !pads.every((v) => typeof v === "string")
      )
        throw new Error("Invalid control mapping");
    }
    if (g.touchControls && (!g.controls || !g.bridge))
      throw new Error("Touch controls require mapping and bridge");
  }
  return value as Game[];
}
export const games = validateRegistry(raw);
export function findGame(id: string) {
  return games.find((g) => g.id === id);
}
export function matches(game: Game, query: string): boolean {
  const text = [game.title, game.series, ...game.aliases, ...game.tags]
    .join(" ")
    .toLowerCase();
  return query
    .toLowerCase()
    .trim()
    .split(/\s+/)
    .every((word) => {
      if (text.includes(word)) return true;
      if (word.length < 3) return false;
      return text.split(/[^a-z0-9]+/).some((token) => {
        if (token.length < word.length || token.length > word.length + 2)
          return false;
        let i = 0;
        for (const c of token) if (c === word[i]) i++;
        return i === word.length;
      });
    });
}
