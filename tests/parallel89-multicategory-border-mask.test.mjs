import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
import {proposeBorderMask89,proposeOriginalPhotoMask89} from '../research/parallel89/multicategory-border-mask89.mjs';
const sha=b=>createHash('sha256').update(b).digest('hex');
test('thin contrasting silhouette retained, connected background removed, matching enclosed hole uncertain',()=>{
 const w=32,h=32,rgb=new Uint8Array(w*h*3).fill(230);
 const paint=(x,y,c)=>rgb.fill(c,3*(y*w+x),3*(y*w+x)+3);
 for(let y=8;y<24;y++)for(let x=9;x<23;x++)paint(x,y,60);
 for(let y=4;y<8;y++)paint(15,y,60);
 for(let y=13;y<16;y++)for(let x=14;x<17;x++)paint(x,y,230);
 paint(8,12,205);
 const before=sha(rgb),r=proposeBorderMask89({rgb,width:w,height:h});
 assert.equal(r.status,'UNREVIEWED_BORDER_MASK_PROPOSAL');
 assert.equal(r.alpha[4*w+15],255);
 assert.equal(r.alpha[14*w+15],0);assert.equal(r.uncertain[14*w+15],255);
 assert.equal(r.background[0],255);assert.equal(r.alpha[12*w+8],0);assert.equal(r.uncertain[12*w+8],255);
 assert.equal(sha(rgb),before);assert.equal(r.consumer3DAdmitted,false);
});
test('ambiguous border, flat photo and invalid RGB refuse',()=>{
 const w=32,h=32,rgb=new Uint8Array(w*h*3).fill(200);
 assert.equal(proposeBorderMask89({rgb,width:w,height:h}).status,'ORIGINAL_PHOTO_2D_REQUIRED');
 for(let y=0;y<h;y++)for(let x=0;x<w/2;x++)rgb.fill(20,3*(y*w+x),3*(y*w+x)+3);
 assert.equal(proposeBorderMask89({rgb,width:w,height:h}).status,'ORIGINAL_PHOTO_2D_REQUIRED');
 assert.equal(proposeBorderMask89({rgb:new Uint8Array(3),width:w,height:h}).status,'ORIGINAL_PHOTO_2D_REQUIRED');
});
test('six independently licensed JPEGs produce source-derived proposals or explicit abstention',async()=>{
 const reg=JSON.parse(readFileSync(new URL('../benchmark/locked-photo-sources.json',import.meta.url)));
 let proposed=0;
 for(const id of ['commons-0001','commons-0003','commons-0016','commons-0023','commons-0041','commons-0053']){
  const originalBytes=readFileSync(new URL('../benchmark/fixtures/'+id+'.jpg',import.meta.url)),before=sha(originalBytes),lockedRecord=reg.find(r=>r.id===id);
  const r=await proposeOriginalPhotoMask89({sourceId:id,originalBytes,lockedRecord});
  const {data,info}=await sharp(originalBytes,{limitInputPixels:16000000}).removeAlpha().toColourspace('srgb').raw().toBuffer({resolveWithObject:true});
  assert.equal(r.originalSHA256,before);assert.equal(r.decodedRGBSHA256,sha(data));
  assert.deepEqual(r.decodedDimensions,[info.width,info.height]);assert.equal(r.consumer3DAdmitted,false);assert.equal(r.familyAlpha,'HOLD');
  assert.equal(sha(originalBytes),before);
  if(r.status==='UNREVIEWED_BORDER_MASK_PROPOSAL'){
   proposed++;
   assert.equal(r.maskSHA256,sha(r.alpha));assert.equal(r.uncertaintySHA256,sha(r.uncertain));
   assert.equal(r.alpha.length,r.width*r.height);
   for(let i=0;i<r.alpha.length;i++)assert.equal(Number(r.alpha[i]===255)+Number(r.uncertain[i]===255)+Number(r.background[i]===255),1);
   assert.ok(r.foregroundPixels>0);assert.ok(r.backgroundPixels>0);
  }else assert.equal(r.status,'ORIGINAL_PHOTO_2D_REQUIRED');
  console.log(id,r.status,r.foregroundPixels??0,r.uncertainPixels??0,r.reason??'');
 }
 assert.ok(proposed>0,'at least one real source must support a proposal');
 const originalBytes=readFileSync(new URL('../benchmark/fixtures/commons-0001.jpg',import.meta.url));originalBytes[70]^=1;
 assert.equal((await proposeOriginalPhotoMask89({sourceId:'commons-0001',originalBytes,lockedRecord:reg.find(r=>r.id==='commons-0001')})).status,'ORIGINAL_PHOTO_2D_REQUIRED');
});
