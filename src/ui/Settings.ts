import type {
  PerformanceManager,
  Settings,
} from "../performance/PerformanceManager";
import { el, button, link, message, toggleFullscreen } from "./dom";
import type { AudioManager } from "../audio/AudioManager";
export function renderSettings(
  root: HTMLElement,
  manager: PerformanceManager,
  audio: AudioManager,
  replay: () => void,
) {
  root.append(
    el("div", "eyebrow muted", "MAKE IT YOURS"),
    el("h1", "", "Settings"),
    el(
      "p",
      "page-copy",
      "Shell preferences only. These do not change an external game’s graphics, audio or save system. Controls apply only to declared bridge-enabled runtimes.",
    ),
  );
  const form = el("form", "settings-grid");
  form.addEventListener("submit", (e) => e.preventDefault());
  const s = manager.settings;
  const group = (label: string, control: HTMLElement, help: string) => {
    const section = el("label", "setting");
    section.append(el("span", "", label), control, el("small", "", help));
    form.append(section);
  };
  const profile = el("select");
  for (const key of ["AUTO", "LOW", "MEDIUM", "HIGH", "ULTRA"]) {
    const o = el("option", "", key);
    o.value = key;
    profile.append(o);
  }
  profile.value = s.profile;
  group(
    "Performance profile",
    profile,
    "AUTO selects from coarse device hints. Current: " +
      manager.profile +
      ". ULTRA still caps DPR at 2.",
  );
  profile.addEventListener("change", () => {
    s.profile = profile.value as Settings["profile"];
    persist();
  });
  function persist() {
    if (!manager.save())
      message("Storage unavailable: preference applies for this session only.");
  }
  const range = (
    label: string,
    key: "master" | "ui" | "radius" | "buttonSize" | "opacity",
    min: number,
    max: number,
    step: number,
    help: string,
  ) => {
    const box = el("span", "range-wrap");
    const input = el("input");
    input.type = "range";
    input.min = String(min);
    input.max = String(max);
    input.step = String(step);
    input.value = String(s[key]);
    const value = el("output", "", String(s[key]));
    input.setAttribute("aria-label", label);
    input.addEventListener("input", () => {
      s[key] = Number(input.value);
      value.value = input.value;
      persist();
    });
    box.append(input, value);
    group(label, box, help);
  };
  const check = (label: string, key: "motion" | "controls", help: string) => {
    const input = el("input");
    input.type = "checkbox";
    input.checked = s[key];
    input.addEventListener("change", () => {
      s[key] = input.checked;
      persist();
    });
    group(label, input, help);
  };
  check(
    "Cinematic motion",
    "motion",
    "Respects OS reduced motion; disables intro auto-entry and atmosphere when off.",
  );
  check(
    "Show virtual controls",
    "controls",
    "Applied when the next compatible local session starts. No overlay is injected into external hosts.",
  );
  range(
    "Master audio",
    "master",
    0,
    1,
    0.05,
    "Original synthesized shell UI sound only. No music/ambience assets are installed.",
  );
  range(
    "UI audio",
    "ui",
    0,
    1,
    0.05,
    "Sound starts only after a user presses Test sound.",
  );
  range(
    "Joystick radius",
    "radius",
    40,
    100,
    1,
    "Pixels, applied at next runtime launch.",
  );
  range("Button size", "buttonSize", 44, 90, 1, "Pixels, minimum 44.");
  range(
    "Control opacity",
    "opacity",
    0.25,
    1,
    0.05,
    "Applied to compatible runtime overlay.",
  );
  const side = el("select");
  for (const v of ["left", "right"]) {
    const option = el("option", "", v);
    side.append(option);
  }
  side.value = s.side;
  side.addEventListener("change", () => {
    s.side = side.value as "left" | "right";
    persist();
  });
  group(
    "Joystick position",
    side,
    "Mirrors action buttons; takes effect next launch.",
  );
  root.append(form);
  const actions = el("div", "page-actions");
  actions.append(
    button("Test UI sound", () => {
      void audio.click();
    }),
    button("Replay cinematic intro", replay),
    link("Open diagnostics", "#/diagnostics"),
    button("Fullscreen hub", () => {
      void toggleFullscreen(document.documentElement).then(message);
    }),
    button("Clear shell offline cache", () => {
      void clearCache();
    }),
  );
  root.append(
    actions,
    el(
      "p",
      "fine",
      "Runtime saves and game data are not cleared. External audio and saves remain controlled by their host.",
    ),
  );
}
async function clearCache() {
  try {
    if (!("caches" in window)) throw new Error("Cache API unavailable");
    for (const name of await caches.keys())
      if (name.startsWith("afterhours-shell-")) await caches.delete(name);
    message(
      "Shell caches cleared. Reconnect and reload to restore offline shell files. Game saves untouched.",
    );
  } catch {
    message("Could not clear shell cache in this browser.");
  }
}
