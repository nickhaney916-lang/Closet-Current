/** Source-honest no-deploy research cross-check of M11 per-pose body BVH reuse.
 * Uses synthetic triangles ONLY to exercise the same exact original geometry
 * routines as the browser QA; does not substitute for genuine clothing tests.
 */
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import * as T from 'three';
import {MeshBVH} from 'three-mesh-bvh';
const donor=resolve(process.argv[2]||'.native05-donor-541');
assert.equal(execFileSync('git',['-C',donor,'rev-parse','HEAD'],{encoding:'utf8'}).trim(),
 'df6885d6011cb33fb22dceb81a08f35a0ac4dd61',
 'cross-check requires immutable original source donor');
const file=pathToFileURL(donor+'/research/three-d-42/posed-contact.mjs').href;
const {triangleContacts}=await import(file);
function makeBody(){
 const g=new T.BufferGeometry();
 g.setAttribute('position',new T.Float32BufferAttribute([
  -1,-1,0, 1,-1,0, 1,1,0, -1,1,0
 ],3));
 g.setIndex([0,1,2,0,2,3]);
 return g;
}
function makeGarment(shift=0){
 const g=new T.BufferGeometry();
 g.setAttribute('position',new T.Float32BufferAttribute([
  shift,-0.8,-0.5, shift,0.8,0.5, shift,0.8,-0.5
 ],3));
 g.setIndex([0,1,2]);
 return g;
}
const body=makeBody(),bodyTree90=new MeshBVH(body);
const results=[];
for(const shift of [0,3]){
 const defaultBody=makeBody(),defaultShirt=makeGarment(shift),optimizedShirt=makeGarment(shift);
 const original=triangleContacts(defaultShirt,defaultBody,{collect:true});
 const reused=triangleContacts(optimizedShirt,body,{collect:true,bodyTree90});
 assert.deepEqual(reused,original,
  'identical source triangle crossing geometry, segment, normal and local depth required');
 results.push({shift,count:original.count,maximumLocalOrientedFaceDepth:original.maximumLocalOrientedFaceDepth});
 defaultShirt.dispose();defaultBody.dispose();optimizedShirt.dispose();
}
assert.ok(results[0].count>0,'crossing garment must really intersect the posed body');
const noCross=results[1];
assert.equal(noCross.count,0,'translated garment must really avoid the body');
body.dispose();
console.log('P90_CONTACT_BVH_EQUIVALENCE',JSON.stringify({
 originalBody:true,bodyBVHConstructedOnce:true,
 runs:results,photographicEvidence:false,physicalPhone:false,familyAlpha:'HOLD'
}));
