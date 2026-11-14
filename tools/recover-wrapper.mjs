#!/usr/bin/env node
/** Source-only recovery. Does not execute upstream code, proxy assets or fetch game data. */
import {readdir,readFile,mkdir,writeFile,lstat,copyFile,realpath} from 'node:fs/promises';
import {resolve,relative,join,sep} from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
export const REVISION='95f14ef3c1d0a872ecd0881544cc7e1f55cb1946';
const ROOT_FILES=new Set(['LICENSE','README.md','requirements.txt','server.py','index.php','.htaccess','docker-compose.yml','docker/Dockerfile']);
export function isSourceFile(path){return ROOT_FILES.has(path)||/^(dist|additions|utils)\/[^\0]+\.(js|html|py)$/.test(path);}
export async function listSource(root){
 const files=[];
 async function walk(dir){for(const item of await readdir(dir,{withFileTypes:true})){if(item.isSymbolicLink())continue;const path=join(dir,item.name),local=relative(root,path).split(sep).join('/');if(item.isDirectory()){if(['dist','additions','utils','docker'].some(p=>local===p||local.startsWith(p+'/')))await walk(path);}else if(item.isFile()&&isSourceFile(local)){const bytes=await readFile(path);files.push({path:local,bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')});}}}
 await walk(root);return files.sort((a,b)=>a.path.localeCompare(b.path));
}
export async function recover(source,output){
 source=await realpath(source);output=resolve(output);if(output===source||output.startsWith(source+sep)||source.startsWith(output+sep))throw Error('Source and destination must be separate directories');
 const revision=execFileSync('git',['-C',source,'rev-parse','HEAD'],{encoding:'utf8'}).trim();if(revision!==REVISION)throw Error('Unexpected upstream revision; inspect it before recovery');
 const status=execFileSync('git',['-C',source,'status','--porcelain'],{encoding:'utf8'});if(status.trim())throw Error('Upstream checkout has changes; use a clean verified source');
 try{await lstat(output);throw Error('Destination exists; refusing to overwrite recovered files');}catch(e){if(e.code!=='ENOENT')throw e;}
 const files=await listSource(source);if(!files.some(f=>f.path==='LICENSE'))throw Error('License missing');
 await mkdir(output,{recursive:true});for(const f of files){const dest=join(output,f.path);await mkdir(resolve(dest,'..'),{recursive:true});await copyFile(join(source,f.path),dest);const actual=createHash('sha256').update(await readFile(dest)).digest('hex');if(actual!==f.sha256)throw Error('Copy verification failed: '+f.path);}
 const report={schema:1,source:'https://github.com/Lolendor/reVCDOS',revision,scope:'Public credited upstream wrapper source, not a byte-identical backup of the live site',license:'MIT, copyright 2025 Alexey Olendor; see copied LICENSE',fileCount:files.length,totalBytes:files.reduce((n,f)=>n+f.bytes,0),files,excluded:['.git','cover.jpg','intro.mp4','game data','WASM engines','private server state','cloud save keys'],playability:'NOT VERIFIED / engine and game data absent',nextRequired:['Authorized language-specific /vcbr/ WASM payload','Authorized /vcsky/ resources in runtime-compatible layout','Any original host configuration and save backups'],note:'No files have been installed into the active hub, no upstream scripts executed, no game data fetched, no ownership flags changed.'};
 await writeFile(join(output,'RECOVERY-MANIFEST.json'),JSON.stringify(report,null,2)+'\n');return report;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 const [source,output]=process.argv.slice(2);if(!source||!output){console.error('Usage: node tools/recover-wrapper.mjs /path/to/clean/reVCDOS /new/recovery/folder');process.exitCode=1;}else{try{const report=await recover(source,output);console.log(JSON.stringify({output:resolve(output),files:report.fileCount,bytes:report.totalBytes,revision:report.revision,playability:report.playability},null,2));}catch(e){console.error(e.message);process.exitCode=1;}}
}
