import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,mkdtempSync,mkdirSync,writeFileSync,rmSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
const source=readFileSync('scripts/install-parallel90-viewer.mjs','utf8');
test('P90 donor installer refuses another source HEAD before any write',()=>{
 const dir=mkdtempSync(join(tmpdir(),'p90-'));
 try{
  execFileSync('git',['init',dir]);
  assert.throws(()=>execFileSync(process.execPath,['scripts/install-parallel90-viewer.mjs',dir],{stdio:'pipe'}));
 }finally{rmSync(dir,{recursive:true,force:true});}
});
test('P90 installer limits writes to panel, camera and source loading, not geometry or skeleton authoring',()=>{
 const writes=[...source.matchAll(/writeFile\((\w+),s\)/g)].map(x=>x[1]);
 assert.deepEqual(writes,['panel','showroom','sourceViewer']);
 assert.match(source,/assert.equal\(s.split\(a\).length,2/);
});
test('P90 context-loss listener is captured and removed on bridge disposal',()=>{
 const s=readFileSync('research/native-3d-05/native-preview-bridge.mjs','utf8');
 assert.match(s,/addEventListener\('webglcontextlost',onContextLost90,true\)/);
 assert.match(s,/removeEventListener\('webglcontextlost',onContextLost90,true\)/);
 assert.match(s,/e.target\?\.id!=='outfit3D01Canvas'/);
});
