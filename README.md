# AFTERHOURS — cinematic browser-game hub

A Vite + strict TypeScript application with an original cinematic identity, metadata-driven library and an opt-in authorized-runtime launcher. **No GTA or Resident Evil game files are bundled.** A working original Input Laboratory verifies launcher/bridge/input infrastructure; it is not a substitute for a commercial game.

## Quick start

Node.js 22 recommended.

```sh
npm ci
npm run dev           # 0.0.0.0:5173, permits the Arena preview host
npm run build         # TypeScript validation + production dist/
npm run preview       # inspect production build, default port 4173
npm run lint
npm test
npx playwright install chromium
npm run test:e2e
```

Deploy the **contents of `dist/` at the origin root**, not raw source or `public/`. Hash routes need no server-side route rewrites. Vite preview is a local QA server, not the recommended public production server. Use an HTTPS static host; localhost also supports PWA APIs. Non-root/subpath deployments require changing Vite base, registry paths, manifest and service-worker scope first. Do not serve the old root `app.js` as the current entry.

### Main routes

- `/#/` — cinematic home, featured, GTA/RE rows, favorites/recent and device links
- `/#/library`, `/#/gta`, `/#/resident-evil` — instant search + metadata filters
- `/#/game/<id>` — game detail, status, requirements, controls, saves and rights
- `/#/play/<id>` — real local runtime or clear external/pending launch options
- `/#/favorites`, `/#/recent`, `/#/settings`, `/#/diagnostics`
- `/?dev=true#/play/input-lab` — optional measured-state debug panel; no fake FPS

The cinematic intro is skippable, OS reduced-motion aware, replayable and persisted as `afterhours:introSeen`. Fullscreen requires a browser-granted user gesture and has a windowed fallback. Navigation does not reload the whole application.

## Current availability

51 registry entries cover major GTA and Resident Evil releases, remakes, expansions/spin-off families, and the Input Laboratory. This is not a catalog of every regional edition or DLC. Release information is original-release metadata, not a claim of current store/service availability. Newer titles whose release was not audited are labeled accordingly.

| Entry type | Behavior |
|---|---|
| Input Laboratory | Original local Canvas 2D runtime; rendered readiness handshake, joystick/keyboard/gamepad bridge, pause/resume, position save/export/import |
| Vice City | External Lemon reVC reference, opened unchanged in a new tab; gameplay/mobile support unverified |
| GTA V supplied URL | Pending; fetch returned general catalog, not a verified playable game |
| Other commercial entries | Not installed; some include catalog references. Authorized browser build and legal hosting rights required |

No fake Play/percentage/FPS states. An iframe document `load` is not GAME_READY. Local-runtime loading is indeterminate until its opt-in bridge reports first-render readiness. Pending entries do not instantiate an iframe. External launch attempts are stored as **attempts**, not verified played sessions.

## Architecture

```
src/app/           App, hash router
src/cinematic/     Configurable scene-based, accessible intro
src/games/         Registry validation, metadata types, bridge, lifecycle and launcher
src/input/         Merged input state, keyboard/gamepad/touch adapters, joystick
src/mobile/        Orientation recommendation and cleanup
src/performance/   API detection, compatibility and shell profiles
src/audio/         Gesture-initiated synthesized UI tone, master/UI gain
src/storage/       Validated, failure-tolerant local preferences and sessions
src/ui/            Cards, detail, settings, DOM/fullscreen helpers, truthful loader
src/diagnostics/   Local API/storage checks and timed Canvas frame-pacing sample
data/games.json    Single extensible registry
public/games/      Authorized builds only; ignored except original input lab
public/assets/     Original generated cinematic artwork
public/icons/      Original hub icons
backups/           Preserved pre-migration HTML/CSS/JS/README
analysis/          Earlier reverse-engineering report and compact tool evidence
docs/              Architecture, integration contract, phase log, QA and notices
```

Three.js/game frameworks are intentionally not required for this CSS/image shell. The presentation is not a copied Rockstar/Capcom interface. No third-party commercial artwork, BIOS, ROM, engine binary or game data was copied into the active application. The background is AI-generated atmosphere, not an in-game screenshot. Self-hosted Barlow Condensed is OFL-licensed; see `docs/THIRD-PARTY.md`.

## Adding an authorized game

See **[integration guide](docs/INTEGRATING-GAMES.md)** and `src/games/types.ts`. Start from a pending entry in `data/games.json`:

```json
{
  "id": "your-game",
  "title": "Your game",
  "launchMode": "pending",
  "entry": null,
  "status": "pending"
}
```

This excerpt is not a complete entry: copy a full schema-valid record, supply rights/capabilities/control mappings and run `npm run build` + tests. Mark `available` only when a lawful local `/games/<id>/index.html` and an authorized wrapper implement the bridge contract. Availability is not assigned automatically from a URL or file extension. Per-game controls come from metadata, not main-application edits. Runtime-specific wrapper work may be necessary when a game has no existing bridge; metadata alone cannot add a missing control API.

Local iframe content is **trusted project-controlled code**. Current sandbox permits scripts and same-origin storage; it does not securely isolate malicious same-origin uploads. Arbitrary executable URLs/uploads are not accepted. External link hosts are explicitly allowlisted, iframe entries are same-origin `/games/` paths, and postMessage checks exact source window, origin, protocol and command. No CORS/CSP/X-Frame-Options or ownership checks are bypassed.

## Mobile controls and saves

- Pointer Events with capture, one pointer owner per joystick, dead zone, normalized axes, independent multi-touch action pointers and configurable side/size/opacity.
- Sources merge so releasing touch does not release an independently held keyboard action. Blur/hidden/pause/exit clear state. Joystick resets on resize/cancel. A real Gamepad API adapter reads connected pads; no fake browser gamepad is injected.
- Controls appear only for a runtime that declares an opt-in bridge and mappings. No fake camera/look area is shown for a lab that has no camera.
- The shell cannot inject events, pause, mute, export saves or change graphics inside arbitrary cross-origin pages. External runtimes use their own controls/saves/settings.
- Lab saves contain normalized marker position only. The format is explicitly validated and bounded; no commercial save format is claimed.
- Orientation recommendation uses metadata, not a permanent device lock. Mobile safe-area insets protect controls. Fullscreen has in-viewport window/exit controls.

## Performance and audio

AUTO uses coarse exposed memory/core/touch hints; LOW/MEDIUM/HIGH/ULTRA can be selected manually. Profiles affect shell atmosphere/blur and capped lab DPR (1/1.5/2/2), not external game graphics. Every commercial entry remains **Untested**. Capability detection is separate from measured gameplay performance.

Diagnostics show browser/OS hints (UA detection is imperfect), screen/DPR, WebGL/WebGL2, renderer string, WASM, touch, Gamepad API, fullscreen, IndexedDB read/write, localStorage and service-worker support. Canvas sampling reports actual callback intervals, not a fabricated game FPS rating. It is short and cannot establish sustained thermal behavior. No diagnostic data is uploaded.

The audio manager generates an original short UI tone only after a Test sound gesture. Master/UI settings persist. No background music/ambience files are installed; those channels are not pretended to play. Cross-origin game audio stays on its host.

## PWA and deployment

- Manifest and original PNG icons support installability where the browser permits it.
- Build creates a versioned shell worker and explicit small-asset allowlist: HTML, hashed JS/CSS/font and project UI art/icons.
- No `/games/` requests, third-party content or commercial payloads are cached by the shell worker. Large game data needs its own lawful, opt-in, quota-aware strategy.
- Navigation is network-first with offline shell fallback; hashed shell assets are cache-first. Cached shell works offline; that **does not make games offline-capable**.
- Updates show a banner; user chooses reload. Save and exit any runtime first. Settings can clear only hub shell caches, not game saves. Reconnect/reload to restore offline shell after clearing.
- Serve `sw.js`, `index.html` and the manifest with `Cache-Control: no-cache`; hashed `/assets/*` may use immutable long-lived caching. Use correct JS, JSON, WOFF2 and WASM MIME types.
- Enforce HTTPS, `X-Content-Type-Options: nosniff`, a deployment CSP matching index.html, `frame-ancestors 'self'` in HTTP headers and a suitable Referrer-Policy. If a future runtime needs SharedArrayBuffer, configure/audit COOP/COEP and all subresources specifically; do not claim current isolation implies threaded-game support.
- CSP allows self-hosted app/runtime files only; ws/wss are present for development HMR. Harden those connect sources in public deployment if HMR is unnecessary. Origin-wide game files share the trust/storage boundary; isolate untrusted games on separately audited origins.

## Testing and verified limits

See **[QA report](docs/QA.md)** for the actual matrix. Unit tests and Chromium browser tests exist for registry/URLs, routes, storage, compatibility, input, bridge, lifecycle, fullscreen fallback, failure recovery, responsive views, favorites, diagnostics, real local runtime movement, multi-touch, saves and offline shell.

The restricted sandbox blocked Playwright's browser CDN. QA used an npm-distributed Chromium executable with matching local support libraries, **not a physical phone**. Reproduce with the normal Playwright browser install on an unrestricted machine, or supply `CHROMIUM_PATH` to the config. Physical Android, iOS/Safari, Firefox and Samsung Internet still need testing. No universal smooth-gameplay claim is made.

## Research and preservation

[Architecture/audit findings](docs/ARCHITECTURE.md) distinguish VERIFIED, INFERRED and NOT TESTABLE. [Original deep report](analysis/GAME-FEASIBILITY.md) and [REA evidence](analysis/evidence/rea-summary.json) preserve prior investigation. REA JavaScript static analysis ran on matching credited upstream, not a byte-identical live capture. WABT was smoke-tested on a synthetic module, not the GTA binary. No decompilation of a deployed game binary is claimed.

## Troubleshooting

- **Raw TypeScript/module loading errors:** run Vite or deploy `dist/`; the old Python-only source preview no longer builds the app.
- **Not installed:** supply a lawful authorized build; a commercial catalog link is not an executable runtime.
- **No GAME_READY:** inspect runtime console, entry response, bridge origin/channel and first-render callback; the launcher offers retry/back after a bounded wait.
- **Fullscreen refused:** continue windowed or use browser controls; do not bypass platform permission.
- **External game lacks touch controls:** use its supported controller/overlay. This hub cannot alter cross-origin input.
- **Storage denied:** preferences may not persist; allow site storage and avoid private-mode assumptions. Export supported lab saves before clearing site storage.
- **Offline game failure:** expected unless that exact runtime independently supports offline operation. The hub caches only its shell.

## Recovery of lost deployment files

A source-only recovery pass is now available: [recovery status and instructions](recovery/README.md). A verified archive of 35 files from the matching publicly licensed Vice City wrapper is preserved at `recovery/vice-city-wrapper-source.tar.gz`, with per-file provenance/checksums. **This archive does not include the WASM engine or commercial game data and is not a playable game installation.** It is not deployed by Vite.

Read-only backup inventory and source recovery commands:

```sh
npm run recovery:inventory -- /path/to/your/extracted/backup
npm run recovery:source -- /path/to/clean/audited/reVCDOS /new/recovery/folder
```

`npm test` now runs the existing TypeScript suite plus four Node recovery tests. Hosting exports are the next required input for recovering missing runtime binaries and data; do not supply passwords or secret keys in chat.
