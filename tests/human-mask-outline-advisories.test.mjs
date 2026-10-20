import {test} from 'node:test';
import assert from 'node:assert/strict';
import {inspectHumanOutline} from '../scripts/human-mask-outline-advisories.mjs';
function annotation(w,h,marked){
 const pixels=new Uint8Array(w*h);
 for(const [x,y] of marked)pixels[y*w+x]=1;
 let count=0,prev=0;
 const runs=[];
 for(const bit of pixels){if(bit!==prev){runs.push(count);count=0;prev=bit;}count++;}
 runs.push(count);
 return {width:w,height:h,runs};
}
function square(x1,y1,x2,y2){
 const pts=[];for(let y=y1;y<=y2;y++)for(let x=x1;x<=x2;x++)pts.push([x,y]);return pts;
}
test('single four-connected garment remains a review advisory, not proof of accuracy',()=>{
 const a=annotation(9,9,square(2,2,6,6)),original=JSON.parse(JSON.stringify(a));
 const m=inspectHumanOutline(a);
 assert.equal(m.connectedGarmentRegions,1);
 assert.equal(m.interiorBackgroundRegions,0);
 assert.equal(m.photoFrameForegroundPixels,0);
 assert.deepEqual(m.garmentBounds,{left:2,top:2,right:6,bottom:6});
 assert.equal(m.foregroundPixels,25);
 assert.equal(m.qualityGatePassed,false);
 assert.equal(m.referenceCorrectnessMeasured,false);
 assert.equal(m.productionAuthorized,false);
 assert.deepEqual(a,original,'advisories must not modify approved human evidence');
});
test('enclosed native pixel gap is reported but NOT deemed a true error',()=>{
 const pts=square(2,2,6,6).filter(([x,y])=>!(x===4&&y===4));
 const m=inspectHumanOutline(annotation(9,9,pts));
 assert.equal(m.interiorBackgroundRegions,1);
 assert.equal(m.interiorBackgroundPixels,1);
 assert.equal(m.largestInteriorGapPixels,1);
 assert.ok(m.flags.some(f=>f.code==='interior-background-gaps'));
 assert.equal(m.visibleClothingAccuracyProven,false);
});
test('detached mask regions trigger a reviewer attention flag, not rejection',()=>{
 const a=annotation(10,10,[...square(2,2,4,4),[8,8]]);
 const m=inspectHumanOutline(a);
 assert.equal(m.connectedGarmentRegions,2);
 assert.equal(m.largestGarmentRegionPixels,9);
 assert.equal(m.fragmentPixels,1);
 assert.ok(m.flags.some(f=>f.code==='multiple-foreground-regions'));
 assert.equal(m.flagCount,1);
});
test('image-edge touch and unusually tiny selected garment are explicitly flagged',()=>{
 const m=inspectHumanOutline(annotation(30,30,[[0,0],[1,0],[0,1]]));
 assert.equal(m.photoFrameForegroundPixels,3);
 assert.ok(m.flags.some(f=>f.code==='garment-touches-image-frame'));
 assert.ok(m.flags.some(f=>f.code==='unusual-mask-coverage'));
});
test('diagonal-only connections stay distinct under explicit four-connectivity',()=>{
 const m=inspectHumanOutline(annotation(8,8,[[2,2],[3,3]]));
 assert.equal(m.connectedGarmentRegions,2);
});
test('missing, invalid and full-image masks fail closed',()=>{
 assert.throws(()=>inspectHumanOutline(annotation(5,5,[])),/garment and background/);
 assert.throws(()=>inspectHumanOutline(annotation(5,5,square(0,0,4,4))),/garment and background/);
 assert.throws(()=>inspectHumanOutline({width:5,height:5,runs:[0,300]}));
});
