// Experimental *boxes*, not garment masks or physically verified instances.
// Zero-shot object detection may return multiple names for the SAME item.
// This module never authorizes production crops or wardrobe inserts.
const mapLabel=Object.freeze({
 'a shirt':'Tops','shirt':'Tops','a blouse':'Tops','blouse':'Tops',
 'a jacket':'Outerwear','jacket':'Outerwear','a coat':'Outerwear','coat':'Outerwear',
 'a cardigan':'Outerwear','cardigan':'Outerwear','a dress':'Dresses','dress':'Dresses'
});
const normalized=s=>typeof s==='string'?s.trim().toLowerCase().replace(/\.$/,''):null;
const sourceHash=s=>typeof s==='string'&&/^[a-f0-9]{64}$/.test(s);
const area=b=>(b.xmax-b.xmin)*(b.ymax-b.ymin);
const overlap=(a,b)=>{
 const x=Math.max(0,Math.min(a.xmax,b.xmax)-Math.max(a.xmin,b.xmin));
 const y=Math.max(0,Math.min(a.ymax,b.ymax)-Math.max(a.ymin,b.ymin));
 const intersection=x*y;
 return intersection/Math.max(1e-9,area(a)+area(b)-intersection);
};
export function validateGarmentDetectionBoxes({
 sourceSha256,width,height,detections,threshold=.12
}){
 if(!sourceHash(sourceSha256)||!Number.isInteger(width)||!Number.isInteger(height)
   ||width<32||height<32||width*height>18000000
   ||!Array.isArray(detections)||detections.length>80
   ||!Number.isFinite(threshold)||threshold<.05||threshold>.6)
    throw Error('Invalid garment box evidence');
 const recognized=[],rejected=[],conflicts=[];
 for(let i=0;i<detections.length;i++){
  const raw=detections[i],category=mapLabel[normalized(raw?.label)];
  const box=raw?.box;
  if(typeof raw?.label!=='string'||!Number.isFinite(raw?.score)
     ||raw.score<0||raw.score>1||!box||!['xmin','xmax','ymin','ymax'].every(k=>Number.isFinite(box[k])))
    throw Error('Malformed independent detector output');
  if(!category){rejected.push({index:i,reason:'unsupported-prompt-label'});continue;}
  const rect={xmin:Math.max(0,Math.min(width,box.xmin)),
   ymin:Math.max(0,Math.min(height,box.ymin)),
   xmax:Math.max(0,Math.min(width,box.xmax)),
   ymax:Math.max(0,Math.min(height,box.ymax))};
  const relativeArea=area(rect)/(width*height);
  if(raw.score<threshold||relativeArea<.006||relativeArea>.94
     ||rect.xmin>=rect.xmax||rect.ymin>=rect.ymax){
   rejected.push({index:i,reason:'weak-degenerate-or-overlarge-box'});continue;
  }
  recognized.push({index:i,label:normalized(raw.label),category,score:raw.score,
    box:rect,relativeArea});
 }
 // High IoU across names is often the exact same article of clothing.
 // Keep raw boxes for display, but forbid counting them as independent items.
 for(let i=0;i<recognized.length;i++)for(let j=i+1;j<recognized.length;j++){
  const a=recognized[i],b=recognized[j],iou=overlap(a.box,b.box);
  if(iou>=.35)conflicts.push({a:a.index,b:b.index,iou,
    reason:a.category===b.category?'possibly-same-clothing-two-prompts':
      'overlapping-layer-boxes-not-instance-masks'});
 }
 const categories=[...new Set(recognized.map(x=>x.category))];
 const hasDress=categories.includes('Dresses'),hasOuterwear=categories.includes('Outerwear');
 return {
  sourceSha256,width,height,candidates:recognized,rejected,conflicts,
  layerPairProposed:hasDress&&hasOuterwear,
  requiresSeparateMasksForLayeredItems:hasDress&&hasOuterwear,
  sourceImagePreserved:true,zeroShotBoxesOnly:true,
  garmentPixelMasksMeasured:false,physicalInstancesVerified:false,
  canAutoCreateItems:false,productionAuthorized:false,
  mobilePerformanceMeasured:false
 };
}
