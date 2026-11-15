// Assignment #88: synthetic accepted-mask conservation, NOT independently
// human-labeled image accuracy or evidence of actual SegFormer quality.
import test from 'node:test';
import assert from 'node:assert/strict';
import {clothingLabelMap,clothingMaskGroups} from '../public/outfit-segmentation.mjs';
import {exposedPixelGateMap88,P88_EXPOSED_PIXEL_PROBES,accessoryBoxIoU88,evaluateCocoAccessoryBoxes88,cocoAccessoryLabel88} from '../research/mission1-parallel88/exposed-threshold-probes-88.mjs';
import {clothingReviewInstances840} from '../public/outfit-instance-review-840.mjs';

function fixture(width=48,height=48){
 const area=width*height,data=new Float32Array(18*area);
 data.fill(-10);
 for(let i=0;i<area;i++)data[i]=10;
 return {
  paint(cls,x,y,w,h){
   for(let row=y;row<y+h;row++)for(let col=x;col<x+w;col++){
    const i=row*width+col;
    for(let c=0;c<18;c++)data[c*area+i]=c===cls?10:-10;
   }
  },
  map:()=>clothingLabelMap(data,[1,18,height,width])
 };
}
function proveConservation(original,proposed){
 const total=original.selected.reduce((n,x)=>n+x,0);
 assert.equal(proposed.reduce((n,g)=>n+g.count,0),total);
 for(let i=0;i<original.selected.length;i++){
  assert.equal(proposed.reduce((n,g)=>n+g.selected[i],0),original.selected[i],
   'accepted source pixel '+i+' must occur exactly once');
 }
}
test('P88 two disconnected shirts become separate UNSAVED review masks, never duplicate pixels',()=>{
 const f=fixture();f.paint(4,5,9,6,6);f.paint(4,27,9,6,6);f.paint(6,15,25,10,7);
 const map=f.map(),original=clothingMaskGroups(map).find(x=>x.id===4);
 assert.equal(original.count,72,'legacy merged the two same-class garments');
 const proposals=clothingReviewInstances840(map,{splitNonFootwear:true}).filter(x=>x.id===4);
 assert.equal(proposals.length,2);
 assert.deepEqual(proposals.map(p=>p.count),[36,36]);
 assert.ok(proposals.every(p=>p.requiresReview===true&&
  p.instanceMethod==='connected_semantic_component_unverified'&&
  p.componentReviewStatus==='owner_must_confirm_garment_units'));
 proveConservation(original,proposals);
});
test('P88 two disconnected dresses remain proposals, not verified dress identities',()=>{
 const f=fixture();f.paint(7,4,7,6,7);f.paint(7,30,8,6,7);
 const map=f.map(),original=clothingMaskGroups(map).find(x=>x.id===7);
 const proposed=clothingReviewInstances840(map,{splitNonFootwear:true}).filter(x=>x.id===7);
 assert.equal(proposed.length,2);
 assert.ok(proposed.every(x=>x.requiresReview&&x.types===undefined&&x.id===7));
 proveConservation(original,proposed);
});
test('P88 tiny detached shirt fragment does not disappear or fabricate a second garment',()=>{
 const f=fixture();f.paint(4,6,9,7,7);f.paint(4,34,10,1,5);
 const map=f.map(),original=clothingMaskGroups(map).find(x=>x.id===4);
 const proposed=clothingReviewInstances840(map).filter(x=>x.id===4);
 assert.equal(original.count,54);assert.equal(proposed.length,1);
 assert.equal(proposed[0].componentReviewStatus,'unresolved_fragments_keep_source_mask');
 assert.equal(proposed[0].requiresReview,true);
 proveConservation(original,proposed);
});
test('P88 existing two-shoe owner-review split remains unchanged and source-conserving',()=>{
 const f=fixture();f.paint(9,5,33,5,5);f.paint(9,32,33,5,5);
 const map=f.map(),original=clothingMaskGroups(map).find(x=>x.id===9);
 const shoes=clothingReviewInstances840(map).filter(x=>x.id===9);
 assert.equal(shoes.length,2);
 assert.ok(shoes.every(x=>x.instanceMethod==='connected_footwear_component'&&x.requiresReview));
 proveConservation(original,shoes);
});
test('P88 no clothing pixels produce no phantom garment proposals',()=>{
 const f=fixture(),map=f.map();
 assert.deepEqual(clothingReviewInstances840(map),[]);
});

test('P88 source-verified conservative trial does not create six unproved nonshoe physical items',()=>{
 const f=fixture();f.paint(4,5,9,6,6);f.paint(4,27,9,6,6);
 f.paint(7,4,25,6,7);f.paint(7,30,25,6,7);
 const map=f.map(),source=clothingMaskGroups(map);
 const safe=clothingReviewInstances840(map);
 const research=clothingReviewInstances840(map,{splitNonFootwear:true});
 for(const id of [4,7]){
  const original=source.find(x=>x.id===id);
  assert.equal(safe.filter(x=>x.id===id).length,1,'no unsupported automatic nonshoe instance inflation');
  assert.equal(research.filter(x=>x.id===id).length,2,'all-class research remains reproducible');
  assert.equal(safe.find(x=>x.id===id).instanceMethod,'native_semantic_group_unresolved_fragments');
  assert.equal(safe.find(x=>x.id===id).componentReviewStatus,'unresolved_fragments_keep_source_mask',
   'two disconnected garments must never silently save as one item');
  proveConservation(original,safe.filter(x=>x.id===id));
  proveConservation(original,research.filter(x=>x.id===id));
 }
 assert.equal(safe.every(x=>x.requiresReview===true),true);
});


function researchLogits88(){
 const width=48,height=48,area=width*height,data=new Float32Array(area*18);
 data.fill(-100);
 // Native/logit source background for all pixels.
 for(let i=0;i<area;i++)data[i]=0;
 const rect=(left,top,right,bottom,value)=>{
  for(let y=top;y<bottom;y++)for(let x=left;x<right;x++)
   data[4*area+y*width+x]=value;
 };
 rect(16,16,32,32,.4); // soft accepted-class perimeter
 rect(17,17,31,31,.8); // medium confidence margin
 rect(18,18,30,30,4); // exact original high-confidence shirt core
 return {data,dims:[1,18,height,width]};
}
test('P88 research-only alternative pixel gates never alter production group selection',()=>{
 const {data,dims}=researchLogits88(),original=data.slice();
 const actual=clothingLabelMap(data,dims);
 const duplicate=exposedPixelGateMap88(data,dims,{pixelConfidence:.7,pixelMargin:.15});
 assert.deepEqual(duplicate.labels,actual.labels,'research gate must exactly reproduce native source at default');
 assert.deepEqual(duplicate.confidence,actual.confidence,'no changed original/native probability calculation');
 assert.equal(duplicate.personDetected,actual.personDetected);
 const broad=exposedPixelGateMap88(data,dims,P88_EXPOSED_PIXEL_PROBES.researchLoose65);
 const wider=exposedPixelGateMap88(data,dims,P88_EXPOSED_PIXEL_PROBES.researchLoose55);
 assert.deepEqual([clothingMaskGroups(actual)[0].count,
  clothingMaskGroups(broad)[0].count,clothingMaskGroups(wider)[0].count],[144,196,256],
  'research-only pixel gate adds uncertain boundary pixels but never saves');
 assert.equal(clothingReviewInstances840(wider).every(x=>x.requiresReview===true),true);
 assert.deepEqual(data,original,'research-only gate does not mutate model logits');
 assert.deepEqual(clothingMaskGroups(clothingLabelMap(data,dims)).map(x=>x.count),[144],
  'the production SegFormer mask must remain unchanged');
});
test('P88 experimental thresholds reject corrupt or adversarial SegFormer inputs',()=>{
 const {data,dims}=researchLogits88();
 for(const invalid of [
  {pixelConfidence:0.49,pixelMargin:.1},
  {pixelConfidence:NaN,pixelMargin:.1},
  {pixelConfidence:.65,pixelMargin:1},
  {pixelConfidence:.65,pixelMargin:-.001},
  null
 ])assert.throws(()=>exposedPixelGateMap88(data,dims,invalid),/P88_RESEARCH_INVALID_PIXEL_GATE/);
 assert.throws(()=>exposedPixelGateMap88(data,[1,17,48,48],P88_EXPOSED_PIXEL_PROBES.researchLoose65),
  /P88_RESEARCH_INVALID_MODEL_LOGITS/);
 const poisoned=data.slice();poisoned[400]=NaN;
 assert.throws(()=>exposedPixelGateMap88(poisoned,dims,P88_EXPOSED_PIXEL_PROBES.researchLoose55),
  /P88_RESEARCH_NONFINITE_LOGITS/);
});
test('P88 research pixel-gate never invents an unsourced clothing label or owner permission',()=>{
 const dims=[1,18,24,24],area=24*24,data=new Float32Array(area*18);
 data.fill(-100);for(let i=0;i<area;i++)data[i]=0;
 for(let y=5;y<19;y++)for(let x=5;x<19;x++){
  // Source logits class 2 represents hair and is explicitly non-clothing.
  data[2*area+y*24+x]=6;
 }
 const broad=exposedPixelGateMap88(data,dims,P88_EXPOSED_PIXEL_PROBES.researchLoose55);
 assert.deepEqual(clothingMaskGroups(broad),[]);
 assert.equal(Array.from(broad.labels).some(x=>x!==0),false);
});


test('P88 research source loose shoe mask conserves both physical-region proposals',()=>{
 const width=48,height=48,area=width*height,data=new Float32Array(area*18);
 data.fill(-100);
 for(let i=0;i<area;i++)data[i]=0;
 const shoe=(left,top)=>{
  for(let y=top;y<top+10;y++)for(let x=left;x<left+9;x++)
   data[9*area+y*width+x]=4;
 };
 shoe(4,29);shoe(32,29);
 const native=clothingLabelMap(data,[1,18,height,width]),
  relaxed=exposedPixelGateMap88(data,[1,18,height,width],
   P88_EXPOSED_PIXEL_PROBES.researchLoose65);
 const base=clothingMaskGroups(native),group=clothingMaskGroups(relaxed);
 assert.equal(base.length,1);
 assert.equal(group.length,1,'semantic union still represents two shoes as one source class');
 const review=clothingReviewInstances840(relaxed);
 assert.equal(review.length,2,'existing conservative physical shoe review restores source components');
 assert.equal(review.every(x=>x.requiresReview===true &&
  x.instanceMethod==='connected_footwear_component' &&
  x.componentReviewStatus==='owner_must_confirm_garment_units'),true);
 proveConservation(group[0],review);
 assert.equal(review.reduce((sum,r)=>sum+r.count,0),180);
});


test('P88 COCO model bag scope cannot explain unsupported watch, belt, glasses or hats',()=>{
 assert.equal(cocoAccessoryLabel88('handbag'),'bag');
 assert.equal(cocoAccessoryLabel88('backpack'),'bag');
 assert.equal(cocoAccessoryLabel88('tie'),'tie');
 assert.equal(cocoAccessoryLabel88('umbrella'),'umbrella');
 for(const label of ['watch','belt','glasses','hat','person','shoe','shirt',null])
  assert.equal(cocoAccessoryLabel88(label),null);
 const gt=[
  {category_id:24,box:{xmin:5,ymin:5,xmax:15,ymax:15}},
  {category_id:18,box:{xmin:20,ymin:5,xmax:24,ymax:9}},
  {category_id:19,box:{xmin:5,ymin:20,xmax:18,ymax:25}},
  {category_id:13,box:{xmin:30,ymin:8,xmax:42,ymax:14}},
  {category_id:14,box:{xmin:25,ymin:25,xmax:45,ymax:36}},
  {category_id:15,box:{xmin:2,ymin:30,xmax:10,ymax:40}}
 ];
 const p=[{label:'handbag',score:.98,box:{xmin:5,ymin:5,xmax:15,ymax:15}},
  {label:'person',score:.99,box:{xmin:0,ymin:0,xmax:48,ymax:48}}];
 const result=evaluateCocoAccessoryBoxes88(gt,p);
 assert.equal(result.supportedHuman,1);
 assert.equal(result.unsupportedHuman,5);
 assert.equal(result.matched,1);
 assert.equal(result.proposals,1);
 assert.equal(result.falsePositives,0);
 assert.deepEqual(result.unsupportedFashionpediaIds,[18,19,13,14,15]);
 assert.equal(result.noSaveOrModelPromotion,true);
});
test('P88 accessory COCO boxes use source-bound per-class 1:1 IoU not duplicated detections',()=>{
 const gt=[{category_id:24,box:{xmin:0,ymin:0,xmax:10,ymax:10}},
           {category_id:24,box:{xmin:25,ymin:25,xmax:35,ymax:35}}];
 const seen=[{label:'handbag',score:.9,box:{xmin:0,ymin:0,xmax:10,ymax:10}},
             {label:'backpack',score:.8,box:{xmin:0,ymin:0,xmax:10,ymax:10}},
             {label:'umbrella',score:.8,box:{xmin:25,ymin:25,xmax:35,ymax:35}}];
 const r=evaluateCocoAccessoryBoxes88(gt,seen);
 assert.equal(r.matched,1,'identical overlapping bags cannot match two human physical instances');
 assert.equal(r.falsePositives,2);
 assert.equal(r.falseNegatives,1);
 assert.ok(Math.abs(accessoryBoxIoU88(
  {xmin:0,ymin:0,xmax:10,ymax:10},
  {xmin:5,ymin:5,xmax:15,ymax:15})-1/7)<.0000001);
 assert.throws(()=>evaluateCocoAccessoryBoxes88(
  [{category_id:23,box:gt[0].box}],[]),/P88_EXPECTED_ACCESSORY_TRUTH_ONLY/);
 assert.throws(()=>evaluateCocoAccessoryBoxes88(gt,[
  {label:'handbag',score:NaN,box:gt[0].box}]),/P88_INVALID_COCO_CONFIDENCE/);
 assert.throws(()=>evaluateCocoAccessoryBoxes88(gt,[
  {label:'handbag',score:.6,box:{xmin:0,ymin:0,xmax:0,ymax:10}}]),
 /P88_INVALID_BOX/);
});
