import { store } from "../storage/StorageManager";
import type { Capabilities } from "./DeviceDetector";
export const profiles = {
  LOW: { maxDpr: 1, particles: false, blur: false },
  MEDIUM: { maxDpr: 1.5, particles: true, blur: false },
  HIGH: { maxDpr: 2, particles: true, blur: true },
  ULTRA: { maxDpr: 2, particles: true, blur: true },
};
export type Profile = keyof typeof profiles;
export interface Settings {
  profile: Profile | "AUTO";
  motion: boolean;
  master: number;
  ui: number;
  controls: boolean;
  radius: number;
  buttonSize: number;
  opacity: number;
  side: "left" | "right";
}
export const defaultSettings: Settings = {
  profile: "AUTO",
  motion: !matchMedia("(prefers-reduced-motion: reduce)").matches,
  master: 0.35,
  ui: 0.25,
  controls: true,
  radius: 65,
  buttonSize: 54,
  opacity: 0.8,
  side: "left",
};
export function settingsValid(x: unknown): x is Settings {
  if (!x || typeof x !== "object") return false;
  const s = x as Settings;
  return (
    ["AUTO", ...Object.keys(profiles)].includes(s.profile) &&
    typeof s.motion === "boolean" &&
    typeof s.controls === "boolean" &&
    ["left", "right"].includes(s.side) &&
    [
      [s.master, 0, 1],
      [s.ui, 0, 1],
      [s.radius, 40, 100],
      [s.buttonSize, 44, 90],
      [s.opacity, 0.25, 1],
    ].every(([v, min, max]) => Number.isFinite(v) && v >= min && v <= max)
  );
}
export class PerformanceManager {
  settings = store.get("settings", defaultSettings, settingsValid);
  constructor(readonly device: Capabilities) {
    this.apply();
  }
  get profile(): Profile {
    if (this.settings.profile !== "AUTO") return this.settings.profile;
    return (this.device.memory !== null && this.device.memory <= 4) ||
      this.device.cores <= 4
      ? "LOW"
      : this.device.touch
        ? "MEDIUM"
        : "HIGH";
  }
  get dpr() {
    return Math.min(devicePixelRatio || 1, profiles[this.profile].maxDpr);
  }
  apply() {
    document.documentElement.dataset.profile = this.profile;
    document.documentElement.classList.toggle(
      "motion-off",
      !this.settings.motion,
    );
    document.documentElement.style.setProperty(
      "--control-opacity",
      String(this.settings.opacity),
    );
    document.documentElement.style.setProperty(
      "--button-size",
      this.settings.buttonSize + "px",
    );
    document.documentElement.style.setProperty(
      "--joystick-radius",
      this.settings.radius + "px",
    );
  }
  save() {
    const ok = store.set("settings", this.settings);
    this.apply();
    return ok;
  }
}
