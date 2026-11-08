import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {join} from 'node:path';

const dir=process.argv[2]||'benchmark/outfit-view-360-160';
const views=['front','threequarter-front-right','right','threequarter-rear-right','rear','left'];
const rot=x=>createHash('sha256').update(x).digest('hex');
let total=0;
for(const width of [320,390,430]){
 const rows=JSON.parse(await readFile(join(dir,'views-'+width+'.json'),'utf8'));
 assert.equal(rows.length,12);
 assert.deepEqual([...new Set(rows.map(r=>r.figure))].sort(),['female','male']);
 for(const figure of ['female','male']){
  const set=rows.filter(r=>r.figure===figure);
  assert.deepEqual(set.map(r=>r.view),views);
  assert.equal(new Set(set.map(r=>r.sha256)).size,6,'all six actual camera angles must render distinct screenshots');
  assert.ok(set.every(r=>r.width===width&&r.sourceRigBones===163&&r.ownerSavedBoardUnchanged&&r.renderer==='real-WebGL'));
  assert.equal(set.every(r=>r.sourceHeadAttached),true,'licensed head must remain attached to original figure');
  assert.ok(set.every(r=>r.neckBridgeTriangles===0),'P159 source-overlap no-op must not gain a fake collar');
  for(const row of set){
   const png=await readFile(join(dir,row.file));
   assert.equal(rot(png),row.sha256,'P160 screenshot SHA-256 mismatch');
   const expected={front:x=>Math.abs(x)<.2,'threequarter-front-right':x=>x>1.4&&x<4.1,right:x=>x>3,'threequarter-rear-right':x=>x>1.4&&x<4.1,rear:x=>Math.abs(x)<.2,left:x=>x< -3}[row.view];
   assert.ok(expected(row.cameraX),'P160 camera did not reach intended view: '+row.view+' '+row.cameraX);
   total++;
  }
 }
}
const files=(await readdir(dir)).filter(x=>x.endsWith('.png'));
assert.equal(total,36);assert.equal(files.length,36);
console.log(JSON.stringify({priority:160,accepted:36,figures:2,views:6,widths:[320,390,430],uniqueSHA256:true,sourceSavedOutfitsUnchanged:true,photorealismClaimed:false,physicalDeviceTested:false,familyAlpha:'HOLD',releaseAuthorized:false}));
