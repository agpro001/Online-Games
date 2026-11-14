import { describe, it, expect, vi, beforeAll, afterEach } from "vitest";
import {
  games,
  validateRegistry,
  safeEntry,
  matches,
} from "../src/games/GameRegistry";
import { parseRoute } from "../src/app/Router";
import { InputAdapter } from "../src/input/InputAdapter";
import { joystickVector, VirtualJoystick } from "../src/input/VirtualJoystick";
import {
  StorageManager,
  stringArray,
  recentValid,
} from "../src/storage/StorageManager";
import { GameSession } from "../src/games/GameSession";
import { GameBridge } from "../src/games/GameBridge";
import {
  compatibility,
  type Capabilities,
} from "../src/performance/DeviceDetector";
import { toggleFullscreen } from "../src/ui/dom";
import { GameLauncher } from "../src/games/GameLauncher";
const capabilities = { wasm: true, webgl2: true, touch: false } as Capabilities;
beforeAll(() => {
  Object.defineProperty(window, "matchMedia", {
    value: () => ({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }),
  });
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
  document.body.replaceChildren();
});
describe("registry and URL security", () => {
  it("has unique validated IDs and no unauthorized commercial local builds", () => {
    expect(validateRegistry(games).length).toBe(51);
    expect(
      games.filter((g) => g.status === "available").map((g) => g.id),
    ).toEqual(["input-lab"]);
  });
  it("rejects duplicate IDs", () =>
    expect(() => validateRegistry([games[0], games[0]])).toThrow());
  it.each([
    "javascript:alert(1)",
    "https://evil.invalid/game",
    "//evil.invalid/games/test",
    "/games/../private",
  ])("rejects unsafe entries %s", (entry) =>
    expect(safeEntry(entry, "iframe")).toBe(false),
  );
  it("allows only explicit external origins", () => {
    expect(
      safeEntry("https://www.lemon-web.net/html5games/test/", "external"),
    ).toBe(true);
    expect(
      safeEntry("https://www.lemon-web.net.evil.invalid", "external"),
    ).toBe(false);
  });
  it("rejects available runtime without bridge", () =>
    expect(() =>
      validateRegistry([{ ...games.at(-1), bridge: false }]),
    ).toThrow());
  it("matches title, tag, alias and fuzzy subsequence", () => {
    expect(matches(games[0], "vice")).toBe(true);
    expect(matches(games[0], "vce")).toBe(true);
    expect(matches(games[0], "horror")).toBe(false);
  });
});
describe("routes", () => {
  it.each([
    ["#/game/vc", { page: "game", id: "vc" }],
    ["#/play/input-lab", { page: "play", id: "input-lab" }],
    ["#/gta", { page: "library", series: "GTA" }],
    ["#/diagnostics", { page: "diagnostics" }],
    ["#/%E0%A4%A", { page: "not-found" }],
    ["#/play/../../x", { page: "not-found" }],
  ])("%s", (path, result) => expect(parseRoute(path)).toEqual(result));
});
describe("storage", () => {
  it("survives denied storage", () => {
    const s = new StorageManager({
      getItem() {
        throw Error();
      },
      setItem() {
        throw Error();
      },
      removeItem() {
        throw Error();
      },
    });
    expect(s.get("x", [], stringArray)).toEqual([]);
    expect(s.set("x", [])).toBe(false);
    expect(() => s.remove("x")).not.toThrow();
  });
  it("validates corrupt persisted data", () => {
    const s = new StorageManager({
      getItem: () => "{broken",
      setItem: () => {},
      removeItem: () => {},
    });
    expect(s.get("x", ["fallback"], stringArray)).toEqual(["fallback"]);
    expect(recentValid([{ id: "x", timestamp: "bad" }])).toBe(false);
  });
  it("roundtrips local data", () => {
    const backend = new Map<string, string>();
    const s = new StorageManager({
      getItem: (k) => backend.get(k) ?? null,
      setItem: (k, v) => {
        backend.set(k, v);
      },
      removeItem: (k) => {
        backend.delete(k);
      },
    });
    s.set("x", ["vc"]);
    expect(s.get("x", [], stringArray)).toEqual(["vc"]);
  });
});
describe("input state merging", () => {
  it("does not release one source when another is held", () => {
    const states: { buttons: string[] }[] = [];
    const input = new InputAdapter((s) => states.push(s));
    input.button("keyboard", "left", true);
    input.button("touch", "left", true);
    input.clearSource("touch");
    expect(states.at(-1)?.buttons).toEqual(["left"]);
    input.reset();
    expect(states.at(-1)?.buttons).toEqual([]);
  });
  it("clamps axes and selects strongest source", () => {
    const emit = vi.fn();
    const input = new InputAdapter(emit);
    input.axis("touch", 4, -3);
    expect(emit.mock.calls.at(-1)?.[0].axes).toEqual({ x: 1, y: -1 });
  });
  it("handles dead zone and normalized diagonal", () => {
    expect(joystickVector(1, 1, 85, 0.12)).toEqual({
      x: 0,
      y: 0,
      magnitude: 0,
    });
    const v = joystickVector(100, 100, 85, 0.12);
    expect(Math.hypot(v.x, v.y)).toBeCloseTo(1);
  });
  it("pointer capture/reset cleans joystick listeners", () => {
    const base = document.createElement("div"),
      knob = document.createElement("div");
    base.append(knob);
    document.body.append(base);
    base.setPointerCapture = vi.fn();
    base.hasPointerCapture = () => false;
    const emit = vi.fn();
    const joystick = new VirtualJoystick(base, knob, 65, 0.12, emit);
    joystick.reset();
    expect(emit).toHaveBeenLastCalledWith(0, 0);
    joystick.destroy();
    expect(knob.style.transform).toBe("");
  });
});
describe("compatibility", () => {
  it("does not claim external runtime works", () =>
    expect(compatibility(games[0], capabilities).status).toBe("UNKNOWN"));
  it("enforces required APIs", () =>
    expect(
      compatibility(
        { ...games[0], requirements: { wasm: true, webgl2: true } },
        { ...capabilities, wasm: false },
      ).status,
    ).toBe("UNSUPPORTED"));
  it("declared lab APIs are supported, not performance rated", () =>
    expect(compatibility(games.at(-1)!, capabilities).status).toBe(
      "SUPPORTED",
    ));
});
describe("session lifecycle", () => {
  it("enforces transitions and cleans to idle", () => {
    const s = new GameSession();
    expect(() => s.transition("PLAYING")).toThrow();
    for (const state of [
      "PRELOADING",
      "LOADING",
      "READY",
      "PLAYING",
      "PAUSED",
      "PLAYING",
    ] as const)
      s.transition(state);
    s.stop();
    expect(s.state).toBe("IDLE");
  });
});
describe("bridge", () => {
  it("requires source, origin, protocol and allowed message", () => {
    const frame = document.createElement("iframe");
    document.body.append(frame);
    const receive = vi.fn();
    const b = new GameBridge(frame, location.origin, receive);
    const data = { channel: "afterhours-v1", type: "GAME_READY" };
    window.dispatchEvent(
      new MessageEvent("message", {
        origin: "https://evil.invalid",
        source: frame.contentWindow,
        data,
      }),
    );
    window.dispatchEvent(
      new MessageEvent("message", {
        origin: location.origin,
        source: window,
        data,
      }),
    );
    expect(receive).not.toHaveBeenCalled();
    window.dispatchEvent(
      new MessageEvent("message", {
        origin: location.origin,
        source: frame.contentWindow,
        data,
      }),
    );
    expect(receive).toHaveBeenCalledTimes(1);
    b.destroy();
    window.dispatchEvent(
      new MessageEvent("message", {
        origin: location.origin,
        source: frame.contentWindow,
        data,
      }),
    );
    expect(receive).toHaveBeenCalledTimes(1);
  });
});
describe("fullscreen", () => {
  it("has a fallback", async () =>
    expect(await toggleFullscreen(document.body)).toMatch(/unavailable/));
  it("reports denial", async () => {
    Object.defineProperty(document, "fullscreenEnabled", {
      value: true,
      configurable: true,
    });
    document.body.requestFullscreen = vi.fn().mockRejectedValue(new Error());
    expect(await toggleFullscreen(document.body)).toMatch(/declined/);
  });
});
describe("launcher error and retry", () => {
  it("shows useful failure and retries without an executable external URL", async () => {
    const { PerformanceManager } =
      await import("../src/performance/PerformanceManager");
    const manager = new PerformanceManager({
      ...capabilities,
      cores: 4,
      memory: 4,
    });
    const root = document.createElement("div");
    document.body.append(root);
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 404 }),
    );
    vi.spyOn(console, "error").mockImplementation(() => {});
    const launcher = new GameLauncher(games.at(-1)!, root, manager);
    await launcher.start();
    expect(launcher.session.state).toBe("ERROR");
    expect(root.textContent).toContain("404");
    expect(root.textContent).toContain("Retry");
    launcher.destroy();
    expect(root.querySelector("iframe")).toBeNull();
    vi.unstubAllGlobals();
  });
});
describe("orientation and gamepad adapters", () => {
  it("shows landscape recommendation only when required on a touch portrait screen", async () => {
    const { OrientationManager } =
      await import("../src/mobile/OrientationManager");
    const listeners: EventListener[] = [];
    vi.stubGlobal("matchMedia", () => ({
      matches: true,
      addEventListener: (_type: string, fn: EventListener) =>
        listeners.push(fn),
      removeEventListener: vi.fn(),
    }));
    Object.defineProperty(navigator, "maxTouchPoints", {
      value: 5,
      configurable: true,
    });
    const element = document.createElement("div");
    const manager = new OrientationManager(element, true);
    expect(element.hidden).toBe(false);
    manager.destroy();
    expect(element.hidden).toBe(true);
    vi.unstubAllGlobals();
  });
  it("maps a connected gamepad without inventing a navigator gamepad", async () => {
    const { GamepadAdapter } = await import("../src/input/GamepadAdapter");
    const callback = vi.fn();
    const input = new InputAdapter(callback);
    if (!navigator.getGamepads)
      Object.defineProperty(navigator, "getGamepads", {
        value: () => [],
        configurable: true,
        writable: true,
      });
    vi.spyOn(navigator, "getGamepads").mockReturnValue([
      {
        connected: true,
        buttons: [{ pressed: true }],
        axes: [0.5, 0],
      } as Gamepad,
    ]);
    const raf = vi.spyOn(window, "requestAnimationFrame").mockReturnValue(123);
    const cancel = vi
      .spyOn(window, "cancelAnimationFrame")
      .mockImplementation(() => {});
    const adapter = new GamepadAdapter(input, { "0": "confirm" });
    expect(
      callback.mock.calls.some((c) => c[0].buttons.includes("confirm")),
    ).toBe(true);
    expect(callback.mock.calls.at(-1)?.[0].axes.x).toBe(0.5);
    adapter.destroy();
    expect(cancel).toHaveBeenCalledWith(123);
    expect(raf).toHaveBeenCalled();
  });
});
describe("readiness timeout", () => {
  it("does not treat iframe load as successful runtime rendering", async () => {
    vi.useFakeTimers();
    Object.defineProperty(HTMLIFrameElement.prototype, "sandbox", {
      configurable: true,
      get: () => ({ add: vi.fn() }),
    });
    const { PerformanceManager } =
      await import("../src/performance/PerformanceManager");
    const root = document.createElement("div");
    document.body.append(root);
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true }));
    vi.spyOn(console, "error").mockImplementation(() => {});
    const launcher = new GameLauncher(
      games.at(-1)!,
      root,
      new PerformanceManager({ ...capabilities, cores: 4, memory: 4 }),
    );
    await launcher.start();
    expect(launcher.session.state).toBe("LOADING");
    expect(root.querySelector("progress")?.hasAttribute("value")).toBe(false);
    await vi.advanceTimersByTimeAsync(15001);
    expect(launcher.session.state).toBe("ERROR");
    expect(root.textContent).toContain("No GAME_READY");
    launcher.destroy();
    expect(root.querySelector("iframe")).toBeNull();
    Reflect.deleteProperty(HTMLIFrameElement.prototype, "sandbox");
    vi.unstubAllGlobals();
  });
});
