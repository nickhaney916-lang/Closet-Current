import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {clothingLabelMap,clothingMaskGroups} from '../public/outfit-segmentation.mjs';
import {visibleGarmentGroups24} from '../research/multi-garment-capture-01/visible-groups.mjs';
import {sourceComponentReview776} from '../research/mission1-component-review-776/source-component-review.mjs';

function actualModelLogitShapedFixture(){
 const width=60,height=60,n=width*height,data=new Float32Array(n*18);
 data.fill(-10);
 for(let i=0;i<n;i++)data[i]=10;
 const paint=(family,l,t,w,h)=>{
  for(let y=t;y<t+h;y++)for(let x=l;x<l+w;x++){
   const pos=y*width+x;data[pos]=-10;data[family*n+pos]=10;
  }
 };
 // Two truly separate high-confidence top-shaped model-proposal islands.
 // Synthetic geometry only, NOT original human or publisher photo masks.
 paint(4,3,3,10,10);paint(4,34,4,10,10);paint(6,21,29,10,15);
 const dims=[1,18,height,width],map=clothingLabelMap(data,dims);
 return {data,dims,map,width,height};
}
test('P817 source model: native default merges two same-region tops; reviewed multi24 retains two',()=>{
 const {map,width,height}=actualModelLogitShapedFixture();
 const baseline=clothingMaskGroups(map);
 const research=visibleGarmentGroups24(map);
 const before=baseline.filter(x=>x.id===4),after=research.filter(x=>x.id===4);
 assert.equal(before.length,1);
 assert.equal(after.length,2);
 assert.equal(before[0].count,200);
 assert.deepEqual(after.map(x=>x.count),[100,100]);
 assert.ok(after.every(x=>x.needsReview&&!x.accepted));
 assert.equal(research.find(x=>x.id===6).count,150);
 const union=new Uint8Array(width*height);
 for(const part of after)for(let i=0;i<union.length;i++)if(part.selected[i]){
  assert.equal(union[i],0,'multi24 may not fabricate shared source pixels');
  union[i]=1;
 }
 assert.deepEqual(union,before[0].selected,'unchanged model class-4 source membership');
});
test('P817 original model logits can support source-conserving REVIEW ONLY component alternatives',()=>{
 const {data,dims,map}=actualModelLogitShapedFixture(),g=clothingMaskGroups(map).find(x=>x.id===4);
 const prepared={...g,instanceKey:'source-top-group',
  seedPixelCount:g.count,addedPixelCount:0,maximumAddedPixels:Math.floor(g.count*.5),
  accepted:false,needsReview:true,autoIndex:false};
 const split=sourceComponentReview776({data,dims,map,groups:[prepared]});
 assert.equal(split.length,2);
 assert.deepEqual(split.map(p=>p.count),[100,100]);
 assert.ok(split.every(p=>p.sourcePixelPartitionExact&&p.sourceGroupId==='source-top-group'&&
  p.accepted===false&&p.autoIndex===false&&p.needsReview===true&&
  p.subtype==='Unknown'&&p.primaryColor==='Unknown'));
 const union=new Uint8Array(map.labels.length);
 for(const part of split)for(let i=0;i<union.length;i++)if(part.selected[i]){
  assert.equal(union[i],0);union[i]=1;
 }
 assert.deepEqual(union,g.selected);
});
test('P817 genuine-model test harness keeps all 10 exposed sources and null real independent labels',()=>{
 const src=readFileSync('scripts/test-mission1-seeded-boundary-recovery-browser.mjs','utf8');
 assert.match(src,/MISSION1_COMPONENT_SPLIT_817/);
 assert.match(src,/componentInstanceDiagnostic/);
 assert.match(src,/nativeNormalDiagnostic/);
 assert.match(src,/sourceComponentActualModelReviewArm817/);
 assert.match(src,/sourceComponentActualModelReviewArm817:componentP817/);
 assert.match(src,/newlyEnrolledBlindedHumanHoldout:false/);
 assert.match(src,/exactAppSubtypeAccuracy:null,primaryColorAccuracy:null/);
 assert.match(src,/sourceComponentActualModelReviewArm817:componentP817/);
});
