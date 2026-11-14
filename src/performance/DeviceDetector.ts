export interface Capabilities {
  browser: string;
  os: string;
  deviceClass: string;
  wasm: boolean;
  webgl: boolean;
  webgl2: boolean;
  gpu: string;
  memory: number | null;
  cores: number;
  touch: boolean;
  dpr: number;
  width: number;
  height: number;
  fullscreen: boolean;
  gamepad: boolean;
  serviceWorker: boolean;
  indexedDB: boolean;
  orientation: string;
}
export function detectDevice(): Capabilities {
  const ua = navigator.userAgent;
  const canvas = document.createElement("canvas");
  let gl: WebGLRenderingContext | WebGL2RenderingContext | null = null;
  try {
    gl = canvas.getContext("webgl2");
  } catch {
    /* Driver may block context. */
  }
  const webgl2 = !!gl;
  if (!gl)
    try {
      gl = canvas.getContext("webgl");
    } catch {
      /* Driver may block context. */
    }
  const gpu = gl ? String(gl.getParameter(gl.RENDERER)) : "Unavailable";
  const webgl = !!gl;
  gl?.getExtension("WEBGL_lose_context")?.loseContext();
  const memory =
    (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? null;
  return {
    browser: /Edg\//.test(ua)
      ? "Edge"
      : /SamsungBrowser/.test(ua)
        ? "Samsung Internet"
        : /Firefox/.test(ua)
          ? "Firefox"
          : /Chrome/.test(ua)
            ? "Chromium"
            : /Safari/.test(ua)
              ? "Safari"
              : "Unknown",
    os: /Android/.test(ua)
      ? "Android"
      : /iPhone|iPad/.test(ua)
        ? "iOS/iPadOS"
        : /Windows/.test(ua)
          ? "Windows"
          : /Mac/.test(ua)
            ? "macOS / iPadOS desktop UA"
            : /Linux/.test(ua)
              ? "Linux"
              : "Unknown",
    deviceClass:
      innerWidth < 600
        ? "small screen"
        : innerWidth < 1100
          ? "medium screen"
          : "large screen",
    wasm: typeof WebAssembly === "object",
    webgl,
    webgl2,
    gpu,
    memory,
    cores: navigator.hardwareConcurrency || 1,
    touch: navigator.maxTouchPoints > 0,
    dpr: devicePixelRatio || 1,
    width: screen.width,
    height: screen.height,
    fullscreen: !!document.fullscreenEnabled,
    gamepad: typeof navigator.getGamepads === "function",
    serviceWorker: "serviceWorker" in navigator,
    indexedDB: "indexedDB" in window,
    orientation: innerWidth > innerHeight ? "landscape" : "portrait",
  };
}
export type Compatibility =
  "SUPPORTED" | "PARTIALLY SUPPORTED" | "UNSUPPORTED" | "UNKNOWN";
export function compatibility(
  game: {
    status: string;
    mobile: boolean | null;
    requirements: { wasm: boolean; webgl2: boolean };
  },
  c: Capabilities,
): { status: Compatibility; reason: string } {
  if (
    (game.requirements.wasm && !c.wasm) ||
    (game.requirements.webgl2 && !c.webgl2)
  )
    return {
      status: "UNSUPPORTED",
      reason: "A declared runtime requirement is missing.",
    };
  if (game.status !== "available")
    return {
      status: "UNKNOWN",
      reason:
        "No authorized local runtime installed. External host support is unverified.",
    };
  if (c.touch && game.mobile !== true)
    return {
      status: "PARTIALLY SUPPORTED",
      reason: "Required APIs present; mobile input support not established.",
    };
  return {
    status: "SUPPORTED",
    reason:
      "Declared API requirements detected. This is not a gameplay or FPS rating.",
  };
}
