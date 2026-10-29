import test from 'node:test';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';import * as T from 'three';
import {person,candidate} from '../research/three-d-24/test-fixtures.mjs';
import {createOutfitController} from '../research/three-d-15/outfit-controller.mjs';
import {registerDressNeckline,sourceNeckY,V_SOURCE} from '../research/three-d-29/registered-neckline.mjs';
const hash=a=>createHash('sha256').update(Buffer.from(a.buffer,a.byteOffset,a.byteLength)).digest('hex');
const body=r=>{const rows=[];r.traverse(m=>{if(m.isSkinnedMesh&&!m.userData.work56Garment)rows.push([hash(m.geometry.attributes.position.array),hash(m.geometry.attributes.skinWeight.array),hash(m.geometry.index.array)]);});return rows;};
test('Source landmarks follow both original V sides and reject unreviewed geometry',()=>{assert.equal(sourceNeckY(.505),.244);assert.equal(sourceNeckY(.390),.145);assert.equal(sourceNeckY(.650),.151);assert.throws(()=>registerDressNeckline(null,{}));assert.ok(V_SOURCE.trimTip[1]>V_SOURCE.tip[1]);});
for(const kind of ['female','male'])test(kind+' registered geometry preserves body, source, lower skirt, rollback and deterministic pose',async()=>{
 const r=await person(kind),original=body(r),before=createOutfitController(r,{registeredNeckline:false});
 const source={...candidate('dress'),cropRect:[.1375,.10833333333333334,.61875,.8708333333333333]};
 before.setOutfit('dress',source,{reviewed:true});before.setPose('source');
 const m=r.getObjectByName('3D14-provisional-original-RGB-dress-HOLD'),g=m.geometry;
 const lower=[];for(let i=0;i<g.attributes.position.count;i++)if(g.attributes.dressRest.getY(i)<1.3)lower.push([g.attributes.position.getX(i),g.attributes.position.getY(i),g.attributes.position.getZ(i),g.attributes.dressRest.getX(i),g.attributes.dressRest.getY(i)]);
 before.dispose();const app=createOutfitController(r),state=app.setOutfit('dress',source,{reviewed:true});app.setPose('source');const after=r.getObjectByName('3D14-provisional-original-RGB-dress-HOLD').geometry;
 assert.deepEqual(body(r),original);assert.equal(state.dress.sourceSHA256,source.sourceSHA256);assert.equal(state.dress.sourceRegisteredNeckline,true);assert.equal(state.dress.actualOpenArmholes,true);assert.equal(state.dress.collisionValidated,false);assert.ok(Math.abs(state.dress.maxRegisteredNeckDrop-.10)<1e-6);assert.ok(state.dress.maxNeckClearanceMovement<=.00800001);
 const low=[];for(let i=0;i<after.attributes.position.count;i++)if(after.attributes.dressRest.getY(i)<1.3)low.push([after.attributes.position.getX(i),after.attributes.position.getY(i),after.attributes.position.getZ(i),after.attributes.dressRest.getX(i),after.attributes.dressRest.getY(i)]);assert.deepEqual(low,lower,'Lower skirt and its original source registration remain exact');
 const position=hash(after.attributes.position.array),rest=hash(after.attributes.dressRest.array);app.setPose('relaxed');app.setPose('source');assert.equal(hash(after.attributes.position.array),position);assert.equal(hash(after.attributes.dressRest.array),rest);
 const retained=app.getState();assert.throws(()=>app.setOutfit('dress',source));assert.deepEqual(app.getState(),retained);app.setOutfit('none');assert.equal(app.getState().garmentMeshes,0);app.dispose();
});
