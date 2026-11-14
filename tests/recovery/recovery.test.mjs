import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,symlink,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {Buffer} from 'node:buffer';
import {isSourceFile,listSource} from '../../tools/recover-wrapper.mjs';
import {inventory,kind} from '../../tools/inventory-backup.mjs';
test('source recovery includes code/license, never engine/data/media or Git',()=>{
 for(const path of ['LICENSE','server.py','dist/index.html','dist/modules/runtime.js','additions/cache.py'])assert.equal(isSourceFile(path),true,path);
 for(const path of ['dist/intro.mp4','dist/cover.jpg','dist/engine.wasm','dist/engine.wasm.br','.git/config','vcsky/game.rpf','dist/game.data','private/passwords.txt'])assert.equal(isSourceFile(path),false,path);
});
test('recovery traversal hashes actual code bytes and skips symlinks',async()=>{
 const root=await mkdtemp(join(tmpdir(),'afterhours-source-test-'));
 try{await mkdir(join(root,'dist'));await writeFile(join(root,'LICENSE'),'fixture license');await writeFile(join(root,'dist','game.js'),'fixture source');await writeFile(join(root,'dist','asset.wasm'),'not source');await symlink(join(root,'LICENSE'),join(root,'dist','linked.js'));const files=await listSource(root);assert.deepEqual(files.map(f=>f.path),['dist/game.js','LICENSE']);assert.equal(files[0].bytes,14);assert.match(files[0].sha256,/^[a-f0-9]{64}$/);}finally{await rm(root,{recursive:true,force:true});}
});
test('backup inventory distinguishes archives, databases, compressed engines and data',()=>{
 assert.equal(kind('vcbr/vc-sky-en-v6.wasm.br'),'wasm-engine');assert.equal(kind('backup.tar.gz'),'archive-not-inspected');assert.equal(kind('cloud.sql'),'database-do-not-publish');assert.equal(kind('vcsky/models/gta3.img'),'possible-game-data');assert.equal(kind('index.html'),'code-or-config');
});
test('inventory reads an actual WASM header without claiming gameplay or following links',async()=>{
 const root=await mkdtemp(join(tmpdir(),'afterhours-backup-test-'));
 try{await writeFile(join(root,'engine.wasm'),Buffer.from([0,97,115,109,1,0,0,0]));await writeFile(join(root,'backup.zip'),'not unpacked');await symlink(join(root,'engine.wasm'),join(root,'linked.wasm'));const report=await inventory(root);assert.equal(report.counts['wasm-engine'],1);assert.equal(report.counts['archive-not-inspected'],1);assert.equal(report.skippedSymlinks,1);assert.equal(report.firstPlainWasmHeader.headerValid,true);assert.match(report.playability,/NOT DETERMINED/);}finally{await rm(root,{recursive:true,force:true});}
});
