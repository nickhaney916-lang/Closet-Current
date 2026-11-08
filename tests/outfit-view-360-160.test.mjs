import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

test('P160 builds the 360° extension on the exact inherited owner-photo WebGL harness',async()=>{
 const s=await readFile('scripts/prepare-outfit-view-360-160.mjs','utf8');
 for(const x of ["#outfit3D01Canvas","OrbitControls","threequarter-front-right","threequarter-rear-right","#outfit3D01Side","#outfit3D01Back","ownerOriginal","cameraX","data-rotation"])
  assert.ok(s.includes(x),x);
 assert.match(s,/assert\.equal\(source\.split\(anchor\)\.length,2/);
});
test('P160 audit enforces both figures, all six angles, mobile widths, and image SHA integrity',async()=>{
 const s=await readFile('scripts/audit-outfit-view-360-160.mjs','utf8');
 for(const x of ["'front','threequarter-front-right','right','threequarter-rear-right','rear','left'","[320,390,430]","createHash","neckBridgeTriangles===0","sourceSavedOutfitsUnchanged:true"])
  assert.ok(s.includes(x),x);
});
test('P160 exact-base no-deploy workflow runs inherited regression and 360° evidence audit',async()=>{
 const w=await readFile('.github/workflows/outfit-view-360-160-no-deploy.yml','utf8');
 assert.match(w,/BASE=0e6f8db077b3dd2b1650e300df0d2d7244d29ba0/);
 assert.match(w,/P150=1 P160=1/);
 assert.match(w,/P160 real six-angle saved outfit camera acceptance/);
 assert.match(w,/NO DEPLOY/i);
});
test('P160 report explicitly limits browser emulation and realism claims',async()=>{
 const r=await readFile('research/outfit-view-360-160/REPORT.md','utf8');
 assert.match(r,/Family Alpha.*HOLD/);
 assert.match(r,/(not.*photorealism|photorealism.*not)/i);
 assert.match(r,/not.*physical/i);
});
