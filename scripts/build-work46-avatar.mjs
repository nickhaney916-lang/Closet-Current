import {readFile,writeFile,copyFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import assert from 'node:assert/strict';
const r=spawnSync(process.execPath,['scripts/build-family-alpha-33-gallery.mjs'],{stdio:'inherit'});if(r.error)throw r.error;if(r.status!==0)throw Error('Pinned source gallery build failed');
const d='dist-family-alpha-33-visual-hold/';
await copyFile('research/work46-avatar/gallery.mjs',d+'gallery.mjs');
await copyFile('research/work46-avatar/manual-fit.mjs',d+'manual-fit.mjs');
let html=await readFile(d+'index.html','utf8');assert.ok(html.includes('OFFLINE · PROVISIONAL'));html=html.replace('Real garment visual review','Real garment manual-fit experiment');await writeFile(d+'index.html',html);
console.log('WORK46_AVATAR_DIAGNOSTIC_HOLD: seven provisional masks; eight unavailable; no owner approval');
