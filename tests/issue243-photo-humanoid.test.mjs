import test from 'node:test';import assert from 'node:assert/strict';import {webcrypto} from 'node:crypto';
import {createPhotoHumanoidGeometry,contourMesh,torsoProfile,shellClearance} from '../public/humanoid-3d-photo-geometry.mjs';
import {createPhotoTextureSession,getVerifiedPhotoFrame,cropOriginalRGBA} from '../public/humanoid-3d-photo-session.mjs';
import {createPhotoHumanoid3D} from '../public/humanoid-3d-photo-renderer.mjs';
const sha=async b=>Buffer.from(await webcrypto.subtle.digest('SHA-256',b)).toString('hex');
function pixels(width=32,height=48){const data=new Uint8Array(width*height*4);for(let i=0;i<width*height;i++)data.set(i%width<width/2?[191,21,42,255]:[22,61,181,255],i*4);return {width,height,data};}
async function fixture(overrides={}){
 const bytes=new Uint8Array([1,2,3,4]),version=await sha(bytes),image=pixels();let current=true;
 const verified={placeholderOnly:true,hasDress:false,selected:[{slot:'top',itemId:'owned-top',category:'Tops',itemType:'T-shirt',sourceIdentity:'original-a',sourceVersion:version}],colors:{top:[.3,.4,.8,1]}};
 const session=createPhotoTextureSession({verifySelection:async()=>verified,readOriginal:async()=>bytes,isCurrent:()=>current,decodeOriginal:async()=>image,cryptoProvider:webcrypto,...overrides});
 return {session,bytes,verified,image,setCurrent:v=>current=v};
}
test('contoured meshes extend old authored parts with near 7.5-head silhouette and bounded finite normals',()=>{
 const parts=createPhotoHumanoidGeometry([{slot:'top',category:'Tops',sleeveLength:'Long sleeve'},{slot:'bottom',category:'Bottoms',itemType:'Jeans'},{slot:'shoes',category:'Shoes',itemType:'Sneakers'}]);
 assert.ok(parts.some(p=>p.id==='left-hand'));assert.ok(parts.some(p=>p.id==='nose'));
 const head=parts.find(p=>p.id==='head'),ys=[];for(let i=1;i<head.vertices.length;i+=8)ys.push(head.vertices[i]);
 assert.ok((1.4+1.29)/(Math.max(...ys)-Math.min(...ys))>7);
 for(const p of parts){assert.equal(p.vertices.length%24,0);assert.ok(p.vertices.every(Number.isFinite));for(let i=0;i<p.vertices.length;i+=8){assert.ok(Math.abs(Math.hypot(...p.vertices.subarray(i+3,i+6))-1)<.0001);}}
});
test('layer envelopes increase in radius and depth at every torso contour sample',()=>{
 const keys=['top','layer','layer2','layer3'];for(const [,r,z] of torsoProfile)for(let i=1;i<keys.length;i++){assert.ok(r+shellClearance[keys[i]]>r+shellClearance[keys[i-1]]);assert.ok(z+shellClearance[keys[i]]>z+shellClearance[keys[i-1]]);}
});
for(const type of ['Jeans','Shorts','Skirt'])test(type+' uses distinct native geometry',()=>{
 const parts=createPhotoHumanoidGeometry([{slot:'bottom',category:'Bottoms',itemType:type}]);
 assert.equal(parts.some(p=>p.id==='separate-skirt'),type==='Skirt');
 if(type!=='Skirt'){const p=parts.find(p=>p.id==='left-trouser');let min=0;for(let i=1;i<p.vertices.length;i+=8)min=Math.min(min,p.vertices[i]);assert.ok(type==='Shorts'?min>-.6:min<-1.1);}
});
test('dress hides separates by rejecting conflicts; jacket has sleeves and an open front',()=>{
 const d=createPhotoHumanoidGeometry([{slot:'top',category:'Dresses'},{slot:'shoes',category:'Shoes'}]);assert.ok(d.some(p=>p.id==='dress-skirt'));assert.ok(!d.some(p=>p.id==='trouser-waist'));
 assert.throws(()=>createPhotoHumanoidGeometry([{slot:'top',category:'Dresses'},{slot:'bottom',category:'Bottoms'}]),/conflict/);
 const j=createPhotoHumanoidGeometry([{slot:'layer2',category:'Outerwear'}]);assert.ok(j.some(p=>p.id==='layer2-left-sleeve'));assert.ok(j.find(p=>p.id==='layer2-contoured-shell').vertices.length<contourMesh([...torsoProfile.map(([y,r,z])=>[y,r+.066,z+.066]),[-.12,.351,.236]]).length);
});
test('invalid geometry cannot create unbounded tessellation or duplicate slots',()=>{
 assert.throws(()=>contourMesh([[1,.2,.1],[0,.2,.1]],{segments:9999}),/Invalid/);
 assert.throws(()=>contourMesh([[0,.2,.1],[1,.2,.1]]),/Invalid/);
 assert.throws(()=>createPhotoHumanoidGeometry([{slot:'top'},{slot:'top'}]),/duplicate/);
});
test('full native original RGBA is copied exactly; normalized crop and nearest budget retain actual source colors',()=>{
 const p=pixels(),before=p.data.slice(),full=cropOriginalRGBA(p);assert.deepEqual(full.rgba,p.data);assert.deepEqual(p.data,before);
 const small=cropOriginalRGBA(p,{x:0,y:0,width:1,height:1},16);assert.ok(small.downsampled);for(let i=0;i<small.rgba.length;i+=4)assert.ok([[191,21,42,255],[22,61,181,255]].some(c=>c.every((x,k)=>small.rgba[i+k]===x)));
 const cropped=cropOriginalRGBA(p,{x:.25,y:.25,width:.5,height:.5});assert.deepEqual(cropped.nativeCrop,{left:8,top:12,width:16,height:24});
});
test('blank/transparent buffers, invalid crop and corrupt RGBA fail to original-reference fallback',()=>{
 for(const p of [{...pixels(),data:new Uint8Array(32*48*4).fill(255)},{...pixels(),data:new Uint8Array(32*48*4)},{...pixels(),data:new Uint8Array(4)}])assert.throws(()=>cropOriginalRGBA(p),/Blank|Invalid/);
 assert.throws(()=>cropOriginalRGBA(pixels(),{x:.8,y:0,width:.5,height:1}),/Invalid/);
});
test('metadata and owner IDs cannot replace authority callbacks or forge a GPU frame',()=>{
 assert.throws(()=>createPhotoTextureSession({accountId:'owner',authenticated:true}),/Authoritative/);
 assert.throws(()=>getVerifiedPhotoFrame({sourceCount:1,verified:true}),/unverified/);
});
test('verified selection yields a local original-derived token without modifying bytes/pixels',async()=>{
 const f=await fixture(),bytes=f.bytes.slice(),p=f.image.data.slice(),token=await f.session.prepare({slots:{top:'owned-top'}}),data=getVerifiedPhotoFrame(token);
 assert.equal(token.sourceCount,1);assert.deepEqual(data.materials[0].rgba,p);assert.deepEqual(f.bytes,bytes);assert.deepEqual(f.image.data,p);assert.equal(token.physicalFitVerified,false);
});
test('source replacement with unchanged crop is rejected by original-byte SHA',async()=>{
 const f=await fixture();f.bytes[0]=99;await assert.rejects(f.session.prepare({}),/source version/);
});
test('scope revocation clears local material and cannot resurrect after switching account back',async()=>{
 const f=await fixture(),token=await f.session.prepare({}),data=getVerifiedPhotoFrame(token);f.setCurrent(false);assert.throws(()=>getVerifiedPhotoFrame(token),/Revoked/);assert.ok(data.materials[0].rgba.every(v=>v===0));f.setCurrent(true);assert.throws(()=>getVerifiedPhotoFrame(token),/Revoked/);
});
test('source/identity changes while decode is pending never publish the old texture',async()=>{
 let release;const f=await fixture({decodeOriginal:async()=>{await new Promise(r=>release=r);return pixels();}});const pending=f.session.prepare({});while(!release)await new Promise(r=>setImmediate(r));f.verified.selected[0].sourceIdentity='replacement';release();await assert.rejects(pending,/selection changed/);
});
test('old failed prepare cannot revoke the newer successful request',async()=>{
 let release,n=0;const f=await fixture({decodeOriginal:async()=>{if(++n===1)await new Promise(r=>release=r);return pixels();}});const old=f.session.prepare({});while(!release)await new Promise(r=>setImmediate(r));const token=await f.session.prepare({});release();await assert.rejects(old,/changed/);assert.equal(getVerifiedPhotoFrame(token).materials.length,1);
});
test('duplicate garments and dress conflicts are refused at verified contract boundary',async()=>{
 const f=await fixture();f.verified.selected.push({...f.verified.selected[0]});await assert.rejects(f.session.prepare({}),/Duplicate/);
 const g=await fixture();g.verified.hasDress=true;g.verified.selected[0].category='Dresses';g.verified.selected.push({...g.verified.selected[0],itemId:'bottom',slot:'bottom',category:'Bottoms',cropBounds:{x:.5,y:0,width:.5,height:1}});g.verified.colors.bottom=[0,0,0,1];await assert.rejects(g.session.prepare({}),/conflict/);
});
test('invalidation/disposal require a fresh verification and no WebGL preserves 2D fallback',async()=>{
 const f=await fixture(),token=await f.session.prepare({});f.session.invalidate();assert.throws(()=>getVerifiedPhotoFrame(token),/Revoked/);f.session.dispose();await assert.rejects(f.session.prepare({}),/disposed/);
 const r=createPhotoHumanoid3D({getContext:()=>null});assert.equal(r.supported,false);assert.equal(r.render(),false);
});
