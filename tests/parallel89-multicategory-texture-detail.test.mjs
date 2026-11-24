import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
const {buildOriginalJPEGTexturedFront89:build}=await import(new URL(process.env.M2_DETAIL_BASELINE==='1'?'../research/parallel89/.detail-baseline.mjs':'../research/parallel89/source-original-texture-transfer89.mjs',import.meta.url));
const sha=b=>createHash('sha256').update(b).digest('hex');
const registry=JSON.parse(readFileSync(new URL('../benchmark/locked-photo-sources.json',import.meta.url)));
const ids=['commons-0001','commons-0003','commons-0016','commons-0023','commons-0041','commons-0053'];
const width=12,height=10;
const alpha=new Uint8Array(width*height);
for(let y=1;y<9;y++)for(let x=2;x<10;x++)if(!(x===2&&y<4))alpha[y*width+x]=255;
function input(id){return {sourceId:id,originalBytes:readFileSync(new URL('../benchmark/fixtures/'+id+'.jpg',import.meta.url)),lockedRecord:registry.find(r=>r.id===id),alpha,width,height,sourceMaskSHA256:sha(alpha)};}
test('six licensed original photos: higher density source RGB independent of mesh resolution',async()=>{
 let moreColors=0;
 for(const id of ids){
  const args=input(id),before=sha(args.originalBytes),mask=sha(alpha);
  const low=await build(args),high=await build({...args,textureScale:4});
  assert.equal(low.status,'TWO_DIMENSIONAL_ORIGINAL_RGB_ON_PROVISIONAL_FRONT_MESH_ONLY');
  assert.equal(high.status,low.status);
  assert.deepEqual(high.textureDimensions,[48,40],'SOURCE_TEXTURE_DETAIL_LOSS');
  assert.deepEqual(low.textureDimensions,[12,10]);
  assert.deepEqual(high.positions,low.positions);
  assert.deepEqual(high.uv,low.uv);
  assert.deepEqual(high.indices,low.indices);
  const {data,info}=await sharp(args.originalBytes,{limitInputPixels:16000000}).removeAlpha().toColourspace('srgb').raw().toBuffer({resolveWithObject:true});
  assert.equal(high.decodedOriginalRGBSHA256,sha(data));
  const colors=new Set(),lowColors=new Set();
  for(let i=0;i<low.textureRGBA.length;i+=4)if(low.textureRGBA[i+3])lowColors.add(Array.from(low.textureRGBA.slice(i,i+3)).join(','));
  let count=0;
  for(let y=0;y<40;y++)for(let x=0;x<48;x++){
   const v=Array.from(high.textureRGBA.slice(4*(y*48+x),4*(y*48+x)+4));
   if(!alpha[Math.floor(y/4)*width+Math.floor(x/4)]){assert.deepEqual(v,[0,0,0,0]);continue;}
   const src=3*(Math.floor((y+.5)*info.height/40)*info.width+Math.floor((x+.5)*info.width/48));
   assert.deepEqual(v,[data[src],data[src+1],data[src+2],255]);colors.add(v.slice(0,3).join(','));count++;
  }
  assert.equal(count,16*low.originalRGBForegroundPixels);
  assert.equal(high.textureForegroundPixels,count);
  assert.equal(high.originalRGBForegroundPixels,low.originalRGBForegroundPixels);
  if(colors.size>lowColors.size)moreColors++;
  assert.equal(high.textureSHA256,sha(high.textureRGBA));
  assert.equal(sha(args.originalBytes),before);assert.equal(sha(alpha),mask);
  assert.equal(high.consumer3DAdmitted,false);assert.equal(high.originalPhoto2DFallbackRequired,true);
  assert.equal(high.familyAlpha,'HOLD');
 }
 assert.ok(moreColors>0,'higher sample density must preserve more distinct original RGB on at least one genuine photo');
});
test('invalid or oversized texture requests fail closed; default remains compatible',async()=>{
 const args=input(ids[0]);
 for(const textureScale of [0,-1,1.5,9,Infinity,NaN,'4',null]){
  const out=await build({...args,textureScale});
  assert.equal(out.status,'ORIGINAL_PHOTO_2D_REQUIRED');assert.equal(out.consumer3DAdmitted,false);
 }
 const large=new Uint8Array(256*256);large.fill(255,256,512);
 const out=await build({...args,alpha:large,width:256,height:256,sourceMaskSHA256:sha(large),textureScale:8});
 assert.equal(out.status,'ORIGINAL_PHOTO_2D_REQUIRED');
 const ok=await build({...args,textureScale:1});assert.deepEqual(ok.textureDimensions,[12,10]);
});
