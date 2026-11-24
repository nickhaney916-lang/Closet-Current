import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
import {buildPhotoDerivedResearchMesh89 as build} from '../research/parallel89/source-photo-to-mesh89.mjs';
import {proposeOriginalPhotoMask89 as propose} from '../research/parallel89/multicategory-border-mask89.mjs';
const sha=b=>createHash('sha256').update(b).digest('hex');
const reg=JSON.parse(readFileSync(new URL('../benchmark/locked-photo-sources.json',import.meta.url)));
const ids=['commons-0001','commons-0003','commons-0016','commons-0023','commons-0041','commons-0053'];
const input=id=>({sourceId:id,originalBytes:readFileSync(new URL('../benchmark/fixtures/'+id+'.jpg',import.meta.url)),lockedRecord:reg.find(r=>r.id===id)});
test('six actual licensed JPEGs: source-derived mask to exact textured mesh or explicit abstention',async()=>{
 let produced=0;
 for(const id of ids){
  const a=input(id),before=sha(a.originalBytes),p=await propose(a),r=await build({...a,textureScale:2});
  assert.equal(r.originalSHA256,before);assert.equal(r.consumer3DAdmitted,false);assert.equal(r.familyAlpha,'HOLD');
  assert.equal(r.originalPhoto2DFallbackRequired,true);assert.equal(sha(a.originalBytes),before);
  if(p.status!=='UNREVIEWED_BORDER_MASK_PROPOSAL'){
   assert.equal(r.status,'ORIGINAL_PHOTO_2D_REQUIRED');assert.equal(r.mesh,undefined);
   console.log(id,r.status,r.reason);continue;
  }
  produced++;
  assert.equal(r.status,'SOURCE_DERIVED_TEXTURED_VIEW_PLANE_RESEARCH_ONLY');
  assert.equal(r.maskSHA256,sha(p.alpha));assert.equal(r.uncertaintySHA256,sha(p.uncertain));
  assert.equal(r.decodedRGBSHA256,p.decodedRGBSHA256);
  assert.deepEqual(r.maskDimensions,[p.width,p.height]);
  assert.deepEqual(r.alpha,p.alpha);assert.deepEqual(r.uncertain,p.uncertain);assert.deepEqual(r.background,p.background);
  const m=r.mesh,w=p.width,h=p.height,tw=w*2,th=h*2;
  assert.equal(m.indices.length/3,p.foregroundPixels*2);
  assert.equal(m.textureForegroundPixels,p.foregroundPixels*4);
  assert.deepEqual(m.textureDimensions,[tw,th]);
  assert.equal(m.originalJPEG_SHA256,before);assert.equal(m.textureSHA256,sha(m.textureRGBA));
  assert.equal(m.consumer3DAdmitted,false);assert.equal(m.maskGroundTruthApproved,false);
  assert.equal(r.sourceViewIndependentlyVerified,false);
  const counts=new Uint8Array(w*h);
  for(let i=0;i<m.indices.length;i+=3){
   let u=0,v=0;for(const j of m.indices.slice(i,i+3)){u+=m.uv[j*2];v+=m.uv[j*2+1]}
   const k=Math.floor((1-v/3)*h)*w+Math.floor(u/3*w);
   assert.equal(p.alpha[k],255);counts[k]++;
  }
  for(let i=0;i<counts.length;i++)assert.equal(counts[i],p.alpha[i]?2:0);
  const {data,info}=await sharp(a.originalBytes,{limitInputPixels:16000000}).removeAlpha().toColourspace('srgb').raw().toBuffer({resolveWithObject:true});
  assert.equal(sha(data),r.decodedRGBSHA256);
  for(let y=0;y<th;y++)for(let x=0;x<tw;x++){
   const i=4*(y*tw+x),k=Math.floor(y/2)*w+Math.floor(x/2);
   const actual=m.textureRGBA.subarray(i,i+4);
   if(!p.alpha[k]){assert.equal(actual[0]|actual[1]|actual[2]|actual[3],0);continue}
   const src=3*(Math.floor((y+.5)*info.height/th)*info.width+Math.floor((x+.5)*info.width/tw));
   assert.equal(actual[0],data[src]);assert.equal(actual[1],data[src+1]);assert.equal(actual[2],data[src+2]);assert.equal(actual[3],255);
  }
  console.log(id,r.status,'foreground',p.foregroundPixels,'triangles',m.indices.length/3,'uncertain',p.uncertainPixels);
 }
 assert.ok(produced>0,'must produce at least one actual source-derived textured mesh');
});
test('reject foreign source, modified original, caller-supplied masks and invalid texture configuration',async()=>{
 const a=input(ids[0]);
 const altered=Buffer.from(a.originalBytes);altered[70]^=1;
 for(const args of [{...a,sourceId:ids[1]},{...a,originalBytes:altered},{...a,alpha:new Uint8Array(16)},{...a,maskSHA256:'0'.repeat(64)},{...a,textureScale:9}]){
  const r=await build(args);assert.equal(r.status,'ORIGINAL_PHOTO_2D_REQUIRED');assert.equal(r.mesh,undefined);assert.equal(r.consumer3DAdmitted,false);
 }
});
test('original input is snapshotted before any async source decoding',async()=>{
 const a=input(ids[0]),expected=await build(a);
 const pending=build(a);a.originalBytes[70]^=1;
 const actual=await pending;
 assert.equal(actual.status,expected.status);
 assert.equal(actual.originalSHA256,expected.originalSHA256);
 if(expected.mesh)assert.equal(actual.mesh.textureSHA256,expected.mesh.textureSHA256);
});
