# Integrating an authorized build

1. Establish engine, assets and hosting rights. A commercial game copy alone need not grant redistribution rights. Do not fetch game data from an unaudited CDN on behalf of users.
2. Place your authorized browser build under `public/games/<id>/`. That directory is ignored by Git except the original input lab. Keep commercial binaries/data in your own lawful deployment storage, not this repository.
3. Add a record to `data/games.json` using the exact schema in `src/games/types.ts`. Build validation rejects duplicate IDs and unsafe entry/reference URLs. `status: pending`, `launchMode: pending`, `entry: null` are the default for unavailable games. Mark `available` only after an authorized local build exists, has been tested, and satisfies the opt-in readiness protocol.
4. Current iframe adapter supports only same-origin `/games/...` entries. It is for **trusted, authorized** content, not hostile uploads. `allow-scripts allow-same-origin` permits game storage and the protocol; it is not isolation against a malicious same-origin document. For untrusted code use a separate origin and design an explicitly allowlisted adapter; do not weaken current origin checks.
5. Integrate a separate wrapper only if the runtime exposes a legitimate control/lifecycle API. Never rewrite missions, physics, assets or engine internals. A bridge message alone does not make arbitrary synthetic input trusted by a browser or game.

## Protocol v1

Every message: `{ channel: 'afterhours-v1', type, payload? }`. Both ends validate `event.origin` and `event.source`. The hub additionally allowlists message types and validates exported save data. Do not use wildcard postMessage targets.

Hub → runtime:
- `HUB_INIT {dpr}` after iframe load. The controlled wrapper should render its first frame, then send `GAME_READY`. A document load is not readiness.
- `HUB_CONFIG {dpr}` capped rendering quality, only for runtimes that support it.
- `HUB_INPUT {buttons: string[], axes:{x,y}, look:{x,y}}`. Values normalize to [-1,1]; mappings are in the game's registry entry. Keyboard, joystick and Gamepad API are independent merged sources. No synthetic navigator Gamepad object is created.
- `HUB_PAUSE`, `HUB_RESUME` request supported runtime pause. Only integrated runtimes receive these. External tabs cannot be paused by this shell.
- `HUB_SAVE_EXPORT` / `HUB_SAVE_IMPORT` are currently implemented **only for the original lab's position JSON**. Additional games need explicit format validation and capability adapters; do not reuse the lab save format for them.

Runtime → hub:
- `GAME_READY` after actual runtime initialization and first frame.
- `GAME_ERROR` with a bounded, nonsensitive string.
- `GAME_PAUSED`, `GAME_RESUMED` lifecycle acknowledgements.
- `EXIT_GAME` navigates back to details.
- `REQUEST_FULLSCREEN` displays a user-action prompt, never bypasses gesture requirements.
- `SAVE_EXPORT {format:'afterhours-input-lab',version:1,x,y}` only in the lab adapter.

See `public/games/input-lab/lab.js` for original reference implementation. It is an input diagnostic, **not a commercial game emulator, replacement or performance benchmark**.

## Input limits

Existing axis and keyboard mappings must correspond to the runtime's API. No look area is shown when no look mechanic exists. There is no fake pause button for external links. Rotation is recommended only when metadata declares it; no permanent orientation lock. Fullscreen rejection leaves a working windowed view. Per-runtime saves stay on their own origin; the shell never modifies commercial save formats.

## External references

`external` entries open an explicitly trusted HTTPS host in a new tab and record an **attempt**. They do not report LOADING/READY/PLAYING. `pending` entries expose research references separately from play. No iframe attempt bypasses host headers, CSP, CORS or authentication.
