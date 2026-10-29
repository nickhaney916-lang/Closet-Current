import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {person,candidate} from '../research/three-d-24/test-fixtures.mjs';
import {createOutfitController} from '../research/three-d-15/outfit-controller.mjs';
import {anatomicalSections,fitAnatomicalDress} from '../research/three-d-24/anatomical-dress.mjs';
import {bodySurface} from '../research/three-d-20/surface-fit.mjs';
const hash=a=>createHash('sha256').update(Buffer.from(a.buffer,a.byteOffset,a.byteLength)).digest('hex');
const main=r=>r.getObjectByName('3D14-provisional-original-RGB-dress-HOLD');
const world=(m,i)=>new T.Vector3().fromBufferAttribute(m.geometry.attributes.position,i).applyMatrix4(m.matrixWorld);
const stamp=p=>p.toArray().map(x=>Math.round(x*1e6)).join(',');
function bodyFingerprint(r){const out=[];r.traverse(m=>{if(m.isSkinnedMesh&&!m.userData.work56Garment)out.push({name:m.name,pos:hash(m.geometry.attributes.position.array),skin:hash(m.geometry.attributes.skinWeight.array),indices:hash(m.geometry.index.array)});});return out;}
function boundaryLoops(g){
 const p=g.attributes.position,key=i=>[p.getX(i),p.getY(i),p.getZ(i)].map(x=>Math.round(x*1e5)).join(','),edges=new Map();
 for(let k=0;k<g.index.count;k+=3)for(let j=0;j<3;j++){const a=key(g.index.getX(k+j)),b=key(g.index.getX(k+(j+1)%3));if(a===b)continue;const id=[a,b].sort().join('|');if(edges.has(id))edges.get(id).count++;else edges.set(id,{a,b,count:1});}
 const graph=new Map();for(const {a,b,count}of edges.values())if(count===1){for(const [u,v]of [[a,b],[b,a]]){if(!graph.has(u))graph.set(u,new Set());graph.get(u).add(v);}}
 const seen=new Set();let components=0;for(const v of graph.keys())if(!seen.has(v)){components++;const stack=[v];while(stack.length){const a=stack.pop();if(seen.has(a))continue;seen.add(a);stack.push(...graph.get(a));}}
 return {components,vertices:graph.size,degrees:[...graph.values()].map(s=>s.size)};
}
test('Only a reviewed PR427 dress on original anatomical sections may be tailored',()=>{
 assert.throws(()=>fitAnatomicalDress(null,new T.Group()));assert.throws(()=>anatomicalSections(new T.Group()));const x={};assert.equal(fitAnatomicalDress(x,null,{enabled:false}),x);
});
for(const kind of ['female','male'])test(kind+' original neck contour, genuine armholes, source mapping, body, rig and disposal',async()=>{
 const a=await person(kind),b=await person(kind),beforeBody=bodyFingerprint(b),baseline=createOutfitController(a,{dressAnatomy:false}),current=createOutfitController(b,{dressAnatomy:true});
 baseline.setOutfit('dress',candidate('dress'),{reviewed:true});const state=current.setOutfit('dress',candidate('dress'),{reviewed:true});baseline.setPose('source');current.setPose('source');a.updateMatrixWorld(true);b.updateMatrixWorld(true);
 assert.equal(state.dress.actualOpenArmholes,true);assert.ok(state.dress.armholeClippedTriangles>100);assert.equal(state.dress.necklineProfilePreserved,true);assert.equal(state.dress.collisionValidated,false);assert.equal(state.dress.sourceSHA256,'a'.repeat(64));
 assert.deepEqual(bodyFingerprint(b),beforeBody);
 const old=main(a),mesh=main(b),g=mesh.geometry,points=new Map();for(let i=0;i<g.attributes.position.count;i++)points.set(stamp(new T.Vector3().fromBufferAttribute(g.attributes.dressRest,i)),i);
 for(let j=0;j<65;j++){const p=world(old,8*65+j),original=new T.Vector3().fromBufferAttribute(old.geometry.attributes.dressRest,8*65+j),i=points.get(stamp(original));assert.notEqual(i,undefined,'Every original physical V-neck source coordinate survives');assert.ok(Math.abs(world(mesh,i).y-p.y)<1e-7,'Exact original V-height/drop profile retained while X/Z attaches to body');const source=new T.Vector3().fromBufferAttribute(g.attributes.dressRest,i);assert.ok(original.distanceTo(source)<1e-7,'Original neck photo coordinate preserved');}
 const loops=boundaryLoops(g);assert.equal(loops.components,4,'Exactly neck, hem and two separate armhole openings');assert.ok(loops.degrees.every(n=>n===2),'Closed non-branching boundary loops');
 const rest=g.attributes.dressRest,weights=g.attributes.skinWeight,skins=g.attributes.skinIndex;
 for(let i=0;i<rest.count;i++){assert.ok(Number.isFinite(rest.getX(i)+rest.getY(i)+rest.getZ(i)));assert.ok(Math.abs(weights.getX(i)+weights.getY(i)+weights.getZ(i)+weights.getW(i)-1)<1e-5);for(let k=0;k<4;k++)assert.ok(skins.array[i*4+k]<163);}
 const rows=[];for(const m of [old,mesh]){const pts=[];for(let i=0;i<m.geometry.attributes.position.count;i++){const p=world(m,i);if(p.y>1.45&&p.y<1.65)pts.push(p);}rows.push(new T.Box3().setFromPoints(pts));}
 assert.ok(rows[1].getSize(new T.Vector3()).z<rows[0].getSize(new T.Vector3()).z*.80,'Real upper-bodice depth reduced');
 const sourcePosition=hash(g.attributes.position.array);current.setPose('relaxed');current.setPose('source');assert.equal(hash(g.attributes.position.array),sourcePosition,'Pose cannot rebuild source geometry');
 const retained=current.getState();assert.throws(()=>current.setOutfit('dress',candidate('dress')),/review/);assert.deepEqual(current.getState(),retained);
 let disposed=0;g.addEventListener('dispose',()=>disposed++);current.setOutfit('pants');assert.equal(disposed,1);assert.equal(mesh.parent,null);current.setOutfit('dress',candidate('dress'),{reviewed:true});current.setOutfit('none');assert.equal(current.getState().garmentMeshes,0);
 baseline.dispose();current.dispose();
});
for(const kind of ['female','male'])test(kind+' measured torso rays reach actual triangle interiors rather than guessed radii',async()=>{
 const r=await person(kind),section=anatomicalSections(r),nearest=bodySurface(r);
 for(const dy of [-.13,-.10,-.06,.03,.13,.24,.36])for(let j=0;j<16;j++){
  const y=Math.min(section.neck.y-.12,section.waist.y+dy),angle=j*2*Math.PI/16,q=section.radius(y,angle),p=q.origin.clone().add(new T.Vector3(Math.sin(angle)*q.radius,0,Math.cos(angle)*q.radius));
  assert.ok(nearest(p).distance<1e-5,'Measured radial point must lie on original body triangle');
 }
});
test('All licensed original/cutout hashes and every visible source RGB byte remain identical',async()=>{
 const sharp=(await import('sharp')).default,manifest=JSON.parse(await readFile('benchmark/work47/manifest.json')),locked=JSON.parse(await readFile('benchmark/locked-photo-sources.json'));
 for(const id of ['commons-0003','commons-0053']){const row=manifest.rows.find(r=>r.id===id),jpg=await readFile('benchmark/work47/assets/'+id+'.jpg'),png=await readFile('benchmark/work47/assets/'+id+'.png');assert.equal(createHash('sha256').update(jpg).digest('hex'),row.sourceSHA256);assert.equal(row.sourceSHA256,locked.find(r=>r.id===id).sha256);assert.equal(createHash('sha256').update(png).digest('hex'),row.cutoutSHA256);const a=await sharp(jpg).rotate().ensureAlpha().raw().toBuffer(),b=await sharp(png).ensureAlpha().raw().toBuffer();assert.equal(a.length,b.length);for(let i=0;i<b.length;i+=4)if(b[i+3])assert.ok(a[i]===b[i]&&a[i+1]===b[i+1]&&a[i+2]===b[i+2],'Original visible RGB retained');}
});
