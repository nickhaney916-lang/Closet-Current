/** Actual posed-body nearest-triangle probes, not full cloth collision proof. */
import * as T from 'three';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {person,candidate} from '../research/three-d-24/test-fixtures.mjs';
import {createOutfitController} from '../research/three-d-15/outfit-controller.mjs';
import {bodySurface} from '../research/three-d-20/surface-fit.mjs';
const records=[];
for(const kind of ['female','male'])for(const variant of ['before','after']){
 const root=await person(kind),app=createOutfitController(root,{registeredNeckline:variant==='after'});app.setOutfit('dress',{...candidate('dress'),cropRect:[.1375,.10833333333333334,.61875,.8708333333333333]},{reviewed:true});
 for(const pose of ['source','relaxed']){
  app.setPose(pose);root.updateMatrixWorld(true);root.traverse(m=>{if(m.isSkinnedMesh)m.skeleton.update();});
  const body=new T.Group();root.traverse(m=>{
   if(!m.isSkinnedMesh||m.userData.work56Garment)return;const original=m.geometry,g=new T.BufferGeometry(),positions=[];
   for(let i=0;i<original.attributes.position.count;i++){const p=new T.Vector3().fromBufferAttribute(original.attributes.position,i);m.applyBoneTransform(i,p);positions.push(...p.applyMatrix4(m.matrixWorld).toArray());}
   g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setIndex(original.index.clone());body.add(new T.SkinnedMesh(g));
  });
  const nearest=bodySurface(body),garment=root.getObjectByName('3D14-provisional-original-RGB-dress-HOLD'),g=garment.geometry,groups={shoulder:[],chestWaist:[],neck:[],hipSkirt:[]};let waist,neck,shoulder;
  root.traverse(o=>{if(o.isBone&&o.name==='spine04')waist=o.getWorldPosition(new T.Vector3()).y;if(o.isBone&&o.name==='neck01')neck=o.getWorldPosition(new T.Vector3()).y;if(o.isBone&&o.name==='upperarm01L')shoulder=o.getWorldPosition(new T.Vector3()).y;});
  const probe=(p,referenceY)=>{const hit=nearest(p),signed=p.clone().sub(hit.point).dot(hit.normal),region=referenceY<=waist+.07?'hipSkirt':referenceY>neck-.075?'neck':referenceY>shoulder-.08?'shoulder':'chestWaist';groups[region].push(signed);};
  // Triangle interiors catch penetration that boundary-only vertex checks miss.
  for(let t=0;t<g.index.count;t+=3){const ps=[],ys=[];for(let k=0;k<3;k++){const i=g.index.getX(t+k);if(i===undefined)continue;const p=new T.Vector3().fromBufferAttribute(g.attributes.position,i);garment.applyBoneTransform(i,p);ps.push(p.applyMatrix4(garment.matrixWorld));ys.push(new T.Vector3().fromBufferAttribute(g.attributes.position,i).applyMatrix4(garment.matrixWorld).y);}if(ps.length===3)probe(ps[0].add(ps[1]).add(ps[2]).multiplyScalar(1/3),(ys[0]+ys[1]+ys[2])/3);}
  const summary=Object.fromEntries(Object.entries(groups).map(([region,ds])=>{const sorted=ds.slice().sort((a,b)=>a-b);return [region,{samples:ds.length,minimumSignedProbeMeters:sorted[0]??null,medianSignedProbeMeters:sorted[Math.floor(sorted.length/2)]??null,penetrationsOver2mm:ds.filter(d=>d<-.002).length,interpretation:'oriented nearest-body-triangle sample; not watertight signed distance or full collision proof'}];}));
  records.push({kind,variant,pose,regions:summary,fullCollisionValidated:false,releaseAuthorized:false});body.traverse(m=>{if(m.isMesh)m.geometry.dispose();});
 }
 app.dispose();
}
for(const r of records)if(r.variant==='after')for(const area of ['shoulder','chestWaist','hipSkirt']){const q=r.regions[area];assert.ok(q.samples>100,'Real posed triangle-interior probes required');assert.equal(q.penetrationsOver2mm,0,'No >2mm shoulder/chest/waist/hip-skirt penetration in measured samples');}
for(const r of records)if(r.variant==='after'){const b=records.find(x=>x.kind===r.kind&&x.pose===r.pose&&x.variant==='before');assert.ok(r.regions.neck.minimumSignedProbeMeters>=b.regions.neck.minimumSignedProbeMeters-1e-5,'Paired neck samples must not regress');assert.equal(r.regions.neck.penetrationsOver2mm,0,'No neck samples deeper than 2mm');}
await mkdir('benchmark/three-d-29',{recursive:true});await writeFile('benchmark/three-d-29/posed-contact-probes.json',JSON.stringify({records,fullCollisionValidated:false,humanVisualApproval:false},null,2));console.log(JSON.stringify(records,null,2));
