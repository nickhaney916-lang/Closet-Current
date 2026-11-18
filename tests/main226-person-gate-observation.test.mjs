/** M226 source-only deterministic gate witness. This proves a possible zero-output
 * route, NOT that this condition caused historical WebKit intermittent failure. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {clothingLabelMap,clothingMaskGroups} from '../public/outfit-segmentation.mjs';

const source=readFileSync('public/outfit-worker-p94.mjs','utf8');
test('M226 production source still enforces personDetected before exposing candidate garments',()=>{
 assert.ok(source.includes("const groups=!map.personDetected?[]:request.instanceReview840===true?"));
 assert.ok(source.includes("self.postMessage({type:'done',id:request.id,count,personDetected:map.personDetected===true,segmentationGroups:groups.length})"));
});

const logits=(width=20,height=20)=>{
 const area=width*height,data=new Float32Array(18*area).fill(-10);
 for(let i=0;i<area;i++)data[i]=10;
 return {data,dims:[1,18,height,width],paint(id,x0,y0,w,h){
  for(let y=y0;y<y0+h;y++)for(let x=x0;x<x0+w;x++){
   const i=y*width+x;for(let c=0;c<18;c++)data[c*area+i]=c===id?10:-10;
  }
 }};
};

test('M226 deterministic garment-like logits but no confidently detected person trigger zero-gate',()=>{
 const l=logits();
 l.paint(4,5,5,10,8);
 const map=clothingLabelMap(l.data,l.dims);
 const candidates=clothingMaskGroups(map);
 assert.equal(map.personDetected,false);
 assert.equal(candidates.length,1);
 assert.equal(candidates[0].label,'Upper garment');
 assert.equal((map.personDetected?candidates:[]).length,0);
 // This is evidence of gating semantics, not proof that a real WebKit model
 // ever supplied this logits distribution for the historical failed photo.
});
test('M226 same clothing logits with confident head and limb retain positive gating',()=>{
 const l=logits();
 l.paint(4,5,6,10,7);
 l.paint(2,7,1,6,4);
 l.paint(14,1,7,3,6);
 const map=clothingLabelMap(l.data,l.dims);
 const candidates=clothingMaskGroups(map);
 assert.equal(map.personDetected,true);
 assert.equal(candidates.length,1);
 assert.equal((map.personDetected?candidates:[]).length,1);
});
