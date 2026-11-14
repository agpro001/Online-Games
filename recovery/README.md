# Website recovery — actual status

Date: 14 November 2026.

## Recovered now

`vice-city-wrapper-source.tar.gz` contains **35 public upstream source files (1,440,451 uncompressed bytes)** plus a recovery manifest. The credited upstream commit is `95f14ef3c1d0a872ecd0881544cc7e1f55cb1946`, https://github.com/Lolendor/reVCDOS . Archive size is approximately 233 KiB. This is the public matching wrapper, **not a byte-identical recovery of the user's deployed site or private server**.

Contents: HTML, Emscripten JavaScript glue, language metadata, touch-control code, Python/PHP serving code, helper scripts, original README and MIT license (Alexey Olendor, 2025). Code was copied unchanged, not executed. Each source file's SHA-256 was verified after copying and again inside the archive. Archive-level checksum: `vice-city-wrapper-source.tar.gz.sha256`. Human-readable provenance/file checksums: `vice-city-source-manifest.json`.

The temporary extracted working copy is ignored by Git; the source archive, manifests and this document are deliverables. It is intentionally **not installed into public/games or offered as playable**. The recovered code still references original upstream services/configuration; it has not undergone a deployment security review. It also contains original ownership-related UI/state code. Preserving that source is not an entitlement grant; no ownership setting was enabled and no full-game flow was bypassed.

## Not recovered / still required

- Vice City language-specific WASM engine, including the inspected `/vcbr/vc-sky-en-v6.wasm.br` path or the corresponding Russian build.
- `/vcsky/` game data compatible with that exact runtime (metadata does not contain the actual textures, audio or maps).
- Site-specific server configuration, keys, databases and saves. Never upload secrets into chat or commit them to this repository.
- GTA V: supplied URL returned the general catalog again, not an executable game page.
- Other commercial games: no engine/game-data archives found in this repository. A catalog entry is not a recovered game.

The page-extraction tool can read the supplied page content. This execution environment's outbound policy does not permit direct binary downloads from lemon-web.net or the DOS Zone asset hosts. No binary payload request from those hosts succeeded in this recovery pass; no protected files were extracted. The source archive is not enough to run the game, and a playable installation is **not claimed**.

`installed-runtime-inventory.json` is an actual read-only inventory of `public/games`: it finds only the three original Input Laboratory files and no WASM engine or commercial game data.

## Next input needed from surviving hosting

A lost computer does not necessarily mean the server copy is lost. From your hosting provider's File Manager/backups, export the deployed game directory and relevant asset directories (or request a backup from hosting support). Start with Vice City, not an unbounded dump of all accounts. Upload a ZIP/TAR of files you are authorized to host, with passwords/tokens/databases/private saves excluded. Do not paste hosting credentials in chat.

For this build, preserve the relationship between `dist/`, the `/vcbr/` engine resources and the `/vcsky/` asset layout. A `public_html` export containing only the HTML/UI will still be incomplete when assets are served from separate storage/CDNs. Generic installed Windows game files are not automatically in the required browser format.

Once those files are supplied: inventory them locally, verify engine bytes/compression and dependency paths, configure the correct serving routes, test original game loading, then wire the runtime into the hub. Do not mark available based only on file presence.

## Reproduce public source recovery

```sh
git clone --depth 1 https://github.com/Lolendor/reVCDOS.git /tmp/revcdos-recovery
# Recovery requires the clean audited revision recorded above; it refuses a changed/new revision.
npm run recovery:source -- /tmp/revcdos-recovery /path/to/new-output-folder
```

The recovery script copies an explicit source allowlist, skips symlinks, retains the license, checks revision/cleanliness, computes hashes and refuses overwrite. It does not clone/download/extract game assets, run upstream scripts or modify the active website.

## Inspect a supplied backup locally

After you have safely unpacked your own backup into a separate staging folder:

```sh
npm run recovery:inventory -- /path/to/staging
# Or use the direct command for clean JSON redirection:
node tools/inventory-backup.mjs /path/to/staging > /path/outside/staging/inventory.json
```

This enumerates files/sizes, classifies possible engines/data/archives/configs, skips symlinks and known build directories, and reads only eight bytes to check one plain WASM header. It does not execute files, extract archives or upload anything. File presence/header is not a complete-runtime or entitlement check. Do not put the output inside the directory being scanned, and review private filenames before sharing any report.

No hub UI, game logic, missions, physics, assets, registry availability or existing saves were modified during this recovery pass.
