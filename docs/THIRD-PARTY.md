# Assets, tools and references

- **Barlow Condensed**, Jeremy Tribby and contributors, SIL Open Font License 1.1, distributed via `@fontsource/barlow-condensed`. Full license: `licenses/Barlow-OFL.txt`. Used as self-hosted typography; not sold on its own.
- **Hero environment artwork**: AI-generated for this project, stored locally. Not a gameplay screenshot or copied game texture. Original geometric icons are project-created.
- **Application dependencies/tooling**: Vite (MIT), TypeScript (Apache-2.0), Vitest (MIT), ESLint (MIT), Prettier (MIT), Playwright (Apache-2.0), JSDOM (MIT), associated transitive licenses in installed packages. Exact versions/integrity in package-lock.json; no third-party engine/assets bundled.
- **Research only, no portal/template code copied**: Tickle https://github.com/theshaneobrien/tickle and Pico CSS https://github.com/picocss/pico . Registry/detail/iframe separation is a general architectural pattern. No template code, auto-patching, commercial art or emulator core was incorporated.
- **Reverse-engineering tools/references**: REA https://github.com/morluto/rea and WABT https://github.com/WebAssembly/wabt . Research findings do not grant game redistribution rights. Prior upstream analysis: https://github.com/Lolendor/reVCDOS at commit recorded in architecture report.
- **Chromium QA**: temporary `@sparticuz/chromium` npm distribution used outside repository because the Playwright CDN was blocked. Its binaries and support libraries are not shipped with the website or committed. Chromium renderer ran headless with software GPU settings, not mobile hardware.

Rockstar, GTA, Capcom and Resident Evil names identify compatibility targets. The project is independent and does not claim endorsement. A source-code wrapper license is not an asset license. Historical backups contain external image URLs from the earlier launcher, but active website code does not fetch those images or bundle them.
