# AFTERHOURS architecture and public-web audit

14 November 2026. This document precedes the TypeScript implementation.

## Phase 1 — workspace inventory (VERIFIED)

Existing files: index.html, style.css, app.js, generated 188 KiB hero artwork, README, analysis report and REA evidence. No package.json, dependencies, build scripts, installed game runtime or router. Existing functions: intro, six in-code metadata entries, catalog links, family filters, external launch modal, motion and API checks. Backups: backups/pre-typescript/. No commercial game files are installed or removed.

## Phase 2 — public references

Re-fetched both URLs through the page extraction service. Its output is content, **not a browser network trace or raw response-header capture**.

### Vice City

URL: https://www.lemon-web.net/html5games/grandtheftautovicecity/dist/

VERIFIED page content: canvas-oriented reVC browser edition credits, English/Russian choice, FPS setting, cheats, fullscreen, cloud-save key, demo/original-file flow, touch keys and landscape prompt. Prior local analysis of credited Lolendor/reVCDOS upstream at 95f14ef3c1d0a872ecd0881544cc7e1f55cb1946 identifies:

- HTML canvas and plain JavaScript, no identified frontend framework/bundler required for the wrapper.
- game.js configuration and index.js ordered module loader; Emscripten runtime, filesystem, graphics, OpenAL-style audio, events, language packages and main boot.
- Language-specific WASM entry paths under /vcbr/, raw/streamed asset paths under /vcsky/; proxy/local/packed support in Python/PHP server. Static dist alone is insufficient without those endpoints.
- WASM instantiate override; virtual /vc-assets/local tree; fetch progress with a configured size estimate, not an observed complete-transfer measurement.
- Cache API, IndexedDB filesystem and localStorage preferences/save integration; external cloud-save dependency.
- Touch overlay and rotation UI; graphics context-loss hook and browser fullscreen UI in inspected glue. Actual fullscreen grant, Android rendering and error-recovery behavior NOT TESTED.
- Service-worker use NOT ESTABLISHED for this exact deployment. Cache API alone does not imply a service worker.

INFERRED: Lemon uses a catalog plus runtime-specific pages; it is not one uniform emulator. reVCDOS upstream matches credits and observable UI but deployment byte identity is unverified. No live WASM fetched, no response headers/HAR, GPU render or Android FPS captured. The sandbox permits only selected outbound hosts; raw Lemon network fetching is unavailable. See analysis/GAME-FEASIBILITY.md and evidence for deeper source findings. No protected assets or binaries extracted.

### GTA V

https://www.lemon-web.net/html5games/grandtheftauto5/ resolves through the fetch service to the general Lemon game catalog. VERIFIED: returned content is a catalog, not a gameplay page. NOT ESTABLISHED: GTA V runtime, WASM, mobile controls, local rendering, installability or full gameplay. Keep URL as an external research reference; status pending/unverified, never PLAY NOW.

### Request dependencies (source-derived, not observed HAR)

Vice City: HTML → game/index JS → Emscripten module scripts → language WASM under /vcbr/ → map/model/texture/audio data under /vcsky/ → cache/virtual filesystem → WebGL/audio/browser input. Saves: origin-local storage plus optional cloud integration. Exact sizes, response security headers, deployed service workers, error responses and completion remain NOT TESTABLE in this environment.

## Open-source research and choices

- Tickle: https://github.com/theshaneobrien/tickle — research output describes metadata-managed static portal, separate detail pages and iframe adapters for Unity/Godot/EmulatorJS. Borrow registry/detail/adapter separation, not implementation or patched game files. No code copied.
- Three.js/Babylon/PlayCanvas: appropriate for 3D scenes, unnecessary for a CSS/image-based hub. Avoiding these saves GPU/memory. Phaser is a game framework, not needed to wrap games. WebAssembly is an execution format, not a universal converter.
- EmulatorJS: possible future licensed emulator adapter; BIOS/ROM rights must be established separately. Not bundled or CDN-executed here.
- Vite + strict TypeScript; native dialogs/hash routes, Pointer Events/Gamepad API, Web Audio synthesized original UI tone, IndexedDB probe, standard Fullscreen API, explicit readiness message bridge, PWA API. Dependencies tracked by lockfile and their licenses, no portal template code copied.

## Phase 3 — planned system

```
User → Router / cinematic shell → JSON registry → game detail
     → GameLauncher → session state machine → iframe (authorized local runtime only)
     → validated GameBridge → READY / PAUSED / ERROR
     → InputAdapter ← keyboard / touch joystick / Gamepad
```

External references open new tabs only. They never enter PLAYING or pretend to report loading progress. Catalog/pending slots explain legal file requirements. An original local input laboratory will exercise readiness, rendering, input, pause, save export/import and cleanup. It is explicitly NOT GTA/Resident Evil or a replacement for them.

Registry schema separates rights, availability, runtime, launch mode, entry, controls, expected bridge protocol, capabilities and requirements. Same-origin controlled /games/ files only for iframe execution, an explicit external-origin allowlist for links. Strings rendered as text. No user-entered executable URLs. Commercial placeholders carry no proprietary artwork; generated hero/text cards replace earlier remote covers.

Launcher lifecycle: IDLE → PRELOADING → LOADING → READY → PLAYING ↔ PAUSED → EXITING → CLEANUP → IDLE; ERROR can exit/retry. Load events do not prove readiness. READY requires a protocol-versioned message from the exact iframe window/origin after its first render. Timeout yields error with retry/back, no fake percentage. Cleanup removes iframe, timers, bridge, input, visibility listeners and orientation prompt. Fullscreen is user-initiated and reports rejection.

Input uses a bridge contract, not untrusted synthetic keyboard events into arbitrary games. Joystick has one captured pointer per stick; independent action pointers allow multi-touch. Per-source input merging avoids releasing a keyboard button while a joystick holds it. Cancel, blur, hidden and exit release all input. Runtime-specific mappings live in metadata. No virtual browser Gamepad injection claim.

Storage is origin-local, validated and failure-tolerant. Favorites/recent launch attempts, settings and introSeen use localStorage. Runtime saves remain on their own origin; export/import only for the original input lab's declared format. External launch attempts are labeled as attempts, not verified played sessions.

Performance profiles affect shell effects and lab DPR only; never claim to change third-party game graphics. Diagnostics use real API probes and timed Canvas2D frames, not game FPS. Visibility stops lab animation; CSS reduced motion/low profile disable atmosphere. Audio applies only to shell synthesized UI tone, not cross-origin games. Missing music/ambience assets are declared.

PWA uses a versioned, small same-origin shell allowlist; no third-party or /games/ cache. Stable filenames for manifest/icons, Vite hashed bundles for application. Offline fallback for navigation, update notice on waiting worker, explicit shell-cache cleanup. HTTPS or localhost required; iframe readiness never means offline support.

## Acceptance boundary

Production infrastructure can be built/tested here. No authorized GTA/RE files supplied, so full commercial-game launch acceptance remains pending. Physical Android/iOS/Samsung/Safari validation cannot be claimed from desktop emulation. QA report must separate unit tests, desktop browser results, emulated viewports and unavailable physical devices. No UI promises universal smooth gameplay.
