import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
const moduleURL = new URL(process.env.M2_ASPECT_BASELINE === '1'
 ? '../research/parallel89/.aspect-baseline.mjs'
 : '../research/parallel89/source-original-texture-transfer89.mjs', import.meta.url);
const {buildOriginalJPEGTexturedFront89:build}=await import(moduleURL);
const sha=b=>createHash('sha256').update(b).digest('hex');
const records=JSON.parse(readFileSync(new URL('../benchmark/locked-photo-sources.json',import.meta.url)));
const sources=[['commons-0001','shirt'],['commons-0003','shirt'],['commons-0016','blouse'],['commons-0023','jeans'],['commons-0041','skirt'],['commons-0053','dress']];
test('six licensed original JPEGs retain native source aspect across square and rectangular proposal grids',async()=>{
 const mismatches=[];
 let nonSquare=0;
 for(const [id,category] of sources){
  const bytes=readFileSync(new URL('../benchmark/fixtures/'+id+'.jpg',import.meta.url));
  const record=records.find(r=>r.id===id),before=sha(bytes);
  assert.equal(before,record.sha256);
  const {data,info}=await sharp(bytes,{limitInputPixels:16000000}).removeAlpha().toColourspace('srgb').raw().toBuffer({resolveWithObject:true});
  const ratio=info.width/info.height;
  if(Math.abs(ratio-1)>1e-5)nonSquare++;
  for(const [width,height] of [[12,12],[18,10]]){
   // Test-only mask, not an approved garment boundary.
   const alpha=new Uint8Array(width*height);
   for(let y=2;y<height-2;y++)for(let x=1;x<width-2;x++)if(x!==1||y!==2)alpha[y*width+x]=255;
   const maskSHA=sha(alpha);
   const out=await build({sourceId:id,originalBytes:bytes,lockedRecord:record,alpha,width,height,sourceMaskSHA256:maskSHA});
   assert.equal(out.status,'TWO_DIMENSIONAL_ORIGINAL_RGB_ON_PROVISIONAL_FRONT_MESH_ONLY');
   assert.equal(out.category,category);
   assert.equal(out.originalJPEG_SHA256,before);
   assert.equal(out.decodedOriginalRGBSHA256,sha(data));
   assert.equal(out.researchMaskSHA256,maskSHA);
   assert.equal(out.indices.length/3,2*alpha.filter(v=>v===255).length);
   for(let i=0;i<out.positions.length/3;i++){
    const u=out.uv[2*i],v=out.uv[2*i+1];
    const error=Math.abs(out.positions[3*i]-(u-.5)*ratio);
    if(error>1e-6){mismatches.push(id+' '+width+'x'+height);break;}
    assert.ok(Math.abs(out.positions[3*i+1]-(v-.5))<1e-6);
    assert.equal(out.positions[3*i+2],0);
   }
   for(let y=0;y<height;y++)for(let x=0;x<width;x++){
    const dst=4*(y*width+x),src=3*(Math.floor((y+.5)*info.height/height)*info.width+Math.floor((x+.5)*info.width/width));
    assert.deepEqual(Array.from(out.textureRGBA.slice(dst,dst+4)),alpha[y*width+x]?[data[src],data[src+1],data[src+2],255]:[0,0,0,0]);
   }
   assert.equal(sha(bytes),before);
   assert.equal(sha(alpha),maskSHA);
   assert.equal(out.consumer3DAdmitted,false);
   assert.equal(out.actual163BoneFitProved,false);
   assert.equal(out.originalPhoto2DFallbackRequired,true);
   assert.equal(out.familyAlpha,'HOLD');
  }
 }
 assert.ok(nonSquare>0,'actual non-square source coverage required');
 assert.deepEqual(mismatches,[],'SOURCE_ASPECT_DISTORTION: source UV to native decoded aspect mismatch');
});
