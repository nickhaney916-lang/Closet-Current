import {test} from 'node:test';
import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {createPortableFitRecipe,restorePortableFitRecipe} from '../research/work47/portable-fit.mjs';
if(!globalThis.crypto)globalThis.crypto=webcrypto;

const source=(c='A',slot='top')=>({png:'data:image/png;base64,'+c.repeat(400),slot,width:200,height:250});
const review=()=>({profile:{slot:'top',anchors:[[.25,.09],[.75,.09]]},
 adjust:{dx:3,dy:8,scale:1.03,edgeCleanup:false,binaryEdgeReview:false}});
const changed=(x,fn)=>{const c=structuredClone(x);fn(c);return JSON.stringify(c)};
test('fit recipe exports exact normalized source-bound geometry; imports in same source only',async()=>{
 const s=source(),out=await createPortableFitRecipe(s,review()),txt=JSON.stringify(out);
 assert.equal(out.decision,'HOLD');assert.equal(out.ownerApproved,false);
 assert.equal(out.requiresReview,true);assert.equal(out.profile.slot,'top');
 assert.equal(out.adjust.tilt,0);
 assert.equal(out.adjust.leftSleeve,0);
 assert.equal(out.adjust.scale,1.03);
 assert.equal(out.traces.left,undefined);
 assert.match(out.cutoutSHA256,/^[0-9a-f]{64}$/);
 assert.deepEqual(Object.keys(out).sort(),
  ['format','cutoutSHA256','width','height','slot','profile','adjust','traces','decision','ownerApproved','requiresReview'].sort());
 assert.doesNotMatch(txt,/(data:image|password|private-|account_id|username|token)/i);
 const result=await restorePortableFitRecipe(s,txt);
 assert.deepEqual(result.profile,review().profile);
 assert.equal(result.adjust.dx,3);
 assert.equal(result.adjust.leftSleeve,0);
 assert.deepEqual(result.traces,{});
});
test('changing single source PNG byte, image dimensions or slot strictly rejects recipe',async()=>{
 const s=source(),json=JSON.stringify(await createPortableFitRecipe(s,review()));
 for(const changedSource of [{...s,png:s.png.slice(0,-1)+'B'},
  {...s,width:201},{...s,height:251},{...s,slot:'layer2'},source('B')])
  await assert.rejects(restorePortableFitRecipe(changedSource,json),/different reviewed garment/);
});
test('no forged approval, source hash, owner, release, accounts, URLs, code fields or edit extras',async()=>{
 const s=source(),recipe=await createPortableFitRecipe(s,review());
 for(const change of [
  x=>x.ownerApproved=true,x=>x.requiresReview=false,x=>x.decision='PASS',
  x=>x.release='READY',x=>x.email='someone@example.com',x=>x.owner_id='test',
  x=>x.accessToken='secret',x=>x.format='something-else',
  x=>x.cutoutSHA256='0'.repeat(64),x=>x.profile.target=[[115,145],[245,145]],
  x=>x.adjust.shear=.25,x=>x.adjust.scale=1.6,
  x=>x.adjust.dx=Infinity,x=>x.adjust.leftSleeve=90,
  x=>x.adjust.edgeCleanup=true,x=>x.adjust.binaryEdgeReview=true,
  x=>x.profile.anchors[0][0]=-1,x=>x.traces.left='hacked'
 ])await assert.rejects(restorePortableFitRecipe(s,changed(recipe,change)),/invalid or belongs|different reviewed/);
 await assert.rejects(restorePortableFitRecipe(s,'not json'));
 await assert.rejects(restorePortableFitRecipe(s,'{}'.repeat(5500)));
});
test('real traced sleeve boundaries can round trip and are reconstructed from validated source geometry',async()=>{
 const s=source(),r=review();
 r.traces={left:[[.24,.09],[.02,.09],[.02,.35],[.24,.35]]};
 r.profile.panels=[{polygon:[[0,0],[1,0],[1,1],[0,1]]}];
 r.profile.exclusivePanels=true;
 r.adjust.leftSleeve=-5;
 const out=await createPortableFitRecipe(s,r);
 const loaded=await restorePortableFitRecipe(s,JSON.stringify(out));
 assert.equal(loaded.traces.left.length,4);
 assert.equal(loaded.profile.exclusivePanels,true);
 assert.equal(loaded.profile.panels.length,2);
 assert.equal(loaded.adjust.leftSleeve,-5);
 assert.deepEqual(out.profile,{slot:'top',anchors:r.profile.anchors},
  'No untrusted polygons are serialized: they must be reconstructed from traces');
});
test('sleeve rotation without approved sleeve trace cannot be restored',async()=>{
 const s=source(),r=review();r.adjust.leftSleeve=5;
 await assert.rejects(createPortableFitRecipe(s,r));
 const out=await createPortableFitRecipe(s,review());
 out.adjust.leftSleeve=5;
 await assert.rejects(restorePortableFitRecipe(s,JSON.stringify(out)));
});
test('no portrait JPG bytes, persistent storage, cloud action, account data or review approval introduced into UI',async()=>{
 const [mod,editor,builder]=await Promise.all([
  readFile('research/work47/portable-fit.mjs','utf8'),
  readFile('research/work47/editor.mjs','utf8'),
  readFile('scripts/build-work47-fit-hold.mjs','utf8')
 ]);
 assert.match(editor,/createPortableFitRecipe/);
 assert.match(editor,/restorePortableFitRecipe/);
 assert.match(editor,/sourceBinding=r=>/);
 assert.match(editor,/fitDownload\.onclick=async event=>/);
 assert.match(editor,/fitUpload\.onchange=async\(\)=>/);
 assert.match(editor,/if\(!isSame\(r,binding\.png\)\)return/);
 assert.match(editor,/redraw\(r\);slides\.sync/);
 assert.match(editor,/fitDownload\.onclick=null;fitUpload\.onchange=null/);
 assert.match(builder,/'portable-fit\.mjs'/);
 for(const text of [mod,editor])assert.doesNotMatch(text,/localStorage|indexedDB|navigator\.sendBeacon|XMLHttpRequest|fetch\(|\/rest\/v1\/|signUp\(/);
});
