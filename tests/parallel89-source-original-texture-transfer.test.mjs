import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
import {buildOriginalJPEGTexturedFront89 as build} from
 '../research/parallel89/source-original-texture-transfer89.mjs';
import {attestOriginalSource89,auditSourceOutfit89} from
 '../research/parallel89/source-contract.mjs';

const sha256=bytes=>createHash('sha256').update(bytes).digest('hex');
const registry=JSON.parse(readFileSync(new URL('../benchmark/locked-photo-sources.json',import.meta.url)));
const original=id=>readFileSync(new URL('../benchmark/fixtures/'+id+'.jpg',import.meta.url));
const record=id=>registry.find(x=>x.id===id);
const w=12,h=12;
function proposedMask(){
 // Explicitly constructed TEST-ONLY proposal, NOT a human-accepted garment.
 const a=new Uint8Array(w*h);
 for(let y=2;y<=9;y++)for(let x=2;x<=9;x++){
  if(!(x===2&&y<=5)&&!(x===9&&y>=7))a[y*w+x]=255;
 }
 return a;
}
const make=(id,x={})=>{
 const alpha=proposedMask();
 return build({sourceId:id,originalBytes:original(id),lockedRecord:record(id),
  alpha,width:w,height:h,sourceMaskSHA256:sha256(alpha),...x});
};
const ids=['commons-0003','commons-0023'];
for(const id of ids){
 test('ACTUAL independently licensed original JPEG RGB to FRONT UV for '+id,async()=>{
  const bytes=original(id),before=sha256(bytes);
  assert.equal(before,record(id).sha256);
  const result=await make(id);
  assert.equal(result.status,'TWO_DIMENSIONAL_ORIGINAL_RGB_ON_PROVISIONAL_FRONT_MESH_ONLY');
  assert.equal(result.originalJPEG_SHA256,before);
  assert.equal(result.sourceFullImageWasReencoded,false);
  assert.equal(result.originalRGBForegroundPixels,proposedMask().filter(v=>v===255).length);
  assert.equal(result.positions.length%3,0);
  assert.equal(result.uv.length/2,result.positions.length/3);
  assert.equal(result.indices.length/3,2*result.originalRGBForegroundPixels);
  assert.equal(result.textureRGBA.length,w*h*4);
  // Independently decode actual source JPEG again: every visible pixel must
  // be a nearest sampled original RGB triplet, never a synthetic color proxy.
  const {data,info}=await sharp(bytes,{limitInputPixels:16000000})
   .removeAlpha().toColourspace('srgb').raw().toBuffer({resolveWithObject:true});
  assert.equal(result.decodedOriginalRGBSHA256,sha256(data));
  assert.deepEqual(result.decodedOriginalDimensions,[info.width,info.height]);
  const alpha=proposedMask();
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
   const dst=(y*w+x)*4,actual=Array.from(result.textureRGBA.slice(dst,dst+4));
   if(alpha[y*w+x]===0){assert.deepEqual(actual,[0,0,0,0]);continue;}
   const sx=Math.min(info.width-1,Math.floor((x+.5)*info.width/w));
   const sy=Math.min(info.height-1,Math.floor((y+.5)*info.height/h));
   const src=(sy*info.width+sx)*3;
   assert.deepEqual(actual,[data[src],data[src+1],data[src+2],255]);
  }
  assert.equal(result.textureSHA256,sha256(result.textureRGBA));
  assert.equal(sha256(bytes),before,'original JPEG bytes were modified');
  assert.equal(result.actual163BoneFitProved,false);
  assert.equal(result.maskGroundTruthApproved,false);
  assert.equal(result.unseenSideOrBackInvented,false);
  assert.equal(result.consumer3DAdmitted,false);
  assert.equal(result.originalPhoto2DFallbackRequired,true);
  assert.equal(result.releaseAuthorized,false);
  assert.equal(result.familyAlpha,'HOLD');
 });
}
test('two AUTHENTIC distinct categories are real-pixel front only, not a wearable 3D outfit',async()=>{
 const a=await make(ids[0]),b=await make(ids[1]);
 assert.equal(a.category,'shirt');assert.equal(b.category,'jeans');
 assert.notEqual(a.originalJPEG_SHA256,b.originalJPEG_SHA256);
 assert.notEqual(a.textureSHA256,b.textureSHA256);
 const pair=ids.map(id=>attestOriginalSource89({
  sourceId:id,originalBytes:original(id),lockedRecord:record(id)}));
 for(const avatar of ['female','male']){
  const look=auditSourceOutfit89({pieces:pair,avatar});
  assert.equal(look.distinctSourceCategories,2);
  assert.equal(look.actualPairedSkinnedMeshesValidated,false);
  assert.equal(look.mode,'original-photo-2d-required');
  assert.equal(look.releaseAuthorized,false);
 }
});
test('wrong JPEG, source ID, license, mask digest or incomplete segmentation fail closed',async()=>{
 const id=ids[0],bytes=original(id),alpha=proposedMask();
 const corrupt=Buffer.from(bytes);corrupt[70]^=1;
 const cases=[
  {originalBytes:corrupt},
  {sourceId:'commons-0023'},
  {lockedRecord:{...record(id),attribution:{...record(id).attribution,license:'proprietary'}}},
  {sourceMaskSHA256:'0'.repeat(64)},
  {alpha:new Uint8Array(w*h)},
  {alpha:new Uint8Array(w*h).fill(255)},
  {alpha:new Uint8Array([255])},
  {alpha:new Uint8Array(w*h).fill(128)},
  {width:Infinity},{width:257},{height:0},
  {originalBytes:new Uint8Array(0)}
 ];
 for(const c of cases){
  const out=await make(id,c);
  assert.equal(out.status,'ORIGINAL_PHOTO_2D_REQUIRED',JSON.stringify(Object.keys(c)));
  assert.equal(out.consumer3DAdmitted,false);
  assert.equal(out.originalPhoto2DFallbackRequired,true);
  assert.equal(out.familyAlpha,'HOLD');
 }
});
