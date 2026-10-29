import {test} from 'node:test';import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {buildGarmentShell} from '../research/three-d-08/garment-shell.mjs';
globalThis.ProgressEvent=class{};
const item={id:'commons-0003',type:'shirt',sourceSHA256:'a'.repeat(64),ownerApproved:false,releaseAuthorized:false,realFabricTexture:true,humanVisualApproval:false,cutout:{width:1920,height:2880,decode(){}},cropRect:[0,0,1,1],baseColor:[.08,.08,.08]};
for(const kind of ['female','male'])test(kind+' separate shell preserves original geometry and binds actual skeleton',async()=>{
 const b=await readFile(`research/three-d-06/models/${kind}-cc0-rigged.glb`);
 const {scene:root}=await new GLTFLoader().parseAsync(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),'');
 root.updateMatrixWorld(true);const box=new T.Box3().setFromObject(root),s=2/box.getSize(new T.Vector3()).y,c=box.getCenter(new T.Vector3());root.scale.multiplyScalar(s);root.position.set(-c.x*s,-box.min.y*s,-c.z*s);root.updateMatrixWorld(true);
 const originals=[];root.traverse(o=>{if(o.isSkinnedMesh)originals.push({o,positions:Array.from(o.geometry.attributes.position.array)});});
 assert.throws(()=>buildGarmentShell(root,item),/reviewed/);
 const shell=buildGarmentShell(root,item,{acknowledged:true});assert.ok(shell.stats.triangles>1000);assert.equal(shell.stats.skinBones,163);
 let moved=false;
 for(const mesh of shell.meshes){
  assert.ok(originals.some(x=>x.o.skeleton===mesh.skeleton));assert.ok(!originals.some(x=>x.o.geometry===mesh.geometry));
  const w=mesh.geometry.attributes.skinWeight;
  for(let i=0;i<w.count;i++){const sum=w.getX(i)+w.getY(i)+w.getZ(i)+w.getW(i);assert.ok(Math.abs(sum-1)<.0001);}
  const p=new T.Vector3().fromBufferAttribute(mesh.geometry.attributes.position,0);const before=mesh.applyBoneTransform(0,p.clone());
  const bone=mesh.skeleton.bones[mesh.geometry.attributes.skinIndex.getX(0)];const old=bone.position.x;bone.position.x+=.02;root.updateMatrixWorld(true);mesh.skeleton.update();const after=mesh.applyBoneTransform(0,p.clone());if(before.distanceTo(after)>.00001)moved=true;bone.position.x=old;root.updateMatrixWorld(true);mesh.skeleton.update();
 }
 assert.ok(moved,'Garment must follow actual source skeleton');
 for(const {o,positions} of originals)assert.deepEqual(Array.from(o.geometry.attributes.position.array),positions);
 shell.dispose();assert.ok(shell.meshes.every(m=>!m.parent));assert.equal(shell.stats.releaseAuthorized,false);
});
test('No shared renderer or application change',async()=>{
 const {execFileSync}=await import('node:child_process');
 const names=execFileSync('git',['diff','--name-only','ac7d2bd1f2c223baf61fa0c3580cbc3b9b1330ec'],{encoding:'utf8'}).trim().split('\n').filter(Boolean);
 for(const p of names)assert.match(p,/^(research\/three-d-08\/|tests\/three-d-08-|scripts\/test-three-d-08-|\.github\/workflows\/three-d-08-)/);
});

test('Photographic panel preserves pixel aspect and rejects unknown source dimensions',async()=>{
 const {originalPhotoSpan,roundedNeckBoundary}=await import('../research/three-d-08/garment-fit-profile.mjs');
 const crop=[.03,.025,.94,.606],span=originalPhotoSpan(item.cutout,crop);
 assert.ok(Math.abs(span.width/(crop[2]*1920)-span.height/(crop[3]*2880))<1e-12);
 assert.throws(()=>originalPhotoSpan({},crop),/dimensions/);
 assert.ok(roundedNeckBoundary(new T.Vector3(0,1.63,.05),1.69,-.08)<roundedNeckBoundary(new T.Vector3(.13,1.63,.05),1.69,-.08),'Front neckline is curved, not a flat horizontal chop');
});
test('Corrupted RGB/cutout bytes and unexpected source URLs fail closed',async()=>{
 const {readVerifiedAsset}=await import('../research/three-d-02/reviewed-texture.mjs');
 let requests=0;const fetcher=async()=>{requests++;return new Response(new Uint8Array(400).fill(7));};
 await assert.rejects(readVerifiedAsset('/benchmark/work47/assets/commons-0003.jpg','a'.repeat(64),{fetcher}),/hash mismatch/);
 await assert.rejects(readVerifiedAsset('/benchmark/work47/assets/commons-0003.png','a'.repeat(64),{fetcher}),/hash mismatch/);
 await assert.rejects(readVerifiedAsset('https://example.invalid/private.jpg','a'.repeat(64),{fetcher}),/Unexpected/);assert.equal(requests,2,'External URL must be rejected before fetching');
});
test('Full-resolution licensed cutout retains every visible original RGB pixel',async()=>{
 const {default:sharp}=await import('sharp');const {createHash}=await import('node:crypto');
 const manifest=JSON.parse(await readFile('benchmark/work47/manifest.json')),row=manifest.rows.find(r=>r.id==='commons-0003');
 const jpg=await readFile('benchmark/work47/assets/commons-0003.jpg'),png=await readFile('benchmark/work47/assets/commons-0003.png');
 assert.equal(createHash('sha256').update(jpg).digest('hex'),row.sourceSHA256);assert.equal(createHash('sha256').update(png).digest('hex'),row.cutoutSHA256);
 const {data:original,info}=await sharp(jpg).rotate().ensureAlpha().raw().toBuffer({resolveWithObject:true});const {data:cutout,info:other}=await sharp(png).ensureAlpha().raw().toBuffer({resolveWithObject:true});assert.equal(info.width,other.width);assert.equal(info.height,other.height);
 let visible=0;for(let i=0;i<cutout.length;i+=4)if(cutout[i+3]>0){visible++;if(cutout[i]!==original[i]||cutout[i+1]!==original[i+1]||cutout[i+2]!==original[i+2])assert.fail('Source RGB changed at pixel '+i/4);}assert.ok(visible>10000);
});
