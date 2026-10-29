import {test} from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';import {createHash} from 'node:crypto';import {execFileSync} from 'node:child_process';import * as T from 'three';import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {buildGarmentShell} from '../research/three-d-08/garment-shell.mjs';
import {setFashionPose} from '../research/three-d-09/pose-source.mjs';
import {prepareBodyPresentation,attachReviewedShirt,releaseBodyPresentation} from '../research/three-d-09/dress-in-source-pose.mjs';
import {SOURCES} from '../research/three-d-06/fetch-licensed-avatars.mjs';
globalThis.ProgressEvent=class{};
const candidate={id:'commons-0003',type:'shirt',sourceSHA256:'a'.repeat(64),ownerApproved:false,releaseAuthorized:false,realFabricTexture:true,humanVisualApproval:false,cutout:{width:1920,height:2880,decode(){}},cropRect:[0,0,1,1],baseColor:[.08,.08,.08]};
async function body(kind){const bytes=await readFile('research/three-d-06/models/'+SOURCES[kind].filename);assert.equal(createHash('sha256').update(bytes).digest('hex'),SOURCES[kind].sha256);const {scene:root}=await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');root.updateMatrixWorld(true);const box=new T.Box3().setFromObject(root),s=2/box.getSize(new T.Vector3()).y,c=box.getCenter(new T.Vector3());root.scale.multiplyScalar(s);root.position.set(-c.x*s,-box.min.y*s,-c.z*s);root.updateMatrixWorld(true);return root;}
for(const kind of ['male','female'])test(kind+': canonical Work56 fit and shared-skeleton deformation survive Work57 pose',async()=>{
 const raw=await body(kind),expected=buildGarmentShell(raw,candidate,{acknowledged:true});
 const root=await body(kind);const originals=[];root.traverse(o=>{if(o.isSkinnedMesh)originals.push({mesh:o,positions:Array.from(o.geometry.attributes.position.array)});});
 prepareBodyPresentation(root);assert.throws(()=>prepareBodyPresentation(root),/already prepared/);setFashionPose(root,'relaxed');
 const normals=originals.map(({mesh})=>mesh.geometry.attributes.normal);
 assert.throws(()=>attachReviewedShirt(root,candidate),/reviewed/);
 const shirt=attachReviewedShirt(root,candidate,{acknowledged:true,pose:'relaxed'});
 assert.equal(shirt.sharedSkeleton,true);assert.equal(shirt.fitPose,'source');assert.equal(shirt.stats.triangles,expected.stats.triangles);
 for(let m=0;m<shirt.meshes.length;m++)for(const attr of ['position','skinWeight','skinIndex','panelPosition'])assert.deepEqual(Array.from(shirt.meshes[m].geometry.attributes[attr].array),Array.from(expected.meshes[m].geometry.attributes[attr].array),'Canonical fit must reuse original source geometry, not smoothed/posed body');
 originals.forEach(({mesh,positions},i)=>{assert.deepEqual(Array.from(mesh.geometry.attributes.position.array),positions);assert.equal(mesh.geometry.attributes.normal,normals[i]);});
 setFashionPose(root,'source');const samples=[];
 for(const mesh of shirt.meshes){const a=mesh.geometry.attributes.position,uv=Array.from(mesh.geometry.attributes.panelPosition.array);for(let i=0;i<a.count;i+=47){const p=mesh.getVertexPosition(i,new T.Vector3()).applyMatrix4(mesh.matrixWorld);if(Math.abs(p.x)>.40&&p.y<1.45)samples.push({mesh,i,p});}assert.deepEqual(Array.from(mesh.geometry.attributes.panelPosition.array),uv);}
 assert.ok(samples.length>20);setFashionPose(root,'relaxed');let max=0;for(const {mesh,i,p} of samples)max=Math.max(max,p.distanceTo(mesh.getVertexPosition(i,new T.Vector3()).applyMatrix4(mesh.matrixWorld)));assert.ok(max>.06,'Actual sleeve vertices must follow lowered arms');
 for(let i=0;i<8;i++){setFashionPose(root,'source');setFashionPose(root,'relaxed');}setFashionPose(root,'source');for(const {mesh,i,p} of samples)assert.ok(p.distanceTo(mesh.getVertexPosition(i,new T.Vector3()).applyMatrix4(mesh.matrixWorld))<1e-6,'No cumulative drift');
 shirt.dispose();assert.ok(shirt.meshes.every(m=>!m.parent));assert.ok(originals.every(({mesh})=>mesh.skeleton.bones.length===163),'Garment disposal must retain body skeleton');releaseBodyPresentation(root);assert.throws(()=>attachReviewedShirt(root,candidate,{acknowledged:true}),/Prepared/);expected.dispose();
});
test('Pinned Work57 pose reused byte-for-byte; old Work56 fitting code remains unchanged',async()=>{
 const pose=await readFile('research/three-d-09/pose-source.mjs');assert.equal(createHash('sha256').update(pose).digest('hex'),'8b0d2fe50e70b4423b94b79c928601a338cbbffb6b705e0d6fd56af912b25549');
 for(const p of ['research/three-d-08/garment-shell.mjs','research/three-d-08/garment-fit-profile.mjs','research/three-d-02/reviewed-texture.mjs'])assert.deepEqual(await readFile(p),execFileSync('git',['show','89c4808cba4e790ae4fe7d268ada81ef3c90d966:'+p]));
 const names=execFileSync('git',['diff','--name-only','89c4808cba4e790ae4fe7d268ada81ef3c90d966'],{encoding:'utf8'}).trim().split('\n').filter(Boolean);for(const p of names)assert.match(p,/^(research\/three-d-09\/|scripts\/test-three-d-09-|tests\/three-d-09-|\.github\/workflows\/three-d-09-)/);
});
test('Original stock source and cutout hashes/RGB remain intact; bad bytes are rejected',async()=>{
 const {readVerifiedAsset}=await import('../research/three-d-02/reviewed-texture.mjs');const {default:sharp}=await import('sharp');
 const row=JSON.parse(await readFile('benchmark/work47/manifest.json')).rows.find(x=>x.id==='commons-0003');const jpg=await readFile('benchmark/work47/assets/commons-0003.jpg'),png=await readFile('benchmark/work47/assets/commons-0003.png');assert.equal(createHash('sha256').update(jpg).digest('hex'),row.sourceSHA256);assert.equal(createHash('sha256').update(png).digest('hex'),row.cutoutSHA256);
 const a=await sharp(jpg).rotate().ensureAlpha().raw().toBuffer(),b=await sharp(png).ensureAlpha().raw().toBuffer();assert.equal(a.length,b.length);for(let i=0;i<b.length;i+=4)if(b[i+3]>0&&(a[i]!==b[i]||a[i+1]!==b[i+1]||a[i+2]!==b[i+2]))assert.fail('Original RGB changed');
 for(const ext of ['jpg','png'])await assert.rejects(readVerifiedAsset('/benchmark/work47/assets/commons-0003.'+ext,row.sourceSHA256,{fetcher:async()=>new Response(new Uint8Array(400))}),/hash mismatch/);
});
