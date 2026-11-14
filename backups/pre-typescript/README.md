# Online Games

Investigation of the Lemon Web Vice City build and mobile/browser feasibility across GTA, Resident Evil and representative AAA games.

- [Technical report](analysis/GAME-FEASIBILITY.md): findings, evidence boundaries, game-family matrices and runtime test plan.
- [Launcher and device feature checks](index.html): opens the actual external Vice City page; does not contain or silently download a game.
- [REA evidence extract](analysis/evidence/rea-summary.json).
- [WABT tool smoke test](analysis/evidence/wabt-smoke-test.txt), explicitly using a synthetic module, not GTA.

## Preview

```sh
python3 -m http.server 8000 --bind 0.0.0.0
```

Open the preview and select **Open external Vice City** to visit the original deployment, or run browser feature checks. This is a static investigation page, not a self-hosted game. Feature checks do not benchmark gameplay.

## Reproduce static analysis

The tools below were run in disposable `/tmp` locations, not vendored into Git. Native REA decompilers were unavailable. WABT npm version obtained was 1.0.39; REA's separate WASM provider requires its own configured 1.0.42 installation and was not used successfully.

```sh
git clone https://github.com/Lolendor/reVCDOS.git /tmp/reVCDOS
# Verify the analyzed revision before comparing evidence:
git -C /tmp/reVCDOS rev-parse HEAD
# Analyzed: 95f14ef3c1d0a872ecd0881544cc7e1f55cb1946
npm install --prefix /tmp/rea-tools rea-agents@6.9.0
/tmp/rea-tools/node_modules/.bin/rea doctor
# doctor reports absent native backends; JS analysis can still run:
/tmp/rea-tools/node_modules/.bin/rea analyze-javascript-application /tmp/reVCDOS/dist --format json > /tmp/rea-js.json
npm install --prefix /tmp/wasm-tools wabt@1.0.39
# With a lawfully obtained, decoded engine binary:
# /tmp/wasm-tools/node_modules/.bin/wasm-validate /path/to/engine.wasm
# /tmp/wasm-tools/node_modules/.bin/wasm-objdump -x /path/to/engine.wasm
```

Do not commit raw semantic dumps, commercial game data, save keys or large downloaded binaries. The inspected upstream is not a byte-identical capture of the live site. No gameplay or phone FPS measurements have been completed.

## AFTERHOURS cinematic collection

The homepage is now an original, responsive game-launcher design with locally generated cinematic background art (`assets/vice-city.jpg`), a first-visit dismissible intro, family filters, accessible launch dialogs, motion preferences and device feature checks. `style.css` and `app.js` require no build step. The live static server command above still applies.

### Availability and controls

Six cards are included: the previously identified GTA/Resident Evil catalog titles, the direct Vice City endpoint, and the user's supplied GTA V URL. This is **not** a claim that all franchise titles are hosted or playable. No unverified direct emulator URLs were fabricated. Catalog anchors are discovery shortcuts, not guaranteed launch APIs; the user may need to search on the host.

The GTA V URL returned the general Lemon catalog during inspection. Its card explicitly warns of this. No full GTA V mobile support was implemented or verified. Launches open the original host in a new tab; no proxy, iframe input injection, game modification, ownership-flag changes or commercial asset redistribution is included. The browser same-origin boundary prevents this site's UI from delivering arbitrary keyboard/touch input into that external page. Host touch controls or a host-supported controller are the actual input options.

### Design / dependencies

Implementation is original, not a copied commercial template. Pico CSS was checked as an open-source template/style reference (GitHub reports MIT at https://github.com/picocss/pico); no Pico code was incorporated. Native HTML dialogs and CSS animations avoid adding an animation/framework dependency. Optional Google Fonts have system/Impact fallbacks. Card cover images are external and degrade to styled text art on errors. The hero art is generated locally, not a game screenshot. No analytics are included.

### Checks performed

- `node --check app.js` and `git diff --check` passed.
- JSDOM interaction tests passed: six cards, first-visit intro/exit, GTA/RE filters, launch dialog open/close, unchanged Vice City and GTA V URLs, GTA V availability caveat and motion preference.
- Real-browser visual testing and game/device FPS benchmarks have not been completed. DOM tests do not establish those results.
