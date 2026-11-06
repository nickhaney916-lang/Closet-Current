import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const enhancement=await readFile(new URL('../research/dual-humanoid-photorealism-118/realism.mjs',import.meta.url),'utf8');
const installer=await readFile(new URL('../scripts/install-dual-humanoid-realism-118.mjs',import.meta.url),'utf8');

test('P118 provides a query-opt-in improvement for both pinned figures',()=>{
 for(const marker of ["kind==='female'","kind==='male'","MeshStandardMaterial","roughnessFactor",
  "skinTone118","research-procedural-hair-118","headBone"])
  assert.ok(enhancement.includes(marker),marker);
 assert.match(enhancement,/sourceGarmentGeometryChanged:false/);
 assert.match(installer,/realism118/);
 assert.match(installer,/applyDualHumanoidRealism118/);
});

test('P118 enhancements do not load remote assets or replace the skinned rig',()=>{
 assert.doesNotMatch(enhancement,/fetch\s*\(|XMLHttpRequest|https?:\/\/|new GLTFLoader/);
 assert.match(enhancement,/sourceRigBones/);
 assert.match(enhancement,/userData\?\.work56Garment/);
});
