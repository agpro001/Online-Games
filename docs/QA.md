# QA and acceptance report

14 November 2026. Status: **launcher infrastructure implemented and tested; commercial integration and physical-device acceptance remain pending**.

## VERIFIED commands

- `npm run build`: strict TypeScript passes; Vite production bundle succeeds.
- `npm run lint`: passes with no warnings.
- `npm test`: **33 passing unit tests**.
- Chromium Playwright suite: **36 passing browser tests**, nine scenarios in each of four contexts. Assertions include no uncaught page exceptions.
- `git diff --check`: passes.
- `npm audit --omit=dev`: reported 0 production dependency vulnerabilities at the time run. Full dev dependency audit request timed out; no clean full-audit claim.

The normal Playwright browser download failed because cdn.playwright.dev is not on the sandbox's outbound allowlist. The browser tests instead used **Chromium 153.0.8010.0**, supplied through a temporary npm @sparticuz/chromium package, with temporary shared libraries and software rendering flags. Binaries, results directories, node_modules and dist are not committed.

Reproduction in this sandbox after the temporary browser installation:

```sh
LD_LIBRARY_PATH=/tmp/al2023/lib CHROMIUM_PATH=/tmp/chromium npm run test:e2e
```

On an unrestricted development machine, `npx playwright install chromium` then `npm run test:e2e` is the normal route. Physical phone performance cannot be extrapolated from this Chromium binary or its software GPU.

## Unit coverage

Registry/schema/duplicate IDs, explicit URL trust policy, unsafe URL rejection, search, hash routes/malformed encoding, blocked/corrupt/valid storage, held-input source merging, axes clamping/dead zone/normalization, joystick reset/cleanup, compatibility status boundaries, state-machine transitions, message origin/source/protocol filtering, fullscreen fallback/denial, missing-runtime error/cleanup, orientation recommendation, gamepad mapping and bounded readiness timeout. JSDOM lacks some browser APIs; explicit mocks cover those unit boundaries, while actual browser iframe/Pointer Events/storage/fullscreen paths are covered separately below.

## Browser scenarios (all four contexts)

1. 51-entry library, search, details, favorites persistence, pending GTA V status/reference.
2. Local authorized runtime readiness handshake, rendered canvas, pause/resume, iframe removal on exit, recent local-session record.
3. Settings persistence, LOW profile, diagnostics IndexedDB transaction, local frame sample and no document overflow in tested view.
4. Cinematic replay, skip and persisted intro preference.
5. Forced entry HTTP 404, useful failure state, retry into a working runtime.
6. Actual keyboard movement updates marker position, then Chromium DevTools touch events hold joystick and Confirm simultaneously and the runtime receives both. This is real browser pointer input but still simulated hardware, not a physical multi-touch phone test.
7. Production service-worker registration/control, shell cache content inspection, no `/games/` cache entries and offline shell reload with OFFLINE status.
8. User-gesture fullscreen API: either actual entry with visible in-viewport Window/Exit controls and exit, or an explicit browser refusal/unavailability message. This test does not claim every mobile platform grants fullscreen.
9. Real lab JSON download and validated import restores marker position. No commercial save compatibility claimed.

Readiness is an authorized wrapper's first-render message. The suite also observes the real Canvas element and movement persistence; it does not compare screenshot pixels to commercial-game output. A missing readiness message yields an error, not pretend success. The initial entry HTTP request is also bounded.

## Viewport matrix

| Context | Browser engine actually used | Result | Limit |
|---|---|---|---|
| Desktop Chrome preset, 1280×720 | Headless Chromium 153 | 9/9 | Not branded Chrome/Edge binaries |
| iPhone SE preset, 375×667 | **Chromium**, not WebKit | 9/9 | Layout/touch/UA emulation only, not iOS Safari |
| Pixel 7 preset, 393×727 viewport | Chromium | 9/9 | Not physical Android, no thermal test |
| iPad Mini preset, 768×1024 | **Chromium**, not WebKit | 9/9 | Layout/tablet touch emulation only |
| Additional 390×844 and 1440×1000 screenshots | Chromium | Visually inspected | No sustained performance claims |
| Large Android physical phone | Not available | NOT TESTABLE | Must test real GPU/OS/browser |
| Chrome Android / Firefox Android / Samsung Internet | Not available as actual platform browsers | NOT TESTABLE | Do not infer from mobile UA |
| Edge desktop / Firefox desktop / Safari/WebKit | Not executed | NOT TESTABLE | Requires cross-engine QA |

All commercial games remain **Untested**, including mobile GTA V. API presence is not a performance classification. No Playable/Good/Excellent rating has been fabricated.

## Bundle / asset observations

Before gzip: main JS approximately 90.5 kB (includes full 51-entry registry), CSS approximately 26 kB, lazy diagnostics approximately 3 kB. Main JS gzip approximately 19 kB. Latin WOFF2 approximately 22.4 kB; generated hero approximately 188 KiB. No giant videos, game downloads or external cover/font requests are part of the shell. No Three.js or continuous shell WebGL renderer. Build output filenames and exact byte counts change with content.

The diagnostics sample measures callback intervals on the current device only. It is not a 20-minute load test, battery/temperature reading or proof of the target 60 FPS on all hardware.

## Acceptance checklist

- [x] Cinematic intro, skip, persistent preference and replay
- [x] Home, registry, GTA/RE categories, game detail routes
- [x] Authorized original local input runtime launches; external references remain separate
- [x] Fullscreen API with fallback and accessible exit controls
- [x] Responsive tested viewports / safe-area CSS
- [x] Opt-in virtual controls, joystick and multi-pointer browser test
- [x] Orientation recommendation and cleanup tested at unit boundary
- [x] Shell performance profiles, settings, local diagnostics
- [x] Favorites, recent local sessions and labeled external attempts
- [x] Instant title/series/tag/alias search and metadata filters
- [x] Install manifest/icons, worker, bounded shell cache, verified offline shell
- [x] Error/retry, readiness timeout and runtime cleanup
- [x] No proprietary game assets copied or game logic modified
- [x] No fabricated loading percentages, fake FPS or unsupported game availability
- [x] Production build, lint, unit tests and Chromium desktop/emulated-mobile QA
- [ ] Authorized GTA/Resident Evil runtime/asset integration — awaiting files and rights
- [ ] Physical mobile QA / sustained performance / thermal/battery testing
- [ ] Firefox, Safari/WebKit, Edge and Samsung Internet execution
- [ ] Physical PWA install/update UX and browser-specific fullscreen/audio policies
- [ ] Sustained 60 FPS shell target measured on representative real devices

## Remaining technical boundaries

- Website shell and lab do not grant engine or asset redistribution rights.
- Arbitrary cross-origin games cannot receive this origin's injected input, pause/audio commands or save exports. No restrictions are bypassed.
- The same-origin iframe sandbox is for trusted content, not malicious uploads. Separately isolate untrusted future runtimes.
- Legacy phone variants are grouped; registry is not a definitive list of every regional SKU/DLC. Release-year placeholders explicitly identify unaudited newer titles.
- No licensed music/ambience or video assets supplied; only original synthesized UI tone is implemented. No fake silent “music playback.”
- PWA update button, cache-cleanup action and capability failure paths exist; a complete browser-version upgrade/installation UX matrix still needs manual target-device validation.
