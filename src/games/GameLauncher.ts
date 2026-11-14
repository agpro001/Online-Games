import { Loader } from "../ui/Loader";
import type { Game } from "./types";
import { safeEntry } from "./GameRegistry";
import { GameSession } from "./GameSession";
import { GameBridge, type RuntimeMessage } from "./GameBridge";
import { InputAdapter } from "../input/InputAdapter";
import { KeyboardAdapter } from "../input/KeyboardAdapter";
import { GamepadAdapter } from "../input/GamepadAdapter";
import { TouchAdapter } from "../input/TouchAdapter";
import { OrientationManager } from "../mobile/OrientationManager";
import type { PerformanceManager } from "../performance/PerformanceManager";
import { el, button, link, message, toggleFullscreen } from "../ui/dom";
import { recordSession } from "../storage/StorageManager";
export class GameLauncher {
  readonly session: GameSession;
  private loader: Loader;
  private bridge: GameBridge | null = null;
  private frame: HTMLIFrameElement | null = null;
  private timeout = 0;
  private input: InputAdapter | null = null;
  private keyboard: KeyboardAdapter | null = null;
  private gamepad: GamepadAdapter | null = null;
  private touch: TouchAdapter | null = null;
  private orientation: OrientationManager | null = null;
  private abort = new AbortController();
  private started = 0;
  private handshake = false;
  private stage = el("div", "runtime-stage");
  private status = el("p", "runtime-status", "Initializing runtime…");
  private pauseButton: HTMLButtonElement;
  private exportPending = false;
  private exportTimeout = 0;
  private ready = false;
  constructor(
    private game: Game,
    private container: HTMLElement,
    private performance: PerformanceManager,
  ) {
    this.loader = new Loader(game.title);
    this.session = new GameSession((state) => {
      this.container.dataset.state = state;
      this.status.textContent =
        state === "LOADING"
          ? "Waiting for runtime readiness (no byte progress available)…"
          : state === "PLAYING"
            ? "Runtime ready · original local input lab"
            : state === "PAUSED"
              ? "Paused"
              : state;
    });
    const toolbar = el("div", "runtime-toolbar");
    this.pauseButton = button("Pause", () => this.togglePause());
    this.pauseButton.disabled = true;
    toolbar.append(
      link("← Leave runtime", "#/game/" + game.id),
      this.pauseButton,
      button("Fullscreen", () => {
        void toggleFullscreen(this.stage).then(message);
      }),
    );
    if (game.save === "lab-json") {
      const exp = button("Export lab save", () => this.exportSave());
      const imp = el("input");
      imp.type = "file";
      imp.accept = "application/json,.json";
      imp.hidden = true;
      imp.addEventListener("change", () => {
        void this.importSave(imp.files?.[0]);
        imp.value = "";
      });
      toolbar.append(
        exp,
        button("Import lab save", () => {
          if (this.ready) imp.click();
          else message("Wait for runtime readiness.");
        }),
        imp,
      );
    }
    const fullscreenTools = el("div", "fullscreen-tools");
    fullscreenTools.append(
      button("Window", () => {
        void toggleFullscreen(this.stage).then(message);
      }),
      button("Pause / Resume", () => this.togglePause()),
      link("Exit session", "#/game/" + game.id),
    );
    this.stage.append(fullscreenTools);
    this.stage.tabIndex = -1;
    this.stage.setAttribute("aria-label", game.title + " runtime");
    this.status.setAttribute("role", "status");
    this.container.append(toolbar, this.status, this.stage);
    this.stage.append(this.loader.root);
  }
  async start() {
    try {
      if (
        this.game.status !== "available" ||
        this.game.launchMode !== "iframe" ||
        !this.game.entry ||
        !safeEntry(this.game.entry, "iframe") ||
        !this.game.bridge
      )
        throw new Error(
          "Authorized local build required. This entry cannot be embedded.",
        );
      this.session.transition("PRELOADING");
      this.timeout = window.setTimeout(
        () =>
          this.fail(
            "Runtime entry request timed out. Check the local build and connection.",
          ),
        10000,
      );
      // Check HTTP reachability, not render success. Readiness is a separate bridge event.
      const response = await fetch(this.game.entry, {
        method: "HEAD",
        signal: this.abort.signal,
        cache: "no-store",
      });
      if (!response.ok)
        throw new Error(`Runtime entry returned HTTP ${response.status}`);
      if (this.abort.signal.aborted) return;
      clearTimeout(this.timeout);
      this.session.transition("LOADING");
      const frame = el("iframe", "game-frame");
      this.frame = frame;
      frame.title = this.game.title + " authorized runtime";
      frame.sandbox.add("allow-scripts", "allow-same-origin");
      frame.allow = "fullscreen; gamepad";
      frame.allowFullscreen = true;
      frame.referrerPolicy = "no-referrer";
      this.bridge = new GameBridge(frame, location.origin, (m) =>
        this.receive(m),
      );
      frame.addEventListener(
        "load",
        () => {
          this.bridge?.send("HUB_INIT", { dpr: this.performance.dpr });
        },
        { signal: this.abort.signal },
      );
      frame.addEventListener(
        "error",
        () => this.fail("Runtime document failed to load."),
        { signal: this.abort.signal },
      );
      frame.src = this.game.entry;
      this.stage.append(frame);
      this.timeout = window.setTimeout(
        () =>
          this.fail(
            "No GAME_READY after 15 seconds. Possible missing build, blocked frame, script error or unsupported browser.",
          ),
        15000,
      );
      document.addEventListener(
        "visibilitychange",
        () => {
          if (document.hidden && this.session.state === "PLAYING") this.pause();
        },
        { signal: this.abort.signal },
      );
      window.addEventListener("blur", () => this.input?.reset(), {
        signal: this.abort.signal,
      });
    } catch (error) {
      if (!this.abort.signal.aborted)
        this.fail(
          error instanceof Error
            ? error.message
            : "Runtime initialization failed.",
        );
    }
  }
  private receive(m: RuntimeMessage) {
    if (this.session.state === "IDLE" || this.session.state === "ERROR") return;
    if (
      m.type === "GAME_READY" &&
      this.session.state === "LOADING" &&
      !this.handshake
    ) {
      this.handshake = true;
      this.loader.destroy();
      clearTimeout(this.timeout);
      this.session.transition("READY");
      this.input = new InputAdapter((state) => {
        if (this.session.state === "PLAYING")
          this.bridge?.send("HUB_INPUT", state);
      });
      const controls = this.game.controls;
      if (controls) {
        this.keyboard = new KeyboardAdapter(this.input, controls.keyboard, [
          window,
          ...(this.frame?.contentWindow ? [this.frame.contentWindow] : []),
        ]);
        this.gamepad = new GamepadAdapter(this.input, controls.gamepad);
        if (this.game.touchControls && this.performance.settings.controls)
          this.touch = new TouchAdapter(
            this.input,
            controls,
            this.performance.settings,
            this.stage,
          );
      }
      const rotate = el(
        "div",
        "rotate-prompt",
        "↻ Rotate your device for the recommended landscape layout",
      );
      this.stage.append(rotate);
      this.orientation = new OrientationManager(rotate, this.game.landscape);
      this.bridge?.send("HUB_CONFIG", { dpr: this.performance.dpr });
      this.session.transition("PLAYING");
      this.ready = true;
      this.started = Date.now();
      this.pauseButton.disabled = false;
      this.stage.focus({ preventScroll: true });
      if (document.hidden) this.pause();
    } else if (m.type === "GAME_ERROR") {
      this.fail(
        typeof m.payload === "string"
          ? m.payload.slice(0, 300)
          : "Runtime reported an error.",
      );
    } else if (m.type === "EXIT_GAME") location.hash = "#/game/" + this.game.id;
    else if (m.type === "REQUEST_FULLSCREEN")
      message("Use the Fullscreen button to grant a user-initiated request.");
    else if (m.type === "GAME_PAUSED" && this.session.state === "PLAYING") {
      this.pause();
    } else if (
      m.type === "GAME_RESUMED" &&
      this.session.state === "PAUSED" &&
      !document.hidden
    ) {
      this.resume();
    } else if (m.type === "SAVE_EXPORT" && this.exportPending) {
      this.exportPending = false;
      clearTimeout(this.exportTimeout);
      if (this.validSave(m.payload)) {
        const blob = new Blob([JSON.stringify(m.payload, null, 2)], {
          type: "application/json",
        });
        const url = URL.createObjectURL(blob);
        const a = el("a");
        a.href = url;
        a.download = "afterhours-input-lab.json";
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      } else message("Runtime returned an invalid lab save.");
    }
  }
  private validSave(
    x: unknown,
  ): x is { format: string; version: number; x: number; y: number } {
    if (!x || typeof x !== "object") return false;
    const v = x as Record<string, unknown>;
    return (
      v.format === "afterhours-input-lab" &&
      v.version === 1 &&
      typeof v.x === "number" &&
      typeof v.y === "number" &&
      Number.isFinite(v.x) &&
      Number.isFinite(v.y) &&
      v.x >= 0 &&
      v.x <= 1 &&
      v.y >= 0 &&
      v.y <= 1
    );
  }
  private exportSave() {
    if (!this.ready) {
      message("Wait for runtime readiness.");
      return;
    }
    this.exportPending = true;
    this.bridge?.send("HUB_SAVE_EXPORT");
    clearTimeout(this.exportTimeout);
    this.exportTimeout = window.setTimeout(() => {
      this.exportPending = false;
      message("Runtime did not return a save export.");
    }, 5000);
  }
  private async importSave(file?: File) {
    if (!file) return;
    if (file.size > 4096) {
      message("Invalid lab save: maximum size is 4 KiB.");
      return;
    }
    try {
      const value: unknown = JSON.parse(await file.text());
      if (!this.validSave(value)) throw new Error("Invalid lab save format");
      if (!this.ready) return;
      this.bridge?.send("HUB_SAVE_IMPORT", value);
      message(
        "Lab position imported. Original game save formats are not supported.",
      );
    } catch {
      message("Could not import: invalid input-lab JSON save.");
    }
  }
  private pause() {
    if (this.session.state !== "PLAYING") return;
    this.input?.reset();
    this.session.transition("PAUSED");
    this.bridge?.send("HUB_PAUSE");
    this.pauseButton.textContent = "Resume";
    this.touch?.root.setAttribute("inert", "");
  }
  private resume() {
    if (this.session.state !== "PAUSED") return;
    this.input?.reset();
    this.session.transition("PLAYING");
    this.bridge?.send("HUB_RESUME");
    this.pauseButton.textContent = "Pause";
    this.touch?.root.removeAttribute("inert");
    this.stage.focus({ preventScroll: true });
  }
  private togglePause() {
    if (this.session.state === "PLAYING") this.pause();
    else this.resume();
  }
  private fail(reason: string) {
    if (this.session.state === "ERROR" || this.session.state === "IDLE") return;
    console.error("[GameLauncher]", this.game.id, reason);
    this.session.transition("ERROR");
    this.release();
    this.status.textContent = "GAME FAILED TO LOAD";
    const panel = el("div", "runtime-error");
    panel.append(
      el("h2", "", "Unable to start this runtime"),
      el("p", "", reason),
      el(
        "p",
        "",
        "Possible causes: missing assets, unavailable server, blocked embedding or incompatible browser.",
      ),
      button(
        "Retry",
        () => {
          this.destroy();
          this.container.replaceChildren();
          const next = new GameLauncher(
            this.game,
            this.container,
            this.performance,
          );
          this.replacement = next;
          void next.start();
        },
        "primary",
      ),
      link("Back to library", "#/library", "secondary button-link"),
    );
    this.stage.replaceChildren(panel);
  }
  get activeState(): string {
    return this.replacement?.activeState ?? this.session.state;
  }
  private replacement: GameLauncher | null = null;
  private release() {
    this.loader.destroy();
    clearTimeout(this.timeout);
    clearTimeout(this.exportTimeout);
    this.exportPending = false;
    this.ready = false;
    this.abort.abort();
    this.keyboard?.destroy();
    this.keyboard = null;
    this.gamepad?.destroy();
    this.gamepad = null;
    this.touch?.destroy();
    this.touch = null;
    this.input?.reset();
    this.input = null;
    this.orientation?.destroy();
    this.orientation = null;
    this.bridge?.destroy();
    this.bridge = null;
    this.frame?.remove();
    this.frame = null;
  }
  destroy() {
    this.replacement?.destroy();
    this.replacement = null;
    if (this.started) {
      recordSession({
        id: this.game.id,
        timestamp: this.started,
        duration: Math.round((Date.now() - this.started) / 1000),
        kind: "local-session",
      });
      this.started = 0;
    }
    this.release();
    this.session.stop();
  }
}
