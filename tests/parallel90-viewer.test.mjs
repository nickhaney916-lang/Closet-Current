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

test('P90 touch allows vertical page scrolling without disabling horizontal orbit',()=>{
 assert.match(source,/controls\.domElement\.style\.touchAction='pan-y'/);
 assert.match(source,/new OrbitControls\(camera,canvas\)/);
});
test('P90 a replacement WebGL canvas retains keyboard target and full instructions',()=>{
 assert.match(source,/fresh\.tabIndex=0;fresh\.setAttribute\('aria-label'/);
 assert.match(source,/canvas\.getAttribute\('aria-label'\)/);
});

test('P90 selected, freshly byte-attested top-source hint only removes unused public dress preparation',()=>{
 assert.ok(source.includes("nativeTopSource90===OUTFIT3D_PINNED_SOURCE_SHA.shirt"));
 assert.ok(source.includes("loadVettedOutfit3D01Sources({dressOnly90=false,shirtOnly90=false,singleShirtBundle90=false}"));
 assert.ok(source.includes("if(dressOnly90&&shirtOnly90)throw Error"));
 assert.ok(source.includes("if(!shirtOnly90){"));
 assert.ok(source.includes("if(!sources.dress||!dressPiece"));
 assert.ok(source.includes("(sources?.dress==null&&sources?.bundles?.length===0)"));
 // An absent dress must not be forged using a placeholder source capability.
 assert.equal(source.includes("sourceSHA256:DRESS_SHA"),false);
});

test('P90 selects one original shirt research source only for verified saved board without bottom',()=>{
 const bridge=readFileSync('research/native-3d-05/native-preview-bridge.mjs','utf8');
 assert.match(bridge,/nativeBottomEmpty90:!Object\.hasOwn\(selected\.slots,'bottom'\)/);
 assert.ok(source.includes("nativeBottomEmpty90===true"));
 assert.ok(source.includes("if(singleShirtBundle90&&!shirtOnly90)throw Error"));
 assert.ok(source.includes("singleShirtBundle90?['public']:['public','second']"));
 assert.ok(source.includes("loadVettedOutfit3D01Sources({dressOnly90=false,shirtOnly90=false,singleShirtBundle90=false}"));
 // Never change the default licensed-source path for selected bottoms/legacy.
 assert.equal(source.includes("for(const denim of ['public']){"),false);
});
