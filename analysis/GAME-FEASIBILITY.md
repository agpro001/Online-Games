# Browser and mobile game investigation

Date: 14 November 2026. Scope: Lemon Web Vice City, the major GTA and Resident Evil releases and spin-off families, and representative demanding AAA games.

## Executive conclusion and evidence limits

The Vice City page is a real browser-engine integration, not merely an HTML imitation: its inspected upstream contains Emscripten JavaScript, a WASM instantiation path, a virtual game filesystem, graphics/audio bindings, streaming assets and touch controls. However, **I did not run the game or inspect the actual deployed WASM binary**. The live page was read through the page-fetch tool; source inspection and REA analysis used the matching credited upstream. Matching credits and architecture are strong identification evidence, not proof of byte-for-byte equality with Lemon's deployment.

The sandbox cannot directly fetch Lemon/DOS Zone game payloads because outbound network access is restricted. No original game files were supplied. Therefore gameplay, mission completion, FPS, mobile compatibility and the contents of the remote engine binary remain unverified. A launcher/feature-check page is supplied, clearly separate from an installed game.

**Best mobile routes:** official native releases where available; PS1/PSP emulation for older games; experimental browser ports only after device testing; streaming from an owned PC for the largest titles. A browser listing does not prove a native browser port. A phone playing a video stream does not mean the game runs on its processor.

“Possible” below is an engineering assessment, not a performance benchmark or a promise that a playable port already exists. Store availability varies by region, device and date. This is a family-level survey, not binary analysis of every edition, DLC, arcade release or regional mobile variant.

## 1. Reverse-engineering tools actually used

- Installed `rea-agents` npm package 6.9.0; CLI reports REA 6.7.0. Ran `rea doctor`: native decompilation engines Hopper/Ghidra/IDA/Jadx/Kuna are absent. Installing REA alone does not install those engines.
- **Successfully ran** `rea analyze-javascript-application /tmp/reVCDOS/dist --format json`. The upstream directory inventory processed 21 selected application files and produced an 86 MB evidence envelope. Its application graph contains 85 nodes: 28 JavaScript-module, 21 endpoint, 20 asset, 9 storage, 4 unknown, 2 artifact and 1 electron-renderer node. These are analyzer classifications, not proof this browser app is Electron or that every discovered endpoint executes.
- Saved a compact, source-identified evidence extract in `evidence/rea-summary.json`; excluded the huge raw AST/semantic output from Git.
- Installed open-source WABT through npm in `/tmp/wasm-tools`; `wasm-objdump --version` reports 1.0.39. Validated/disassembled a synthetic 41-byte add-function WASM module as a tool smoke test. **That sample is not GTA.** Output: `evidence/wabt-smoke-test.txt`.
- REA's WASM provider requires a separately configured absolute WABT 1.0.42 directory. That provider was not operational with this installation. No GTA disassembly/decompilation was performed.
- Inspected upstream source and Emscripten glue with Python, grep and Git; also cloned a re3 reference tree. No DRM/ownership checks were bypassed and no game assets were redistributed.

Analyzed upstream: https://github.com/Lolendor/reVCDOS at commit `95f14ef3c1d0a872ecd0881544cc7e1f55cb1946`.

Tool references: https://github.com/morluto/rea and https://github.com/WebAssembly/wabt .

## 2. Vice City: reconstructed architecture

Target: https://www.lemon-web.net/html5games/grandtheftautovicecity/dist/

```text
index.html + game.js + index.js
  ├─ touch/gamepad overlay, canvas, settings, language
  ├─ Emscripten runtime + filesystem + graphics/audio/event bindings
  ├─ WebAssembly.instantiate(engine bytes)
  │    └─ reVC engine → WebGL, OpenAL-style audio, browser input
  ├─ /vcsky/ asset requests → game data → virtual /vc-assets/local/
  ├─ /vcbr/ compressed payload requests → engine/data
  └─ IndexedDB / Cache API / localStorage → saves, cache, preferences
       optional js-dos cloud-save integration
```

### Identification

The page credits DOS Zone contributors @specialist003, @caiiiycuk and @SerGen and deobfuscation by @Lolendor. The matching repository is reVCDOS. reVC is the reverse-engineered C++ Vice City engine associated with the re3 project, compiled for the browser through Emscripten; this is not evidence that the original Windows executable runs inside the page. A re3 engine reference exists at https://github.com/Hezkore/hez-gta-re3 . An independent browser-port reference is https://github.com/origami-ltd/wasm-revc .

The inspected wrapper repository includes an MIT license, copyright 2025 Alexey Olendor. **That license does not grant rights to Rockstar's game data or establish the license/provenance of every engine component.** Ownership of a website or a game copy is not blanket permission to redistribute game assets.

### Boot and payload path

`index.js` loads runtime, language packages, loader, filesystem, audio, graphics, events, fetch, language-specific asm constants and main modules. `main.js` invokes `createWasm(); run();`. `game.js` supplies an `instantiateWasm` override and requests language-specific engine payloads, including `/vcbr/vc-sky-en-v6.wasm.br` and `/vcbr/vc-sky-ru-v6.wasm.br`.

The upstream rewrites DOS Zone asset paths to same-origin `/vcsky/` and `/vcbr/`. Its Python/PHP serving paths support proxying, caching and packed/local assets. The game data is **not included in the inspected source checkout**. The code's `130 * 1024 * 1024` progress value is a configured download estimate, not a measured complete install size, decoded memory requirement, or proof all content is available.

`loader.js` builds `/vc-assets/local/` folders for animation, map data, models/collision, fonts, MP3, skins, text and texture dictionaries. Emscripten glue exposes typed heaps and browser graphics/audio/input integration. The exact deployed graphics context/version and WASM imports/memory limits require runtime capture or the real binary to verify.

### Controls, settings and persistence

- `GamepadEmulator.js` supplies a touch overlay; canvas pointer-lock and context-loss handling exist. Touch UI existing does not prove phone GPU/browser compatibility.
- Parameters include `lang`, `cheats`, `max_fps`, `fullscreen`, `configurable` and `request_original_game`. `max_fps=0` means unlimited in the inspected limiter, not an unlocked hardware capability.
- Optional cheats UI is loaded separately. No need to enable it to evaluate compatibility.
- Cache API stores fetched resources; IndexedDB filesystem code persists files. Local-storage keys include save/settings/ownership-related state and a cloud-save key.
- Cloud saves and browser storage introduce privacy and durability considerations. Export saves before clearing storage or switching origins. Do not use a short cloud key as a strong authentication secret.
- The UI distinguishes demo/full-game ownership. Keep that distinction; a client-side flag is not proof of entitlement. I did not alter it or force full-game mode.

### Hosting and reliability findings

1. Serving only `dist/` with a generic file server is insufficient when absolute `/vcsky/` and `/vcbr/` endpoints are absent.
2. Verify whether `.br` bytes are decoded in code or by HTTP `Content-Encoding`; wrong headers/double decoding can break WASM compilation. Check the decoded magic `00 61 73 6d`, not just the filename.
3. WASM MIME, HTTPS, CORS, cache versioning, and any threaded build's cross-origin isolation must match its actual build requirements. Do not assume all reVC builds require threads.
4. An external proxy is a trust and availability dependency. Restrict upstream hosts and avoid turning the server into a general open proxy.
5. Game code, maps, decoded textures, audio and browser GPU allocations consume much more RAM than compressed transfer size suggests. Long sessions and context-loss recovery need testing.
6. Running upstream code that downloads commercial data is not equivalent to possessing redistributable assets. Prefer a documented user-supplied-data workflow.

## 3. GTA family: mobile/browser feasibility

Legend: **Native** = official mobile edition exists, subject to store/device support; **candidate** = engineering route, not verified playable here; **stream** = game executes on a PC/server.

| Game/edition | Local mobile route | Browser assessment |
|---|---|---|
| GTA (1997) | DOS/PS1 emulation candidate | DOS/PS1 emulator feasible; lawful assets and control setup required |
| GTA London 1969 / London 1961 | DOS/Windows-era compatibility or emulation | Version-specific DOS/PC work; not equivalent to a reVC port |
| GTA 2 | PS1 emulation candidate | PS1 emulator plausible; PC executable is not automatically WASM |
| GTA III classic | Native Android/iOS; re3-based alternatives require assets | Mature engine-port family; test the particular build |
| Vice City classic | Native Android/iOS; inspected reVC browser integration | Strong browser candidate; Lemon gameplay not tested |
| San Andreas classic | Native Android/iOS | No complete audited SA browser engine established here; reVC cannot simply load SA maps/scripts |
| GTA Advance | GBA emulation | Lightweight GBA browser-emulator candidate |
| Liberty City Stories | Native Android/iOS; PSP emulation alternative | PSP browser emulation is more demanding; not a reVC drop-in |
| Vice City Stories | PSP emulation on capable phones | Browser PSP route experimental/device-dependent |
| Chinatown Wars | Native Android/iOS; DS/PSP alternatives | DS/PSP browser emulation candidate, controls differ |
| GTA IV + The Lost and Damned + The Ballad of Gay Tony | PC streaming practical; Android Windows-translation experiments device-specific | No reproducible audited local browser build established in this investigation |
| GTA V Legacy / Enhanced | Streaming practical; local compatibility experiments are not official mobile releases | Browser-port claims exist, but their source completeness, asset provenance and full gameplay were not verified |
| GTA Online | Stream an eligible supported PC/console version | Single-player reimplementation does not provide official service compatibility; anti-cheat/account restrictions matter |
| Trilogy Definitive Edition (III / VC / SA) | Official mobile editions exist, device/access terms vary | Different modernized build; classic reVC findings do not establish browser support |
| GTA VI | No local mobile build verified in this work | Do not infer support from fake APKs or browser launchers; recheck official platforms rather than assuming a port |

Official LCS/Chinatown mobile references: https://www.rockstargames.com/games/libertycitystories and https://www.rockstargames.com/games/chinatownwars .

**Important correction to speculative GTA V claims:** https://github.com/jerryjuche/Grand-V describes memory64, shared workers, WebGPU, desktop 8 GB minimum/16 GB recommended and experimental mobile support. These are **repository claims, not independently validated results**. The inspected search listing shows a README-only file listing, not enough evidence for a reproducible engine build. Do not treat claims of a tiny download containing the complete game, or a video of gameplay, as proof. Obtain buildable source, validate payloads and network traffic, disable networking after caching, and compare real gameplay before accepting a local-browser claim. No GTA V launcher executables were run.

## 4. Resident Evil family

Originals, remakes and remasters are materially different software. A working PS1 emulator does not imply RE Engine support.

| Game/family | Local mobile route | Browser assessment |
|---|---|---|
| RE1 / Director's Cut / DualShock | PS1 emulation candidate | Feasible PS1-emulator class; Lemon catalog listing is not a tested port |
| RE2 (1998) | PS1 emulation candidate | Same; multiple discs/saves need handling |
| RE3 Nemesis | PS1 emulation candidate | Same; no target-specific binary analysis performed |
| Survivor | PS1 emulation candidate | Technically plausible; aim/input mapping matters |
| Code: Veronica / X | Dreamcast/PS2 emulation on capable devices | More demanding; not equivalent to the PS1 route |
| Survivor 2 Code: Veronica | PS2 emulation on strong Android hardware, game-specific | Browser port not verified |
| Gaiden | Game Boy Color emulation | Lightweight browser-emulator candidate |
| RE1 remake / HD Remaster | GameCube emulation for original remake; other editions differ | GameCube/browser experimental; no audited full browser build here |
| RE0 / HD Remaster | GameCube emulation for original release | Same distinction; HD PC build does not inherit emulator compatibility |
| Dead Aim | PS2 emulation candidate | No verified browser build; gun/aim controls need redesign |
| Outbreak / Outbreak File #2 | PS2 emulation or recompilation candidates | Outbreak·Web is reported; third-party source/data licensing and mobile performance remain unverified |
| RE4 (2005) / Wii / HD | GameCube/Wii emulation on capable phones; historical mobile editions differ | Browser emulation/recompilation requires specific engineering; not the 2023 remake |
| The Umbrella Chronicles / The Darkside Chronicles | Wii emulation candidate on capable Android devices | Motion/aim input and GPU cost make mobile browser support difficult |
| RE5 | Streaming practical; local Windows translation experimental | No audited full local browser port established |
| The Mercenaries 3D | 3DS emulation candidate, device/version dependent | More experimental than PS1; no verified target build |
| Revelations | Original 3DS emulation candidate; HD editions differ | 3DS browser route unverified here |
| Operation Raccoon City | Streaming; local PC-translation experiments | No verified local browser port |
| RE6 | Streaming; local translation experiments | No verified local browser port |
| Revelations 2 | Streaming or platform-specific emulation experiments | No verified local browser port |
| Umbrella Corps | Streaming if owned/service modes available | No verified local browser port |
| RE7 biohazard | Official supported Apple-device edition exists | Native Metal port does not imply WebGPU/browser availability |
| RE2 remake | Official supported Apple-device edition exists | No audited browser build established |
| RE3 remake | Official supported Apple-device edition exists | Same |
| RE Village / Winters' Expansion | Official supported Apple-device edition | App Store lists A17 Pro-or-later/M-series compatibility classes; check exact device listing |
| RE4 remake / Separate Ways | Official supported Apple-device edition | Not the old RE4 mobile game; browser support not established |
| Resistance / Re:Verse | Service availability must be checked; cannot assume online modes still operate | Hosting an old client cannot restore a closed proprietary service |
| RE Requiem / newer releases | Exact supported-platform/device verification still required | Not evaluated at binary level; no local browser compatibility established |
| Legacy phone titles (Missions, Confidential Report, Assault the Nightmare, Degeneration, Genesis, Mercenaries VS and related variants) | Java/BREW/Symbian/iOS-specific preservation; availability/architecture varies | Case-by-case runtime/reimplementation; not covered by PS1 compatibility |

Capcom's Apple portal: https://www.residentevil.com/apple/ . Village listing: https://apps.apple.com/us/app/resident-evil-village/id6450980545 . The listing distinguishes the small initial app from additional game downloads and recommends controller use. Do not use the storefront app size as the installed game size.

Outbreak evidence: https://github.com/DJTOMATO/reoutbreakdesktop documents a desktop Electron wrapper around Outbreak·Web with WebGPU, streamed disc chunks, IndexedDB cards and recent WASM features. It is **not** proof the complete game integration is open source or mobile-tested. https://github.com/Jacksonmlol/ResidentEvilPort is another toolchain reference, not a Capcom asset license. Prefer user-owned disc extraction and auditable integrations.

## 5. Representative large AAA games

These are route assessments, not claims that current store versions were installed or benchmarked.

| Title/family | Practical mobile route | Local-browser outlook |
|---|---|---|
| Cyberpunk 2077 / Phantom Liberty | PC/cloud streaming where supported | No audited full local port established; high GPU/memory/asset cost |
| Red Dead Redemption 2 | PC/console streaming | Modern RAGE complexity; reVC does not generalize to it |
| The Witcher 3 | Streaming; high-end Android PC-translation experiments | No audited full local browser build established |
| Elden Ring | Streaming; translation experiments require per-device testing | Graphics/API, shader, memory and service constraints |
| Baldur's Gate 3 | Streaming; experimental translation | CPU, large assets and memory pressure; no verified browser build |
| Starfield / Hogwarts Legacy | Streaming | Not a credible drop-in Emscripten conversion |
| Doom (1993) / Quake | Open-source engine ports with owned data | Excellent browser/mobile candidates; commercially released classics, not modern AAA workloads |
| Doom Eternal | Streaming/experimental translation | Entirely different engine requirements from Doom 1993 |
| Half-Life / Half-Life 2 / Portal | Community engine-port routes, with owned data | Audit exact engine, completeness and license; catalog presence proves little |
| Alien: Isolation | Official mobile-port route on supported devices | Native port is evidence of mobile feasibility, not browser availability |
| Death Stranding / Assassin's Creed Mirage | Supported Apple native editions are relevant routes; verify current device/store list | Native Metal code needs substantial browser adaptation |
| Fortnite / Genshin-class games | Official mobile client where supported, or streaming | Proprietary online backend/anti-cheat; cannot infer browser support from engine name |

A phone can run an impressive native port while failing a browser build of the same game because native apps use different graphics backends, memory budgets, shader pipelines and platform APIs. Conversely, old engines can run well in a browser with relatively little data.

## 6. What a trustworthy mobile test must measure

Initial test settings, not measured results: start Vice City at 30 FPS, low draw distance and roughly 640×360 to 960×540 internal resolution, then adjust on actual hardware. Do not equate CSS canvas size with render resolution.

Test at least a low/mid/high Android tier and an eligible iPhone/iPad; record exact SoC, RAM, OS, browser, build hash and screen resolution. RAM alone is not a sufficient predictor.

1. Record WebAssembly/WebGL/WebGPU support, secure context, cross-origin isolation and storage availability. Feature detection is necessary but not sufficient.
2. Capture network requests, response headers and payload hashes. Identify every external origin and distinguish streamed video from assets/WASM.
3. Inspect the actual decoded WASM with `wasm-validate`, `wasm-objdump -x` and, when useful, `wasm2wat`/`wasm-decompile`. Record imports, exports, memory min/max, shared flag, tables and required proposals. Names can be stripped; output is not original C++ source.
4. Measure cold and warm boot, transfer bytes, peak memory where measurable, steady-state frame times and p95/p99 stalls. FPS averages conceal streaming pauses.
5. Run 20–30 minutes of driving/combat/interior transitions; check temperature, battery drain, audio underruns and thermal throttling.
6. Test multi-touch, controller, pause/resume, orientation, incoming interruptions, background tab recovery and graphics context loss.
7. Save, close the tab, reopen, verify and export/import. Test low storage and cache eviction. Private mode may behave differently.
8. After caching, test offline intentionally: boot, multiple islands, missions, radio and cutscenes. Opening one cached scene does not prove full offline support.

## 7. Loading the real game: current state and next inputs

Open the original URL through the supplied launcher in your own browser. That opens the actual third-party deployment, **not a locally installed or verified full game**. Respect its demo/ownership flow. I cannot certify the remote site's safety, entitlement checks or uptime.

For a reproducible local build, the next missing inputs are the engine payload and legally usable asset directory in the exact format expected by the upstream. Supplying ordinary retail files may require a documented importer; do not assume they are already `/vcsky/`-ready. Use the upstream server's local-directory options only after validating that layout, configure compression and isolate data from Git. No ownership flag manipulation is necessary or appropriate.

Once those files are available, the next work is binary inspection, request tracing, a real first playable boot, and measured testing on the user's phone. Until then, the honest status is **source analyzed; game runtime untested**.
