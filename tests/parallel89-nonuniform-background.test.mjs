import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {proposeBorderMask89,proposeOriginalPhotoMask89} from '../research/parallel89/multicategory-border-mask89.mjs';
import {buildPhotoDerivedResearchMesh89} from '../research/parallel89/source-photo-to-mesh89.mjs';
const sha=b=>createHash('sha256').update(b).digest('hex');
test('nonuniform gradient background retains contrasting garment and uncertain hole',()=>{
 const w=64,h=48,rgb=new Uint8Array(w*h*3);
 const bg=(x,y)=>Math.round(100+100*x/(w-1)+30*y/(h-1));
 for(let y=0;y<h;y++)for(let x=0;x<w;x++)rgb.fill(bg(x,y),3*(y*w+x),3*(y*w+x)+3);
 for(let y=10;y<38;y++)for(let x=20;x<44;x++)if(!(x>=29&&x<35&&y>=20&&y<25))rgb.fill(15,3*(y*w+x),3*(y*w+x)+3);
 const r=proposeBorderMask89({rgb,width:w,height:h});
 assert.equal(r.status,'UNREVIEWED_BORDER_MASK_PROPOSAL');
 assert.equal(r.backgroundModel,'bilinear-corner-field');
 assert.equal(r.foregroundPixels,28*24-6*5);
 assert.equal(r.alpha[10*w+20],255);assert.equal(r.uncertain[22*w+32],255);
 assert.equal(r.background[0],255);assert.equal(r.consumer3DAdmitted,false);
});
test('two-tone backdrop: supported palette retains garment but refuses empty split photo',()=>{
 const w=64,h=48,rgb=new Uint8Array(w*h*3);
 for(let y=0;y<h;y++)for(let x=0;x<w;x++)rgb.fill(x<w/2?220:140,3*(y*w+x),3*(y*w+x)+3);
 assert.equal(proposeBorderMask89({rgb,width:w,height:h}).status,'ORIGINAL_PHOTO_2D_REQUIRED');
 for(let y=12;y<36;y++)for(let x=22;x<42;x++)rgb.fill(20,3*(y*w+x),3*(y*w+x)+3);
 const r=proposeBorderMask89({rgb,width:w,height:h});
 assert.equal(r.status,'UNREVIEWED_BORDER_MASK_PROPOSAL');
 assert.equal(r.backgroundModel,'cross-side-color-palette');
 assert.equal(r.foregroundPixels,480);assert.equal(r.backgroundPixels,w*h-480);
});
test('six original JPEGs preserve prior proposals and probe three previously blocked sources',async()=>{
 const reg=JSON.parse(readFileSync(new URL('../benchmark/locked-photo-sources.json',import.meta.url)));
 const ids=['commons-0001','commons-0003','commons-0016','commons-0023','commons-0041','commons-0053'];
 const prior=new Map([['commons-0001',10480],['commons-0016',5010],['commons-0053',9267]]);
 let recovered=0;
 for(const id of ids){
  const originalBytes=readFileSync(new URL('../benchmark/fixtures/'+id+'.jpg',import.meta.url)),before=sha(originalBytes),lockedRecord=reg.find(r=>r.id===id);
  const p=await proposeOriginalPhotoMask89({sourceId:id,originalBytes,lockedRecord});
  const m=await buildPhotoDerivedResearchMesh89({sourceId:id,originalBytes,lockedRecord});
  assert.equal(p.originalSHA256,before);assert.equal(m.originalSHA256,before);
  assert.equal(p.consumer3DAdmitted,false);assert.equal(m.consumer3DAdmitted,false);assert.equal(sha(originalBytes),before);
  if(prior.has(id)){assert.equal(p.foregroundPixels,prior.get(id));assert.equal(p.backgroundModel,'uniform-border-median')}
  if(p.status==='UNREVIEWED_BORDER_MASK_PROPOSAL'){
   if(!prior.has(id))recovered++;
   assert.equal(m.status,'SOURCE_DERIVED_TEXTURED_VIEW_PLANE_RESEARCH_ONLY');
   assert.equal(m.mesh.indices.length/3,p.foregroundPixels*2);
   assert.equal(m.maskSHA256,sha(p.alpha));assert.equal(m.uncertaintySHA256,sha(p.uncertain));
   for(let i=0;i<p.alpha.length;i++)assert.equal(p.alpha[i]+p.uncertain[i]+p.background[i],255);
  }else{assert.equal(m.status,'ORIGINAL_PHOTO_2D_REQUIRED');assert.equal(m.mesh,undefined);}
  console.log('NONUNIFORM_RESULT',id,p.status,p.backgroundModel??p.reason,p.foregroundPixels??0,p.uncertainPixels??0);
 }
 console.log('RECOVERED_PREVIOUS_ABSTENTIONS',recovered);
});
