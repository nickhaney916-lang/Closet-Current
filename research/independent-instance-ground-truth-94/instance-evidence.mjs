/**
 * Closet Current — INDEPENDENT-INSTANCE-GROUND-TRUTH-94
 *
 * Source-locked offline two-human polygon evidence for each photographed garment.
 * NO model predictions, historical category labels, split/holdout information,
 * default auto-masks, customer images, or release authority. This module does
 * not pretend QA-generated geometry is scientific ground truth.
 */
import {createHash} from 'node:crypto';
import {validReviewTaxonomy43} from '../multi-garment-capture-01/atomic-group.mjs';
import {COLORS60} from '../recognition-ground-truth-gate-60/ground-truth-gate.mjs';

export const INSTANCE_PACKET_94='closet-current-blind-instance-packet-94/v1';
export const INSTANCE_REVIEW_94='closet-current-human-instance-review-94/v1';
const shaPattern=/^[a-f0-9]{64}$/;
const idPattern=/^[A-Za-z0-9._-]{3,80}$/;
const colors=new Set(COLORS60);
const err=s=>{throw Error('INSTANCE94 '+s);};
const digest=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
const clean=x=>x&&typeof x==='object'&&!Array.isArray(x);
const boundedID=x=>typeof x==='string'&&/^[A-Za-z0-9._-]{1,90}$/.test(x);

export function makeInstancePacket94({sources,role,onlyIds=null}={}){
 if(!['A','B','C'].includes(role)||!Array.isArray(sources))err('invalid blinded packet request');
 const allowed=onlyIds===null?null:new Set(onlyIds);
 if(allowed&&(allowed.size!==onlyIds.length||!onlyIds.every(boundedID)))err('invalid restricted photo IDs');
 const seenIDs=new Set(),seenSHA=new Set(),items=[];
 for(const s of sources){
  if(!boundedID(s?.id)||!shaPattern.test(s?.sha256||'')||
    seenIDs.has(s.id)||seenSHA.has(s.sha256)||s.verified!==true||
    !/^[A-Za-z0-9._-]+\.jpg$/i.test(s.image||'')||
    !s.attribution?.source||!s.attribution?.license)err('nonunique or unverified genuine JPEG source');
  seenIDs.add(s.id);seenSHA.add(s.sha256);
  if(!allowed||allowed.has(s.id))
   items.push({id:s.id,image:s.image,sourceSHA256:s.sha256});
 }
 if(!items.length||items.length>500||(allowed&&allowed.size!==items.length))err('empty or missing source selection');
 items.sort((a,b)=>digest({role,sha:a.sourceSHA256}).localeCompare(digest({role,sha:b.sourceSHA256})));
 const packetId=digest({schema:INSTANCE_PACKET_94,role,items});
 return {schema:INSTANCE_PACKET_94,role,packetId,blinded:true,total:items.length,
  noPredictionsOrHistoricalLabels:true,neverShown:[
   'historical-label','model-prediction','reviewer-peer-answer','locked-holdout-split'],
  taxonomy:Object.freeze({
   categories:['Tops','Bottoms','Dresses','Outerwear','Shoes'],
   colors:[...COLORS60]
  }),items};
}
export function verifyPacket94(packet){
 if(!clean(packet)||packet.schema!==INSTANCE_PACKET_94||
   !['A','B','C'].includes(packet.role)||!Array.isArray(packet.items)||
   packet.items.length<1||packet.items.length>500||packet.total!==packet.items.length||
   !shaPattern.test(packet.packetId||''))err('invalid blinded packet');
 const ids=new Set(),hashes=new Set();
 for(const p of packet.items){
  if(!boundedID(p?.id)||!shaPattern.test(p?.sourceSHA256||'')||
     !/^[A-Za-z0-9._-]+\.jpg$/i.test(p.image||'')||
     ids.has(p.id)||hashes.has(p.sourceSHA256)||
     Object.keys(p).sort().join(',')!=='id,image,sourceSHA256')
   err('untrusted source identity or leaked source fields');
  ids.add(p.id);hashes.add(p.sourceSHA256);
 }
 if(packet.packetId!==digest({schema:INSTANCE_PACKET_94,role:packet.role,
   items:packet.items.map(p=>({id:p.id,image:p.image,sourceSHA256:p.sourceSHA256}))}))
  err('source packet SHA-256 identity mismatch');
 return true;
}
const nearly=(a,b)=>Math.abs(a-b)<1e-9;
const orient=(a,b,c)=>(b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x);
function intersection(a,b,c,d){
 const ab1=orient(a,b,c),ab2=orient(a,b,d),cd1=orient(c,d,a),cd2=orient(c,d,b);
 if(ab1*ab2<0&&cd1*cd2<0)return true;
 // Touching at separate non-neighbor edges is self-intersection too.
 const on=(p,u,v)=>Math.abs(orient(u,v,p))<1e-10&&
  p.x>=Math.min(u.x,v.x)-1e-10&&p.x<=Math.max(u.x,v.x)+1e-10&&
  p.y>=Math.min(u.y,v.y)-1e-10&&p.y<=Math.max(u.y,v.y)+1e-10;
 return on(c,a,b)||on(d,a,b)||on(a,c,d)||on(b,c,d);
}
export function validatePolygon94(points){
 if(!Array.isArray(points)||points.length<3||points.length>96)
  err('polygon requires 3–96 source-photo vertices');
 const p=points.map(v=>{
  if(!clean(v)||Object.keys(v).sort().join(',')!=='x,y'||
    !Number.isFinite(v.x)||!Number.isFinite(v.y)||
    v.x<0||v.x>1||v.y<0||v.y>1)err('normalized polygon coordinate out of range');
  return {x:v.x,y:v.y};
 });
 for(let i=0;i<p.length;i++){
  if(nearly(p[i].x,p[(i+1)%p.length].x)&&nearly(p[i].y,p[(i+1)%p.length].y))
   err('zero-length garment edge');
  for(let j=i+1;j<p.length;j++){
   if(j===i+1||(i===0&&j===p.length-1))continue;
   if(intersection(p[i],p[(i+1)%p.length],p[j],p[(j+1)%p.length]))
    err('self-intersecting garment mask');
  }
 }
 const area=Math.abs(p.reduce((n,c,i)=>n+c.x*p[(i+1)%p.length].y-
  p[(i+1)%p.length].x*c.y,0))/2;
 if(area<0.0001)err('invisible or degenerate instance mask');
 return {points:p,area};
}
function validateInstance(instance){
 if(!clean(instance)||!validReviewTaxonomy43(instance.category,instance.itemType)||
   !colors.has(instance.primaryColor)||
   !(instance.secondaryColor===null||colors.has(instance.secondaryColor)&&
     instance.secondaryColor!==instance.primaryColor))
  err('invalid individual garment category/type/primary-secondary color');
 const shape=validatePolygon94(instance.polygon);
 return {category:instance.category,itemType:instance.itemType,
  primaryColor:instance.primaryColor,secondaryColor:instance.secondaryColor,
  polygon:shape.points};
}
export function validateInstanceReview94(packet,review){
 verifyPacket94(packet);
 if(!clean(review)||review.schema!==INSTANCE_REVIEW_94||
   review.packetId!==packet.packetId||review.role!==packet.role||
   !idPattern.test(review.reviewerId||'')||review.method!=='direct-human-visual-review'||
   review.independent!==true||review.identityVerification!=='SELF_ATTESTED_NOT_VERIFIED'||
   !Array.isArray(review.rows)||review.rows.length>packet.total)
  err('invalid or dishonest human review metadata');
 const known=new Map(packet.items.map(x=>[x.id,x])),seen=new Set(),rows=[];
 for(const row of review.rows){
  if(!clean(row)||seen.has(row.id)||known.get(row.id)?.sourceSHA256!==row.sourceSHA256||
    row.reviewerId!==review.reviewerId||typeof row.reviewedAt!=='string'||
    !Number.isFinite(Date.parse(row.reviewedAt))||
    !Array.isArray(row.instances)||row.instances.length>20||
    typeof row.noGarments!=='boolean'||row.noGarments===(row.instances.length>0))
   err('duplicate, unbound, incomplete or impossible source instance review');
  if(row.noGarments&&(!row.note||typeof row.note!=='string'||row.note.length<8))
   err('non-garment requires explicit human observation');
  const instances=row.instances.map(validateInstance);
  // Pixel-identical duplicate instances must not inflate evidence counts.
  const keys=new Set(instances.map(x=>JSON.stringify(x.polygon)));
  if(keys.size!==instances.length)err('duplicate polygon instances');
  seen.add(row.id);rows.push({id:row.id,sourceSHA256:row.sourceSHA256,
   reviewerId:row.reviewerId,reviewedAt:row.reviewedAt,
   noGarments:row.noGarments,note:String(row.note||'').slice(0,600),instances});
 }
 return {role:review.role,reviewerId:review.reviewerId,rows,
  complete:rows.length===packet.total,humanIndependenceVerified:false,
  humanReviewsSelfAttestedOnly:true};
}
function contains(p,x,y){
 let inside=false;
 for(let i=0,j=p.length-1;i<p.length;j=i++){
  if((p[i].y>y)!==(p[j].y>y)&&
    x<(p[j].x-p[i].x)*(y-p[i].y)/(p[j].y-p[i].y)+p[i].x)inside=!inside;
 }
 return inside;
}
export function polygonIoU94(a,b,{resolution=128}={}){
 validatePolygon94(a);validatePolygon94(b);
 if(!Number.isInteger(resolution)||resolution<16||resolution>256)err('invalid mask scoring resolution');
 let inter=0,union=0;
 for(let y=0;y<resolution;y++)for(let x=0;x<resolution;x++){
  const aa=contains(a,(x+.5)/resolution,(y+.5)/resolution);
  const bb=contains(b,(x+.5)/resolution,(y+.5)/resolution);
  if(aa&&bb)inter++;
  if(aa||bb)union++;
 }
 return union?inter/union:0;
}
function matchedInstances(a,b,{threshold=.5,requireLabels=true}={}){
 const pairs=[];
 for(let i=0;i<a.length;i++)for(let j=0;j<b.length;j++){
  const iou=polygonIoU94(a[i].polygon,b[j].polygon);
  const matchingLabel=!requireLabels||
   ['category','itemType','primaryColor','secondaryColor']
    .every(k=>a[i][k]===b[j][k]);
  if(iou>=threshold&&matchingLabel)pairs.push({i,j,iou});
 }
 pairs.sort((a,b)=>b.iou-a.iou);
 const left=new Set(),right=new Set(),hits=[];
 for(const p of pairs)if(!left.has(p.i)&&!right.has(p.j)){
  hits.push(p);left.add(p.i);right.add(p.j);
 }
 return hits;
}
export function reconcileIndependentInstanceReviews94({
 packetA,reviewA,packetB,reviewB,packetC=null,reviewC=null
}={}){
 const a=validateInstanceReview94(packetA,reviewA);
 const b=validateInstanceReview94(packetB,reviewB);
 if(packetA.role!=='A'||packetB.role!=='B'||a.reviewerId===b.reviewerId)
  err('independent distinct A/B real humans required');
 const idsA=new Map(packetA.items.map(x=>[x.id,x]));
 const idsB=new Map(packetB.items.map(x=>[x.id,x]));
 if(idsA.size!==idsB.size||
  [...idsA].some(([id,x])=>idsB.get(id)?.sourceSHA256!==x.sourceSHA256))
  err('independent reviewer photo sources not identical');
 let c=null;
 if(packetC!==null||reviewC!==null){
  if(!packetC||!reviewC)err('third human packet and review both required');
  c=validateInstanceReview94(packetC,reviewC);
  if(packetC.role!=='C'||[a.reviewerId,b.reviewerId].includes(c.reviewerId))
   err('independent third reviewer identity required');
  const idsC=new Map(packetC.items.map(x=>[x.id,x]));
  if(idsC.size!==idsA.size||[...idsA].some(([id,x])=>
   idsC.get(id)?.sourceSHA256!==x.sourceSHA256))
   err('third reviewer source identity not matched');
 }
 const ra=new Map(a.rows.map(x=>[x.id,x]));
 const rb=new Map(b.rows.map(x=>[x.id,x]));
 const rc=new Map(c?.rows.map(x=>[x.id,x])||[]);
 const accepted=[],pending=[],disagreements=[];
 for(const [id,source] of idsA){
  const first=ra.get(id),second=rb.get(id);
  if(!first||!second){pending.push({id,reason:'two-human-per-instance-reviews-required'});continue;}
  const pairs=matchedInstances(first.instances,second.instances);
  if(first.noGarments===second.noGarments&&
     first.instances.length===second.instances.length&&
     pairs.length===first.instances.length){
   accepted.push({id,sourceSHA256:source.sourceSHA256,
    instances:first.instances,adjudicatedBy:'A/B-independent-agreement',
    minimumCrossHumanIoU:pairs.length?Math.min(...pairs.map(x=>x.iou)):1});
  }else{
   disagreements.push({id,reason:'mask-instance-count-category-subtype-color-or-IoU-disagreement'});
   const third=rc.get(id);
   if(!third){pending.push({id,reason:'third-human-mask-adjudication-required'});continue;}
   accepted.push({id,sourceSHA256:source.sourceSHA256,
    instances:third.instances,adjudicatedBy:'third-human-source-bound'});
  }
 }
 return {schema:'independent-instance-evidence-94/reconciliation-v1',
  researchOnly:true,releaseAuthorized:false,scientificAccepted:false,
  humanIdentityVerified:false,accepted,pending,disagreements,
  count:{sources:idsA.size,accepted:accepted.length,
   pending:pending.length,thirdAdjudications:accepted.filter(x=>
    x.adjudicatedBy==='third-human-source-bound').length}};
}
export function scoreIndependentInstanceMasks94({accepted,predictions,threshold=.5}={}){
 if(!Array.isArray(accepted)||!accepted.length||!Array.isArray(predictions)||
   !Number.isFinite(threshold)||threshold<=0||threshold>1)
  err('nonempty source-bound truth and pinned predictions required');
 const predMap=new Map(),truthIds=new Set();
 for(const p of predictions){
  if(!boundedID(p?.id)||predMap.has(p.id)||!shaPattern.test(p.sourceSHA256||'')||
    !Array.isArray(p.instances)||p.instances.length>20)
   err('duplicate or malformed pinned model source prediction');
  predMap.set(p.id,p);
 }
 let tp=0,fp=0,fn=0,cat=0,subtype=0,primary=0,secondary=0,matchedIoU=0,truth=0;
 for(const t of accepted){
  if(!boundedID(t?.id)||truthIds.has(t.id)||!shaPattern.test(t.sourceSHA256||'')||
    !Array.isArray(t.instances))err('untrusted locked independent truth');
  truthIds.add(t.id);
  const p=predMap.get(t.id);
  if(!p||p.sourceSHA256!==t.sourceSHA256)err('missing or cross-source pinned predictions');
  const gt=t.instances.map(validateInstance),pr=p.instances.map(validateInstance);
  const pairs=matchedInstances(gt,pr,{threshold,requireLabels:false});
  tp+=pairs.length;fp+=pr.length-pairs.length;fn+=gt.length-pairs.length;truth+=gt.length;
  for(const match of pairs){
   matchedIoU+=match.iou;
   const a=gt[match.i],b=pr[match.j];
   if(a.category===b.category)cat++;
   if(a.category===b.category&&a.itemType===b.itemType)subtype++;
   if(a.primaryColor===b.primaryColor)primary++;
   if(a.secondaryColor===b.secondaryColor)secondary++;
  }
 }
 if(predMap.size!==truthIds.size)err('extra or missing source prediction outside independent evaluation');
 return {schema:'instance-mask-scoring-94/v1',sourceCount:truthIds.size,
  perInstanceTruth:truth,truePositive:tp,falsePositive:fp,falseNegative:fn,
  detectionPrecision:tp+fp?tp/(tp+fp):null,
  detectionRecall:tp+fn?tp/(tp+fn):null,
  meanMatchedMaskIoU:tp?matchedIoU/tp:null,
  categoryAccuracyIncludingMissed:truth?cat/truth:null,
  subtypeAccuracyIncludingMissed:truth?subtype/truth:null,
  primaryColorAccuracyIncludingMissed:truth?primary/truth:null,
  secondaryColorAccuracyIncludingMissed:truth?secondary/truth:null,
  humanIdentityVerified:false,scientificVerdict:'EXPLORATORY_ONLY_UNLESS_INDEPENDENCE_AUDITED',
  releaseAuthorized:false};
}
